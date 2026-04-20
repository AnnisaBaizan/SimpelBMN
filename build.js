// build.js — Inject env variables into HTML files before deploy
// Dijalankan otomatis oleh Vercel saat build, atau manual: node build.js

const fs   = require('fs');
const path = require('path');

const GAS_URL        = process.env.GAS_URL        || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD  || '';

if (!GAS_URL)        { console.error('ERROR: GAS_URL tidak diset'); process.exit(1); }
if (!ADMIN_PASSWORD) { console.error('ERROR: ADMIN_PASSWORD tidak diset'); process.exit(1); }

const SRC  = __dirname;
const DIST = path.join(__dirname, 'dist');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

// ── TTD Sarpras: baca semua file dari folder TTDSapras, embed sebagai base64 ──
// Format nama file: {Nama}_TTD.png  →  key = "Nama"
const TTD_SAPRAS_DIR = path.join(SRC, 'TTDSapras');
const ttdSaprasObj   = {};
if (fs.existsSync(TTD_SAPRAS_DIR)) {
  fs.readdirSync(TTD_SAPRAS_DIR)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .sort()
    .forEach(file => {
      const name = file.replace(/_TTD\.(png|jpg|jpeg)$/i, '').replace(/\.(png|jpg|jpeg)$/i, '');
      const ext  = path.extname(file).slice(1).toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      const b64  = fs.readFileSync(path.join(TTD_SAPRAS_DIR, file)).toString('base64');
      ttdSaprasObj[name] = `data:${mime};base64,${b64}`;
      console.log(`🖊️  TTD Sarpras: ${file} → "${name}"`);
    });
}
const TTD_SAPRAS_JSON = JSON.stringify(ttdSaprasObj);

// ── File HTML yang perlu diproses ──
const HTML_FILES = ['index.html', 'usulan.html', 'bapp.html', 'admin.html', 'laporan-ac.html'];

HTML_FILES.forEach(file => {
  const src = path.join(SRC, file);
  if (!fs.existsSync(src)) return;

  let content = fs.readFileSync(src, 'utf8');
  content = content.replaceAll('__GAS_URL__',        GAS_URL);
  content = content.replaceAll('__ADMIN_PASSWORD__', ADMIN_PASSWORD);
  content = content.replaceAll('__TTD_SAPRAS__',     TTD_SAPRAS_JSON);

  fs.writeFileSync(path.join(DIST, file), content, 'utf8');
  console.log(`✅ ${file} → dist/${file}`);
});

// Copy static assets
const ASSETS = ['KOP.png'];
ASSETS.forEach(file => {
  const src = path.join(SRC, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, file));
    console.log(`📁 ${file} → dist/${file}`);
  }
});

console.log('\nBuild selesai. Output: dist/');
