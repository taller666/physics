import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const root=path.resolve(import.meta.dirname,'../dist')
const port=Number(process.env.PORT||3031)
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.pdf':'application/pdf'}
http.createServer((req,res)=>{
  let name
  try { name=decodeURIComponent(new URL(req.url,'http://localhost').pathname) } catch { res.writeHead(400).end(); return }
  let file=path.resolve(root,'.'+name)
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html')
  if(!fs.existsSync(file))file=path.join(root,'index.html')
  if(!fs.existsSync(file)){res.writeHead(404).end('Please run npm run build first.');return}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'})
  fs.createReadStream(file).pipe(res)
}).listen(port,'127.0.0.1',()=>console.log(`Lecture ready: http://127.0.0.1:${port}`))
