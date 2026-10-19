// Cloudflare Pages build:
// 1) ги собира проектите и сертификатите во еден JSON (побрзо вчитување)
// 2) прави помали WebP верзии од сликите (240 / 900 / 2000 px)
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

for (const name of ['projects', 'certificates']) {
  const dir = path.join(ROOT, '_data', name);
  let list = [];
  if (fs.existsSync(dir)) {
    list = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return null; } })
      .filter(Boolean);
  }
  fs.writeFileSync(path.join(ROOT, '_data', name + '.json'), JSON.stringify(list));
  console.log(name + ': ' + list.length);
}

(async () => {
  let sharp;
  try { sharp = require('sharp'); } catch (e) { console.log('sharp not available, skipping image resize'); return; }
  const src = path.join(ROOT, 'uploads', 'images');
  if (!fs.existsSync(src)) return;
  const files = fs.readdirSync(src).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  for (const w of [240, 900, 2000]) fs.mkdirSync(path.join(ROOT, '_img', String(w)), { recursive: true });
  let n = 0;
  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, '');
    for (const w of [240, 900, 2000]) {
      const out = path.join(ROOT, '_img', String(w), base + '.webp');
      try {
        await sharp(path.join(src, f)).rotate()
          .resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: w === 240 ? 70 : 78 }).toFile(out);
      } catch (e) { console.log('skip', f, e.message); }
    }
    n++;
  }
  console.log('images resized: ' + n);
})();
