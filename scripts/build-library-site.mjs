import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ownFile = fileURLToPath(import.meta.url)
const defaultRoot = path.resolve(path.dirname(ownFile), '..')
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const esc = escapeHtml
const icon = (name, extra = '') => {
  const paths = {
    book: '<path d="M4 4.5h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-2H4zM20 4.5h-4a3 3 0 0 0-3 3v13a4 4 0 0 1 4-2h3z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    left: '<path d="M19 12H5m5-5-5 5 5 5"/>',
    up: '<path d="M12 19V5m-5 5 5-5 5 5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    external: '<path d="M14 4h6v6m0-6L10 14M10 4H4v16h16v-6"/>',
    slides: '<path d="M3 4h18v12H3zM12 16v5m-4 0 4-3 4 3"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
  }
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`
}

function safeOutputPath(outputRoot, relative) {
  const clean = String(relative).replaceAll('\\', '/').replace(/^\/+/, '')
  if (!clean || clean.split('/').some(part => part === '..') || clean.includes('\0') || /^[a-z]:/i.test(clean)) throw new Error(`Unsafe output path: ${relative}`)
  const resolved = path.resolve(outputRoot, clean)
  if (!resolved.startsWith(path.resolve(outputRoot) + path.sep)) throw new Error(`Output escapes destination: ${relative}`)
  return resolved
}

function routeFile(outputRoot, href) {
  const url = new URL(href, 'https://notes.invalid')
  if (url.origin !== 'https://notes.invalid') throw new Error(`Page href must be a local route: ${href}`)
  const decoded = decodeURIComponent(url.pathname)
  return safeOutputPath(outputRoot, `${decoded.replace(/\/+$/, '')}/index.html`)
}

function pageHead(title, description, site) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#f6f4ef">
  <meta name="description" content="${esc(description || site.description || '')}">
  <title>${esc(title === site.title ? title : `${title} · ${site.title}`)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/site/katex/katex.min.css">
  <link rel="stylesheet" href="/site/site.css">
  <script type="module" src="/site/site.js"></script>
</head>`
}

function siteHeader(site, categories, currentCategory = '', reader = false) {
  return `<a class="skip-link" href="#main-content">跳到主要内容</a>
  <header class="site-header${reader ? ' reader-site-header' : ''}">
    <div class="header-inner">
      <a class="site-brand" href="/" aria-label="${esc(site.title)}，返回首页"><span class="brand-mark">${icon('book')}</span><span>${esc(site.title)}</span></a>
      <nav class="top-nav" aria-label="主导航"><a href="/"${currentCategory === 'home' ? ' aria-current="page"' : ''}>首页</a>${categories.map(category => `<a href="${esc(category.href)}"${currentCategory === category.id ? ' aria-current="page"' : ''}>${esc(category.title)}</a>`).join('')}</nav>
      <a class="header-search" href="/#site-search" aria-label="搜索笔记">${icon('search')}<span>搜索</span></a>
    </div>
  </header>`
}

function breadcrumbs(items) {
  return `<nav class="breadcrumbs" aria-label="当前位置"><ol><li><a href="/">首页</a></li>${items.map(item => `<li>${icon('chevron')}${item.href ? `<a href="${esc(item.href)}">${esc(item.title)}</a>` : `<span aria-current="page">${esc(item.title)}</span>`}</li>`).join('')}</ol></nav>`
}

function searchForm(count, scope = '全部章节') {
  return `<div class="search-area" data-search-root>
    <label class="search-field" for="site-search">${icon('search')}<input id="site-search" type="search" placeholder="搜索章节标题或简介…" autocomplete="off" spellcheck="false" aria-controls="chapter-list"><button class="search-clear" type="button" data-search-clear aria-label="清除搜索" hidden>${icon('close')}</button></label>
    <p class="search-summary" data-search-status aria-live="polite">${esc(scope)} · ${count} 章</p>
  </div>`
}

