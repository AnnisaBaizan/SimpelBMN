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

// ── Helper: baca folder TTD, embed sebagai base64 ──
// Format nama file: {Nama}_{NIP}_{Jabatan}.png  →  key = "Nama"
// Backward-compat: {Nama}.png atau {Nama}_TTD.png  →  nip/jabatan kosong
function readTTDFolder(dirPath, label) {
  const obj = {};
  if (!fs.existsSync(dirPath)) return obj;
  fs.readdirSync(dirPath)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .sort()
    .forEach(file => {
      const ext    = path.extname(file).slice(1).toLowerCase();
      const mime   = ext === 'png' ? 'image/png' : 'image/jpeg';
      const base   = file.replace(/\.(png|jpg|jpeg)$/i, '');
      const parts    = base.split('_');
      const name     = parts[0];
      const nip      = (parts[1] && parts[1] !== '-' && !/^TTD$/i.test(parts[1])) ? parts[1] : '';
      const jabatan  = parts[2] || '';
      const instansi = parts.slice(3).join('_');
      const b64     = fs.readFileSync(path.join(dirPath, file)).toString('base64');
      obj[name] = { img: `data:${mime};base64,${b64}`, nip, jabatan, instansi };
      console.log(`🖊️  TTD ${label}: ${file} → "${name}" (NIP: ${nip || '-'}, Jab: ${jabatan || '-'}, Inst: ${instansi || '-'})`);
    });
  return obj;
}

// ── TTD Sarpras (Pengawas) ──
const TTD_SAPRAS_JSON    = JSON.stringify(readTTDFolder(path.join(SRC, 'TTDSapras'),         'Sarpras'));
// ── TTD Pelaksana ──
const TTD_PELAKSANA_JSON = JSON.stringify(readTTDFolder(path.join(SRC, 'TTDPelaksana'),      'Pelaksana'));
// ── TTD Atasan Langsung ──
const TTD_ATASAN_JSON    = JSON.stringify(readTTDFolder(path.join(SRC, 'TTDAtasanLangsung'), 'Atasan'));

// ── File HTML yang perlu diproses ──
const HTML_FILES = ['index.html', 'usulan.html', 'bapp.html', 'admin.html', 'laporan-ac.html', 'lkh.html'];

HTML_FILES.forEach(file => {
  const src = path.join(SRC, file);
  if (!fs.existsSync(src)) return;

  let content = fs.readFileSync(src, 'utf8');
  content = content.replaceAll('__GAS_URL__',        GAS_URL);
  content = content.replaceAll('__ADMIN_PASSWORD__', ADMIN_PASSWORD);
  content = content.replaceAll('__TTD_SAPRAS__',     TTD_SAPRAS_JSON);
  content = content.replaceAll('__TTD_PELAKSANA__',  TTD_PELAKSANA_JSON);
  content = content.replaceAll('__TTD_ATASAN__',     TTD_ATASAN_JSON);

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

// Copy TTD folders ke dist/ agar bisa di-load via path relatif di admin
const TTD_DIRS = ['TTDPelaksana', 'TTDSapras', 'TTDAtasanLangsung'];
TTD_DIRS.forEach(dir => {
  const srcDir = path.join(SRC, dir);
  const dstDir = path.join(DIST, dir);
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
  fs.readdirSync(srcDir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .forEach(file => {
      const ext      = path.extname(file);
      const destName = file.replace(/\.(png|jpg|jpeg)$/i, '').split('_')[0] + ext;
      fs.copyFileSync(path.join(srcDir, file), path.join(dstDir, destName));
      console.log(`📁 ${dir}/${file} → dist/${dir}/${destName}`);
    });
});

console.log('\nBuild selesai. Output: dist/');
