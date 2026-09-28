import MarkdownIt from 'markdown-it'
import katex from 'katex'
import path from 'node:path'
import { fileError } from './assets.mjs'

// Authoring guidance inside HTML comments is not published content. Keep code
// examples literal and retain comment newlines so neighbouring blocks do not join.
function stripHtmlComments(body) {
  let out = '', index = 0
  const escaped = at => {
    let count = 0
    while (at > 0 && body[--at] === '\\') count++
    return count % 2 === 1
  }
  while (index < body.length) {
    if (index === 0 || body[index - 1] === '\n') {
      const end = body.indexOf('\n', index)
      const lineEnd = end < 0 ? body.length : end + 1
      const line = body.slice(index, lineEnd)
      const fence = line.match(/^[ \t]*(?:>[ \t]*)*(\x60{3,}|~{3,})/)
      if (fence) {
        const marker = fence[1][0], length = fence[1].length
        let cursor = lineEnd
        while (cursor < body.length) {
          const next = body.indexOf('\n', cursor)
          const limit = next < 0 ? body.length : next + 1
          const ending = body.slice(cursor, limit).trim().replace(/^>[ \t]*/, '')
          cursor = limit
          if (new RegExp('^' + marker + '{' + length + ',}[ \\t]*$').test(ending)) break
        }
        out += body.slice(index, cursor); index = cursor; continue
      }
      if (/^(?: {4}|\t)/.test(line)) {
        out += line; index = lineEnd; continue
      }
    }
    if (body.charCodeAt(index) === 96 && !escaped(index)) {
      const run = body.slice(index).match(/^\x60+/)[0]
      const close = new RegExp('(?<!\\x60)' + run + '(?!\\x60)', 'g')
      close.lastIndex = index + run.length
      const match = close.exec(body)
      if (match) {
        const end = match.index + run.length
        out += body.slice(index, end); index = end; continue
      }
    }
    if (body.startsWith('<!--', index) && !escaped(index)) {
      const closing = body.indexOf('-->', index + 4)
      const end = closing < 0 ? body.length : closing + 3
      out += body.slice(index, end).replace(/[^\r\n]/g, '')
      index = end
      continue
    }
    out += body[index++]
  }
  return out
}

// Extract display math before block parsing: Obsidian accepts text immediately
// before "$$", which otherwise makes a closing delimiter look like a new block.
// Fenced/inline/ordinary indented code is copied verbatim.
function extractDisplayMath(body, { legacyObsidian, sourceFile }) {
  let prefix = 'LIBRARYDISPLAYMATH'
  while (body.includes(prefix)) prefix += 'X'
  const formulas = new Map()
  let out = '', index = 0
  const escaped = at => {
    let n = 0
    while (at > 0 && body[--at] === '\\') n++
    return n % 2 === 1
  }
  while (index < body.length) {
    const lineStart = index === 0 || body[index - 1] === '\n'
    if (lineStart) {
      const end = body.indexOf('\n', index)
      const lineEnd = end < 0 ? body.length : end + 1
      const line = body.slice(index, lineEnd)
      const fence = line.match(/^[ \t]*(?:>[ \t]*)*(\x60{3,}|~{3,})/)
      if (fence) {
        const marker = fence[1][0], length = fence[1].length
        let cursor = lineEnd
        while (cursor < body.length) {
          const next = body.indexOf('\n', cursor)
          const limit = next < 0 ? body.length : next + 1
          const ending = body.slice(cursor, limit).trim().replace(/^>[ \t]*/, '')
          cursor = limit
          if (new RegExp('^' + marker + '{' + length + ',}[ \\t]*$').test(ending)) break
        }
        out += body.slice(index, cursor); index = cursor; continue
      }
      if (!legacyObsidian && /^(?: {4}|\t)/.test(line)) {
        out += line; index = lineEnd; continue
      }
    }
    if (body.charCodeAt(index) === 96) {
      const run = body.slice(index).match(/^\x60+/)[0]
      const close = new RegExp('(?<!\\x60)' + run + '(?!\\x60)', 'g')
      close.lastIndex = index + run.length
      const match = close.exec(body)
      if (match) {
        const end = match.index + run.length
        out += body.slice(index, end); index = end; continue
      }
    }
    if (body.startsWith('$$', index) && !escaped(index)) {
      let end = index + 2
      while ((end = body.indexOf('$$', end)) >= 0 && escaped(end)) end += 2
      if (end < 0) throw fileError(sourceFile, '显示数学公式缺少结束分隔符 $$')
      const key = prefix + formulas.size + 'END'
      formulas.set(key, body.slice(index + 2, end).trim())
      out += '\n\n' + key + '\n\n'
      index = end + 2
      continue
    }
    out += body[index++]
  }
  return { body: out, formulas }
}