function chapterCard(chapter, index) {
  return `<article class="chapter-card" data-search-card data-search-text="${esc([chapter.title, chapter.description, chapter.categoryTitle].filter(Boolean).join(' '))}">
    <div class="card-meta"><span class="category-label">${esc(chapter.categoryTitle || '')}</span><span class="chapter-number">${String(index + 1).padStart(2, '0')}</span></div>
    <h3><a href="${esc(chapter.href)}">${esc(chapter.title)}</a></h3>
    ${chapter.description ? `<p class="card-description">${esc(chapter.description)}</p>` : ''}
    <div class="card-bottom"><span>${chapter.hasRight ? '笔记与例题' : '章节笔记'}</span><span class="card-read">阅读章节 ${icon('arrow')}</span></div>
  </article>`
}

function footer(site) {
  return `<footer class="site-footer"><span>${esc(site.title)}</span><a href="#top" data-document-top>回到顶部 ${icon('up')}</a></footer>`
}

function homePage(site, categories, chapters) {
  return `${pageHead(site.title, site.description, site)}
<body id="top" class="page-index">
${siteHeader(site, categories, 'home')}
<main id="main-content" class="library-main">
  <section class="home-intro"><div><p class="eyebrow">笔记资料库</p><h1>${esc(site.title)}</h1><p class="intro-description">${esc(site.description || '课程笔记、例题与推导，按主题与章节归档。')}</p></div><div class="library-counts" aria-label="资料库统计"><span><strong>${categories.length}</strong>分类</span><span><strong>${chapters.length}</strong>章节</span></div></section>
  <section class="category-section" aria-labelledby="categories-title"><div class="section-heading"><h2 id="categories-title">分类浏览</h2><p>按主题查找笔记</p></div><div class="category-grid">${categories.map(category => {
    const count = chapters.filter(chapter => chapter.categoryId === category.id).length
    return `<a class="category-card" href="${esc(category.href)}"><span class="category-card-icon">${icon('book')}</span><div><h3>${esc(category.title)}</h3>${category.description ? `<p>${esc(category.description)}</p>` : ''}<span class="category-count">${count} 章</span></div>${icon('arrow', 'category-arrow')}</a>`
  }).join('')}</div></section>
  <section class="chapters-section" aria-labelledby="chapters-title"><div class="section-heading"><h2 id="chapters-title">全部章节</h2><p>从一章开始阅读</p></div>${searchForm(chapters.length)}<div class="chapter-grid" id="chapter-list">${chapters.map(chapterCard).join('')}</div><div class="empty-state" data-search-empty hidden><h3>没有找到相关章节</h3><p>换一个关键词，或清除搜索查看全部笔记。</p><button class="button secondary" type="button" data-search-reset>清除搜索</button></div></section>
</main>${footer(site)}</body></html>`
}

function categoryPage(site, categories, category, chapters) {
  return `${pageHead(category.title, category.description, site)}
<body id="top" class="page-category">
${siteHeader(site, categories, category.id)}
<main id="main-content" class="library-main category-main">
  ${breadcrumbs([{ title: category.title }])}
  <section class="category-intro"><p class="eyebrow">分类 · ${chapters.length} 章</p><h1>${esc(category.title)}</h1>${category.description ? `<p class="intro-description">${esc(category.description)}</p>` : ''}</section>
  <section aria-label="${esc(category.title)}章节">${searchForm(chapters.length, category.title)}<div class="chapter-grid" id="chapter-list">${chapters.map(chapterCard).join('')}</div><div class="empty-state" data-search-empty hidden><h3>没有找到相关章节</h3><p>试试其他关键词。</p><button class="button secondary" type="button" data-search-reset>清除搜索</button></div></section>
</main>${footer(site)}</body></html>`
}

