# 📋 Sistem Surat Usulan Perbaikan BMN
**Politeknik Kesehatan Palembang — Instalasi Sarana Prasarana**

Sistem web form untuk mengisi, preview, submit, dan mencetak **Surat Usulan Perbaikan Barang Milik Negara (BMN)** secara otomatis — berbasis HTML murni + Google Apps Script (gratis, tanpa server).

---

## 📁 Struktur File

```
bmn-sarpras/
├── index.html          ← Aplikasi web (form + preview + cetak)
├── kop.png             ← Kop surat instansi (siapkan sendiri)
├── Code.gs             ← Backend Google Apps Script (CallMeBot)
├── Code_MetaWA.gs      ← Backend alternatif (Meta WA Cloud API)
└── README.md           ← Panduan ini
```

---

## ⚙️ Fitur

- ✅ Form input lengkap dengan preview surat **real-time**
- ✅ Nomor surat **otomatis** (diambil dari Google Sheets)
- ✅ Upload 4 foto lampiran (NUP, Merek/Tipe, Kerusakan, Keseluruhan)
- ✅ Submit → data tersimpan ke **Google Sheets** + foto ke **Google Drive**
- ✅ Notifikasi **Email HTML** otomatis ke tim Sarpras
- ✅ Notifikasi **WhatsApp** otomatis (3 pilihan provider)
- ✅ Cetak surat 2 lembar kertas **F4** (215×330mm) — foto tidak pernah terpotong
- ✅ Gratis 100% (Vercel/GitHub Pages + Google Workspace + WA provider)

---

## 🚀 Panduan Setup Lengkap

### LANGKAH 1 — Siapkan Google Sheets

