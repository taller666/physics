import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { compileLibrary, migrateInitialContent } from '../scripts/prepare-library.mjs'
import { readFrontmatter } from '../scripts/lib/library.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const png = Buffer.alloc(24)
Buffer.from([137,80,78,71,13,10,26,10]).copy(png)
png.writeUInt32BE(640, 16); png.writeUInt32BE(480, 20)

async function fixture(t) {
  const base = await fs.realpath(os.tmpdir())
  const root = await fs.mkdtemp(path.join(base, 'library-fixture-'))
  t.after(async () => {
    const resolved = path.resolve(root)
    const relative = path.relative(base, resolved)
    assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative) && path.basename(resolved).startsWith('library-fixture-'))
    await fs.rm(resolved, { recursive: true, force: true })
  })
  return root
}
async function put(root, relative, content) {
  const filename = path.join(root, relative)
  await fs.mkdir(path.dirname(filename), { recursive: true })
  await fs.writeFile(filename, content)
}
async function chapter(root, category, name, content = '# 正文\n\n$x^2$') {
  await put(root, 'content/' + category + '/' + name + '/index.md', content)
}

test('discovers new categories and chapters, infers metadata, and sorts numbers naturally', async t => {
  const root = await fixture(t)
  await put(root, 'site.config.json', JSON.stringify({ title: '测试笔记', description: '测试站点', author: '作者' }))
  await chapter(root, '02-数学', '10-积分')
  await chapter(root, '02-数学', '02-微分')
  await chapter(root, '01-电磁学', '01-静电场', '---\ntitle: 静电笔记\nslug: electrostatics\norder: 3\n---\n# 电场')
  let library = await compileLibrary(root)
  assert.deepEqual(library.categories.map(c => c.title), ['电磁学', '数学'])
  assert.deepEqual(library.chapters.map(c => c.title), ['静电笔记', '微分', '积分'])
  assert.deepEqual(library.chapters.map(c => c.slideNo), [1, 2, 3])
  assert.equal(library.site.title, '测试笔记')
  assert.equal(library.site.author, '作者')
  assert.equal(library.chapters[0].hasRight, false)
  assert.match(library.chapters[0].href, /^\/notes\/%E7%94%B5%E7%A3%81%E5%AD%A6\/electrostatics\/$/)
  await chapter(root, '03-研究', '01-新章')
  library = await compileLibrary(root)
  assert.equal(library.categories.length, 3)
  assert.equal(library.chapters.length, 4)
  assert.deepEqual(library, await compileLibrary(root), 'manifest must be deterministic')
})

