import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const managedPaths = ['content', 'site.config.json']
let input

function redact(value) {
  return String(value ?? '')
    .replace(/\b(?:https?|ssh):\/\/[^\s"'<>]+/giu, '[远端地址]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/gu, '[已隐藏凭据]')
    .replace(/(authorization|password|access_token|token)\s*[:=]\s*[^\s]+/giu, '$1=[已隐藏]')
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root, encoding: 'utf8', windowsHide: true,
    stdio: options.inherit ? 'inherit' : 'pipe',
    ...options,
  })
  if (result.error) throw new Error(`无法运行 ${path.basename(command)}，请检查是否已安装并加入 PATH。`)
  return result
}

function git(commandArgs, { allowFailure = false, network = false, proxy, identity } = {}) {
  const settings = ['-c', `safe.directory=${root}`]
  if (network && proxy) settings.push('-c', `http.proxy=${proxy}`)
  if (identity) settings.push('-c', `user.name=${identity.name}`, '-c', `user.email=${identity.email}`)
  const result = run('git', [...settings, ...commandArgs])
  if (result.status !== 0 && !allowFailure) {
    if (network) {
      throw new Error(`git ${commandArgs[0]} 未成功（退出码 ${result.status}）。请检查 GitHub 权限、网络及 origin 配置；工具不会强制推送。为避免输出凭据，未显示网络命令的原始日志。`)
    }
    throw new Error(`git ${commandArgs[0]} 未成功：${redact(result.stderr || result.stdout).trim()}`)
  }
  return result
}

function output(commandArgs) {
  return git(commandArgs).stdout.trim()
}

function nulList(value) {
  return value.split('\0').filter(Boolean)
}

function isManaged(name) {
  return name === 'site.config.json' || name === 'content' || name.startsWith('content/')
}

function samePath(a, b) {
  const left = path.resolve(a)
  const right = path.resolve(b)
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right
}

async function ask(question) {
  if (!stdin.isTTY) throw new Error('发布需要本人在终端确认；非交互检查请使用 --dry-run。')
  input ??= createInterface({ input: stdin, output: stdout })
  return input.question(question)
}

function systemProxy() {
  if (process.platform !== 'win32') return undefined
  const powershell = "[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); $p=Get-ItemProperty -LiteralPath 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -ErrorAction Stop; if ($p.ProxyEnable -eq 1) { @{ enabled=$true; server=[string]$p.ProxyServer } | ConvertTo-Json -Compress } else { '{\"enabled\":false}' }"
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', powershell], {
    encoding: 'utf8', windowsHide: true, stdio: 'pipe',
  })
  if (result.error || result.status !== 0) return undefined
  let settings
  try { settings = JSON.parse(result.stdout.replace(/^\uFEFF/u, '').trim()) } catch { return undefined }
  if (!settings.enabled || !settings.server) return undefined
  const raw = String(settings.server).trim()
  const entries = Object.fromEntries(raw.split(';').map(part => part.trim().match(/^([a-z]+)=(.+)$/iu)).filter(Boolean).map(match => [match[1].toLowerCase(), match[2].trim()]))
  const selected = entries.https || entries.http || (raw.includes('=') ? '' : raw)
  if (!selected) return undefined
  try {
    const url = new URL(selected.includes('://') ? selected : `http://${selected}`)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash
      || url.pathname !== '/' || !url.hostname || /[\r\n]/u.test(selected)) throw new Error('unsupported')
    return url.origin
  } catch {
    throw new Error('已启用的系统代理格式不受支持或包含内嵌凭据。请先调整代理或 Git 设置；代理原文不会显示，也不会写入全局配置。')
  }
}

function commitIdentity() {
  const name = git(['config', '--local', '--get', 'user.name'], { allowFailure: true }).stdout.trim()
  const email = git(['config', '--local', '--get', 'user.email'], { allowFailure: true }).stdout.trim()
  const previous = git(['log', '-1', '--format=%an%x00%ae'], { allowFailure: true }).stdout.trim().split('\0')
  const identity = { name: name || previous[0], email: email || previous[1] }
  if (!identity.name || !identity.email) {
    throw new Error('没有可用的提交身份。请在本仓库设置 git config user.name 和 git config user.email 后重试；工具不会修改全局身份。')
  }
  return identity
}

async function buildSite() {
  console.log('\n正在构建网站……')
  const result = process.platform === 'win32'
    ? run(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'npm.cmd run build:workers'], { inherit: true })
    : run('npm', ['run', 'build:workers'], { inherit: true })
  if (result.status !== 0) throw new Error('网站构建失败，未暂存、提交或推送。请先修复构建错误。')
}

function safeStagedAdditions() {
  const additions = nulList(git(['diff', '--cached', '--name-only', '--diff-filter=A', '-z']).stdout)
  const outside = additions.filter(name => !isManaged(name))
  if (outside.length) {
    throw new Error(`暂存区已有范围外的新增文件，发布已停止，以免一并上传：\n${outside.map(name => `  ${name}`).join('\n')}\n请自行检查并处理这些暂存项后重试；工具没有取消或覆盖你的暂存内容。`)
  }
}

