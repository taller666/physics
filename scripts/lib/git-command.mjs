import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'

// Explorer-launched terminals do not inherit Codex's additional tool paths.
// Resolve an executable for this process without changing the user's PATH.
export function findGit({ env = process.env, platform = process.platform, probe = spawnSync, cwd } = {}) {
  const candidates = ['git']
  if (platform === 'win32') {
    const join = path.win32.join
    for (const base of [env.ProgramW6432, env.ProgramFiles, env['ProgramFiles(x86)']]) {
      if (base) candidates.push(join(base, 'Git', 'cmd', 'git.exe'))
    }
    if (env.LOCALAPPDATA) candidates.push(join(env.LOCALAPPDATA, 'Programs', 'Git', 'cmd', 'git.exe'))
    const profile = env.USERPROFILE || os.homedir()
    candidates.push(join(profile, 'scoop', 'apps', 'git', 'current', 'cmd', 'git.exe'))
    candidates.push(join(profile, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'native', 'git', 'cmd', 'git.exe'))
  }
  for (const command of [...new Set(candidates)]) {
    const result = probe(command, ['--version'], { cwd, env, encoding: 'utf8', windowsHide: true, timeout: 10000 })
    if (!result.error && result.status === 0 && /^git version\s/m.test(result.stdout || '')) {
      return { command, version: result.stdout.trim() }
    }
  }
  throw new Error('未找到可用的 Git。已检查 PATH、常见 Git 安装位置和本机 Codex 内置 Git；请安装 Git for Windows 后重新打开发布窗口。')
}
