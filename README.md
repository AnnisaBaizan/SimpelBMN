# SimpleBMN

Sistem digital pengelolaan dokumen Barang Milik Negara (BMN) — dilengkapi tanda tangan digital dan integrasi Google Sheets & Drive.

**Politeknik Kesehatan Palembang — Instalasi Sarana Prasarana**

---

## Fitur

- **Surat Usulan BMN** — form pengajuan dengan foto dan TTD digital Penerima & Pengirim
- **Berita Acara (BAPP)** — form serah terima dengan TTD digital 3 pihak
- **Laporan Pemeliharaan/Perbaikan AC** — form laporan khusus AC dengan pilihan kapasitas, jenis pekerjaan, dan TTD Pengawas otomatis
- **Panel Admin** — lihat, filter, dan cetak ulang semua dokumen
- **TTD Digital** — tanda tangan via canvas (mouse/jari)
- **TTD Sarpras Otomatis** — TTD Pengawas dimuat dari folder `TTDSapras/`, diproses hitam-putih + hapus background otomatis
- **Integrasi Google** — data tersimpan otomatis ke Google Sheets, foto & TTD ke Google Drive

---

## Arsitektur

```
SimpleBMN/
├── admin.html          # Panel admin (lihat & cetak surat + BA + Laporan AC)
├── usulan.html         # Form surat usulan BMN
├── bapp.html           # Form berita acara serah terima
├── laporan-ac.html     # Form laporan pemeliharaan/perbaikan AC
├── index.html          # Halaman utama / landing
├── build.js            # Script inject env → dist/ (termasuk embed TTD Sarpras)
├── vercel.json         # Konfigurasi deploy Vercel
├── TTDSapras/          # Folder TTD Pengawas Sarpras (format: NamaPengawas_TTD.png)
│   ├── Sukiman_TTD.png
│   └── Tommy_TTD.png
├── Code_UseFonnte.gs   # Google Apps Script backend
└── dist/               # Output build (di-generate, tidak di-commit)
```

---

## Alur Kerja

```
EDIT KODE (VS Code/Cursor)
  └─ HTML menggunakan placeholder __GAS_URL__, __ADMIN_PASSWORD__, __TTD_SAPRAS__
        ↓
BUILD LOKAL
  └─ node --env-file=.env.local build.js
  └─ Placeholder diganti nilai asli dari .env.local → dist/
  └─ File TTDSapras/*.png di-embed sebagai base64 ke dalam laporan-ac.html
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
   - `L_PP_AC_DRIVE_FOLDER_ID` — ID folder Drive untuk foto & TTD Laporan AC
   - `ASET_SPREADSHEET_ID` — ID Google Sheets database aset BMN
4. **Deploy → Web App** → Execute as: Me → Access: Anyone
5. Salin URL deployment → ini adalah `GAS_URL`

### 2. Google Sheets

Import `Template_Spreadsheet_BMN.xlsx` ke Google Drive. Pastikan ada 3 sheet:

| Sheet | Deskripsi | Kolom |
|-------|-----------|-------|
| `Usulan-PP` | Arsip surat usulan | A–Z (26 kolom) |
| `BA-PP` | Arsip berita acara | A–AB (28 kolom) |
| `L-PP-AC` | Arsip laporan perbaikan AC | A–AF (32 kolom) |

### 3. TTD Pengawas Sarpras

Taruh file TTD masing-masing pengawas di folder `TTDSapras/` dengan format nama file:

```
NamaPengawas_TTD.png
```

Contoh: `Sukiman_TTD.png`, `Tommy_TTD.png`

> Saat build, file-file ini di-embed sebagai base64 ke dalam `laporan-ac.html` dan diproses otomatis menjadi **hitam-putih + background transparan** di browser. Untuk menambah pengawas baru, cukup taruh file baru di folder ini lalu build ulang.

### 4. Vercel

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

# Build (inject env + embed TTD Sarpras ke HTML)
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

### Kalau ada Pengawas Sarpras baru

1. Tambah file `NamaBaru_TTD.png` ke folder `TTDSapras/`
2. Push ke GitHub → Vercel auto-rebuild (TTD baru otomatis muncul di dropdown)

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

### Sheet: L-PP-AC

| Kolom | Field |
|-------|-------|
| A | No |
| B | Nomor Laporan |
| C | Tanggal Submit |
| D | Tanggal Laporan |
| E | No Surat Usulan |
| F | Nama Barang |
| G | Tipe |
| H | Merek |
| I | Ruangan (DBR) |
| J | NUP |
| K | Kapasitas AC |
| L | Cuci (Ya/kosong) |
| M | Isi Freon (Ya/kosong) |
| N | Ganti Kapasitor (Ya/kosong) |
| O | Ganti Modul (Ya/kosong) |
| P | Lain-lain (teks keterangan) |
| Q | Deskripsi |
| R | Nama Pelaksana (badan surat) |
| S | Jabatan Pelaksana (badan surat) |
| T | Nama Pelaksana (TTD) |
| U | Jabatan Pelaksana (TTD) |
| V | Nama Pengguna |
| W | Jabatan Pengguna |
| X | Nama Pengawas |
| Y | TTD Pelaksana (Link Drive) |
| Z | TTD Pengguna (Link Drive) |
| AA | TTD Pengawas (Link Drive) |
| AB | Foto 1 NUP (Link Drive) |
| AC | Foto 2 Merek/Tipe (Link Drive) |
| AD | Foto 3 Sebelum/Spare Part (Link Drive) |
| AE | Foto 4 Pekerjaan 1 (Link Drive) |
| AF | Foto 5 Pekerjaan 2 (Link Drive) |

---

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Backend | Google Apps Script |
| Storage | Google Sheets + Google Drive |
| Deploy | Vercel (static + build-time env injection) |
| Notifikasi | WhatsApp via Fonnte (opsional) |
| TTD Sarpras | PNG embed base64 saat build, proses B&W di browser |
