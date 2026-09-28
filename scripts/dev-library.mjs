import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createSiteServer } from './site-server.mjs'

const root = path.resolve(import.meta.dirname, '..')
const { server, refresh, setDirectory } = createSiteServer(path.join(root, '.preview/a'), { live: true })
let currentOutput = ''
let running = false
let queued = false
let timer
async function rebuild() {
  if (running) { queued = true; return }
  running = true
  const output = currentOutput === '.preview/a' ? '.preview/b' : '.preview/a'
  console.log('\n正在更新网站与讲课模式……')
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/build-site.mjs', '--out', output], { cwd: root, stdio: 'inherit', windowsHide: true })
      child.on('error', reject)
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`构建失败 (${code})；请检查上面的错误。`)))
    })
    currentOutput = output
    setDirectory(path.join(root, output))
    refresh()
    console.log('已更新。继续编辑并保存 Markdown 即可。')
  } catch (error) { console.error(error.message) }
  finally { running = false; if (queued) { queued = false; void rebuild() } }
}
await rebuild()
if (!currentOutput) process.exit(1)
let retried = false
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && !retried) { retried = true; server.listen(0, '127.0.0.1') }
  else { console.error(error); process.exit(1) }
})
server.on('listening', () => {
  const url = `http://127.0.0.1:${server.address().port}/`
  console.log(`本地预览：${url}\n保存内容后自动更新。关闭此窗口或按 Ctrl+C 停止。`)
  if (process.env.NO_OPEN === '1') return
  if (process.platform === 'win32') spawn('cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' })
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { stdio: 'ignore' })
})
server.listen(Number(process.env.PORT || 3032), '127.0.0.1')
function schedule() { clearTimeout(timer); timer = setTimeout(() => void rebuild(), 500) }
for (const directory of ['content', 'web']) {
  const folder = path.join(root, directory)
  if (fs.existsSync(folder)) fs.watch(folder, { recursive: true }, schedule)
}
fs.watch(root, (_, filename) => { if (filename === 'site.config.json') schedule() })
