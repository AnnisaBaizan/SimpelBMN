# SimpleBMN

Sistem digital pengelolaan Surat Usulan Perbaikan/Pemeliharaan/Penggantian dan Berita Acara Serah Terima Barang Milik Negara (BMN) — dilengkapi tanda tangan digital dan integrasi Google Sheets & Drive.

**Politeknik Kesehatan Palembang — Instalasi Sarana Prasarana**

---

## Fitur

- **Surat Usulan BMN** — form pengajuan dengan foto dan TTD digital Penerima & Pengirim
- **Berita Acara (BAPP)** — form serah terima dengan TTD digital 3 pihak
- **Panel Admin** — lihat, filter, dan cetak ulang semua dokumen
- **TTD Digital** — tanda tangan via canvas (mouse/jari)
- **Integrasi Google** — data tersimpan otomatis ke Google Sheets, foto & TTD ke Google Drive

---

## Arsitektur

```
SimpleBMN/
├── admin.html        # Panel admin (lihat & cetak surat + BA)
├── usulan.html       # Form surat usulan BMN
├── bapp.html         # Form berita acara serah terima
├── index.html        # Halaman utama / landing
├── build.js          # Script inject env → dist/
├── vercel.json       # Konfigurasi deploy Vercel
├── .env.example      # Template env (salin ke .env.local)
├── Code_UseFonnte.gs # Google Apps Script backend
└── dist/             # Output build (di-generate, tidak di-commit)
```

---

## Alur Kerja

```
EDIT KODE (VS Code/Cursor)
  └─ HTML menggunakan placeholder __GAS_URL__ & __ADMIN_PASSWORD__
        ↓
BUILD LOKAL
  └─ node --env-file=.env.local build.js
  └─ Placeholder diganti nilai asli dari .env.local → dist/
        ↓
TEST LOKAL
  └─ npx serve dist → buka localhost:3000
        ↓
PUSH KE GITHUB
  └─ git add && git commit && git push
        ↓
VERCEL AUTO-DEPLOY
  └─ Detect push → jalankan build.js dengan env dari dashboard
  └─ Publish ke simpelbmn.vercel.app
```

---

## Setup Awal

### 1. Google Apps Script

1. Buka [script.google.com](https://script.google.com) → buat project baru
2. Paste isi `Code_UseFonnte.gs`
3. Isi nilai di bagian `CONFIG`:
   - `SPREADSHEET_ID` — ID Google Sheets arsip
   - `DRIVE_FOLDER_ID` — ID folder Drive untuk foto usulan
   - `BA_DRIVE_FOLDER_ID` — ID folder Drive untuk foto & TTD BA
   - `ASET_SPREADSHEET_ID` — ID Google Sheets database aset BMN
4. **Deploy → Web App** → Execute as: Me → Access: Anyone
5. Salin URL deployment → ini adalah `GAS_URL`

### 2. Google Sheets

Import `Template_Spreadsheet_BMN.xlsx` ke Google Drive. Pastikan ada 2 sheet:
- `Usulan-PP` — arsip surat usulan (kolom A–Z)
- `BA-PP` — arsip berita acara (kolom A–AB)

### 3. Vercel

1. Import repo dari GitHub di [vercel.com](https://vercel.com)
2. **Root Directory**: `gworkspace-webapps/SimpleBMN`
3. **Framework**: `Other`
4. **Environment Variables** → tambah:
   - `GAS_URL` = URL dari langkah GAS
   - `ADMIN_PASSWORD` = password halaman admin

---

## Development Lokal

```bash
# Masuk ke folder project
cd gworkspace-webapps/SimpleBMN

# Link ke project Vercel (sekali saja)
vercel link

# Pull env dari Vercel ke lokal
vercel env pull .env.local

# Build (inject env ke HTML)
node --env-file=.env.local build.js

# Jalankan local server
npx serve dist
```

---

## Deploy

Cukup push ke GitHub — Vercel otomatis build dan deploy:

```bash
git add .
git commit -m "pesan commit"
git push
```

### Kalau GAS_URL berubah (redeploy GAS)

1. Update `GAS_URL` di Vercel Dashboard → **Environment Variables**
2. Vercel Dashboard → **Deployments** → **Redeploy**
3. Update lokal: `vercel env pull .env.local`

---

## Struktur Kolom Spreadsheet

### Sheet: Usulan-PP

| Kolom | Field |
|-------|-------|
| A | No |
| B | Nomor Surat |
| C | Tanggal Submit |
| D | Tanggal Surat |
| E | Nama Pengusul |
| F | NIP |
| G | Jabatan |
| H | Unit/Bagian |
| I | Nama Barang |
| J | Merek |
| K | Tipe |
| L | Ruangan (DBR) |
| M | NUP BMN |
| N | Kondisi |
| O | Keluhan |
| P | Link Foto NUP |
| Q | Link Foto Merek |
| R | Link Foto Kerusakan |
| S | Link Foto Keseluruhan |
| T | Link Foto Lain-lain |
| U | TTD Penerima (Link Drive) |
| V | TTD Pengirim (Link Drive) |
| W | Nama Penerima |
| X | NIP Penerima |
| Y | Status |
| Z | Keterangan |

### Sheet: BA-PP

| Kolom | Field |
|-------|-------|
| A | No |
| B | Nomor BA |
| C | Tanggal Submit |
| D | Tanggal BA |
| E | No Surat Usulan |
| F | Nama Barang |
| G | Tipe |
| H | Merek |
| I | Ruangan |
| J | NUP |
| K | Lain-lain / No.Inv |
| L | Kondisi |
| M | Rincian Pemeliharaan/Perbaikan/Penggantian |
| N | Nama Pelaksana |
| O | Jabatan Pelaksana |
| P | Nama Pengawas |
| Q | Jabatan Pengawas |
| R | Nama Pengguna BMN |
| S | Jabatan Pengguna BMN |
| T | TTD Pelaksana (Link Drive) |
| U | TTD Pengawas (Link Drive) |
| V | TTD Pengguna BMN (Link Drive) |
| W–AB | Foto 1–6 (Link Drive) |

---

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Backend | Google Apps Script |
| Storage | Google Sheets + Google Drive |
| Deploy | Vercel (static + build-time env injection) |
| Notifikasi | WhatsApp via Fonnte (opsional) |