function tocLinks(chapter, panel) {
  const items = panel === 'left' ? chapter.leftToc : chapter.rightToc
  return (items || []).map(item => `<li class="toc-level-${Math.min(4, Math.max(1, Number(item.level) || 2))}"><a href="#${esc(encodeURIComponent(item.id))}" data-toc-link data-panel="${panel}" data-heading-id="${esc(item.id)}">${esc(item.title)}</a></li>`).join('')
}

function tocContent(chapter) {
  const left = tocLinks(chapter, 'left')
  const right = chapter.hasRight ? tocLinks(chapter, 'right') : ''
  if (!left && !right) return '<p class="toc-empty">本章暂无分节标题</p>'
  return `${left ? `<p class="toc-group-title">笔记</p><ol class="toc-list">${left}</ol>` : ''}${right ? `<p class="toc-group-title">${esc(chapter.rightTitle || '例题与证明')}</p><ol class="toc-list">${right}</ol>` : ''}`
}

function pane(panel, title, html) {
  return `<section class="reader-pane pane-${panel}" id="pane-${panel}" aria-labelledby="pane-${panel}-label" data-reader-pane="${panel}">
    <div class="pane-heading"><h2 id="pane-${panel}-label">${esc(title)}</h2><span class="pane-scroll-hint">独立滚动</span></div>
    <div class="reader-scroll" data-panel-scroll="${panel}" tabindex="0" aria-label="${esc(title)}内容"><div class="prose pane-content">${html || '<p class="content-empty">本章内容正在整理。</p>'}</div><div class="pane-end" aria-hidden="true"><span></span>本栏结束<span></span></div></div>
    <button class="panel-top" type="button" data-panel-top="${panel}" aria-label="回到${esc(title)}顶部" hidden>${icon('up')}</button>
  </section>`
}

function imageDialog() {
  return `<dialog class="image-dialog" data-image-dialog aria-label="图片预览">
  <div class="lightbox-toolbar"><p data-image-caption>图片预览</p><span data-image-counter></span><a data-image-original href="#" target="_blank" rel="noopener noreferrer" aria-label="在新标签页查看原图">${icon('external')}<span>原图</span></a><button type="button" data-image-close aria-label="关闭图片预览" autofocus>${icon('close')}</button></div>
  <div class="lightbox-stage"><button class="lightbox-nav lightbox-prev" type="button" data-image-prev aria-label="上一张图片">${icon('left')}</button><img class="lightbox-image" data-image-view alt=""><button class="lightbox-nav lightbox-next" type="button" data-image-next aria-label="下一张图片">${icon('arrow')}</button></div>
  <p class="lightbox-hint">Esc 关闭 · ← → 切换图片 · 点击图片查看原始尺寸</p>
</dialog>`
}

