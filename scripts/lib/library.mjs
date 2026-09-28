import fs from 'node:fs/promises'
import path from 'node:path'
import { parseDocument } from 'yaml'
import { createAssetResolver, listGallery, naturalCompare, slash, fileError, isWithin } from './assets.mjs'
import { renderMarkdown, renderGallery } from './markdown.mjs'

export const DEFAULT_SITE = {
  title: 'taller666 的笔记',
  description: '个人学习笔记、课程资料与研究记录'
}

const titleFromDir = name => name.replace(/^\d+[-_.\s]+/, '').replace(/[-_]+/g, ' ').trim() || name
const inferredSlug = name => titleFromDir(name).normalize('NFKC').toLowerCase()
  .replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^[._-]+|[._-]+$/g, '') || 'chapter'
const inferredOrder = name => Number(name.match(/^(\d+)(?:[-_.\s]|$)/)?.[1] || 1000)
const exists = async filename => fs.stat(filename).then(stat => stat.isFile()).catch(error => {
  if (error.code === 'ENOENT') return false
  throw error
})

export function readFrontmatter(raw, sourceFile) {
  const source = raw.replace(/^\uFEFF/, '')
  const opening = source.match(/^---[ \t]*\r?\n/)
  if (!opening) return { meta: {}, body: source }
  const rest = source.slice(opening[0].length)
  const closing = /^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m.exec(rest)
  if (!closing) throw fileError(sourceFile, 'YAML frontmatter 缺少结束分隔符 ---')
  const document = parseDocument(rest.slice(0, closing.index), { uniqueKeys: true })
  if (document.errors.length) throw fileError(sourceFile, 'YAML frontmatter 无效：' + document.errors[0].message)
  const meta = document.toJS() ?? {}
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw fileError(sourceFile, 'frontmatter 必须是键值对象')
  return { meta, body: rest.slice(closing.index + closing[0].length) }
}

function validateMeta(meta, file) {
  for (const key of ['title', 'slug', 'description', 'rightTitle', 'layout'])
    if (meta[key] !== undefined && typeof meta[key] !== 'string') throw fileError(file, key + ' 必须是字符串')
  if (meta.order !== undefined && (typeof meta.order !== 'number' || !Number.isFinite(meta.order)))
    throw fileError(file, 'order 必须是有限数字')
  if (meta.draft !== undefined && typeof meta.draft !== 'boolean') throw fileError(file, 'draft 必须是布尔值 true/false')
}

function slugValue(value, dirname, sourceFile) {
  const slug = (value === undefined ? inferredSlug(dirname) : value.trim()).normalize('NFC')
  if (!/^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u.test(slug) || slug === '.' || slug === '..')
    throw fileError(sourceFile, 'slug 必须是单个安全路径段（文字、数字、点、下划线或连字符）：' + slug)
  return slug
}

async function readJson(filename, fallback = {}) {
  let raw
  try { raw = await fs.readFile(filename, 'utf8') }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error }
  let value
  try { value = JSON.parse(raw.replace(/^\uFEFF/, '')) }
  catch (error) { throw fileError(filename, 'JSON 无效：' + error.message) }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw fileError(filename, 'JSON 必须是对象')
  return value
}

async function childDirectories(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  const selected = []
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    if (entry.isSymbolicLink()) throw fileError(path.join(directory, entry.name), '分类和章节目录不能是符号链接')
    if (entry.isDirectory()) selected.push(entry.name)
  }
  return selected.sort(naturalCompare)
}

const sortEntries = (a, b) => a.order - b.order || naturalCompare(a.id, b.id)

/**
 * Compile a deterministic in-memory manifest. Does not migrate or write files.
 * options.site overlays site.config.json (useful to compile a fixture).
 */
