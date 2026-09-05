import { chromium } from 'playwright'
import fs from 'node:fs'
const out='output/playwright/audit-20260905'
fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'})
const page=await context.newPage()
const errors=[]
page.on('pageerror',e=>errors.push(String(e)))
const records=[]
for(const size of [{width:1440,height:1000},{width:390,height:844}]) {
 await page.setViewportSize(size)
 for(const route of ['/','/path','/kana','/vocabulary','/grammar','/semantics','/pragmatics','/quiz','/review','/learn/day-1-a-row-hello']) {
  await page.goto('http://127.0.0.1:3217'+route,{waitUntil:'networkidle'})
  await page.screenshot({path:`${out}/${size.width}-${route.replaceAll('/','_')||'home'}.png`})
  const record=await page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,elements:document.querySelectorAll('*').length,navVisible:!!document.querySelector('header nav')?.getClientRects().length,body:document.body.innerText.slice(0,10000),resources:performance.getEntriesByType('resource').filter(r=>r.initiatorType==='script').reduce((n,r)=>n+r.encodedBodySize,0),smallTargets:[...document.querySelectorAll('button,a')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&(r.width<24||r.height<24)}).map(x=>({text:x.textContent||x.getAttribute('aria-label'),width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height})).slice(0,12)}))
  records.push({route,...record})
 }
}
await page.setViewportSize({width:1440,height:1000})
await page.emulateMedia({colorScheme:'dark'})
await page.goto('http://127.0.0.1:3217/',{waitUntil:'networkidle'})
await page.screenshot({path:out+'/dark-home.png'})
await page.goto('http://127.0.0.1:3217/kana',{waitUntil:'networkidle'})
await page.getByTestId('kana-card-a').click()
await page.getByRole('dialog').waitFor()
await page.screenshot({path:out+'/dark-kana-modal.png'})
fs.writeFileSync(out+'/browser-evidence.json',JSON.stringify({records,errors},null,2))
console.log(JSON.stringify({pages:records.length,errors,summary:records.map(({route,width,height,scrollWidth,elements,resources})=>({route,width,height,scrollWidth,elements,scriptEncodedBytes:resources}))},null,2))
await browser.close()