function chapterPage(site, categories, chapter, categoryChapters) {
  const category = categories.find(item => item.id === chapter.categoryId)
  const position = categoryChapters.findIndex(item => item.id === chapter.id)
  const previous = categoryChapters[position - 1]
  const next = categoryChapters[position + 1]
  const title = chapter.rightTitle || '例题与证明'
  const toc = tocContent(chapter)
  const slidesHref = chapter.slideNo ? `/slides/${encodeURIComponent(chapter.slideNo)}` : ''
  return `${pageHead(chapter.title, chapter.description, site)}
<body id="top" class="page-reader${chapter.hasRight ? ' has-right' : ' single-column'}" data-active-pane="left">
${siteHeader(site, categories, chapter.categoryId, true)}
<main id="main-content" class="reader-shell">
  <div class="reader-top"><div class="reader-title-row"><div>${breadcrumbs([{ title: category?.title || chapter.categoryTitle, href: category?.href }, { title: chapter.title }])}<h1>${esc(chapter.title)}</h1></div>${slidesHref ? `<a class="button lecture-link" href="${slidesHref}" title="在幻灯片中打开本章">${icon('slides')}<span>讲课模式</span></a>` : ''}</div>
    <div class="reader-controls"><label class="chapter-select-label"><span>章节</span><select data-chapter-select aria-label="选择章节">${categoryChapters.map(item => `<option value="${esc(item.href)}"${item.id === chapter.id ? ' selected' : ''}>${esc(item.title)}</option>`).join('')}</select></label><span class="chapter-position">${position + 1} / ${categoryChapters.length}</span><div class="chapter-pagination">${previous ? `<a href="${esc(previous.href)}" title="上一章：${esc(previous.title)}" aria-label="上一章：${esc(previous.title)}">${icon('left')}<span>上一章</span></a>` : `<span class="page-disabled" aria-disabled="true">${icon('left')}<span>上一章</span></span>`}${next ? `<a href="${esc(next.href)}" title="下一章：${esc(next.title)}" aria-label="下一章：${esc(next.title)}"><span>下一章</span>${icon('arrow')}</a>` : `<span class="page-disabled" aria-disabled="true"><span>下一章</span>${icon('arrow')}</span>`}</div></div>
    <details class="mobile-toc"><summary>本章目录</summary><nav aria-label="本章目录">${toc}</nav></details>
    ${chapter.hasRight ? `<div class="reader-tabs" role="tablist" aria-label="阅读内容"><button type="button" role="tab" id="tab-left" aria-selected="true" aria-controls="pane-left" data-reader-tab="left">笔记</button><button type="button" role="tab" id="tab-right" aria-selected="false" aria-controls="pane-right" tabindex="-1" data-reader-tab="right">${esc(title)}</button></div>` : ''}
  </div>
  <div class="reader-layout"><aside class="reader-toc"><h2>本章目录</h2><nav aria-label="本章目录">${toc}</nav><a class="toc-home" href="/">${icon('left')}返回首页</a></aside><div class="reader-panels">${pane('left', '笔记', chapter.leftHtml)}${chapter.hasRight ? pane('right', title, chapter.rightHtml) : ''}</div></div>
</main>${imageDialog()}</body></html>`
}

function notFoundPage(site, categories) {
  return `${pageHead('页面不存在', '这个地址没有对应的笔记。', site)}<body class="page-not-found">${siteHeader(site, categories)}<main id="main-content" class="not-found"><p class="eyebrow">404 · 页面不存在</p><h1>这页笔记暂未找到</h1><p>链接可能已经更改。请返回首页，从分类或搜索中查找。</p><a class="button primary" href="/">${icon('left')}返回首页</a></main>${footer(site)}</body></html>`
}

function redirectPage(href, site) {
  return `${pageHead('正在跳转', '旧版链接正在跳转到新的阅读页面。', site)}<body class="page-not-found"><main class="not-found"><p class="eyebrow">链接已更新</p><h1>正在打开新版笔记</h1><p>如果没有自动跳转，请点击下方链接。</p><a class="button primary" href="${esc(href)}">继续阅读 ${icon('arrow')}</a></main><script>location.replace(${JSON.stringify(href).replaceAll('<', '\\u003c')} + location.search + location.hash)</script></body></html>`
}

/** Generate the library around an existing dist/slides directory without clearing dist.
 * buildLibrarySite(root, { manifest: 'data/library.json', outDir: 'dist' })
 */