function mathPlugin(md) {
  md.inline.ruler.after('backticks', 'library_math', (state, silent) => {
    const start = state.pos
    if (state.src[start] !== '$') return false
    const display = state.src[start + 1] === '$'
    const delimiter = display ? '$$' : '$'
    const from = start + delimiter.length
    if (!display && /\s/.test(state.src[from] || '')) return false
    let end = from
    while ((end = state.src.indexOf(delimiter, end)) >= 0) {
      let backslashes = 0
      for (let i = end - 1; i >= 0 && state.src[i] === '\\'; i--) backslashes++
      if (backslashes % 2 === 0) break
      end += delimiter.length
    }
    if (end < 0 || end === from) return false
    const content = state.src.slice(from, end)
    if (!display && (content.includes('\n') || /\s$/.test(content))) return false
    if (!silent) {
      const token = state.push(display ? 'library_math_display' : 'library_math_inline', '', 0)
      token.content = content
      token.meta = { display }
    }
    state.pos = end + delimiter.length
    return true
  })

  md.block.ruler.before('code', 'library_math_block', (state, startLine, _endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const key = state.src.slice(start, state.eMarks[startLine]).trim()
    if (!state.env.displayFormulas.has(key)) return false
    if (silent) return true
    const token = state.push('library_math_block', '', 0)
    token.block = true
    token.content = state.env.displayFormulas.get(key)
    token.map = [startLine, startLine + 1]
    state.line = startLine + 1
    return true
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] })

  for (const type of ['library_math_inline', 'library_math_display', 'library_math_block']) {
    md.renderer.rules[type] = (tokens, index, _options, env) => {
      const token = tokens[index]
      const displayMode = type !== 'library_math_inline'
      let html
      try { html = katex.renderToString(token.content, { displayMode, throwOnError: true, strict: 'ignore', trust: false }) }
      catch (error) { throw fileError(env.sourceFile, '数学公式无效：' + error.message) }
      return type === 'library_math_block'
        ? '<div class="note-formula">' + html + '</div>\n'
        : '<span class="' + (displayMode ? 'note-formula-inline' : 'note-math') + '">' + html + '</span>'
    }
  }
}

function wikiImages(md) {
  md.inline.ruler.before('image', 'library_wiki_image', (state, silent) => {
    if (!state.src.startsWith('![[', state.pos)) return false
    const end = state.src.indexOf(']]', state.pos + 3)
    if (end < 0) return false
    const inside = state.src.slice(state.pos + 3, end)
    const divider = inside.indexOf('|')
    const href = (divider < 0 ? inside : inside.slice(0, divider)).trim()
    const alias = divider < 0 ? '' : inside.slice(divider + 1).trim()
    if (!href) return false
    if (!silent) {
      const image = state.push('image', 'img', 0)
      const dimension = alias.match(/^(\d+)(?:x(\d+))?$/)
      const alt = dimension ? path.posix.basename(href) : alias || path.posix.basename(href)
      image.attrs = [['src', href], ['alt', '']]
      if (dimension) {
        image.attrSet('width', dimension[1])
        if (dimension[2]) image.attrSet('height', dimension[2])
      }
      image.content = alt
      const text = new state.Token('text', '', 0)
      text.content = alt
      image.children = [text]
    }
    state.pos = end + 2
    return true
  })
}

