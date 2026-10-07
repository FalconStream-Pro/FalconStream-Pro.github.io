#!/usr/bin/env node
/*
 * End-to-end smoke test for the deployed site.
 *
 * Usage: node scripts/smoke_test.cjs BASE_URL [--play]
 *
 * Checks static files, accepts the consent modal, loads the Sri Lanka preset
 * and, with --play, plays every channel in it and reports which ones start.
 * Exits non-zero if any check fails, including any channel that does not play.
 */
const { chromium } = require('playwright');

const base = process.argv[2].replace(/\/$/, '');
const play = process.argv.includes('--play');
const executablePath = process.env.CHROMIUM_PATH || undefined;

const summary = [];
let failed = false;
const log = (ok, msg) => {
  const line = `${ok ? '✅' : '❌'} ${msg}`;
  console.log(line);
  summary.push(`- ${line}`);
  if (!ok) failed = true;
};

async function main() {
  const browser = await chromium.launch({
    executablePath,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  const brokenAssets = [];
  page.on('response', (res) => {
    if (res.url().startsWith(base) && res.status() >= 400) {
      brokenAssets.push(`${res.status()} ${res.url()}`);
    }
  });

  for (const path of ['/manifest.json', '/robots.txt', '/sitemap.xml', '/playlists/sri-lanka/lk.m3u']) {
    const res = await page.request.get(base + path);
    log(res.ok(), `GET ${path} → ${res.status()}`);
  }

  const res = await page.goto(base + '/', { waitUntil: 'networkidle' });
  log(res && res.ok(), `GET / → ${res && res.status()}`);
  const title = await page.title();
  log(title.includes('FalconStream'), `Page title: "${title}"`);

  // Consent modal
  await page.getByText('I have read and agree').click();
  await page.getByRole('button', { name: /I Agree/ }).click();
  log(true, 'Accepted consent modal');

  // Load the Sri Lanka preset
  await page.getByRole('button', { name: 'Load Sri Lanka' }).first().click();
  const options = page.getByRole('listbox', { name: 'Channel list' }).first().getByRole('option');
  try {
    await options.first().waitFor({ timeout: 20000 });
  } catch {
    log(false, 'Sri Lanka preset loaded no channels');
  }
  const count = await options.count();
  log(count > 0, `Sri Lanka preset loaded ${count} channels`);

  if (play && count > 0) {
    let playing = 0;
    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      const name = (await option.locator('p').first().innerText()).trim();
      await option.click();
      let ok = false;
      try {
        await page.waitForFunction(
          () => {
            const v = document.querySelector('video');
            return v && v.currentTime > 2 && !v.paused && v.readyState >= 3;
          },
          null,
          { timeout: 30000 },
        );
        ok = true;
      } catch {
        // reported below
      }
      const errorText = ok ? '' : await page.locator('.text-red-400').first().innerText().catch(() => '');
      log(ok, `Plays: ${name}${errorText ? ` (${errorText})` : ''}`);
      if (ok) playing++;
      // Pause between channels so streams are not all opened at once
      await page.waitForTimeout(500);
    }
    log(playing > 0, `${playing}/${count} Sri Lanka channels play in the browser`);
  }

  log(pageErrors.length === 0, `Uncaught page errors: ${pageErrors.length}${pageErrors.length ? ` (${pageErrors.slice(0, 3).join('; ')})` : ''}`);
  log(brokenAssets.length === 0, `Broken site assets: ${brokenAssets.length}${brokenAssets.length ? ` (${brokenAssets.slice(0, 5).join('; ')})` : ''}`);

  await browser.close();
}

main()
  .catch((e) => log(false, `Smoke test crashed: ${e.message}`))
  .finally(() => {
    if (process.env.GITHUB_STEP_SUMMARY) {
      require('fs').appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `### Smoke test: ${base}\n\n${summary.join('\n')}\n`,
      );
    }
    process.exit(failed ? 1 : 0);
  });