1. Upload file `arsip-surat-bmn.xlsx` ke Google Drive
2. Klik kanan → **"Open with"** → **"Google Sheets"** (wajib dikonversi, bukan preview Excel)
3. Setelah terbuka, salin **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/ <<<SALIN_INI>>> /edit
   ```

---

### LANGKAH 2 — Siapkan Folder Google Drive (Foto)

1. Di Google Drive, buat folder baru → beri nama misal `Arsip Foto BMN`
2. Buka folder tersebut → salin **Folder ID** dari URL:
   ```
   https://drive.google.com/drive/folders/ <<<SALIN_INI>>>
   ```

---

### LANGKAH 3 — Deploy Google Apps Script

1. Buka [script.google.com](https://script.google.com) → **"New project"**
2. Hapus semua isi default → paste seluruh isi `Code.gs`
3. **Isi bagian CONFIG** di atas file:

```javascript
const CONFIG = {
  SPREADSHEET_ID  : 'ISI_SPREADSHEET_ID_DARI_LANGKAH_1',
  DRIVE_FOLDER_ID : 'ISI_FOLDER_ID_DARI_LANGKAH_2',
  EMAIL_TUJUAN    : 'email-tim-sarpras@instansi.go.id',
  NAMA_INSTANSI   : 'Politeknik Kesehatan Palembang',
  NOMOR_PREFIX    : 'KN.01.03/Sarpras',
  SHEET_NAME      : 'Arsip Surat',

  // Pilih salah satu provider WA di bawah ↓
};
```

4. **Jalankan sekali untuk authorize:**
   - Klik dropdown nama fungsi → pilih `getNomorSurat` → klik ▶ **Run**
   - Muncul popup **"Authorization required"** → klik **"Review permissions"**
   - Pilih akun Google yang **sama** dengan pemilik Spreadsheet → **"Allow"**
   - Jika muncul peringatan "Google hasn't verified this app" → klik **"Advanced"** → **"Go to (nama project) (unsafe)"**

5. **Deploy sebagai Web App:**
   - Klik **"Deploy"** → **"New deployment"**
   - Klik ⚙️ → pilih **"Web app"**
   - Execute as: **Me** | Who has access: **Anyone**
   - Klik **"Deploy"** → salin **URL Web App**

> ⚠️ **Setiap kali mengubah kode**, gunakan **"Manage deployments" → edit → "New version"** agar URL tidak berubah.

---

### LANGKAH 4 — Konfigurasi Notifikasi WhatsApp

Pilih **salah satu** provider berikut:

---

#### 📱 Opsi A — CallMeBot *(Gratis selamanya, setup 5 menit)*

| | |
|--|--|
| ✅ Gratis permanen | ❌ Hanya bisa kirim ke nomor sendiri |
| ✅ Tidak ada expired | ❌ Tidak bisa foto/file |
| ✅ Aman (tidak risiko banned) | ❌ Tidak bisa kirim ke beberapa nomor |

**Setup:**
1. Simpan nomor ini ke kontak WA: `+34 644 95 42 75`
2. Kirim pesan WA ke kontak tersebut:
   ```
   I allow callmebot to send me messages
   ```
3. Tunggu balasan berisi APIKEY, contoh: `Your APIKEY is 123456`
4. Isi di `Code.gs`:
   ```javascript
   WA_PHONE   : '6281234567890',   // nomor yang daftar (format 62xxx)
   WA_APIKEY  : '123456',          // APIKEY dari balasan bot
   WA_AKTIF   : true,
   ```

---

#### 📱 Opsi B — Fonnte *(Berbayar, bisa kirim ke banyak nomor)*

| | |
|--|--|
| ✅ Bisa kirim ke banyak nomor | ❌ Ada expired kuota |
| ✅ Setup cepat (scan QR) | ⚠️ Ada risiko nomor banned |
| ✅ Free plan tersedia | ⚠️ Pesan ada branding "sent via fonnte" |

**Setup:**
1. Daftar di [fonnte.com](https://fonnte.com) → **"Add Device"**
2. Scan QR dengan WA yang akan jadi pengirim notif
3. Salin **Token** dari dashboard
4. Isi di `Code.gs`:
   ```javascript
   WA_TOKEN   : 'token-dari-fonnte',
   WA_TUJUAN  : '6281234567890',   // bisa beberapa: '628xxx,628yyy'
   WA_AKTIF   : true,
   ```

> ⚠️ Gunakan nomor cadangan, bukan nomor utama. Risiko diblokir Meta tetap ada.

---

#### 📱 Opsi C — Meta WhatsApp Cloud API *(Resmi, gratis 1.000 pesan/bulan)*

| | |
|--|--|
| ✅ Resmi dari Meta | ⏳ Setup 1-2 hari (tunggu approval template) |
| ✅ Gratis 1.000 pesan/bulan | ⚠️ Wajib pakai template pesan |
| ✅ Tidak ada risiko banned | ⚠️ Perlu Facebook Business Account |

**Gunakan file `Code_MetaWA.gs` (bukan `Code.gs`).**

**Setup:**
1. Buka [developers.facebook.com](https://developers.facebook.com) → **"Create App"** → pilih **Business**
2. Di dashboard app → tambahkan produk **WhatsApp** → hubungkan ke Facebook Business Account
3. Di halaman **WhatsApp → API Setup**, salin:
   - **Phone Number ID**
   - Buat **System User Token** permanen di Meta Business Settings → System Users
4. Buat template pesan di **WhatsApp Manager → Message Templates:**
   - Name: `notif_bmn` | Category: `Utility` | Language: `Indonesian`
   - Copy isi template dari komentar di bagian bawah `Code_MetaWA.gs`
   - Submit → tunggu approval (1-24 jam)
5. Isi di `Code_MetaWA.gs`:
   ```javascript
   WA_PHONE_NUMBER_ID : '1234567890',
   WA_ACCESS_TOKEN    : 'EAAxxxxxxxx...',
   WA_TUJUAN          : '6281234567890',
   WA_TEMPLATE_NAME   : 'notif_bmn',
   WA_TEMPLATE_LANG   : 'id',
   WA_AKTIF           : true,
   ```

---

### LANGKAH 5 — Update index.html

Buka `index.html` dengan text editor (VS Code / Notepad) → cari baris berikut dan ganti URL:

```javascript
// ===== CONFIG — GANTI URL DI BAWAH INI =====
const GAS_URL = 'https://script.google.com/macros/s/GANTI_DENGAN_URL_WEB_APP_ANDA/exec';
```

Ganti dengan URL Web App hasil deploy dari Langkah 3.

---

### LANGKAH 6 — Deploy ke GitHub Pages

1. Buat repository baru di GitHub (misal: `poltekkes-webapps`)
2. Buat folder `bmn-sarpras/` di dalam repo
3. Upload file `index.html` dan `kop.png` ke folder tersebut
4. Buka **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: `main` → folder: `/ (root)` atau `/bmn-sarpras` → **Save**
5. URL aplikasi akan muncul, contoh:
   ```
   https://username.github.io/poltekkes-webapps/bmn-sarpras/
   ```

> URL ini yang dibagikan ke seluruh staf/pegawai.

---

## 🔄 Cara Update Aplikasi

### Update kode GAS (Config, nomor WA, email, dll):
1. Edit kode di Google Apps Script editor
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
3. URL tidak berubah ✅

### Update tampilan/form (index.html):
1. Edit `index.html` di GitHub langsung (klik file → ✏️ edit) atau push dari lokal
2. GitHub Pages otomatis update dalam 1-2 menit ✅

---

## 🛠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Nomor surat tidak muncul / NetworkError | Cek GAS_URL di index.html sudah benar dan tidak ada spasi |
| "Layanan Spreadsheet gagal" | File .xlsx belum dikonversi ke Google Sheets — buka via "Open with Google Sheets" |
| Submit gagal | Pastikan GAS sudah di-authorize (run manual dulu) dan sudah di-deploy ulang |
| kop.png tidak muncul | Nama file harus persis `kop.png` (huruf kecil semua), letakkan di folder yang sama |
| Foto tidak terupload ke Drive | Cek DRIVE_FOLDER_ID benar dan folder ada di akun yang sama |
| Email tidak masuk | Cek EMAIL_TUJUAN, cek folder Spam |
| WA tidak terkirim | Cek konfigurasi provider WA, lihat Execution log di GAS editor |
| Nomor surat dobel | Jangan buka form di 2 tab sekaligus saat submit — perbaiki manual di Sheets |
| Cetak hanya 1 lembar | Coba di browser Chrome/Edge, pastikan popup tidak diblokir |

---

## 📊 Limit Layanan Gratis

| Layanan | Limit | Catatan |
|---------|-------|---------|
| **GitHub Pages** | Unlimited | Gratis selamanya |
| **Google Apps Script** | 90 menit/hari runtime | Sangat cukup untuk ratusan submit/hari |
| **Google Drive** | 15 GB storage | Shared dengan Gmail |
| **Gmail** | 100 email/hari | Cukup untuk internal instansi |
| **CallMeBot** | Tidak dipublish | Gratis selamanya, hanya ke nomor sendiri |
| **Fonnte Free** | ~1000 pesan/kuota | Ada masa berlaku, perlu top up |
| **Meta WA Cloud API** | 1.000 pesan/bulan | Gratis resmi dari Meta |

---

## 👥 Kontak & Pemeliharaan

- **Instansi:** Politeknik Kesehatan Palembang
- **Unit:** Instalasi Sarana Prasarana
- **Penerima Laporan:** Rahmad Aswin Juliansyah, SST, M.Kes — NIP. 198607182008121001

---

*Sistem ini dibangun menggunakan HTML, CSS, JavaScript, dan Google Apps Script — 100% gratis.*
