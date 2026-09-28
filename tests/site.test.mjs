import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import { prepareSlides } from '../scripts/prepare-slides.mjs'
import { buildLibrarySite } from '../scripts/build-library-site.mjs'
import { createSiteServer } from '../scripts/site-server.mjs'

const project = path.resolve(import.meta.dirname, '..')
test('site navigation, chapter selectors, lecture pages and legacy URLs derive from the manifest', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'taller-library-site-'))
  try {
    const category = { id: 'test', title: '测试分类', slug: 'test', href: '/category/test/', order: 1 }
    const first = { id: 'test/electrostatics', categoryId: 'test', categoryTitle: '测试分类', slug: 'electrostatics', title: '静电场', href: '/notes/test/electrostatics/', slideNo: 1, order: 1, leftHtml: '<h2>笔记</h2>', leftToc: [], rightHtml: '', rightToc: [], hasRight: false, assets: [], images: [] }
    const extra = { ...first, id: 'test/chapter', title: '第二章 & <测试>', slug: 'second', order: 2, slideNo: 2, href: '/notes/test/second/', hasRight: false, assets: [], images: [] }
    const data = { site: { title: 'taller666 的笔记', description: '测试' }, categories: [category], chapters: [first, extra], assets: [] }
    await fs.mkdir(path.join(temporary, 'data'))
    await fs.writeFile(path.join(temporary, 'data/library.json'), JSON.stringify(data))
    await prepareSlides(temporary)
    const slides = await fs.readFile(path.join(temporary, 'slides.md'), 'utf8')
    assert.equal((slides.match(/<LibraryChapter /g) || []).length, 2)
    assert.match(slides, /chapter-id="test\/chapter"/)
    await buildLibrarySite(project, { data, outDir: temporary })
    const home = await fs.readFile(path.join(temporary, 'index.html'), 'utf8')
    assert(home.includes('第二章 &amp; &lt;测试&gt;'))
    const chapter = await fs.readFile(path.join(temporary, 'notes/test/second/index.html'), 'utf8')
    assert(chapter.includes('href="/slides/2"'))
    assert(chapter.includes('single-column'))
    assert(chapter.includes('value="/notes/test/second/" selected'))
    const legacyPresenter = await fs.readFile(path.join(temporary, 'presenter/4/index.html'), 'utf8')
    assert(legacyPresenter.includes('/slides/presenter/1'))
  } finally { await fs.rm(temporary, { recursive: true, force: true }) }
})

test('local preview serves chapter routes, Slidev HTML aliases and actual 404 responses', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'taller-library-server-'))
  const { server, refresh } = createSiteServer(temporary, { live: true })
  try {
    await fs.mkdir(path.join(temporary, 'slides'))
    await fs.mkdir(path.join(temporary, 'notes/example'), { recursive: true })
    await fs.writeFile(path.join(temporary, 'notes/example/index.html'), '<body>chapter</body>')
    await fs.writeFile(path.join(temporary, 'slides/1.html'), '<body>slide</body>')
    await fs.writeFile(path.join(temporary, '404.html'), '<body>not found</body>')
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const base = `http://127.0.0.1:${server.address().port}`
    for (const [route, status, body] of [['/notes/example/', 200, 'chapter'], ['/slides/1', 200, 'slide'], ['/unknown', 404, 'not found']]) {
      const response = await fetch(base + route)
      assert.equal(response.status, status)
      const content = await response.text()
      assert(content.includes(body))
      assert(content.includes('EventSource'))
    }
    const events = await fetch(base + '/__events')
    const reader = events.body.getReader()
    assert.equal(new TextDecoder().decode((await reader.read()).value), 'data: 0\n\n')
    refresh()
    assert.equal(new TextDecoder().decode((await reader.read()).value), 'data: 1\n\n')
    await reader.cancel()
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    await fs.rm(temporary, { recursive: true, force: true })
  }
})
