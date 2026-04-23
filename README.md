# SimpleBMN

Sistem digital pengelolaan dokumen **Barang Milik Negara (BMN)** — pengajuan, berita acara, laporan AC, dengan tanda tangan digital dan integrasi Google Sheets & Drive.

**Politeknik Kesehatan Palembang — Instalasi Sarana Prasarana**

---

## Daftar Isi

- [Fitur](#fitur)
- [Panduan Pengguna](#panduan-pengguna)
  - [Surat Usulan BMN](#1-surat-usulan-bmn--usulanhtml)
  - [Berita Acara (BAPP)](#2-berita-acara-serah-terima--bapphtml)
  - [Laporan Pemeliharaan AC](#3-laporan-pemeliharaanperbaikan-ac--laporan-achtml)
  - [Laporan Kegiatan Harian](#4-laporan-kegiatan-harian-sarpras--lkhhtml)
  - [Panel Admin](#5-panel-admin--adminhtml)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Alur Kerja Pengembangan](#alur-kerja-pengembangan)
- [Setup Awal](#setup-awal)
- [Development Lokal](#development-lokal)
- [Deploy](#deploy)
- [GAS — Endpoint & Aksi](#gas--endpoint--aksi)
- [Struktur Kolom Spreadsheet](#struktur-kolom-spreadsheet)
- [Manajemen TTD](#manajemen-ttd)
- [Notifikasi](#notifikasi)
- [Teknologi](#teknologi)

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| **4 Jenis Dokumen** | Surat Usulan BMN (Umum / AC Perbaikan / AC Pemindahan), Berita Acara PP, Laporan Pemeliharaan AC, Laporan Kegiatan Harian |
| **Live Preview** | Preview surat terbentuk otomatis real-time saat form diisi |
| **Cascade Dropdown Aset** | NUP → Nama Barang → Merek → Tipe, diambil dari Google Sheets aset |
| **Input Manual** | Toggle "✏️ Isi Data Manual" jika barang tidak ada di daftar |
| **Auto-fill dari Surat Usulan** | Saat memilih surat usulan di BA/Laporan AC, detail barang + foto terisi otomatis dari data usulan (Drive URL, tidak di-upload ulang) |
| **Foto Digital** | Upload hingga 6 foto per dokumen, otomatis tersimpan ke Google Drive |
| **TTD Digital (2 mode)** | Pilih dari daftar TTD tersimpan *atau* gambar manual via canvas |
| **TTD Otomatis B&W** | TTD diproses hitam-putih + background transparan otomatis saat dipilih |
| **Panel Admin** | Lihat, filter, dan cetak ulang semua dokumen yang pernah disubmit |
| **Nomor Otomatis** | Nomor surat/BA/laporan di-generate otomatis berurutan dari server |
| **Google Sheets** | Semua data tersimpan ke 3 sheet terpisah di Google Sheets |
| **Google Drive** | Foto & file TTD tersimpan ke folder Drive yang dikonfigurasi |
| **Notifikasi WhatsApp** | Kirim notif ke nomor WA via Fonnte setelah submit (opsional) |
| **Notifikasi Email** | Kirim email notifikasi ke `sarpras@poltekkespalembang.ac.id` untuk semua jenis dokumen (aktif) |

---

## Panduan Pengguna

### 1. Surat Usulan BMN — `usulan.html`

Form pengajuan usulan perbaikan/pemeliharaan/penggantian BMN atau pemindahan AC.

#### Langkah Pengisian

1. **Pilih Jenis Surat** dari dropdown di bagian atas:
   - 📄 **Umum / Selain AC** — untuk BMN selain AC (laptop, printer, dll.)
   - ❄️ **Perbaikan / Pemeliharaan AC** — khusus AC, dropdown barang difilter ke A.C saja
   - 🔄 **Pemindahan AC** — khusus pemindahan AC; muncul kolom Ruangan Sesudah + Kondisi Baik; judul dan narasi surat berubah otomatis

2. **Info Surat** — Nomor terisi otomatis. Isi Tanggal Surat.

3. **Identitas Pengusul** — Isi Nama, NIP, Jabatan, Unit/Bagian.

4. **Identitas Penerima TTD** — dua mode:
   - **🗂️ Pilih dari Daftar** — pilih nama dari dropdown; TTD dan NIP terisi otomatis
   - **✍️ Gambar Manual** — gambar TTD di canvas atau isi nama/NIP manual

5. **Detail Barang** — Pilih NUP dari dropdown (cascade: NUP → Nama → Merek → Tipe).
   - Jika barang tidak ada di daftar, klik **✏️ Isi Data Manual**.
   - Isi NUP, Nama Barang, Merek, Tipe secara manual.

6. **Kondisi** — Pilih: Rusak Ringan / Rusak Berat (/ Baik khusus Pemindahan AC).

7. **Ruangan** — Ruangan sesuai DBR. Untuk Pemindahan AC, isi juga Ruangan Sesudah.

8. **Keluhan / Deskripsi** — Jelaskan kondisi dan masalah barang.

9. **Foto** — Upload 5 foto (label berubah sesuai jenis surat):

   | Foto | Umum / Perbaikan AC | Pemindahan AC |
   |------|---------------------|---------------|
   | 1 | Foto NUP Barang | Foto NUP Barang |
   | 2 | Foto Merek/Tipe | Foto Merek/Tipe |
   | 3 | Foto Kerusakan | Foto BMN & Ruangan Sebelum Pemindahan |
   | 4 | Foto Keseluruhan Ruangan | Foto Keseluruhan Ruangan |
   | 5 | Foto Lain-lain | Foto BMN & Ruangan Sesudah Pemindahan |

10. **TTD Pengirim** — pilih dari daftar atau gambar manual.

11. Klik **🚀 Submit** — data tersimpan ke Google Sheets & Drive. Email notifikasi terkirim otomatis ke tim Sarpras.

> **Tips:** Preview surat di panel kanan terupdate otomatis. Scroll ke bawah di preview untuk melihat lembar lampiran foto.

---

### 2. Berita Acara Serah Terima — `bapp.html`

Form berita acara setelah pekerjaan pemeliharaan/perbaikan/penggantian selesai dilakukan.

#### Langkah Pengisian

1. **Info Surat** — Nomor BA terisi otomatis. Isi Tanggal BA.

2. **Dasar Surat** — Pilih:
   - **Ya** → pilih Nomor Surat Usulan dari dropdown (hanya menampilkan surat usulan **Umum**); detail barang + foto 1 & 2 terisi otomatis dari data usulan
   - **Tidak** → isi Nomor Surat Usulan manual (opsional) atau kosongkan

3. **Detail Barang** — Jika dari usulan, terisi otomatis. Bisa ubah manual.
   - Toggle **✏️ Isi Data Manual** jika perlu mengisi ulang dari awal.

4. **Kondisi & Rincian** — Pilih kondisi akhir barang, isi rincian pekerjaan.

5. **Foto** — Upload hingga 6 foto:
   - Foto NUP (auto dari usulan jika dipilih)
   - Foto Merek/Tipe (auto dari usulan jika dipilih)
   - Foto Spare Part / Bahan yang digunakan
   - Foto Setelah Perbaikan 1 & 2
   - Foto Lain-lain

6. **Penandatangan** — Isi data 3 pihak:
   - **Pelaksana** (yang mengerjakan) — pilih TTD dari daftar atau gambar
   - **Pengawas** (Sarpras) — pilih TTD dari daftar atau gambar
   - **Atasan Langsung / Pengguna BMN** — pilih dari daftar atau gambar

7. Klik **🚀 Submit**. Email notifikasi terkirim otomatis.

---

### 3. Laporan Pemeliharaan/Perbaikan AC — `laporan-ac.html`

Form laporan khusus pemeliharaan, perbaikan, atau pemindahan Air Conditioner.

#### Langkah Pengisian

1. **Jenis Surat Laporan** — Pilih dari dropdown:
   - ❄️ **Perbaikan / Pemeliharaan AC** — narasi, judul, dan label foto sesuai perbaikan
   - 🔄 **Pemindahan AC** — narasi berubah, muncul field Ruangan Sesudah Pindah, label foto 3 & 6 berubah, dropdown surat usulan difilter ke pemindahan

2. **Info Laporan** — Nomor Laporan terisi otomatis. Isi Tanggal Laporan.

3. **Dasar Surat** — Pilih:
   - **Ya** → pilih Nomor Surat Usulan dari dropdown (difilter sesuai jenis yang dipilih di langkah 1); detail barang terisi otomatis, foto juga terisi otomatis dari Drive (tidak di-upload ulang):
     - ❄️ Perbaikan: foto 1 (NUP) + foto 2 (Merek/Tipe) auto-fill
     - 🔄 Pemindahan: foto 1 + foto 2 + foto 3 (Sebelum) + foto 6 (Sesudah) auto-fill
   - **Tidak** → isi nomor surat usulan manual atau kosongkan

4. **Detail Barang** — Pilih NUP → Nama → Merek → Tipe (hanya barang A.C).
   - Jika tidak ada di daftar, klik **✏️ Isi Data Manual**.
   - Isi Ruangan (sesuai DBR). Untuk Pemindahan, isi juga **Ruangan Sesudah Pindah**.

5. **Kapasitas AC** — Pilih kapasitas dalam PK (½, ¾, 1, 1½, 2, 2½, 3, 5 PK).

6. **Jenis Pekerjaan** — Centang pekerjaan yang dilakukan:
   - Cuci AC, Isi Freon, Ganti Kapasitor, Ganti Modul/PCB, Lain-lain (isi keterangan)

7. **Deskripsi** — Keterangan tambahan (opsional).

8. **Foto** — Upload hingga 6 foto (label berubah sesuai jenis laporan):

   | Slot | ❄️ Perbaikan / Pemeliharaan | 🔄 Pemindahan |
   |------|------------------------------|---------------|
   | 📸 1 | Foto NUP Barang (auto dari usulan) | Foto NUP Barang (auto) |
   | 📸 2 | Foto Merek/Tipe (auto dari usulan) | Foto Merek/Tipe (auto) |
   | 📸 3 | Foto Sebelum / Spare Part | Foto AC dan Ruangan Sebelum Pemindahan (auto) |
   | 📸 4 | Foto Pekerjaan 1 | Foto Pekerjaan 1 |
   | 📸 5 | Foto Pekerjaan 2 | Foto Pekerjaan 2 |
   | 📸 6 | Foto Lain-lain | Foto AC dan Ruangan Sesudah Pemindahan (auto) |

9. **Penandatangan** — Isi data 3 pihak:
   - **Pelaksana**: pilih dari daftar → jabatan & perusahaan terisi otomatis
   - **Pengguna BMN**: isi nama & jabatan + gambar TTD manual
   - **Pengawas**: pilih dari daftar TTD Sarpras

10. Klik **🚀 Submit**. Email notifikasi terkirim otomatis.

---

### 4. Laporan Kegiatan Harian Sarpras — `lkh.html`

Form laporan harian kegiatan pemeliharaan Barang Milik Negara oleh Instalasi Sarana Prasarana.

#### Langkah Pengisian

1. **Info Laporan** — Nomor LKH terisi otomatis. Isi Tanggal Laporan.

2. **Dasar Surat Usulan** — Pilih:
   - **Ya** → pilih Nomor Surat Usulan dari dropdown; detail barang (NUP, nama, merek, tipe, ruangan, keluhan) + foto 1 & 2 terisi otomatis
   - **Tidak** → isi nomor surat usulan manual atau kosongkan (untuk kegiatan rutin tanpa surat usulan)

   > Opsi ditandai **🔒 (sudah selesai)** jika surat usulan tersebut sudah pernah punya LKH ber-progress "Selesai" — tidak bisa dipilih kembali.

3. **Nama Kegiatan** — Deskripsikan kegiatan yang dilakukan (mis. "Pemeliharaan rutin AC, pembersihan filter").

4. **Rincian BMN** — Pilih NUP dari dropdown cascade (atau isi manual). Isi Ruangan dan Kondisi barang.

5. **Progress** — Pilih:
   - **Dalam Tahap Pengerjaan** — pekerjaan belum selesai
   - **Selesai** — pekerjaan sudah selesai (LKH ini akan mengunci surat usulan agar tidak bisa dipilih lagi)

6. **Foto** — Upload hingga 6 foto:
   - Foto 1 & 2: auto-fill dari surat usulan (NUP dan merek/tipe)
   - Foto 3–6: upload manual (sebelum, sesudah 1, sesudah 2, lain-lain)

7. **Penandatangan** — Isi data 3 pihak:
   - **Yang Melaksanakan** (Sarpras) — pilih dari daftar TTDSapras
   - **Pengusul / Pengguna BMN** — isi nama/NIP + gambar TTD manual
   - **Mengetahui / Kepala Instalasi** — pilih dari daftar TTDSapras

8. Klik **🚀 Submit**. Email notifikasi terkirim otomatis ke tim Sarpras.

---

### 5. Panel Admin — `admin.html`

Halaman untuk melihat, mencari, dan mencetak ulang semua dokumen yang pernah disubmit.

#### Cara Akses

Buka `admin.html` → masukkan **password admin** (dikonfigurasi saat deploy).

#### Fitur Admin

**Tab Surat Usulan:**
- Tabel semua surat usulan dengan kolom: Tanggal, Nomor, Nama, Bagian, Jenis Surat, Nama Barang, NUP, Kondisi
- Filter berdasarkan Nama, Nomor/Kata Kunci, dan Bulan
- Klik baris → detail panel muncul (semua field lengkap termasuk Jenis Surat dan Ruangan Sesudah jika pemindahan)
- Tombol **🖨️ Cetak / Regenerasi PDF** → muat ulang foto dari Drive, narasi surat berubah sesuai jenis, lalu buka dialog cetak

**Tab Berita Acara:**
- Tabel semua BA dengan kolom: Tanggal BA, Nomor BA, Pelaksana, Nama Barang, NUP, Kondisi, No Usulan
- Klik baris → detail + tombol Cetak

**Tab Laporan AC:**
- Tabel semua Laporan AC dengan kolom: Tanggal Laporan, Nomor, Pelaksana, Nama Barang, Kapasitas AC, NUP, No Usulan
- Klik baris → detail panel (termasuk Jenis Surat, Ruangan Sesudah jika pemindahan) + tombol Cetak
- Saat cetak: judul, narasi, dan caption foto berubah otomatis sesuai jenis (perbaikan vs pemindahan), foto 6 slot tersedia

**Tab Laporan Kegiatan (LKH):**
- Tabel semua LKH dengan kolom: Tanggal LKH, Nomor LKH, Pelaksana, Nama Barang, NUP, Progress, No Usulan
- Klik baris → detail lengkap + tombol Cetak
- Saat cetak: muat foto & TTD dari Drive, tanggal diformat terbilang, progress di-underline sesuai nilai

> **Catatan:** Cetak akan mengunduh foto terbaru dari Google Drive. Pastikan koneksi internet stabil.

---

## Arsitektur Sistem

```
SimpleBMN/
├── index.html              #   ~175 baris — Landing page, navigasi ke 4 form
├── usulan.html             # ~2.220 baris — Form Surat Usulan BMN
├── bapp.html               # ~1.749 baris — Form Berita Acara PP
├── laporan-ac.html         # ~2.073 baris — Form Laporan Pemeliharaan AC
├── lkh.html                # ~1.600 baris — Form Laporan Kegiatan Harian Sarpras
├── admin.html              # ~1.800 baris — Panel Admin (4 tab: Usulan, BA, AC, LKH)
├── build.js                #    88 baris — Build script: inject env + embed TTD base64 → dist/
├── vercel.json             #             — Konfigurasi deploy Vercel
├── KOP.png                 #             — Kop surat institusi
│
├── TTDSapras/              # TTD Pengawas Sarpras
│   ├── Sukiman.png
│   └── Tommy.png
├── TTDPelaksana/           # TTD Pelaksana pekerjaan
│   ├── Heriyanto.png
│   └── Iqbal.png
├── TTDAtasanLangsung/      # TTD Atasan Langsung / Pengguna BMN (untuk bapp.html)
│   └── (nama).png
│
├── Code_UseFonnte.gs       # 1.190 baris — Google Apps Script, backend API utama
├── Code_MetaWA.gs          #   370 baris — Alternatif notif WA via Meta API
├── Code_callMeBot.gs       #   335 baris — Alternatif notif WA via CallMeBot
├── Template_Spreadsheet_BMN.xlsx  # Template Google Sheets
│
└── dist/                   # Output build (generated, tidak di-commit)
    ├── index.html
    ├── usulan.html
    ├── bapp.html
    ├── laporan-ac.html
    ├── lkh.html
    ├── admin.html
    ├── KOP.png
    ├── TTDSapras/
    ├── TTDPelaksana/
    └── TTDAtasanLangsung/
```

### Alur Data

```
Browser (form HTML)
    │
    ├─ GET  → GAS (?action=getNomor)            → nomor surat otomatis
    ├─ GET  → GAS (?action=getAset)             → daftar aset BMN
    ├─ GET  → GAS (?action=getSuratUsulanList)  → daftar nomor usulan (+ foto untuk auto-fill)
    │
    └─ POST → GAS (action=submit*)
                │
                ├─ Tulis baris baru ke Google Sheets
                ├─ Upload foto ke Google Drive (base64 → file)
                │   └─ Drive URL yang sudah ada diteruskan langsung (tidak di-upload ulang)
                ├─ Upload TTD ke Google Drive
                ├─ Kirim email notifikasi ke sarpras@poltekkespalembang.ac.id
                └─ Kirim WA via Fonnte (jika aktif)
```

---

## Alur Kerja Pengembangan

```
EDIT KODE (VS Code / Cursor)
  │  HTML menggunakan placeholder:
  │  __GAS_URL__ | __ADMIN_PASSWORD__ | __TTD_SAPRAS__ | __TTD_PELAKSANA__ | __TTD_ATASAN__
  ↓
BUILD LOKAL
  │  node --env-file=.env.local build.js
  │  Placeholder → nilai asli dari .env.local
  │  TTDSapras/*.png + TTDPelaksana/*.png + TTDAtasanLangsung/*.png
  │  → embed sebagai base64 JSON ke dalam HTML → dist/
  ↓
TEST LOKAL
  │  npx serve dist  →  buka http://localhost:3000
  ↓
PUSH KE GITHUB
  │  git add . && git commit -m "..." && git push
  ↓
VERCEL AUTO-DEPLOY
     Vercel detect push
  →  jalankan build.js dengan env dari dashboard Vercel
  →  publish dist/ ke simplebmn.vercel.app (atau domain kustom)
```

---

## Setup Awal

### 1. Google Sheets

1. Import `Template_Spreadsheet_BMN.xlsx` ke Google Drive
2. Jalankan `setupSheetHeaders()` di GAS satu kali untuk membuat/memperbarui header kolom
3. Buat juga **Spreadsheet Aset BMN** terpisah dengan kolom:
   `NUP | Nama Barang | Merk | Tipe` (nama kolom harus persis)

### 2. Google Apps Script

1. Buka [script.google.com](https://script.google.com) → **New Project**
2. Paste seluruh isi `Code_UseFonnte.gs`
3. Isi nilai di bagian `CONFIG` di atas file:

```javascript
const CONFIG = {
  SPREADSHEET_ID          : 'ID_SHEETS_ARSIP',
  DRIVE_FOLDER_ID         : 'ID_FOLDER_DRIVE_FOTO_USULAN',
  BA_DRIVE_FOLDER_ID      : 'ID_FOLDER_DRIVE_FOTO_BA',
  L_PP_AC_DRIVE_FOLDER_ID : 'ID_FOLDER_DRIVE_FOTO_LAPORAN_AC',
  LKH_DRIVE_FOLDER_ID     : 'ID_FOLDER_DRIVE_FOTO_LKH',
  ASET_SPREADSHEET_ID     : 'ID_SHEETS_ASET_BMN',
  ASET_SHEET_NAME         : 'ASET2026',        // nama sheet di spreadsheet aset
  EMAIL_TUJUAN            : 'sarpras@poltekkespalembang.ac.id',
  EMAIL_AKTIF             : true,
  NAMA_INSTANSI           : 'Politeknik Kesehatan Palembang',
  // ...
};
```

4. **Otorisasi MailApp** (sekali saja):
   - Pilih fungsi `testEmailUsulan` → **Run**
   - GAS minta otorisasi → **Allow**
   - Cek inbox apakah email test masuk

5. **Jalankan `setupSheetHeaders()` sekali** untuk membuat/memperbarui header kolom di semua sheet arsip

6. **Deploy → Web App**:
   - Execute as: **Me**
   - Who has access: **Anyone**

7. Salin **Deployment URL** → ini adalah `GAS_URL`

> Setiap ada perubahan kode GAS, buat **New Version** di Deploy → Manage Deployments.

### 3. Folder Google Drive

Buat 3 folder di Google Drive, salin ID masing-masing dari URL:

| Folder | Konfigurasi | Isi |
|--------|-------------|-----|
| Foto Surat Usulan | `DRIVE_FOLDER_ID` | Foto & TTD dari form usulan |
| Foto BA PP | `BA_DRIVE_FOLDER_ID` | Foto & TTD dari form BAPP |
| Foto Laporan AC | `L_PP_AC_DRIVE_FOLDER_ID` | Foto & TTD dari form laporan AC |
| Foto LKH | `LKH_DRIVE_FOLDER_ID` | Foto & TTD dari form laporan kegiatan harian |

> ID folder ada di URL Google Drive: `drive.google.com/drive/folders/**ID_INI**`

### 4. TTD (Tanda Tangan Digital)

Lihat [bagian Manajemen TTD](#manajemen-ttd).

### 5. Vercel

1. Import repo dari GitHub di [vercel.com](https://vercel.com)
2. **Root Directory**: `gworkspace-webapps/SimpleBMN`
3. **Framework Preset**: `Other`
4. **Environment Variables** → tambahkan:

| Variable | Nilai |
|----------|-------|
| `GAS_URL` | URL Web App dari GAS |
| `ADMIN_PASSWORD` | Password untuk halaman admin |

5. Klik **Deploy**

---

## Development Lokal

```bash
# Masuk ke folder project
cd gworkspace-webapps/SimpleBMN

# Link ke project Vercel (sekali saja)
vercel link

# Pull env dari Vercel ke lokal
vercel env pull .env.local

# Build: inject env + embed TTD ke HTML
node --env-file=.env.local build.js

# Jalankan server lokal
npx serve dist
# Buka http://localhost:3000
```

### Struktur `.env.local`

```
GAS_URL=https://script.google.com/macros/s/XXXXXXX/exec
ADMIN_PASSWORD=password_rahasia
```

---

## Deploy

```bash
# Push ke GitHub → Vercel auto-deploy
git add gworkspace-webapps/SimpleBMN/
git commit -m "feat: deskripsi perubahan"
git push
```

### Jika GAS_URL Berubah (redeploy GAS)

1. Update `GAS_URL` di Vercel Dashboard → **Settings → Environment Variables**
2. **Redeploy**: Vercel Dashboard → tab **Deployments** → titik tiga → **Redeploy**
3. Update lokal: `vercel env pull .env.local`

### Jika Ada Pengawas / Pelaksana / Atasan Baru

1. Tambah file `NamaBaru.png` ke folder TTD yang sesuai:
   - `TTDSapras/` → untuk **Pengawas Sarpras**
   - `TTDPelaksana/` → untuk **Pelaksana** pekerjaan
   - `TTDAtasanLangsung/` → untuk **Atasan Langsung / Pengguna BMN**
2. Push ke GitHub → Vercel auto-rebuild → nama baru otomatis muncul di dropdown

### Jika Ada Perubahan di GAS

1. Buka GAS project → edit kode
2. **Deploy → Manage Deployments → New Version** (bukan edit yang lama)
3. Salin URL jika berubah → update `GAS_URL` di Vercel

---

## GAS — Endpoint & Aksi

Semua request ke GAS menggunakan URL format:
```
GET  : {GAS_URL}?action=NAMA_AKSI&param=nilai
POST : {GAS_URL}  (body: JSON string)
```

### GET Endpoints

| Aksi | Deskripsi | Response |
|------|-----------|----------|
| `getNomor` | Generate nomor Surat Usulan berikutnya | `{status, nomor, urut}` |
| `getNomorBA` | Generate nomor BA berikutnya | `{status, nomor, urut}` |
| `getNomorLaporanAC` | Generate nomor Laporan AC berikutnya | `{status, nomor, urut}` |
| `getAset` | Daftar aset BMN dari sheet aset | `{status, count, data: [{nup, nama, merk, tipe}]}` |
| `getSuratList` | Semua surat usulan (untuk admin) | `{status, count, data: [...]}` |
| `getSuratUsulanList` | Surat usulan untuk dropdown BA & Laporan AC | `{status, count, data: [{nomor, namaBarang, merek, tipe, ruangan, nup, fotoNup, fotoMerek, fotoKerusakan, fotoLainLain, jenisSurat}]}` |
| `getBASuratList` | Semua berita acara (untuk admin) | `{status, count, data: [...]}` |
| `getLaporanACList` | Semua laporan AC (untuk admin) | `{status, count, data: [...]}` |
| `getNomorLKH` | Generate nomor LKH berikutnya | `{status, nomor, urut}` |
| `getLKHList` | Semua laporan kegiatan harian (untuk filter & admin) | `{status, count, data: [...]}` |
| `getPhoto` | Ambil foto Drive sebagai base64 | `{status, base64}` — param: `url=DRIVE_URL` |

### POST Endpoints

| Aksi | Deskripsi | Field Penting |
|------|-----------|---------------|
| `submit` | Simpan Surat Usulan | `nomor, tanggalSurat, nama, nip, jabatan, bagian, namaBarang, merek, tipe, ruangan, ruanganSesudah, nup, kondisi, keluhan, jenisSurat, fotoNup, fotoMerek, fotoKerusakan, fotoKeseluruhan, fotoLainLain, ttdPenerima, ttdPengirim, namaPenerima, nipPenerima` |
| `submitBA` | Simpan Berita Acara | `nomor, tanggalBA, noSuratUsulan, namaBarang, merek, tipe, ruangan, nup, kondisi, rincian, namaPelaksana, jabPelaksana, namaPengawas, jabPengawas, namaPengguna, jabPengguna, ttdPelaksana, ttdPengawas, ttdPengguna, foto1–foto6` |
| `submitLaporanAC` | Simpan Laporan AC | `nomor, tanggalLaporan, noSuratUsulan, jenisSurat, namaBarang, merek, tipe, ruangan, ruanganSesudah, nup, kapasitasAC, jenisCuci, jenisIsiFreon, jenisGantiKapasitor, jenisGantiModul, jenisLainLain, deskripsi, namaPelaksana, jabPelaksana, perusahaanPelaksana, namaPengguna, jabPengguna, namaPengawas, ttdPelaksana, ttdPengguna, ttdPengawas, foto1–foto6` |
| `submitLKH` | Simpan Laporan Kegiatan Harian | `nomor, tanggalLKH, noSuratUsulan, namaKegiatan, namaBarang, merek, tipe, ruangan, nup, kondisi, keluhan, progress, namaPelaksana, nipPelaksana, jabPelaksana, namaPengusul, nipPengusul, jabPengusul, namaMengetahui, ttdPelaksana, ttdPengusul, ttdMengetahui, foto1–foto6` |

### Format Nomor Surat

| Dokumen | Prefix | Contoh |
|---------|--------|--------|
| Surat Usulan | `KN.01.03/Sarpras/PP` | `KN.01.03/Sarpras/PP/001/I/2026` |
| Berita Acara | `KN.01.03/Sarpras/BA-PP` | `KN.01.03/Sarpras/BA-PP/001/I/2026` |
| Laporan AC | `KN.01.03/Sarpras/L-PP-AC` | `KN.01.03/Sarpras/L-PP-AC/001/I/2026` |
| Laporan Kegiatan Harian | `KN.01.03/Sarpras/LKH-ISP` | `KN.01.03/Sarpras/LKH-ISP/001/I/2026` |

Format: `PREFIX/URUT/BULAN_ROMAWI/TAHUN`

### Fungsi Utilitas GAS (jalankan manual dari editor)

| Fungsi | Kegunaan |
|--------|----------|
| `setupSheetHeaders()` | Buat/reset header kolom di semua sheet arsip (jalankan sekali saat setup awal atau setelah ada kolom baru) |
| `testEmailUsulan()` | Kirim email test untuk Surat Usulan (sekaligus otorisasi MailApp) |
| `testEmailBA()` | Kirim email test untuk Berita Acara |
| `testEmailLaporanACPerbaikan()` | Kirim email test untuk Laporan AC Perbaikan |
| `testEmailLaporanACPemindahan()` | Kirim email test untuk Laporan AC Pemindahan |

---

## Struktur Kolom Spreadsheet

### Sheet: `Usulan-PP` (28 kolom, A–AB)

| Kolom | Field |
|-------|-------|
| A | No (nomor urut baris) |
| B | Nomor Surat |
| C | Tanggal Submit (timestamp) |
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
| P | Link Foto NUP (Drive) |
| Q | Link Foto Merek (Drive) |
| R | Link Foto Kerusakan / AC Sebelum Pindah (Drive) |
| S | Link Foto Keseluruhan (Drive) |
| T | Link Foto Lain-lain / AC Sesudah Pindah (Drive) |
| U | TTD Penerima (Link Drive) |
| V | TTD Pengirim (Link Drive) |
| W | Nama Penerima |
| X | NIP Penerima |
| Y | Status (default: "Menunggu Tindak Lanjut") |
| Z | Keterangan |
| AA | Jenis Surat (`umum` / `ac-perbaikan` / `ac-pemindahan`) |
| AB | Ruangan Sesudah Pindah (DBR) — khusus Pemindahan AC |

### Sheet: `BA-PP` (28 kolom, A–AB)

| Kolom | Field |
|-------|-------|
| A | No |
| B | Nomor BA |
| C | Tanggal Submit (timestamp) |
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
| W | Link Foto 1 — NUP Barang (Drive) |
| X | Link Foto 2 — Merek/Tipe (Drive) |
| Y | Link Foto 3 — Spare Part/Bahan (Drive) |
| Z | Link Foto 4 — Setelah Perbaikan 1 (Drive) |
| AA | Link Foto 5 — Setelah Perbaikan 2 (Drive) |
| AB | Link Foto 6 — Lain-lain (Drive) |

### Sheet: `L-PP-AC` (36 kolom, A–AJ)

| Kolom | Field |
|-------|-------|
| A | No |
| B | Nomor Laporan |
| C | Tanggal Submit (timestamp) |
| D | Tanggal Laporan |
| E | No Surat Usulan |
| F | Nama Barang |
| G | Tipe |
| H | Merek |
| I | Ruangan (DBR) |
| J | NUP |
| K | Kapasitas AC (PK) |
| L | Cuci (Ya / kosong) |
| M | Isi Freon (Ya / kosong) |
| N | Ganti Kapasitor (Ya / kosong) |
| O | Ganti Modul/PCB (Ya / kosong) |
| P | Lain-lain Pekerjaan (teks keterangan) |
| Q | Deskripsi |
| R | Nama Pelaksana (badan surat) |
| S | Jabatan Pelaksana (badan surat) |
| T | Perusahaan / Instansi Pelaksana |
| U | Nama Pelaksana (TTD) |
| V | Jabatan Pelaksana (TTD) |
| W | Nama Pengguna BMN |
| X | Jabatan Pengguna BMN |
| Y | Nama Pengawas |
| Z | TTD Pelaksana (Link Drive atau nama kunci) |
| AA | TTD Pengguna BMN (Link Drive) |
| AB | TTD Pengawas (Link Drive atau nama kunci) |
| AC | Link Foto 1 — NUP Barang (Drive) |
| AD | Link Foto 2 — Merek/Tipe (Drive) |
| AE | Link Foto 3 — Sebelum/Spare Part *atau* AC Sebelum Pindah (Drive) |
| AF | Link Foto 4 — Pekerjaan 1 (Drive) |
| AG | Link Foto 5 — Pekerjaan 2 (Drive) |
| AH | Link Foto 6 — Lain-lain *atau* AC Sesudah Pindah (Drive) |
| AI | Jenis Surat Laporan (`ac-perbaikan` / `ac-pemindahan`) |
| AJ | Ruangan Sesudah Pindah (DBR) — khusus Pemindahan AC |

### Sheet: `LKH-ISP` (30 kolom, A–AD)

| Kolom | Field |
|-------|-------|
| A | No (nomor urut baris) |
| B | Nomor LKH |
| C | Tanggal Submit (timestamp) |
| D | Tanggal LKH |
| E | No Surat Usulan |
| F | Nama Kegiatan |
| G | Nama Barang |
| H | Merek |
| I | Tipe |
| J | Ruangan (DBR) |
| K | NUP BMN |
| L | Kondisi |
| M | Keluhan |
| N | Progress (`Dalam Tahap Pengerjaan` / `Selesai`) |
| O | Nama Pelaksana (Sarpras) |
| P | NIP Pelaksana |
| Q | Jabatan Pelaksana |
| R | TTD Pelaksana (nama kunci atau URL Drive) |
| S | Nama Pengusul / Pengguna BMN |
| T | NIP Pengusul |
| U | Jabatan Pengusul |
| V | TTD Pengusul (URL Drive — selalu manual/canvas) |
| W | Nama Mengetahui (Kepala Instalasi) |
| X | TTD Mengetahui (nama kunci atau URL Drive) |
| Y | Link Foto 1 — NUP Barang (Drive atau URL dari usulan) |
| Z | Link Foto 2 — Merek/Tipe (Drive atau URL dari usulan) |
| AA | Link Foto 3 — Sebelum Perbaikan (Drive) |
| AB | Link Foto 4 — Sesudah Perbaikan 1 (Drive) |
| AC | Link Foto 5 — Sesudah Perbaikan 2 (Drive) |
| AD | Link Foto 6 — Lain-lain (Drive) |

---

## Manajemen TTD

### Folder & Penggunaannya

| Folder | Diembed ke | Dipakai di Form |
|--------|-----------|-----------------|
| `TTDSapras/` | `usulan.html`, `bapp.html`, `laporan-ac.html`, `lkh.html` | TTD Penerima (usulan), TTD Pengawas Sarpras (bapp & laporan), TTD Pelaksana & Mengetahui (lkh) |
| `TTDPelaksana/` | `laporan-ac.html` | TTD Pelaksana pekerjaan |
| `TTDAtasanLangsung/` | `bapp.html` | TTD Atasan Langsung / Pengguna BMN |

### Format File

- Nama file: `NamaOrang.png` (gunakan nama yang akan ditampilkan di dropdown)
- Format: PNG (disarankan), background transparan atau putih
- Resolusi: minimal 300×150 px

### Proses Otomatis saat Dipilih

1. Gambar TTD di-load dari data base64 yang sudah embed di HTML
2. Dikonversi ke **hitam-putih** secara otomatis
3. Background dihapus (piksel terang → transparan)
4. Ditampilkan di preview surat dengan kualitas tanda tangan formal

### Menambah TTD Baru

```bash
# Taruh file PNG di folder yang sesuai
cp NamaBaru.png TTDSapras/NamaBaru.png     # untuk pengawas
cp NamaBaru.png TTDPelaksana/NamaBaru.png  # untuk pelaksana

# Push ke GitHub → Vercel rebuild otomatis
git add TTDSapras/NamaBaru.png
git commit -m "feat(ttd): tambah TTD NamaBaru sebagai pengawas"
git push
```

### Mode TTD di Form

Setiap bidang TTD di semua form memiliki 2 mode:

| Mode | Yang Tersimpan di Sheet | Admin Reprint |
|------|------------------------|---------------|
| **🗂️ Pilih dari Daftar** | **Nama kunci** (mis. `"Tommy"`) — tidak upload ke Drive | `loadTTDIntoEl` load dari folder TTD lokal (embed saat build) |
| **✍️ Gambar Manual** | **URL Google Drive** — base64 di-upload ke folder Drive | `loadTTDIntoEl` fetch via GAS `?action=getPhoto` |

Kedua mode ditangani otomatis oleh `loadTTDIntoEl` di `admin.html` — fungsi ini cek `startsWith('https://')` untuk Drive URL, sisanya dianggap nama kunci dan diload dari folder TTD lokal.

### Kolom TTD di Google Sheets

| Sheet | Kolom | Nilai yang Mungkin |
|-------|-------|--------------------|
| Usulan-PP | U (TTD Penerima) | Nama kunci (dari daftar) atau URL Drive (manual) |
| Usulan-PP | V (TTD Pengirim) | URL Drive (selalu manual/canvas) |
| BA-PP | T (TTD Pelaksana) | URL Drive (selalu manual/canvas) |
| BA-PP | U (TTD Pengawas) | Nama kunci atau URL Drive |
| BA-PP | V (TTD Pengguna) | Nama kunci atau URL Drive |
| L-PP-AC | Z (TTD Pelaksana) | Nama kunci atau URL Drive |
| L-PP-AC | AA (TTD Pengguna) | URL Drive (selalu manual/canvas) |
| L-PP-AC | AB (TTD Pengawas) | Nama kunci atau URL Drive |
| LKH-ISP | R (TTD Pelaksana) | Nama kunci atau URL Drive |
| LKH-ISP | V (TTD Pengusul) | URL Drive (selalu manual/canvas) |
| LKH-ISP | X (TTD Mengetahui) | Nama kunci atau URL Drive |

---

## Notifikasi

### Email (Aktif)

Email dikirim **otomatis saat form disubmit** ke `sarpras@poltekkespalembang.ac.id`. Tidak dipicu oleh perubahan Sheets.

| Dokumen | Subject Email | Isi Utama |
|---------|---------------|-----------|
| Surat Usulan | `[BMN] Usulan Baru — {nomor} — {nama}` | Jenis surat, identitas pengusul, detail barang, kondisi, keluhan, link foto |
| Berita Acara | `[BMN] Berita Acara Baru — {nomor}` | Detail barang, kondisi, rincian, pelaksana/pengawas/pengguna, link foto |
| Laporan AC | `[BMN] Laporan AC Baru — {nomor} — {jenis}` | Jenis laporan, detail AC, ruangan sesudah (jika pemindahan), jenis pekerjaan, pelaksana, link foto |
| Laporan Kegiatan (LKH) | `[BMN] Laporan Kegiatan Baru — {nomor} — {pelaksana}` | Nama kegiatan, detail BMN, progress, pelaksana, pengusul, link foto |

Konfigurasi di `CONFIG` dalam `Code_UseFonnte.gs`:

```javascript
EMAIL_TUJUAN : 'sarpras@poltekkespalembang.ac.id',
EMAIL_AKTIF  : true,
NAMA_INSTANSI: 'Politeknik Kesehatan Palembang',
```

**Otorisasi (sekali saja):** Jalankan `testEmailUsulan()` dari GAS Editor → izinkan akses MailApp.

### WhatsApp (via Fonnte, opsional)

```javascript
WA_TOKEN  : 'TOKEN_FONNTE_KAMU',
WA_TUJUAN : '628XXXXXXXXXX',  // nomor WA tujuan (format internasional)
WA_AKTIF  : false,             // ubah ke true untuk mengaktifkan
```

---

## Jenis Surat Usulan

| Nilai (`jenisSurat`) | Label | Perbedaan |
|---------------------|-------|-----------|
| `umum` | 📄 Umum / Selain AC | Dropdown aset semua jenis BMN; tidak ada ruangan sesudah; tidak ada kondisi Baik |
| `ac-perbaikan` | ❄️ Perbaikan / Pemeliharaan AC | Dropdown aset difilter ke A.C saja; tidak ada kondisi Baik |
| `ac-pemindahan` | 🔄 Pemindahan AC | Filter AC; ada Ruangan Sesudah; ada Kondisi Baik; judul/narasi/caption foto berbeda |

## Jenis Surat Laporan AC

| Nilai (`jenisSurat`) | Label | Perbedaan di Laporan AC |
|---------------------|-------|------------------------|
| `ac-perbaikan` | ❄️ Perbaikan / Pemeliharaan AC | Judul perbaikan; foto 3 = Sebelum/Spare Part; foto 6 = Lain-lain; dropdown surat usulan difilter ke ac-perbaikan |
| `ac-pemindahan` | 🔄 Pemindahan AC | Judul pemindahan; field Ruangan Sesudah Pindah; foto 3 = AC Sebelum Pindah (auto-fill); foto 6 = AC Sesudah Pindah (auto-fill); dropdown surat usulan difilter ke ac-pemindahan |

---

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (vanilla, tanpa framework) |
| Backend | Google Apps Script (GAS) |
| Storage | Google Sheets (data) + Google Drive (file) |
| Deploy | Vercel (static hosting + build-time env injection) |
| Notifikasi | WhatsApp via [Fonnte](https://fonnte.com) + Gmail (MailApp) |
| TTD | PNG embed base64 saat build, diproses B&W + alpha di browser (Canvas API) |
| Aset BMN | Google Sheets terpisah, dibaca via GAS |

---

*Dibuat dan dikelola oleh Instalasi Sarana Prasarana — Poltekkes Kemenkes Palembang*
