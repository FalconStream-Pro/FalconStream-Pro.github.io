#!/usr/bin/env node
/*
 * Plays streams in a real browser with hls.js and measures how they start.
 *
 * Usage: node scripts/bench_player.cjs PLAYLIST.m3u [...] [--configs old,new] [--rounds N]
 *          [--throttle KBPS:LATENCY_MS] [--watch SECONDS]
 *
 * For every stream and hls.js config it reports:
 *   - picture: time from loading the stream to a *moving* picture
 *   - audio lead: how long playback (and so sound) ran before the picture
 *     moved, i.e. how long the old player played sound over a frozen or black
 *     frame
 *   - stalls (with --watch): how often and how long playback stopped to
 *     buffer during SECONDS of playback after it started
 * --throttle emulates a slow connection (e.g. 3000:150 = 3 Mbps, 150 ms).
 * Streams are served to a page on http://127.0.0.1, so CORS applies as on the
 * site. Audio-only streams (radio) are played with the browser's own player.
 * Run with BROWSER_CHANNEL=chrome: Playwright's Chromium cannot decode H.264.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : dflt;
};
const configs = opt('--configs', 'new').split(',');
const rounds = Number(opt('--rounds', '1'));
const throttle = opt('--throttle', '');
const watchS = Number(opt('--watch', '0'));
const TIMEOUT_MS = 30000;

// Keep "new" in sync with HLS_CONFIG in src/app/components/watch/VideoPlayer.tsx
const HLS_CONFIGS = {
  old: { enableWorker: true, backBufferLength: 30, manifestLoadingMaxRetry: 2, levelLoadingMaxRetry: 2, fragLoadingMaxRetry: 3 },
  new: {
    enableWorker: true, testBandwidth: false, abrEwmaDefaultEstimate: 1500000, startFragPrefetch: true,
    capLevelToPlayerSize: true, backBufferLength: 30, maxMaxBufferLength: 60,
    manifestLoadingMaxRetry: 2, levelLoadingMaxRetry: 2, fragLoadingMaxRetry: 3,
  },
};

function parse(file) {
  const out = [];
  let extinf = null;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('#EXTINF')) extinf = line;
    else if (line && !line.startsWith('#') && extinf) {
      if (!/youtube\.com/.test(line)) {
        out.push({ name: extinf.split(',').slice(1).join(','), url: line, radio: /radio="true"/.test(extinf) });
      }
      extinf = null;
    }
  }
  return out;
}

const hlsJs = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'hls.js', 'dist', 'hls.min.js'));
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/hls.min.js')) {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    return res.end(hlsJs);
  }
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end('<!doctype html><video id="v" playsinline muted style="width:640px;height:360px"></video><script src="/hls.min.js"></script>');
});

// Runs in the page: loads the stream and resolves with timings
function measure({ url, config, radio, timeout, watchMs }) {
  return new Promise((resolve) => {
    const v = document.getElementById('v');
    const t0 = performance.now();
    const r = { playing: null, firstFrame: null, motion: null, error: null, levels: 0, stalls: 0, stalledMs: 0 };
    let base = null;
    let finished = false;
    let watching = false;
    let stallStart = null;
    const finish = (extra) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (stallStart !== null) r.stalledMs += performance.now() - stallStart;
      resolve({ ...r, ...extra, width: v.videoWidth, currentTime: v.currentTime });
    };
    // Started: optionally keep playing for watchMs and count buffering stalls
    const done = (extra) => {
      if (watching || finished) return;
      if (extra.error || !watchMs) return finish(extra);
      watching = true;
      clearTimeout(timer);
      setTimeout(() => finish(extra), watchMs);
    };
    const timer = setTimeout(() => finish({ error: r.error || 'timeout' }), timeout);
    v.addEventListener('playing', () => {
      if (r.playing === null) r.playing = performance.now() - t0;
      if (stallStart !== null) { r.stalledMs += performance.now() - stallStart; stallStart = null; }
    });
    v.addEventListener('waiting', () => {
      if (watching && stallStart === null) { r.stalls++; stallStart = performance.now(); }
    });
    v.addEventListener('timeupdate', () => {
      // Audio only: no picture, playing for 2 s is success
      if ((radio || (r.playing !== null && !v.videoWidth && v.currentTime > 2)) && v.currentTime > 2) done({});
    });
    const onFrame = (_now, meta) => {
      if (r.firstFrame === null) { r.firstFrame = performance.now() - t0; base = meta.mediaTime; }
      else if (meta.mediaTime > base && r.motion === null) {
        r.motion = performance.now() - t0;
        return done({});
      }
      v.requestVideoFrameCallback(onFrame);
    };
    v.requestVideoFrameCallback(onFrame);
    v.addEventListener('error', () => finish({ error: `media error ${v.error && v.error.code}` }));
    const play = () => v.play().catch((e) => { r.error = e.name; });
    if (!radio && window.Hls && Hls.isSupported()) {
      const hls = new Hls(config);
      window.hls = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, (_, d) => { r.levels = d.levels.length; play(); });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) finish({ error: `${d.type}/${d.details}${d.response ? ` ${d.response.code}` : ''}` }); });
      hls.loadSource(url);
      hls.attachMedia(v);
    } else {
      v.src = url;
      play();
    }
  });
}

async function main() {
  const files = args.filter((a) => !a.startsWith('--'));
  const entries = files.flatMap(parse);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || undefined,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const results = [];
  for (const e of entries) {
    for (let round = 0; round < rounds; round++) {
      for (const name of configs) {
        const page = await browser.newPage();
        if (throttle) {
          const [kbps, latency] = throttle.split(':').map(Number);
          const cdp = await page.context().newCDPSession(page);
          await cdp.send('Network.enable');
          await cdp.send('Network.emulateNetworkConditions', {
            offline: false, latency: latency || 0, downloadThroughput: (kbps * 1000) / 8, uploadThroughput: (kbps * 1000) / 8,
          });
        }
        await page.goto(base);
        const r = await page.evaluate(measure, {
          url: e.url, config: HLS_CONFIGS[name], radio: e.radio, timeout: TIMEOUT_MS + watchS * 1000, watchMs: watchS * 1000,
        })
          .catch((err) => ({ error: err.message.slice(0, 80) }));
        await page.close();
        results.push({ ...e, config: name, ...r });
        const s = (ms) => (ms == null ? '-' : `${(ms / 1000).toFixed(1)}s`);
        console.log(`${r.error ? '❌' : '✅'} [${name}] ${e.name}: picture ${s(r.motion)} playing ${s(r.playing)} ` +
          `lead ${r.motion != null && r.playing != null ? s(r.motion - r.playing) : '-'} levels ${r.levels}` +
          `${watchS ? ` stalls ${r.stalls} (${s(r.stalledMs)})` : ''} ${r.error || ''}`);
      }
    }
  }
  await browser.close();
  server.close();

  const s = (ms) => (ms == null ? '-' : (ms / 1000).toFixed(1));
  const rows = results.map((r) => `| ${r.error ? '❌' : '✅'} | ${r.name} | ${r.config} | ${r.radio || (r.width === 0 && !r.error) ? 'audio' : s(r.motion)} | ${s(r.playing)} | ` +
    `${r.motion != null && r.playing != null ? s(Math.max(0, r.motion - r.playing)) : '-'} | ${r.levels || '-'} | ` +
    `${watchS ? `${r.stalls ?? '-'} / ${s(r.stalledMs)}` : '-'} | ${r.error || ''} |`);
  const summary = configs.map((c) => {
    const ok = results.filter((r) => r.config === c && r.motion != null).map((r) => r.motion).sort((a, b) => a - b);
    const all = results.filter((r) => r.config === c && !r.error);
    const stalls = all.reduce((a, r) => a + (r.stalls || 0), 0);
    const stalled = all.reduce((a, r) => a + (r.stalledMs || 0), 0);
    return ok.length
      ? `- **${c}**: ${ok.length} streams, median time to moving picture ${s(ok[Math.floor(ok.length / 2)])} s` +
        `${watchS ? `; ${stalls} stalls, ${s(stalled)} s spent buffering in ${all.length} × ${watchS} s of playback` : ''}`
      : `- **${c}**: no stream played`;
  });
  const report = `### Player benchmark (${files.join(', ')})${throttle ? ` — throttled to ${throttle} (kbps:ms)` : ''}\n\n${summary.join('\n')}\n\n` +
    '| | Stream | Config | Moving picture (s) | Playing (s) | Audio ahead of picture (s) | Levels | Stalls / buffering (s) | Error |\n|---|---|---|---|---|---|---|---|---|\n' +
    rows.join('\n') + '\n';
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
