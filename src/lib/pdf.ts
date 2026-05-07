export async function generatePDF(html: string) {
  let browser;
  if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
    const puppeteer = (await import('puppeteer')).default;
    browser = await puppeteer.launch({ headless: true });
  } else {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = (await import('puppeteer-core')).default;
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
