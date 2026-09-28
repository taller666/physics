import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import {spawn} from 'node:child_process'
const root=path.resolve(import.meta.dirname,'../dist')
if(!fs.existsSync(path.join(root,'index.html'))){console.error('Missing dist. Run npm install and npm run build first.');process.exit(1)}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'}
const server=http.createServer((req,res)=>{
  let name
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  let file=path.resolve(root,'.'+name)
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html')
  if(!fs.existsSync(file))file=path.join(root,'index.html')
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'})
  fs.createReadStream(file).pipe(res)
})
server.listen(0,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${server.address().port}/1`
  console.log(`Lecture: ${url}\nKeep this window open while teaching. Press Ctrl+C to stop.`)
  if(process.platform==='win32')spawn('cmd.exe',['/d','/c','start','',url],{windowsHide:true,stdio:'ignore'})
  else if(process.platform==='darwin')spawn('open',[url],{stdio:'ignore'})
  else spawn('xdg-open',[url],{stdio:'ignore'})
})
