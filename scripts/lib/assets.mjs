import fs from 'node:fs/promises'
import path from 'node:path'

export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])
const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })
export const naturalCompare = (a, b) => collator.compare(a, b) || a.localeCompare(b)
export const slash = value => value.split(path.sep).join('/')
export const encodeSegments = value => value.split('/').map(encodeURIComponent).join('/')
export const isWithin = (parent, child) => {
  const rel = path.relative(parent, child)
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel))
}

export function fileError(file, message) {
  return new Error(file + ': ' + message)
}

export function imageSize(bytes, extension) {
  if (extension === '.png' && bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  if (extension === '.gif' && bytes.length >= 10 && /^GIF8[79]a/.test(bytes.toString('ascii', 0, 6)))
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) }
  if (extension === '.jpg' || extension === '.jpeg') {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return {}
    let offset = 2
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue }
      while (bytes[offset] === 0xff) offset++
      const marker = bytes[offset++]
      if (marker === 0xd9 || marker === 0xda) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
      const length = bytes.readUInt16BE(offset)
      if (length < 2 || offset + length > bytes.length) break
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))
        return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) }
      offset += length
    }
  }
  if (extension === '.webp' && bytes.length >= 30 && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const kind = bytes.toString('ascii', 12, 16)
    if (kind === 'VP8X') return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 }
    if (kind === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a)
      return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff }
    if (kind === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
    }
  }
  if (extension === '.svg') {
    const tag = bytes.toString('utf8').match(/<svg\b[^>]*>/i)?.[0] || ''
    const width = tag.match(/\bwidth\s*=\s*["'](\d+(?:\.\d+)?)(?:px)?["']/i)?.[1]
    const height = tag.match(/\bheight\s*=\s*["'](\d+(?:\.\d+)?)(?:px)?["']/i)?.[1]
    if (width && height) return { width: +width, height: +height }
    const box = tag.match(/\bviewBox\s*=\s*["']\s*([-\d.e+]+)[ ,]+([-\d.e+]+)[ ,]+([\d.e+]+)[ ,]+([\d.e+]+)\s*["']/i)
    if (box && +box[3] > 0 && +box[4] > 0) return { width: +box[3], height: +box[4] }
  }
  return {}
}

export async function createAssetResolver({ root, chapterDir, categorySlug, chapterSlug }) {
  const chapterReal = await fs.realpath(chapterDir)
  const rootReal = await fs.realpath(root)
  if (!isWithin(rootReal, chapterReal)) throw fileError(chapterDir, '章节目录越出站点根目录')
  const assets = new Map()

  async function resolve(reference, sourceFile, { image = false } = {}) {
    const value = String(reference || '').trim()
    if (!value) throw fileError(sourceFile, '空的资源引用')
    if (/^(?:https?:\/\/|mailto:|tel:|#)/i.test(value)) return { url: value, external: true }
    if (value.startsWith('//')) return { url: value, external: true }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) throw fileError(sourceFile, '不支持的资源地址：' + value)
    // Root-relative routes are already public URLs, never filesystem paths.
    if (value.startsWith('/') && !value.startsWith('/../')) return { url: value, external: true }

    const suffixAt = value.search(/[?#]/)
    const pathname = suffixAt < 0 ? value : value.slice(0, suffixAt)
    const suffix = suffixAt < 0 ? '' : value.slice(suffixAt)
    let decoded
    try { decoded = decodeURIComponent(pathname) } catch { throw fileError(sourceFile, '资源地址编码无效：' + value) }
    if (decoded.includes('\0') || decoded.includes('\\') || path.isAbsolute(decoded))
      throw fileError(sourceFile, '资源路径无效或越界：' + value)
    if (decoded.split('/').some(segment => segment.startsWith('_')))
      throw fileError(sourceFile, '不允许引用被忽略的 _ 文件或目录：' + value)
    const absolute = path.resolve(chapterDir, decoded)
    if (!isWithin(chapterDir, absolute)) throw fileError(sourceFile, '资源引用越出章节目录：' + value)
    let stat, real
    try { [stat, real] = await Promise.all([fs.stat(absolute), fs.realpath(absolute)]) }
    catch { throw fileError(sourceFile, '引用的文件不存在：' + value) }
    if (!stat.isFile()) throw fileError(sourceFile, '资源引用不是文件：' + value)
    if (!isWithin(chapterReal, real)) throw fileError(sourceFile, '资源链接越出章节目录：' + value)
    const relative = slash(path.relative(chapterDir, absolute))
    const dest = ['media', categorySlug, chapterSlug, relative].join('/')
    const url = '/' + encodeSegments(dest)
    const source = slash(path.relative(root, absolute))
    if (!assets.has(source)) assets.set(source, { source, dest, url })
    const extension = path.extname(absolute).toLowerCase()
    const dimensions = image && IMAGE_EXTENSIONS.has(extension)
      ? imageSize(await fs.readFile(absolute), extension) : {}
    return { url: url + suffix, ...dimensions, source, dest }
  }

  return { resolve, assets }
}

export async function listGallery(chapterDir) {
  const right = path.join(chapterDir, 'right')
  const entries = await fs.readdir(right, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  return entries.filter(entry => !entry.name.startsWith('_') && !entry.name.startsWith('.')
    && (entry.isFile() || entry.isSymbolicLink()) && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map(entry => 'right/' + entry.name).sort(naturalCompare)
}