const originalHeadings = new Set(['库仑定律', '静电场的基本性质', '数学'])
const stripHeading = token => (token.children || []).filter(child => !['html_inline', 'image'].includes(child.type))
  .map(child => child.type.endsWith('_open') || child.type.endsWith('_close') ? '' : child.content).join('').trim()
const headingSlug = value => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'section'

export async function renderMarkdown(body, { sourceFile, resolver, tocPrefix = 'left', legacyObsidian = false }) {
  const md = new MarkdownIt({ html: false, breaks: true, linkify: false, typographer: false })
  mathPlugin(md)
  wikiImages(md)
  const extracted = extractDisplayMath(stripHtmlComments(body), { sourceFile, legacyObsidian })
  const env = { sourceFile, legacyObsidian, displayFormulas: extracted.formulas }
  const tokens = md.parse(extracted.body, env)
  const toc = []
  const images = []
  const imageUrls = new Set()
  const headingCounts = new Map()

  // Promote only the three original standalone bold titles, never code or prose.
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type !== 'paragraph_open' || tokens[i + 1].type !== 'inline' || tokens[i + 2].type !== 'paragraph_close') continue
    const boldHeading = tokens[i + 1].content.trim().match(/^\*\*([^*]+)\*\*$/)?.[1]
    if (originalHeadings.has(boldHeading)) {
      tokens[i].type = 'heading_open'; tokens[i].tag = 'h2'; tokens[i].hidden = false
      tokens[i + 2].type = 'heading_close'; tokens[i + 2].tag = 'h2'; tokens[i + 2].hidden = false
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open' && tokens[i + 1]?.type === 'inline') {
      const title = stripHeading(tokens[i + 1])
      const base = tocPrefix + '-' + headingSlug(title)
      const count = (headingCounts.get(base) || 0) + 1
      headingCounts.set(base, count)
      const id = base + (count > 1 ? '-' + count : '')
      tokens[i].attrSet('id', id)
      tokens[i].attrSet('data-note-id', id)
      toc.push({ id, title, level: Number(tokens[i].tag.slice(1)) })
    }
  }

  async function visit(items) {
    for (const token of items) {
      if (token.type === 'image') {
        const asset = await resolver.resolve(token.attrGet('src'), sourceFile, { image: true })
        token.attrSet('src', asset.url)
        token.attrSet('loading', 'lazy')
        token.attrSet('decoding', 'async')
        token.attrSet('data-zoom', '')
        if (asset.width && !token.attrGet('width')) token.attrSet('width', String(asset.width))
        if (asset.height && !token.attrGet('height')) token.attrSet('height', String(asset.height))
        const alt = (token.children || []).map(child => child.content || '').join('') || token.content || ''
        if (!imageUrls.has(asset.url)) {
          imageUrls.add(asset.url)
          images.push({ src: asset.url, alt, ...(asset.width ? { width: asset.width, height: asset.height } : {}) })
        }
      } else if (token.type === 'link_open') {
        const asset = await resolver.resolve(token.attrGet('href'), sourceFile)
        token.attrSet('href', asset.url)
        if (/^https?:\/\//i.test(asset.url)) token.attrSet('rel', 'noopener noreferrer')
      }
      if (token.children && token.type !== 'image') await visit(token.children)
    }
  }
  await visit(tokens)
  return { html: md.renderer.render(tokens, md.options, env), toc, images }
}

export function renderGallery(images) {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  return images.map(image => '<figure class="library-figure"><img src="' + escape(image.src)
    + '" alt="' + escape(image.alt) + '" loading="lazy" decoding="async" data-zoom'
    + (image.width ? ' width="' + image.width + '" height="' + image.height + '"' : '')
    + '><figcaption>' + escape(image.alt) + '</figcaption></figure>').join('\n')
}
