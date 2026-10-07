#!/usr/bin/env node
/*
 * Open pages in a real browser and log every HLS/DASH request the page's
 * player makes. Finds stream URLs that are only built at runtime by
 * JavaScript players.
 *
 * Usage: node scripts/sniff_streams.cjs URL [URL ...]
 */
const { chromium } = require('playwright');

const MEDIA_RE = /\.(m3u8|mpd)(\?|$)|\/manifest|\/playlist|youtube\.com\/(embed|watch|live)/i;

(async () => {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || undefined,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  for (const url of process.argv.slice(2)) {
    console.log(`== ${url}`);
    const context = await browser.newContext({ locale: 'si-LK', timezoneId: 'Asia/Colombo' });
    const page = await context.newPage();
    const found = new Set();
    page.on('request', (req) => {
      if (MEDIA_RE.test(req.url()) && !found.has(req.url())) {
        found.add(req.url());
        console.log(`  ${req.resourceType().padEnd(10)} ${req.url()}`);
      }
    });
    page.on('response', (res) => {
      if (/\.(m3u8|mpd)(\?|$)/i.test(res.url())) {
        console.log(`    -> ${res.status()} ${res.url().slice(0, 120)} acao=${res.headers()['access-control-allow-origin'] || '-'}`);
      }
    });
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`  page status ${res && res.status()} title "${await page.title()}"`);
      // Give players time to start; click a play button if there is one
      await page.waitForTimeout(8000);
      for (const sel of ['button[aria-label*="Play" i]', '.vjs-big-play-button', '.jw-icon-display', '.plyr__control--overlaid', 'video']) {
        const el = page.locator(sel).first();
        if (await el.isVisible().catch(() => false)) {
          await el.click({ timeout: 2000 }).catch(() => {});
          break;
        }
      }
      await page.waitForTimeout(12000);
      for (const frame of page.frames()) {
        if (frame !== page.mainFrame()) console.log(`  iframe     ${frame.url().slice(0, 160)}`);
      }
    } catch (e) {
      console.log(`  ! ${e.message.split('\n')[0]}`);
    }
    if (found.size === 0) console.log('  (no stream requests seen)');
    await context.close();
  }
  await browser.close();
})();
