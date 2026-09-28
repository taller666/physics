import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' }
const reload = `<script>let revision;const events=new EventSource('/__events');events.onmessage=e=>{if(revision!==undefined&&revision!==e.data)location.reload();revision=e.data}</script>`
export function createSiteServer(directory, { live = false } = {}) {
  let root = path.resolve(directory)
  const clients = new Set()
  let revision = 0
  const isFile = file => { try { return fs.statSync(file).isFile() } catch { return false } }
  const server = http.createServer(async (req, res) => {
    let name
    try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) } catch { res.writeHead(400).end(); return }
    if (live && name === '/__events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
      clients.add(res)
      res.write(`data: ${revision}\n\n`)
      req.on('close', () => clients.delete(res))
      return
    }
    const requestRoot = root
    try {
      let file = path.resolve(requestRoot, '.' + name)
      if (file !== requestRoot && !file.startsWith(requestRoot + path.sep)) { res.writeHead(403).end(); return }
      const stat = await fs.promises.stat(file).catch(() => null)
      if (stat?.isDirectory()) file = path.join(file, 'index.html')
      if (!isFile(file) && !path.extname(file) && isFile(file + '.html')) file += '.html'
      let status = 200
      if (!isFile(file)) { status = 404; file = path.join(requestRoot, '404.html') }
      const bytes = await fs.promises.readFile(file)
      res.writeHead(status, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
      if (req.method === 'HEAD') { res.end(); return }
      res.end(live && path.extname(file) === '.html' ? bytes.toString('utf8').replace('</body>', reload + '</body>') : bytes)
    } catch (error) {
      if (res.headersSent) { res.destroy(); return }
      res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><body>页面暂未生成，请检查构建输出。' + (live ? reload : '') + '</body></html>')
    }
  })
  return {
    server,
    setDirectory(next) { root = path.resolve(next) },
    refresh() { revision++; for (const client of clients) client.write(`data: ${revision}\n\n`) },
  }
}
