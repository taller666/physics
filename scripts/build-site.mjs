import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { prepareSlides } from './prepare-slides.mjs'

const root = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
if (args.length && (args.length !== 2 || args[0] !== '--out')) throw new Error('Usage: build-site.mjs [--out dist|.preview/a|.preview/b]')
const output = args[1] || 'dist'
if (!['dist', '.preview/a', '.preview/b'].includes(output)) throw new Error('Unsupported output directory')
const dist = path.resolve(root, output)
async function run(script, args = []) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit', windowsHide: true })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${script} failed (${code})`)))
  })
}

await run('scripts/prepare-library.mjs')
const library = await prepareSlides(root)
// Only the generated output inside this project may be removed; refuse junctions.
const current = await fs.lstat(dist).catch(error => { if (error.code !== 'ENOENT') throw error })
const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value
if (!dist.startsWith(root + path.sep) || current?.isSymbolicLink()) throw new Error('Unsafe output directory')
await fs.mkdir(path.dirname(dist), { recursive: true })
if (normalize(await fs.realpath(path.dirname(dist))) !== normalize(path.dirname(dist))) throw new Error('Output parent resolves outside the project')
if (current && normalize(await fs.realpath(dist)) !== normalize(dist)) throw new Error('Output directory resolves outside the project')
await fs.rm(dist, { recursive: true, force: true })
await fs.mkdir(dist, { recursive: true })
await run('node_modules/@slidev/cli/bin/slidev.mjs', ['build', 'slides.md', '--base', '/slides/', '--out', `${output}/slides`])

// Give static hosting real files for Slidev deep links, without a site-wide SPA fallback.
const slideIndex = await fs.readFile(path.join(dist, 'slides/index.html'), 'utf8')
const routes = new Set(['overview', 'print', 'entry', 'notes', 'export', 'presenter', 'presenter/print'])
for (let n = 1; n <= Math.max(1, library.chapters.length); n++) {
  routes.add(String(n))
  routes.add(`presenter/${n}`)
  routes.add(`notes/${n}`)
  routes.add(`notes-edit/${n}`)
}
for (const route of routes) {
  const file = path.join(dist, 'slides', `${route}.html`)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, slideIndex)
}
await fs.rm(path.join(dist, 'slides/_redirects'), { force: true })
await run('scripts/build-library-site.mjs', ['--out', output])
console.log(`Website ready: ${library.categories.length} categories, ${library.chapters.length} chapters.`)
