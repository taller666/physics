import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createSiteServer } from './site-server.mjs'
const root = path.resolve(import.meta.dirname, '../dist')
if (!fs.existsSync(path.join(root, 'index.html'))) { console.error('请先运行 npm run build。'); process.exit(1) }
const { server } = createSiteServer(root)
server.listen(0, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`
  console.log(`网站：${url}\n使用时请保持窗口开启，按 Ctrl+C 停止。`)
  if (process.env.NO_OPEN === '1') return
  if (process.platform === 'win32') spawn('cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' })
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { stdio: 'ignore' })
})
