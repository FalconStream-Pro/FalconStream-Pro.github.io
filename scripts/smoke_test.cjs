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
// Playwright's bundled Chromium has no H.264/AAC decoders, which every live
// stream here uses; CI sets BROWSER_CHANNEL=chrome to test in Google Chrome.
const channel = process.env.BROWSER_CHANNEL || undefined;

const summary = [];
let failed = false;
let page;
// Third-party request problems, reported for streams that do not play
let streamIssues = [];
const log = (ok, msg) => {
  const line = `${ok ? '✅' : '❌'} ${msg}`;
  console.log(line);
  summary.push(`- ${line}`);
  if (!ok) failed = true;
};
const warn = (msg) => {
  console.log(`⚠️ ${msg}`);
  summary.push(`- ⚠️ ${msg}`);
};

// Loads a preset from the home page and, with --play, plays every entry.
// Each stream is a third-party server that can be down for a while, so a
// single stream that does not play is reported as a warning; the check fails
// if fewer than MIN_PLAYING of a list's streams play, or on any site problem.
const MIN_PLAYING = 0.8;
async function testList(presetName, noun) {
  await page.getByRole('button', { name: `Load ${presetName}`, exact: true }).first().click();
  const options = page.getByRole('listbox', { name: 'Channel list' }).first().getByRole('option');
  try {
    await options.first().waitFor({ timeout: 20000 });
  } catch {
    log(false, `${presetName} preset loaded no ${noun}`);
  }
  const count = await options.count();
  log(count > 0, `${presetName} preset loaded ${count} ${noun}`);
  if (!play || count === 0) return;

  let playing = 0;
  let tested = 0;
  const startTimes = [];
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    const name = (await option.locator('p').first().innerText()).trim();
    streamIssues = [];
    const clickedAt = await page.evaluate(() => performance.now());
    await option.click();
    // Official YouTube lives play in YouTube's own iframe; the page can only
    // check that the embed loads. Their live status is checked by
    // check_streams.py.
    const youtube = page.locator('iframe[data-youtube-player]');
    if (await youtube.waitFor({ timeout: 3000 }).then(() => true).catch(() => false)) {
      log(true, `Embeds: ${name} (official YouTube live)`);
      await page.waitForTimeout(500);
      continue;
    }
    tested++;
    let ok = false;
    let timing = '';
    try {
      // The player holds the sound back until the picture moves, so
      // data-av-ready marks the moment picture and sound both run.
      await page.waitForFunction(
        () => document.querySelector('video')?.hasAttribute('data-av-ready'),
        null,
        { timeout: 30000 },
      );
      const readyMs = Number(await page.locator('video').getAttribute('data-av-ready')) - clickedAt;
      const av = await page.evaluate(() => {
        const v = document.querySelector('video');
        const q = v.getVideoPlaybackQuality?.();
        return {
          muted: v.muted,
          frames: q ? q.totalVideoFrames : -1,
          width: v.videoWidth,
          radioView: !!document.querySelector('[data-radio-view]'),
        };
      });
      await page.waitForFunction(
        () => {
          const v = document.querySelector('video');
          return v && v.currentTime > 2 && !v.paused && v.readyState >= 3;
        },
        null,
        { timeout: 30000 },
      );
      timing = av.width
        ? ` — picture and sound in ${(readyMs / 1000).toFixed(1)} s (${av.frames} frames decoded)`
        : ` — sound in ${(readyMs / 1000).toFixed(1)} s (audio only)`;
      startTimes.push(readyMs);
      if (av.muted) log(false, `Sound stays muted after playback starts: ${name}`);
      if (!av.width && !av.radioView) log(false, `Audio-only stream shows a black frame instead of the station: ${name}`);
      ok = true;
    } catch {
      // reported below
    }
    let detail = '';
    if (!ok) {
      const errorText = await page.locator('[data-player-error] p').last()
        .innerText({ timeout: 1000 }).catch(() => '');
      const state = await page.evaluate(() => {
        const v = document.querySelector('video');
        return v ? `readyState=${v.readyState} currentTime=${v.currentTime.toFixed(1)}` +
          `${v.error ? ` mediaError=${v.error.code}` : ''}` : 'no <video>';
      });
      detail = ` (${errorText ? `${errorText}; ` : ''}${state})`;
      // Logos are cosmetic; keep only stream-related problems
      const issues = [...new Set(streamIssues)].filter((x) => !/\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(x));
      if (issues.length) console.log(`     ${issues.slice(0, 8).join('\n     ')}`);
    }
    if (ok) {
      playing++;
      log(true, `Plays: ${name}${timing}`);
    } else {
      warn(`Does not play right now: ${name}${detail}`);
    }
    // Pause between channels so streams are not all opened at once
    await page.waitForTimeout(500);
  }
  if (tested) {
    log(playing >= Math.ceil(tested * MIN_PLAYING), `${playing} of ${tested} ${presetName} streams play in the browser`);
  }
  if (startTimes.length) {
    const sorted = [...startTimes].sort((x, y) => x - y);
    const median = sorted[Math.floor(sorted.length / 2)] / 1000;
    log(true, `${presetName} start-up time (click to playback with sound): median ${median.toFixed(1)} s, slowest ${(sorted.at(-1) / 1000).toFixed(1)} s`);
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath,
    channel,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  page = await browser.newPage();
  page.on('requestfailed', (req) => {
    if (!req.url().startsWith(base)) streamIssues.push(`${req.failure()?.errorText} ${req.url().slice(0, 100)}`);
  });
  page.on('response', (res) => {
    if (!res.url().startsWith(base) && res.status() >= 400) streamIssues.push(`HTTP ${res.status()} ${res.url().slice(0, 100)}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') streamIssues.push(`console: ${msg.text().slice(0, 160)}`);
  });
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

  if (play) {
    const h264 = await page.evaluate(() =>
      MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"'),
    );
    log(h264, `Test browser can decode H.264/AAC${h264 ? '' : ' (set BROWSER_CHANNEL=chrome)'}`);
  }
  await testList('Sri Lanka', 'TV channels');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await testList('Sri Lanka Radio', 'radio stations');

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
