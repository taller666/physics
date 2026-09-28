import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
let input

function segment(value, label) {
  const name = String(value ?? '').trim()
  if (!name || name === '.' || name.includes('..') || /[\\/\x00-\x1f<>:"|?*]/u.test(name)
    || path.posix.isAbsolute(name) || path.win32.isAbsolute(name) || /[. ]$/u.test(name)
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(name)) {
    throw new Error(`${label}必须是一个文件夹名称，可含中文；不能使用绝对路径、..、路径分隔符或系统保留名称。`)
  }
  return name
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

async function ask(question) {
  if (!stdin.isTTY) throw new Error('非交互运行时请提供分类和章节名，例如：npm run new:chapter -- "电磁学" "02-静磁场"')
  input ??= createInterface({ input: stdin, output: stdout })
  return input.question(question)
}

try {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('新增章节：npm run new:chapter -- "分类" "02-章节名" ["显示标题"]\n不带参数时交互输入。已有章节不会被覆盖，新章节默认 draft: true。')
  } else {
    if (args.length > 3) throw new Error('最多提供三个参数：分类、章节文件夹名、可选显示标题。')
    const category = segment(args[0] ?? await ask('分类（例如 电磁学）：'), '分类')
    const chapter = segment(args[1] ?? await ask('章节文件夹名（例如 02-静磁场）：'), '章节')
    const defaultTitle = chapter.replace(/^\d+(?:[._-]\d+)*[._\-\s]+/u, '') || chapter
    const requestedTitle = args[2] ?? (args.length === 0 ? await ask(`显示标题（回车使用“${defaultTitle}”）：`) : defaultTitle)
    const title = requestedTitle.replace(/[\r\n]/gu, ' ').trim() || defaultTitle
    const content = path.join(root, 'content')
    const categoryPath = path.join(content, category)
    const target = path.join(categoryPath, chapter)
    const realRoot = await fs.realpath(root)
    await fs.mkdir(content, { recursive: true })
    if (!isInside(realRoot, await fs.realpath(content))) throw new Error('content 指向项目之外，已停止创建。')
    await fs.mkdir(categoryPath, { recursive: true })
    if (!isInside(await fs.realpath(content), await fs.realpath(categoryPath))) throw new Error('分类文件夹指向 content 之外，已停止创建。')
    const template = await fs.readFile(path.join(root, 'templates/章节模板/index.md'), 'utf8')
    if (!template.includes('{{TITLE_JSON}}')) throw new Error('章节模板缺少 {{TITLE_JSON}} 占位符。')
    const markdown = template
      .replaceAll('{{TITLE_JSON}}', () => JSON.stringify(title))
      .replaceAll('{{TITLE_TEXT}}', () => title)
    try {
      await fs.mkdir(target)
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error(`章节已存在，不会覆盖：content/${category}/${chapter}`)
      throw error
    }
    await fs.writeFile(path.join(target, 'index.md'), markdown, { flag: 'wx' })
    for (const folder of ['right', 'files']) {
      await fs.mkdir(path.join(target, folder))
      await fs.writeFile(path.join(target, folder, '.gitkeep'), '', { flag: 'wx' })
    }
    console.log(`\n已创建：${target}\n正文：index.md\n右栏原图：right/\nPDF 等附件：files/`)
    console.log('新章节目前为草稿；写好正文后将 draft: true 改为 draft: false。需要自排右栏时，再复制 templates/章节模板/right.md 到章节目录。')
  }
} catch (error) {
  console.error(`新增章节失败：${error.message}`)
  process.exitCode = 1
} finally {
  input?.close()
}
