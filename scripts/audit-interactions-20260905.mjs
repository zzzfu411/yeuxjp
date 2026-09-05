import {chromium} from 'playwright'
import fs from 'node:fs'
const dir='output/playwright/audit-20260905'
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',reducedMotion:'reduce'})
const page=await context.newPage()
await page.goto('http://127.0.0.1:3217/learn/day-1-a-row-hello',{waitUntil:'networkidle'})
const stepStates=[]
for(let i=0;i<8;i++) {
 const input=page.getByTestId('lesson-typing-input')
 if(await input.count()) {
  await input.fill('こんにち')
  await input.dispatchEvent('keydown',{key:'Enter',code:'Enter',isComposing:true,bubbles:true})
  await page.waitForFunction(()=>document.querySelector('[data-testid="lesson-typing-input"]')?.disabled)
  stepStates.push({imeSubmitted:await input.isDisabled(),text:await page.locator('main').first().innerText()})
  await page.screenshot({path:dir+'/ime-composition-submitted.png'})
  break
 }
 const choices=page.locator('[data-testid^="lesson-answer-"]')
 if(await choices.count()) await choices.first().click()
 await page.getByTestId('lesson-next').click()
}
await page.emulateMedia({colorScheme:'dark'})
await page.goto('http://127.0.0.1:3217/kana',{waitUntil:'networkidle'})
await page.getByTestId('kana-card-a').click()
await page.getByRole('dialog').waitFor()
await page.waitForFunction(()=>getComputedStyle(document.querySelector('[role="dialog"]').parentElement).opacity==='1')
await page.screenshot({path:dir+'/dark-kana-modal.png'})
const modal=await page.getByRole('dialog').evaluate(el=>({background:getComputedStyle(el).background,opacity:getComputedStyle(el).opacity,overlayOpacity:getComputedStyle(el.parentElement).opacity}))
fs.writeFileSync(dir+'/interaction-evidence.json',JSON.stringify({stepStates,modal},null,2))
console.log(JSON.stringify({imeSubmitted:stepStates[0]?.imeSubmitted,modal}))
await browser.close()