async function publish() {
  if (args.some(arg => arg !== '--dry-run')) throw new Error('仅支持可选参数 --dry-run。')
  if (dryRun) {
    console.log(`发布计划（仅展示，不执行任何命令）\n项目：${root}\n1. 验证当前仓库根目录、main 分支和 origin。\n2. npm run build:workers；失败即停止。\n3. 读取已启用的 Windows 系统代理，仅用于本次网络 Git 命令。\n4. fetch origin 的 main；若本地落后或分叉则停止，不自动合并。\n5. 显示 git status 与 diff 摘要，等待本人输入 Y。\n6. 暂存 content/、site.config.json 及项目内已跟踪文件的改动；范围外的新增文件不加入。\n7. 使用本地 Git 身份或上次提交作者提交，再推送 main 到已有 origin。\n无新改动但本地领先时，仅推送已有提交。不会修改全局身份、代理或 safe.directory。`)
    return
  }
  if (!stdin.isTTY) throw new Error('请在交互终端运行发布工具；只查看计划可加 --dry-run。')
  const repoRoot = output(['rev-parse', '--show-toplevel'])
  if (!samePath(await fs.realpath(repoRoot), await fs.realpath(root))) throw new Error('Git 仓库根目录与网站目录不同，已停止，避免纳入旁边的笔记。')
  if (output(['branch', '--show-current']) !== 'main') throw new Error('请先切换到 main 分支再发布；工具不会自动切换分支。')
  git(['remote', 'get-url', 'origin'])
  if (output(['diff', '--name-only', '--diff-filter=U'])) throw new Error('仓库存在未解决的冲突，请先处理。')
  safeStagedAdditions()
  await buildSite()
  safeStagedAdditions()
  const proxy = systemProxy()
  if (proxy) console.log('本次网络操作沿用已启用的 Windows 系统代理。')
  console.log('\n检查 origin/main 的最新进度……')
  git(['fetch', '--no-tags', 'origin', 'refs/heads/main'], { network: true, proxy })
  const counts = output(['rev-list', '--left-right', '--count', 'HEAD...FETCH_HEAD']).split(/\s+/u).map(Number)
  const [ahead, behind] = counts
  if (!Number.isInteger(ahead) || !Number.isInteger(behind)) throw new Error('无法确定与远端 main 的差异，未进行发布。')
  if (behind > 0) throw new Error(ahead > 0
    ? `本地与远端已分叉（本地领先 ${ahead}、落后 ${behind} 个提交）。请自行处理历史后重试；工具不会强推、rebase 或覆盖改动。`
    : `本地落后远端 ${behind} 个提交。请先自行同步 main，再重新检查并发布。`)
  console.log(`\n本地比远端领先 ${ahead} 个提交，落后 ${behind} 个提交。`)
  console.log('\n工作区状态：\n' + (redact(output(['-c', 'core.quotePath=false', 'status', '--short'])) || '（工作区干净）'))
  console.log('\n已跟踪文件的改动摘要：\n' + (redact(output(['-c', 'core.quotePath=false', 'diff', '--stat', 'HEAD', '--', '.'])) || '（无）'))
  const newFiles = nulList(git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...managedPaths]).stdout)
  if (newFiles.length) console.log('\n本次将纳入的新内容：\n' + newFiles.map(name => `  ${redact(name)}`).join('\n'))
  console.log('\n范围：content/、site.config.json，以及本项目内已跟踪文件的改动。其他未跟踪的新文件不会加入。')
  const trackedChanges = output(['diff', '--name-only', 'HEAD', '--', '.'])
  if (!trackedChanges && !newFiles.length && ahead === 0) {
    console.log('没有可发布的改动或待推送提交。')
    return
  }
  if (!/^y$/iu.test((await ask('\n确认提交上述改动并发布到 origin/main？输入 Y 确认，其他输入取消：')).trim())) {
    console.log('已取消；未暂存、提交或推送。')
    return
  }
  if (output(['branch', '--show-current']) !== 'main') throw new Error('确认期间分支发生变化，已停止，请在 main 上重新运行。')
  if (trackedChanges || newFiles.length) {
    safeStagedAdditions()
    const identity = commitIdentity()
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const defaultMessage = `更新笔记 ${date}`
    const message = (await ask(`提交说明（回车使用“${defaultMessage}”）：`)).trim() || defaultMessage
    const knownPaths = []
    for (const name of managedPaths) {
      if (await fs.stat(path.join(root, name)).catch(() => false) || output(['ls-files', '--', name])) knownPaths.push(name)
    }
    // Never use `git add .`: new files outside these two paths stay untracked.
    if (knownPaths.length) git(['add', '--all', '--', ...knownPaths])
    git(['add', '--update', '--', '.'])
    const staged = git(['diff', '--cached', '--quiet'], { allowFailure: true })
    if (staged.status !== 0 && staged.status !== 1) throw new Error('无法检查暂存区，未继续提交。')
    if (staged.status === 1) {
      git(['commit', '-m', message], { identity })
      console.log('本地提交完成。')
    }
  }
  console.log('\n正在推送 main……')
  git(['push', 'origin', 'refs/heads/main:refs/heads/main'], { network: true, proxy })
  console.log('推送完成。Cloudflare 将按仓库配置启动构建；推送成功不代表云端部署已经完成，请到控制台查看结果。')
}

try {
  await publish()
} catch (error) {
  console.error(`\n发布未完成：${redact(error.message)}`)
  process.exitCode = 1
} finally {
  input?.close()
}
