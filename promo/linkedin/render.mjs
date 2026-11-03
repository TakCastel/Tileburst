// Exporte scene.html en MP4 1080x1080 (30 i/s) avec la musique.
// Usage : node render.mjs [out.mp4]          -> vidéo complète
//         node render.mjs --stills 1,5.5,10   -> images PNG de contrôle
// Prérequis : un serveur HTTP sur la racine du repo (port 8765),
// playwright-core installé et Chromium de Playwright, ffmpeg.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(process.env.PW_CORE || 'playwright-core');
const exe = process.env.CHROME_EXE;
const FPS = 30, DURATION = 33;
const url = 'http://localhost:8765/promo/linkedin/scene.html?render=1';

const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => window.ready);

const grab = (t, type) => page.evaluate(([t, type]) => {
  window.render(t);
  return document.getElementById('cv').toDataURL(type, 0.95).split(',')[1];
}, [t, type]);

const args = process.argv.slice(2);
if (args[0] === '--stills') {
  const dir = resolve(here, 'stills'); mkdirSync(dir, { recursive: true });
  for (const t of args[1].split(',').map(Number)) {
    writeFileSync(`${dir}/t${t.toFixed(2)}.png`, Buffer.from(await grab(t, 'image/png'), 'base64'));
  }
  await browser.close();
  process.exit(0);
}

const out = resolve(here, args[0] || 'pavat-linkedin.mp4');
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-i', resolve(here, 'music.wav'),
  '-filter_complex', `[1:a]apad,atrim=0:${DURATION}[a]`,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-t', String(DURATION), '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(DURATION * FPS);
for (let f = 0; f < total; f++) {
  const buf = Buffer.from(await grab(f / FPS, 'image/png'), 'base64');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) process.stdout.write(`\r${f}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log(`\nOK -> ${out}`);