export async function buildLibrarySite(root = defaultRoot, options = {}) {
  root = path.resolve(root)
  const manifestPath = path.resolve(root, options.manifest || 'data/library.json')
  const outputRoot = path.resolve(root, options.outDir || options.dist || 'dist')
  const manifest = options.data || JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  const site = { title: 'taller666 的笔记', description: '', ...(manifest.site || {}) }
  const categories = [...(manifest.categories || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const chapters = [...(manifest.chapters || [])].sort((a, b) => {
    const ai = categories.findIndex(item => item.id === a.categoryId)
    const bi = categories.findIndex(item => item.id === b.categoryId)
    return ai - bi || (a.order ?? 0) - (b.order ?? 0)
  })
  for (const item of [...categories, ...chapters]) if (!item.href) throw new Error(`Missing href on ${item.id || item.title}`)
  await fs.mkdir(outputRoot, { recursive: true })
  let pageCount = 0
  const writePage = async (filename, html) => { await fs.mkdir(path.dirname(filename), { recursive: true }); await fs.writeFile(filename, html, 'utf8'); pageCount++ }
  await writePage(path.join(outputRoot, 'index.html'), homePage(site, categories, chapters))
  for (const category of categories) await writePage(routeFile(outputRoot, category.href), categoryPage(site, categories, category, chapters.filter(chapter => chapter.categoryId === category.id)))
  for (const chapter of chapters) await writePage(routeFile(outputRoot, chapter.href), chapterPage(site, categories, chapter, chapters.filter(item => item.categoryId === chapter.categoryId)))
  await writePage(path.join(outputRoot, '404.html'), notFoundPage(site, categories))
  const legacyChapter = chapters.find(chapter => chapter.slug === 'electrostatics')
  for (let index = 0; index < 4; index++) {
    if (legacyChapter) await writePage(safeOutputPath(outputRoot, `${index + 1}/index.html`), redirectPage(legacyChapter.href, site))
    if (legacyChapter?.slideNo) await writePage(safeOutputPath(outputRoot, `presenter/${index + 1}/index.html`), redirectPage(`/slides/presenter/${encodeURIComponent(legacyChapter.slideNo)}`, site))
  }
  const assetRoot = path.join(outputRoot, 'site')
  await fs.mkdir(assetRoot, { recursive: true })
  await Promise.all(['site.css', 'site.js'].map(file => fs.copyFile(path.join(root, 'web', file), path.join(assetRoot, file))))
  await fs.copyFile(path.join(root, 'public', 'favicon.svg'), path.join(outputRoot, 'favicon.svg'))
  const katexRoot = path.join(root, 'node_modules', 'katex', 'dist')
  await fs.mkdir(path.join(assetRoot, 'katex'), { recursive: true })
  await fs.copyFile(path.join(katexRoot, 'katex.min.css'), path.join(assetRoot, 'katex', 'katex.min.css'))
  await fs.cp(path.join(katexRoot, 'fonts'), path.join(assetRoot, 'katex', 'fonts'), { recursive: true })
  const assets = [...(manifest.assets || []), ...chapters.flatMap(chapter => chapter.assets || [])]
  const copied = new Set()
  for (const asset of assets) {
    if (!asset.source || !asset.dest || copied.has(asset.dest)) continue
    const destination = safeOutputPath(outputRoot, asset.dest)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(path.resolve(root, asset.source), destination)
    copied.add(asset.dest)
  }
  const result = { outputRoot, pages: pageCount, categories: categories.length, chapters: chapters.length, assets: copied.size }
  console.log(`Library built: ${result.chapters} chapters, ${result.categories} categories, ${result.pages} pages, ${result.assets} assets → ${outputRoot}`)
  return result
}

if (process.argv[1] && path.resolve(process.argv[1]) === ownFile) {
  const args = process.argv.slice(2)
  const options = {}
  let root = defaultRoot
  const positional = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--manifest') options.manifest = args[++i]
    else if (['--out', '--outdir', '--out-dir', '--dist'].includes(args[i])) options.outDir = args[++i]
    else if (args[i] === '--root') root = args[++i]
    else if (['--help', '-h'].includes(args[i])) { console.log('Usage: node scripts/build-library-site.mjs [manifest.json] [output-dir]\n       node scripts/build-library-site.mjs --manifest data/library.json --out dist\nImport: await buildLibrarySite(projectRoot, { manifest, outDir })'); process.exit(0) }
    else positional.push(args[i])
  }
  if (positional[0]) options.manifest = positional[0]
  if (positional[1]) options.outDir = positional[1]
  buildLibrarySite(root, options).catch(error => { console.error(error); process.exitCode = 1 })
}
