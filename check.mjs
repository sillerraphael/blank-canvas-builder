import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:8080/liste', { waitUntil: 'networkidle' });
  
  // check if body has content
  const content = await page.content();
  console.log("Body length:", content.length);
  const liste = await page.$$('text=Listenansicht');
  console.log("Listenansicht elements found:", liste.length);
  
  await browser.close();
})();
