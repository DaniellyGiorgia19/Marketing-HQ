import puppeteer from 'puppeteer';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log("Starting Puppeteer test for ContentCalendar...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Capture network requests
  page.on('request', request => {
    if(request.url().includes('/api/contents')) {
      console.log('NETWORK REQ:', request.method(), request.url(), request.postData() || '');
    }
  });

  page.on('response', async response => {
    if(response.url().includes('/api/contents') && response.request().method() === 'POST') {
      console.log('NETWORK RES:', response.status(), await response.text().catch(()=>''));
    }
  });

  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/calendar', { waitUntil: 'networkidle0' });
    
    console.log("Waiting for content items to load...");
    await delay(2000);
    
    // Look for a review button (either Acompanhar IA or Revisar Conteúdo)
    const reviewButton = await page.$('button::-p-text(Acompanhar IA), button::-p-text(Revisar Conteúdo), button::-p-text(Ver Conteúdo)');
    
    if (reviewButton) {
      console.log("Found review button, clicking...");
      await reviewButton.click();
      
      console.log("Waiting for dialog to open...");
      await delay(1000);
      
      console.log("Clicking on Design tab...");
      const designTab = await page.$('button::-p-text(3. Design)');
      if (designTab) await designTab.click();
      
      await delay(500);
      
      console.log("Typing observation...");
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.type('Teste automatizado de design');
      } else {
        console.log("TEXTAREA NOT FOUND!");
      }
      
      console.log("Clicking Enviar Observação e Refazer...");
      const retryButton = await page.$('button::-p-text(Enviar Observação)');
      if (retryButton) {
        await retryButton.click();
        console.log("Clicked! Waiting 3 seconds to observe network/UI...");
        await delay(3000);
      } else {
        console.log("RETRY BUTTON NOT FOUND!");
      }
      
    } else {
      console.log("NO REVIEW BUTTON FOUND. Testing advance endpoint manually.");
    }
    
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    console.log("Test finished.");
  }
})();
