import test from 'node:test'
import assert from 'node:assert/strict'
import { findGit } from '../scripts/lib/git-command.mjs'
import { createCommitMessage } from '../scripts/publish-site.mjs'

const missing = { error: { code: 'ENOENT' }, status: null }
const installed = { status: 0, stdout: 'git version 2.53.0.windows.1\n' }

test('uses the existing PATH Git when available', () => {
  const calls = []
  const result = findGit({ platform: 'win32', env: {}, probe: command => { calls.push(command); return installed } })
  assert.equal(result.command, 'git')
  assert.deepEqual(calls, ['git'])
})

test('finds bundled Git when an Explorer-launched terminal has no Git in PATH', () => {
  const env = { USERPROFILE: 'C:\\Users\\someone', ProgramFiles: 'C:\\Program Files', Path: 'C:\\Windows\\System32' }
  const original = { ...env }
  const expected = 'C:\\Users\\someone\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\native\\git\\cmd\\git.exe'
  const calls = []
  const result = findGit({ platform: 'win32', env, probe: (command, args, options) => {
    calls.push(command)
    assert.deepEqual(args, ['--version'])
    assert.equal(options.env, env)
    return command === expected ? installed : missing
  } })
  assert.equal(result.command, expected)
  assert(calls.includes('C:\\Program Files\\Git\\cmd\\git.exe'))
  assert.deepEqual(env, original)
})

test('prefers a normal installation over the bundled fallback', () => {
  const expected = 'C:\\Users\\someone\\AppData\\Local\\Programs\\Git\\cmd\\git.exe'
  const result = findGit({ platform: 'win32', env: { LOCALAPPDATA: 'C:\\Users\\someone\\AppData\\Local' }, probe: command => command === expected ? installed : missing })
  assert.equal(result.command, expected)
})

test('reports a useful error if no candidate can run Git', () => {
  assert.throws(() => findGit({ platform: 'win32', env: {}, probe: () => missing }), /未找到可用的 Git/)
})

const library = {
  categories: [{ id: '01-em', title: '电磁学' }],
  chapters: [
    { id: '01-em/01-static', categoryTitle: '电磁学', title: '静电场' },
    { id: '01-em/02-magnetic', categoryTitle: '电磁学', title: '静磁场' },
  ],
}

test('image-only updates name their chapter without claiming other generated slides changed', () => {
  assert.equal(createCommitMessage([
    'slides.md',
    'content/01-em/01-static/right/新增例题.png',
    'content/01-em/01-static/files/讲义.pdf',
    'content/01-em/01-static/right.md',
  ], library, '补充高斯定理例题'), '更新笔记：电磁学/静电场；补充高斯定理例题')
})

test('moves and deleted or draft chapters retain every affected chapter even without manifest metadata', () => {
  assert.equal(createCommitMessage([
    'content/01-em/02-magnetic/right/移动的图片.png',
    'content/数学物理方法_拓扑/01-拓扑/index.md',
    'content/01-em/01-static/right/移动的图片.png',
    'content/01-em/03-已删除章/index.md',
    'content/01-em/02-magnetic/index.md',
  ], library), '更新笔记：电磁学/静电场、电磁学/静磁场、电磁学/已删除章、数学物理方法 拓扑/拓扑')
})

test('category metadata, documentation and tool changes do not invent chapter updates', () => {
  assert.equal(createCommitMessage(['content/01-em/_category.json'], library), '更新分类：电磁学')
  assert.equal(createCommitMessage(['README.md', 'scripts/publish-site.mjs', 'slides.md'], library), '更新网站文档、网站工具')
  assert.equal(createCommitMessage(['slides.md'], library), '更新讲课模式')
})