export async function compileLibrary(root, options = {}) {
  root = path.resolve(root)
  const content = path.join(root, 'content')
  const config = { ...DEFAULT_SITE, ...await readJson(path.join(root, 'site.config.json')), ...(options.site || {}) }
  if (typeof config.title !== 'string' || typeof config.description !== 'string')
    throw fileError(path.join(root, 'site.config.json'), 'title 和 description 必须是字符串')
  const categories = []
  const chapters = []
  const allAssets = new Map()
  const categorySlugs = new Map()

  for (const categoryId of await childDirectories(content)) {
    const categoryDir = path.join(content, categoryId)
    const categoryFile = path.join(categoryDir, '_category.json')
    const categoryMeta = await readJson(categoryFile)
    validateMeta(categoryMeta, categoryFile)
    if (categoryMeta.draft === true) continue
    const categorySlug = slugValue(categoryMeta.slug, categoryId, categoryFile)
    const category = {
      id: categoryId, slug: categorySlug,
      title: categoryMeta.title || titleFromDir(categoryId),
      description: categoryMeta.description || '',
      order: categoryMeta.order ?? inferredOrder(categoryId),
      href: '/category/' + encodeURIComponent(categorySlug) + '/'
    }
    const categoryChapters = []
    const chapterSlugs = new Map()

    for (const chapterName of await childDirectories(categoryDir)) {
      const chapterDir = path.join(categoryDir, chapterName)
      const sourcePath = path.join(chapterDir, 'index.md')
      if (!await exists(sourcePath)) continue
      const realSource = await fs.realpath(sourcePath)
      if (!isWithin(await fs.realpath(chapterDir), realSource))
        throw fileError(sourcePath, 'index.md 符号链接越出章节目录')
      const raw = await fs.readFile(sourcePath, 'utf8')
      const { meta, body } = readFrontmatter(raw, sourcePath)
      validateMeta(meta, sourcePath)
      if (meta.draft === true) continue
      const chapterSlug = slugValue(meta.slug, chapterName, sourcePath)
      const slugKey = chapterSlug.toLocaleLowerCase('en')
      if (chapterSlugs.has(slugKey))
        throw fileError(sourcePath, '同一分类内重复的章节 slug "' + chapterSlug + '"；已用于 ' + chapterSlugs.get(slugKey))
      chapterSlugs.set(slugKey, sourcePath)

      const resolver = await createAssetResolver({ root, chapterDir, categorySlug, chapterSlug })
      const legacyObsidian = ['库仑定律', '静电场的基本性质', '数学'].every(title =>
        body.split(/\r?\n/).some(line => line.trim() === '**' + title + '**'))
      const left = await renderMarkdown(body, { sourceFile: sourcePath, resolver, tocPrefix: 'left', legacyObsidian })
      const article = meta.layout === 'article'
      const rightPath = path.join(chapterDir, 'right.md')
      let right = { html: '', toc: [], images: [] }
      let hasRight = false
      if (!article && await exists(rightPath)) {
        const rightReal = await fs.realpath(rightPath)
        if (!isWithin(await fs.realpath(chapterDir), rightReal))
          throw fileError(rightPath, 'right.md 符号链接越出章节目录')
        const rightRaw = await fs.readFile(rightPath, 'utf8')
        const rightBody = readFrontmatter(rightRaw, rightPath).body
        right = await renderMarkdown(rightBody, { sourceFile: rightPath, resolver, tocPrefix: 'right' })
        hasRight = Boolean(rightBody.trim())
      } else if (!article) {
        for (const filename of await listGallery(chapterDir)) {
          const asset = await resolver.resolve(filename, sourcePath, { image: true })
          right.images.push({
            src: asset.url,
            alt: path.basename(filename),
            ...(asset.width ? { width: asset.width, height: asset.height } : {})
          })
        }
        right.html = renderGallery(right.images)
        hasRight = right.images.length > 0
      }
      const assets = [...resolver.assets.values()].sort((a, b) => naturalCompare(a.source, b.source))
      for (const asset of assets) {
        const existing = allAssets.get(asset.dest.toLowerCase())
        if (existing && existing.source !== asset.source)
          throw fileError(sourcePath, '资源输出路径冲突：' + asset.dest)
        allAssets.set(asset.dest.toLowerCase(), asset)
      }
      categoryChapters.push({
        id: categoryId + '/' + chapterName,
        categoryId, categoryTitle: category.title,
        slug: chapterSlug, title: meta.title || titleFromDir(chapterName),
        description: meta.description || '',
        order: meta.order ?? inferredOrder(chapterName),
        href: '/notes/' + encodeURIComponent(categorySlug) + '/' + encodeURIComponent(chapterSlug) + '/',
        slideNo: 0,
        source: slash(path.relative(root, sourcePath)),
        layout: article ? 'article' : (meta.layout || 'split'),
        leftHtml: left.html, leftToc: left.toc,
        rightHtml: right.html, rightToc: right.toc,
        images: right.images,
        hasRight, rightTitle: meta.rightTitle || '图示与资料',
        assets
      })
    }
    if (!categoryChapters.length) continue
    const categoryKey = categorySlug.toLocaleLowerCase('en')
    if (categorySlugs.has(categoryKey))
      throw fileError(categoryFile, '重复的分类 slug "' + categorySlug + '"；已用于 ' + categorySlugs.get(categoryKey))
    categorySlugs.set(categoryKey, categoryFile)
    categories.push(category)
    chapters.push(...categoryChapters.sort(sortEntries))
  }
  categories.sort(sortEntries)
  const categoryOrder = new Map(categories.map((category, index) => [category.id, index]))
  chapters.sort((a, b) => categoryOrder.get(a.categoryId) - categoryOrder.get(b.categoryId) || sortEntries(a, b))
  chapters.forEach((chapter, index) => { chapter.slideNo = index + 1 })
  return { site: config, categories, chapters, assets: [...allAssets.values()].sort((a, b) => naturalCompare(a.dest, b.dest)) }
}
