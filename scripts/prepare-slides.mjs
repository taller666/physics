import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function prepareSlides(root) {
  const library = JSON.parse(await fs.readFile(path.join(root, 'data/library.json'), 'utf8'))
  const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const parts = [
    `---\ntheme: default\ntitle: ${JSON.stringify(library.site.title)}\nfavicon: /favicon.svg\nlang: zh-CN\nlayout: library\ncolorSchema: light\naspectRatio: 16/9\ncanvasWidth: 1280\ntransition: none\nfonts:\n  sans: Microsoft YaHei\n  local: Microsoft YaHei\n  provider: none\nhtmlAttrs:\n  lang: zh-CN\n---\n\n<!-- 自动生成；请编辑 content/ 中的 Markdown。 -->`,
  ]
  for (const [index, chapter] of library.chapters.entries()) {
    if (index) parts.push(`---\nlayout: library\ntitle: ${JSON.stringify(chapter.title)}\n---`)
    parts.push(`<LibraryChapter chapter-id="${escape(chapter.id)}" />`)
  }
  if (!library.chapters.length) parts.push('# 暂无已发布章节\n\n[返回网站首页](/)')
  await fs.writeFile(path.join(root, 'slides.md'), parts.join('\n\n') + '\n')
  return library
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await prepareSlides(path.resolve(import.meta.dirname, '..'))
}
