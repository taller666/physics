import {chromium} from 'playwright-chromium'
import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve(import.meta.dirname,'..')
const base=process.env.LECTURE_URL||'http://localhost:3030'
const out=path.join(root,'qa/scroll');await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true})
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1})
const errors=[];page.on('pageerror',e=>errors.push(String(e)))
const netErrors=[];page.on('response',r=>{if(r.status()>=400)netErrors.push(`${r.status()} ${r.url()}`)})
const results=[]
for(let n=1;n<=4;n++){
  await page.goto(`${base}/${n}`,{waitUntil:'networkidle'})
  const view=page.locator(`[data-slidev-no="${n}"]`).filter({visible:true}).first()
  await view.locator('.notes-scroll').waitFor()
  await page.evaluate(()=>document.fonts.ready)
  await view.screenshot({path:path.join(out,`view-${n}.png`)})
  results.push(await view.evaluate(el=>({
    slide:el.dataset.slidevNo,
    images:el.querySelectorAll('.original-screenshots img').length,
    errors:el.querySelectorAll('.katex-error').length,
    panes:[...el.querySelectorAll('.independent-pane')].map(p=>({client:p.clientHeight,scroll:p.scrollHeight,width:p.clientWidth,scrollWidth:p.scrollWidth})),
    rightText:el.querySelector('.original-screenshots').innerText,
    active:el.querySelector('nav .active')?.textContent
  })))
}
await page.goto(`${base}/1`,{waitUntil:'networkidle'})
const view=page.locator('[data-slidev-no="1"]').filter({visible:true}).first()
const positions=()=>view.evaluate(el=>[...el.querySelectorAll('.independent-pane')].map(p=>p.scrollTop))
await page.mouse.move(220,400);await page.mouse.wheel(0,660);await page.waitForTimeout(350)
const afterLeft=await positions()
await page.mouse.move(1000,400);await page.mouse.wheel(0,700);await page.waitForTimeout(350)
const afterRight=await positions()
if(afterLeft[0]<=0||afterLeft[1]!==0||afterRight[0]!==afterLeft[0]||afterRight[1]<=0)throw new Error(`Scroll isolation failed: ${afterLeft} / ${afterRight}`)
await view.screenshot({path:path.join(out,'independent-scroll.png')})
await view.locator('.pane-heading button').first().click();await page.waitForTimeout(400)
const reset=await positions()
if(reset[0]!==0||reset[1]!==afterRight[1])throw new Error(`Left reset mismatch ${reset} versus previous ${afterRight}`)
await view.locator('.pane-heading button').nth(1).click();await page.waitForTimeout(400)
await view.locator('.screenshot-button').first().click()
await page.waitForSelector('dialog[open]')
await page.screenshot({path:path.join(out,'enlarged-image.png')})
await view.locator('dialog[open] .close-image').click()
await page.waitForSelector('dialog[open]',{state:'hidden'})
for(const n of [2,3,4,1]){await page.locator('nav[aria-label="章节"]:visible button').nth(n-1).click();await page.waitForURL(`**/${n}`)}
const report={results,afterLeft,afterRight,reset,errors,netErrors}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
await browser.close()
if(errors.length||netErrors.length||results.some(x=>x.errors||x.rightText.trim()))process.exitCode=1
