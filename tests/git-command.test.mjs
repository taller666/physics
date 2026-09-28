import test from 'node:test'
import assert from 'node:assert/strict'
import { findGit } from '../scripts/lib/git-command.mjs'

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
