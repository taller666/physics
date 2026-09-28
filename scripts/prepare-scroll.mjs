import fs from 'node:fs/promises'
import path from 'node:path'
import MarkdownIt from 'markdown-it'
import katex from 'katex'
const root=path.resolve(import.meta.dirname,'..')
const original='C:/Users/86159/Desktop/AFB/静电场.md'
const source=process.argv[2] || (await fs.stat(original).catch(()=>false)?original:path.join(root,'sources/静电场-原稿.md'))
const raw=await fs.readFile(source,'utf8')
await fs.mkdir(path.join(root,'data'),{recursive:true})
await fs.mkdir(path.join(root,'sources'),{recursive:true})
await fs.mkdir(path.join(root,'public/originals'),{recursive:true})
await fs.writeFile(path.join(root,'sources/静电场-原稿.md'),raw)
const supplement=await fs.readFile(path.join(root,'sources/静电场-补全.md'),'utf8').catch(()=>null)
const notes=(supplement||raw.slice(0,raw.indexOf('例题：直接求电场'))).trim()
const basicAt=notes.search(/(?:\*\*|#{1,2}\s+)静电场的基本性质/)
const mathAt=notes.search(/(?:\*\*|#{1,2}\s+)数学(?:\*\*|\s|$)/)
if(basicAt<0||mathAt<0)throw new Error('Notes must contain the three main headings: 库仑定律、静电场的基本性质、数学')
const sections={all:notes,coulomb:notes.slice(0,basicAt).trim(),properties:notes.slice(basicAt,mathAt).trim(),math:notes.slice(mathAt).trim()}
const md=new MarkdownIt({html:true,breaks:true,typographer:false})
let formulaCount=0
const render=(text)=>{
  const blocks=[]
  text=text.replace(/\$\$([\s\S]*?)\$\$/g,(_,tex)=>{
    formulaCount++
    const index=blocks.length
    blocks.push(`<div class="note-formula">${katex.renderToString(tex.trim(),{displayMode:true,throwOnError:true,strict:'ignore'})}</div>`)
    return `\n\nMATHPLACEHOLDER${index}END\n\n`
  })
  text=text.replace(/\$([^$\n]+)\$/g,(_,tex)=>{formulaCount++;return katex.renderToString(tex,{throwOnError:true,strict:'ignore'})})
  text=text.split('\n').map(x=>x.trimStart()).join('\n')
  text=text.replace(/^(#{1,2}) /gm,(_,marks)=>'#'.repeat(marks.length+1)+' ')
  for(const label of ['库仑定律','静电场的基本性质','数学'])text=text.replace(`**${label}**`,`## ${label}`)
  text=text.replace(/^- (矢量|内积|叉乘|并矢|体积分|面积分)[：:]\s*$/gm,'### $1')
  let html=md.render(text)
  blocks.forEach((block,i)=>{html=html.replace(`<p>MATHPLACEHOLDER${i}END</p>`,block).replace(`MATHPLACEHOLDER${i}END`,block)})
  return html
}
const rendered=Object.fromEntries(Object.entries(sections).map(([key,markdown])=>{
  const toc=[]
  const html=render(markdown).replace(/<h([23])>([\s\S]*?)<\/h\1>/g,(_,level,label)=>{
    const id='note-'+toc.length
    toc.push({id,label:label.replace(/<[^>]+>/g,'')})
    return `<h${level} data-note-id="${id}">${label}</h${level}>`
  })
  return [key,{markdown,html,toc}]
}))
await fs.writeFile(path.join(root,'data/notes.json'),JSON.stringify(rendered))
const matches=[...raw.matchAll(/!\[\[([^\]]+\.png)\]\]/g)]
const gaussAt=raw.indexOf('\n高斯定理\n',raw.indexOf('例题：直接求电场'))
const images=[]
for(const [i,m] of matches.entries()){
  const file=`${String(i+1).padStart(2,'0')}.png`
  const imageSource=path.join(path.dirname(source),m[1])
  if(await fs.stat(imageSource).catch(()=>false))await fs.copyFile(imageSource,path.join(root,'public/originals',file))
  const bytes=await fs.readFile(path.join(root,'public/originals',file))
  images.push({index:i+1,source:m[1],src:`/originals/${file}`,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),group:m.index<gaussAt?'direct':'gauss'})
}
await fs.writeFile(path.join(root,'data/screenshots.json'),JSON.stringify(images,null,2))
console.log(`Preserved source text; copied ${images.length} screenshots in original order; rendered ${formulaCount} formula instances.`)
