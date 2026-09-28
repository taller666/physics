import fs from 'node:fs/promises'
import path from 'node:path'
import { constants } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileError } from './assets.mjs'

const exists = filename => fs.access(filename).then(() => true).catch(() => false)

/** Import only once; preserve the exact original note bytes before its image section. */
export async function migrateInitialContent(root) {
  root = path.resolve(root)
  const marker = path.join(root, 'content', '.migration-electrostatics.json')
  const category = path.join(root, 'content', '电磁学')
  const chapter = path.join(category, '01-静电场')
  const target = path.join(chapter, 'index.md')
  if (await exists(marker) || await exists(target)) return { migrated: false }
  const source = path.join(root, 'sources', '静电场-原稿.md')
  if (!await exists(source)) return { migrated: false }
  const original = await fs.readFile(source)
  const imageMarker = Buffer.from('例题：直接求电场', 'utf8')
  const markerIndex = original.indexOf(imageMarker)
  if (markerIndex < 0) throw fileError(source, '初次迁移需要找到原图分界标记“例题：直接求电场”')
  const body = original.subarray(0, markerIndex)
  const images = []
  for (let index = 1; index <= 20; index++) {
    const name = String(index).padStart(2, '0') + '.png'
    const from = path.join(root, 'public', 'originals', name)
    let bytes
    try { bytes = await fs.readFile(from) } catch { throw fileError(from, '初次迁移缺少原始截图') }
    images.push({ name, from, sha256: createHash('sha256').update(bytes).digest('hex') })
  }

  await fs.mkdir(path.join(chapter, 'right'), { recursive: true })
  const categoryConfig = JSON.stringify({ title: '电磁学', slug: 'electromagnetism', description: '电磁学学习笔记与习题资料', order: 1 }, null, 2) + '\n'
  await fs.writeFile(path.join(category, '_category.json'), categoryConfig, { flag: 'wx' }).catch(error => {
    if (error.code !== 'EEXIST') throw error
  })
  for (const image of images) {
    const to = path.join(chapter, 'right', image.name)
    await fs.copyFile(image.from, to, constants.COPYFILE_EXCL).catch(error => {
      if (error.code !== 'EEXIST') throw error
    })
  }
  const frontmatter = Buffer.from('---\ntitle: 静电场\nslug: electrostatics\ndescription: 库仑定律、静电场的基本性质与数学工具\norder: 1\nrightTitle: 原题截图\n---\n', 'utf8')
  await fs.writeFile(target, Buffer.concat([frontmatter, body]), { flag: 'wx' })
  await fs.writeFile(marker, JSON.stringify({
    source: 'sources/静电场-原稿.md',
    bodySha256: createHash('sha256').update(body).digest('hex'),
    images: images.map(({ name, sha256 }) => ({ name, sha256 }))
  }, null, 2) + '\n', { flag: 'wx' })
  return { migrated: true, images: images.length, target: 'content/电磁学/01-静电场/index.md' }
}
