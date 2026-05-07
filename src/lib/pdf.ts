export async function downloadPDFBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({ files: [file], title: filename });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

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
      headless: true,
    });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
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