test('right.md takes priority, supports formulas, links and both image syntaxes', async t => {
  const root = await fixture(t)
  const dir = 'content/电磁学/场'
  await chapter(root, '电磁学', '场', '# 左栏\n\n![左图](files/left.png)')
  await put(root, dir + '/right.md', '# 右栏\n\n$E=mc^2$\n\n![例题](right/02.png)\n\n![[right/10.png|另一张]]\n\n[PDF](files/资料.pdf#page=2)')
  await put(root, dir + '/right/01.png', png)
  await put(root, dir + '/right/02.png', png)
  await put(root, dir + '/right/10.png', png)
  await put(root, dir + '/files/left.png', png)
  await put(root, dir + '/files/资料.pdf', '%PDF-test')
  const library = await compileLibrary(root)
  const current = library.chapters[0]
  assert.equal(current.hasRight, true)
  assert.equal(current.images.length, 2)
  assert.deepEqual(current.images.map(image => image.alt), ['例题', '另一张'])
  assert.equal(current.images[0].width, 640)
  assert.equal(current.images[0].height, 480)
  assert.match(current.rightHtml, /data-zoom/)
  assert.match(current.rightHtml, /class="katex"/)
  assert.match(current.rightHtml, /%E8%B5%84%E6%96%99\.pdf#page=2/)
  assert.equal(current.rightToc[0].title, '右栏')
  assert.ok(current.rightToc[0].id.startsWith('right-'))
  assert.equal(library.assets.length, 4)
  assert.ok(!library.assets.some(asset => asset.source.endsWith('/01.png')), 'unused gallery is not appended or published')
  assert.deepEqual(current.assets, library.assets)
})

test('gallery supports required formats and natural numeric order', async t => {
  const root = await fixture(t)
  const dir = 'content/分类/章'
  await chapter(root, '分类', '章')
  for (const name of ['10.png', '2.png', '1.png']) await put(root, dir + '/right/' + name, png)
  await put(root, dir + '/right/11.svg', '<svg viewBox="0 0 320 200"></svg>')
  await put(root, dir + '/right/_private.png', png)
  await put(root, dir + '/right/readme.txt', 'not an image')
  const { chapters: [current], assets } = await compileLibrary(root)
  assert.deepEqual(current.images.map(image => image.alt), ['1.png', '2.png', '10.png', '11.svg'])
  assert.equal(current.images[3].width, 320)
  assert.equal(current.images[3].height, 200)
  assert.equal(current.hasRight, true)
  assert.equal(assets.length, 4)
})

test('draft and underscore folders never expose chapter metadata or assets', async t => {
  const root = await fixture(t)
  await chapter(root, '分类', 'public')
  await chapter(root, '分类', 'secret', '---\ndraft: true\n---\n![secret](missing.png)')
  await put(root, 'content/分类/secret/right/1.png', png)
  await chapter(root, '分类', '_private', '---\ninvalid: [\n---')
  await chapter(root, '_private-category', 'chapter', '![missing](missing.png)')
  await put(root, 'content/hidden/_category.json', '{"draft":true}')
  await chapter(root, 'hidden', 'chapter', '![missing](missing.png)')
  const library = await compileLibrary(root)
  assert.equal(library.categories.length, 1)
  assert.deepEqual(library.chapters.map(c => c.id), ['分类/public'])
  assert.deepEqual(library.assets, [])
  assert.ok(!JSON.stringify(library).includes('secret'))
})

test('article layout hides the right panel and does not publish its assets', async t => {
  const root = await fixture(t)
  await chapter(root, '分类', '文章', '---\nlayout: article\n---\n# 文章')
  await put(root, 'content/分类/文章/right.md', '![missing](missing.png)')
  await put(root, 'content/分类/文章/right/1.png', png)
  const { chapters: [current], assets } = await compileLibrary(root)
  assert.equal(current.layout, 'article')
  assert.equal(current.hasRight, false)
  assert.equal(current.rightHtml, '')
  assert.deepEqual(current.images, [])
  assert.deepEqual(assets, [])
})

test('an empty right.md still suppresses automatic gallery fallback', async t => {
  const root = await fixture(t)
  await chapter(root, '分类', '章')
  await put(root, 'content/分类/章/right.md', '')
  await put(root, 'content/分类/章/right/1.png', png)
  const library = await compileLibrary(root)
  assert.equal(library.chapters[0].hasRight, false)
  assert.deepEqual(library.assets, [])
})

test('missing and out-of-chapter references fail with the source and target filenames', async t => {
  const root = await fixture(t)
  const target = 'content/分类/章/index.md'
  for (const reference of ['files/missing.pdf', '../private.pdf', '%2e%2e/private.pdf', '_secret/file.png']) {
    await put(root, target, '[reference](' + reference + ')')
    await assert.rejects(() => compileLibrary(root), error => {
      assert.match(error.message, /index\.md/)
      assert.ok(error.message.includes(reference), error.message)
      return true
    })
  }
  await put(root, target, '![[right/missing.png]]')
  await assert.rejects(() => compileLibrary(root), /index\.md.*right\/missing\.png/)
})

test('duplicate category and chapter slugs fail, while same chapter slug in separate categories is valid', async t => {
  const root = await fixture(t)
  await chapter(root, 'A', 'one', '---\nslug: repeated\n---\n# A')
  await chapter(root, 'A', 'two', '---\nslug: repeated\n---\n# B')
  await assert.rejects(() => compileLibrary(root), /index\.md.*重复的章节 slug/)
  await put(root, 'content/A/two/index.md', '---\nslug: unique\n---\n# B')
  await chapter(root, 'B', 'one', '---\nslug: repeated\n---\n# C')
  assert.equal((await compileLibrary(root)).chapters.length, 3)
  await put(root, 'content/A/_category.json', '{"slug":"same"}')
  await put(root, 'content/B/_category.json', '{"slug":"same"}')
  await assert.rejects(() => compileLibrary(root), /_category\.json.*重复的分类 slug/)
  await put(root, 'content/B/_category.json', '{"slug":"../escape"}')
  await assert.rejects(() => compileLibrary(root), /_category\.json.*slug/)
})

test('code fences, inline code and indented code protect dollar signs and image references', async t => {
  const root = await fixture(t)
  const tick = String.fromCharCode(96)
  const source = [
    '# Math', '', '$x^2$', '', '$$', '\\frac{1}{r}', '$$', '',
    tick.repeat(3) + 'tex', '$$\\unsupportedCommand$$', '$inline$', '![[missing.png]]', tick.repeat(3), '',
    tick + '$$\\alsoUnsupported$$' + tick, '',
    '    $$\\indentedUnsupported$$', '', '    $ordinary$', '',
    'before $$\\nabla f$$ after'
  ].join('\n')
  await chapter(root, '分类', '章', source)
  const html = (await compileLibrary(root)).chapters[0].leftHtml
  assert.equal((html.match(/class="katex"/g) || []).length, 3)
  assert.match(html, /<pre><code class="language-tex">/)
  assert.ok(html.includes('$$\\unsupportedCommand$$'))
  assert.ok(html.includes('$$\\alsoUnsupported$$'))
  assert.ok(html.includes('$$\\indentedUnsupported$$'))
  assert.ok(!html.includes('LIBRARYDISPLAYMATH'))
})

test('original bold headings become h2 TOC entries without rewriting ordinary text or fenced code', async t => {
  const root = await fixture(t)
  const tick = String.fromCharCode(96)
  await chapter(root, '分类', '章', [
    '**库仑定律**', '', '正文', '', '**静电场的基本性质**', '', '**数学**', '',
    '正文含有**数学**但不是标题', '', tick.repeat(3), '**数学**', tick.repeat(3)
  ].join('\n'))
  const current = (await compileLibrary(root)).chapters[0]
  assert.deepEqual(current.leftToc.map(item => [item.title, item.level]), [['库仑定律', 2], ['静电场的基本性质', 2], ['数学', 2]])
  assert.equal((current.leftHtml.match(/<h2 /g) || []).length, 3)
  assert.match(current.leftHtml, /正文含有<strong>数学<\/strong>/)
})

test('HTML comments hide missing assets and invalid math before parsing either column', async t => {
  const root = await fixture(t)
  const hidden = [
    '<!-- single-line ![missing](missing.png) -->',
    '<!--',
    '![[right/missing.png]]',
    '[PDF](files/missing.pdf)',
    '$$\\unsupportedCommand$$',
    '$$ no closing math delimiter',
    '-->'
  ].join('\n')
  await chapter(root, '分类', '章', '# 可见标题\n\n' + hidden + '\n\n可见 $x^2$。')
  await put(root, 'content/分类/章/right.md', '# 右栏\n\n' + hidden + '\n\n可见文字。')
  const library = await compileLibrary(root)
  const current = library.chapters[0]
  assert.equal((current.leftHtml.match(/class="katex"/g) || []).length, 1)
  assert.ok(current.leftHtml.includes('可见标题'))
  assert.ok(current.rightHtml.includes('可见文字'))
  assert.ok(!current.leftHtml.includes('missing'))
  assert.ok(!current.rightHtml.includes('missing'))
  assert.ok(!current.leftHtml.includes('unsupportedCommand'))
  assert.deepEqual(library.assets, [])
})

test('HTML comment text inside inline, fenced, and indented code remains literal', async t => {
  const root = await fixture(t)
  const tick = String.fromCharCode(96)
  const source = [
    '# 代码', '',
    tick + '<!-- inline $$\\badInline$$ -->' + tick, '',
    tick.repeat(3) + 'html',
    '<!-- fenced',
    '![[missing.png]] $$\\badFence$$',
    '-->',
    tick.repeat(3), '',
    '~~~html',
    '<!-- tilde-fence $$\\badTilde$$ -->',
    '~~~', '',
    '    <!-- indented $$\\badIndent$$ -->', '',
    '\\<!-- escaped literal -->'
  ].join('\n')
  await chapter(root, '分类', '章', source)
  const html = (await compileLibrary(root)).chapters[0].leftHtml
  for (const label of ['inline', 'fenced', 'tilde-fence', 'indented', 'escaped literal'])
    assert.ok(html.includes(label), label)
  assert.equal((html.match(/&lt;!--/g) || []).length, 5)
  assert.ok(!html.includes('class="katex"'))
})

test('publishing the chapter template ignores its instructional comment examples', async t => {
  const root = await fixture(t)
  const template = await fs.readFile(path.join(projectRoot, 'templates/章节模板/index.md'), 'utf8')
  const source = template.replaceAll('{{TITLE_JSON}}', JSON.stringify('模板测试'))
    .replaceAll('{{TITLE_TEXT}}', '模板测试').replace('draft: true', 'draft: false')
  await chapter(root, '新分类', '新章节', source)
  const library = await compileLibrary(root)
  assert.equal(library.chapters.length, 1)
  assert.deepEqual(library.assets, [])
  assert.ok(!library.chapters[0].leftHtml.includes('files/讲义.pdf'))
  assert.ok(!library.chapters[0].leftHtml.includes('右栏自动图片'))
})

test('malformed metadata and math fail usefully without writing a manifest', async t => {
  const root = await fixture(t)
  await chapter(root, '分类', '章', '---\ntitle: [broken\n---\n# 正文')
  await assert.rejects(() => compileLibrary(root), /index\.md.*YAML/)
  await put(root, 'content/分类/章/index.md', '$$\\unsupportedCommand$$')
  await assert.rejects(() => compileLibrary(root), /index\.md.*数学公式无效/)
  await assert.rejects(() => fs.access(path.join(root, 'data/library.json')))
})

test('first migration is byte preserving, copies 20 images, and never overwrites edits', async t => {
  const root = await fixture(t)
  const original = Buffer.from('**库仑定律**\r\n\r\n原字节 $x$  \r\n例题：直接求电场\r\n![[old.png]]')
  await put(root, 'sources/静电场-原稿.md', original)
  for (let n = 1; n <= 20; n++) {
    const image = Buffer.concat([png, Buffer.from([n])])
    await put(root, 'public/originals/' + String(n).padStart(2, '0') + '.png', image)
  }
  assert.equal((await migrateInitialContent(root)).migrated, true)
  const target = path.join(root, 'content/电磁学/01-静电场/index.md')
  const imported = await fs.readFile(target, 'utf8')
  const expected = original.subarray(0, original.indexOf(Buffer.from('例题：直接求电场'))).toString('utf8')
  assert.equal(readFrontmatter(imported, target).body, expected)
  for (let n = 1; n <= 20; n++) {
    const name = String(n).padStart(2, '0') + '.png'
    assert.equal(sha(await fs.readFile(path.join(root, 'public/originals', name))),
      sha(await fs.readFile(path.join(root, 'content/电磁学/01-静电场/right', name))))
  }
  await fs.writeFile(target, '# 用户修改')
  assert.equal((await migrateInitialContent(root)).migrated, false)
  assert.equal(await fs.readFile(target, 'utf8'), '# 用户修改')
  assert.equal(sha(await fs.readFile(path.join(root, 'sources/静电场-原稿.md'))), sha(original))
})

test('real original migrates with unchanged body and all 20 original image hashes', async t => {
  const root = await fixture(t)
  const original = await fs.readFile(path.join(projectRoot, 'sources/静电场-原稿.md'), 'utf8')
  await put(root, 'sources/静电场-原稿.md', original)
  for (let n = 1; n <= 20; n++) {
    const name = String(n).padStart(2, '0') + '.png'
    await put(root, 'public/originals/' + name, await fs.readFile(path.join(projectRoot, 'public/originals', name)))
  }
  await migrateInitialContent(root)
  const target = path.join(root, 'content/电磁学/01-静电场/index.md')
  const current = readFrontmatter(await fs.readFile(target, 'utf8'), target)
  assert.equal(current.body, original.slice(0, original.indexOf('例题：直接求电场')))
  for (let n = 1; n <= 20; n++) {
    const name = String(n).padStart(2, '0') + '.png'
    assert.equal(sha(await fs.readFile(path.join(projectRoot, 'public/originals', name))),
      sha(await fs.readFile(path.join(root, 'content/电磁学/01-静电场/right', name))), name)
  }
  const library = await compileLibrary(root)
  const imported = library.chapters.find(item => item.slug === 'electrostatics')
  assert.equal(imported.images.length, 20)
  assert.deepEqual(imported.leftToc.slice(0, 3).map(item => item.title), ['库仑定律', '静电场的基本性质', '数学'])
})
