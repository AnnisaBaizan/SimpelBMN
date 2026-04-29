# Known Issues — SimpleBMN

Daftar masalah yang ditemukan saat pembacaan seluruh proyek pada 2026-04-22.
**Tidak ada isu yang langsung diperbaiki di sini** — ini hanya dokumentasi untuk tindak lanjut.

> **Update 2026-04-22 (batch 1):** Issue CRITICAL #1 sudah diperbaiki sekalian saat menambah Foto 6 pada Laporan AC. `getLaporanACList` sekarang membaca 34 kolom (A–AH), foto5 dan foto6 keduanya benar.
>
> **Update 2026-04-22 (batch 2):** Issue LOW #10 sudah diperbaiki — `kirimEmailNotifikasi` sekarang menyertakan Jenis Surat dan Ruangan Sesudah Pindah. Email sudah diaktifkan (EMAIL_AKTIF: true, EMAIL_TUJUAN: sarpras@poltekkespalembang.ac.id). Sheet L-PP-AC sekarang 36 kolom (A–AJ) dengan AI=JenisSurat, AJ=RuanganSesudah. `getSuratUsulanList` sekarang mengembalikan `fotoKerusakan` dan `fotoLainLain` untuk auto-fill foto pemindahan.
>
> **Update 2026-04-23 (batch 3):** Issue HIGH #3 sudah diperbaiki secara menyeluruh — TTD list-based kini ditangani benar di seluruh pipeline: (1) `usulan.html` dan `bapp.html` kini menyimpan nama kunci ke sheet, bukan base64 (menggunakan pola `ttdIsKey`/`ttdKeyVal` dari `laporan-ac.html`); (2) GAS `handleSubmit` dan `handleSubmitBA` kini cek `startsWith('data:')` sebelum upload TTD, sehingga nama kunci disimpan langsung tanpa re-upload ke Drive; (3) `admin.html` kini memakai `loadTTDIntoEl` untuk semua TTD di reprint surat usulan dan BA — bisa handle nama kunci maupun URL Drive. Juga ditambahkan `emailError` di response GAS dan try-catch per handler untuk memudahkan debug email yang tidak terkirim.
>
> **Update 2026-04-23 (batch 4 — LKH):** Fitur baru Laporan Kegiatan Harian Sarpras (`lkh.html`) ditambahkan secara menyeluruh: frontend (form + preview + TTD), backend GAS (`getNomorLKH`, `getLKHList`, `handleSubmitLKH`, `kirimEmailNotifikasiLKH`, sheet `LKH-ISP` 30 kolom), tab admin, menu index, dan build.js. Pola TTD dan foto konsisten dengan halaman lain.
>
> **Update 2026-04-24 (batch 5 — Identity from filename):** Konvensi nama file TTD diubah ke `Nama_NIP_Jabatan_Instansi.png`. `build.js` kini mem-parse metadata dari nama file dan menghasilkan `{ img, nip, jabatan, instansi }` per entri. NIP bisa diisi `-` untuk pegawai non-ASN. Semua halaman (`lkh.html`, `usulan.html`, `bapp.html`, `laporan-ac.html`) diperbarui: hardcoded map `NIP_SARPRAS`, `JAB_SARPRAS`, `JAB_SARPRAS_DEFAULT`, `PELAKSANA_PROFILE` dihapus — NIP dan jabatan kini auto-fill dari metadata file. Menambah orang baru cukup tambah satu file PNG dengan format nama yang benar. Juga diperbaiki: NUP dropdown di `lkh.html` kini hanya tampilkan nomor NUP (bukan `NUP — Nama Barang`), subtitle judul di `lkh.html` ditambah underline.
>
> **Update 2026-04-28 (batch 6 — DataTables admin):** Tabel di semua 4 tab `admin.html` (Surat Usulan, BA, Laporan AC, LKH) kini menggunakan **DataTables 2.x + Buttons extension**. Fitur yang ditambahkan: (1) placeholder "⏳ Memuat data…" saat fetch berjalan dan "❌ Gagal memuat data: …" jika request gagal; (2) export buttons — Copy, CSV, Excel (JSZip), PDF (pdfmake), Print; (3) ColVis (toggle kolom tampil) dengan dropdown CSS fix agar teks tidak putih; (4) per-column filter di `<tfoot>` setiap tabel; (5) default 5 baris per halaman, pilihan 5/10/25/50/100, length selector di pojok kanan atas. Shared factory `makeDTOptions(columns, filename)` + render helpers `nomor()`, `bold()`, `badgeKondisi()` di `admin.html` — kandidat untuk `shared.js` di fase modularisasi.

---

## HIGH

### 2. `ttdPengguna` di `handleSubmitLaporanAC()` tidak dicek apakah base64 atau nama
**File:** `Code_UseFonnte.gs` · Baris 816

```js
// ttdPelaksana dan ttdPengawas sudah ada cek startsWith('data:')
const ttdPelaksana = d.ttdPelaksana && d.ttdPelaksana.startsWith('data:')
  ? uploadFoto(subFolder, d.ttdPelaksana, 'TTD_Pelaksana')
  : (d.ttdPelaksana || '-');

// ttdPengguna TIDAK ada cek — selalu di-upload
const ttdPengguna = uploadFoto(subFolder, d.ttdPengguna, 'TTD_Pengguna');
```

TTD Pengguna di `laporan-ac.html` selalu digambar manual (canvas), sehingga ini tidak muncul saat ini. Tapi jika ke depannya TTD Pengguna ditambahkan ke daftar TTD berbasis nama seperti Pelaksana/Pengawas, `uploadFoto` akan menerima string nama (bukan base64) dan mengembalikan `"Gagal upload: ..."` yang tersimpan ke sheet.

**Dampak:** Data sheet kotor jika TTD Pengguna sewaktu-waktu dijadikan list-based.

**Saran perbaikan:** Tambahkan cek `startsWith('data:')` yang sama seperti `ttdPelaksana`.

### ~~3. Admin regenerasi PDF tidak bisa menampilkan TTD list-based dari Laporan AC~~ ✅ DIPERBAIKI
**File:** `admin.html`, `usulan.html`, `bapp.html`, `Code_UseFonnte.gs`

Pipeline TTD list-based sudah diperbaiki end-to-end:
- `usulan.html` + `bapp.html`: tambah `ttdIsKey`/`ttdKeyVal`, kirim nama kunci ke GAS (bukan base64)
- `Code_UseFonnte.gs` `handleSubmit` + `handleSubmitBA`: cek `startsWith('data:')` — nama kunci disimpan langsung, base64 di-upload ke Drive
- `admin.html` reprint surat usulan dan BA: pakai `loadTTDIntoEl` yang sudah handle nama kunci (load dari TTDSapras/TTDAtasanLangsung) maupun URL Drive (fetch via `getPhoto`)

### ~~4. `PELAKSANA_PROFILE` dan `TTD_DATA` hardcoded hanya untuk 2 teknisi~~ ✅ DIPERBAIKI
**File:** `laporan-ac.html`, `build.js`, semua halaman TTD

`PELAKSANA_PROFILE`, `NIP_SARPRAS`, `JAB_SARPRAS` dihapus dari semua halaman. Identitas (NIP, jabatan, instansi) kini dibaca dari nama file PNG: `Nama_NIP_Jabatan_Instansi.png`. Menambah orang baru cukup tambah satu file PNG ke folder TTD yang sesuai.

### 5. `JENIS_CONFIG` (usulan.html) dan `PR_JENIS` (admin.html) adalah duplikat
**File:** `usulan.html` · Sekitar baris 900–950  
**File:** `admin.html` · Sekitar baris 876–898

Kedua objek menyimpan data yang identik (judul, intro, penutup, ruanganLabel, dll.) untuk tiga jenis surat. Perubahan pada satu file harus direplikasi manual ke file lain.

**Dampak:** Rawan drift — jika penutup diubah di `usulan.html` tanpa diubah di `admin.html`, PDF yang diregenerasi admin akan berbeda dari PDF asli yang disubmit user.

**Saran perbaikan:** Pindahkan konfigurasi ke endpoint GAS (`?action=getJenisConfig`) atau buat satu file JS bersama yang di-include di kedua halaman lewat `build.js`.

---

## MEDIUM

### 6. Fallback filter Laporan AC bisa false-positive untuk barang bukan AC
**File:** `laporan-ac.html` · Fungsi `fetchSuratUsulanList()`

```js
// Untuk data lama tanpa jenisSurat, filter berdasarkan namaBarang
const nama = (s.namaBarang || '').toLowerCase();
return nama === 'a.c' || nama.includes('a.c') || nama.includes('air conditioner');
```

`nama.includes('a.c')` bisa cocok dengan barang seperti "Rak A.C. Display" atau nama lain yang kebetulan mengandung substring 'a.c'.

**Dampak:** Surat umum (bukan AC) bisa muncul di dropdown "Dasar Surat" laporan AC jika nama barangnya mengandung 'a.c'.

**Saran perbaikan:** Gunakan hanya exact match (`nama === 'a.c' || nama === 'air conditioner'`) atau tambahkan kata kunci yang lebih spesifik.

### 7. Surat usulan yang sudah punya BA tetap muncul di dropdown bapp.html
**File:** `bapp.html` · Fungsi `buildSelectUsulan()` / `fetchSuratUsulanList()`

Dropdown surat usulan di `bapp.html` menampilkan semua surat tanpa memfilter yang sudah punya Berita Acara. `baNomorSet` mencegah nomor BA duplikat, tapi tidak mencegah satu surat usulan direferensikan oleh lebih dari satu BA.

**Dampak:** Pengguna bisa membuat dua BA yang mereferensikan surat usulan yang sama tanpa peringatan.

**Saran perbaikan:** Di `fetchSuratUsulanList()`, cross-reference dengan daftar BA (`getBASuratList`) dan filter keluar surat usulan yang nomornya sudah ada di kolom `noSuratUsulan` BA.

### 8. Tidak ada validasi client-side untuk field wajib isi
**File:** Semua halaman (usulan.html, bapp.html, laporan-ac.html)

Field yang ditandai `*` (wajib) tidak memiliki atribut `required` HTML atau validasi JS sebelum submit. Tombol submit langsung memanggil `fetch()` tanpa mengecek apakah field kritis sudah terisi.

**Dampak:** Data tidak lengkap tersimpan di sheet, menyulitkan admin dan berpotensi error saat regenerasi PDF.

**Saran perbaikan:** Tambahkan validasi di fungsi submit (sebelum `fetch`), atau tambahkan atribut `required` di input HTML kritis dan panggil `form.checkValidity()`.

### 9. Placeholder `__GAS_URL__` tidak terdeteksi saat halaman berjalan tanpa build
**File:** Semua halaman · `const GAS_URL = '__GAS_URL__'`

Jika `build.js` gagal atau belum dijalankan (misalnya saat development lokal), semua request akan dikirim ke URL literal `__GAS_URL__` yang tidak valid. Tidak ada error yang ditampilkan ke pengguna — request hanya gagal secara senyap.

**Dampak:** Developer atau pengguna yang membuka file HTML langsung (tanpa build) mendapat halaman yang tampak bekerja tapi semua request gagal tanpa keterangan.

**Saran perbaikan:** Tambahkan pengecekan runtime di awal `init()`:
```js
if (!GAS_URL || GAS_URL.startsWith('__')) {
  alert('Konfigurasi URL belum terpasang. Jalankan build terlebih dahulu.');
  return;
}
```

---

## LOW

### ~~10. Template email notifikasi tidak menyertakan field AC dan Jenis Surat~~ ✅ DIPERBAIKI
**File:** `Code_UseFonnte.gs` · Fungsi `kirimEmailNotifikasi()`

Email sekarang menyertakan baris "Jenis Surat" (dengan label emoji) dan "Ruangan Sesudah Pindah" (hanya untuk pemindahan). Email diaktifkan ke `sarpras@poltekkespalembang.ac.id`.

### 11. Komentar `setupSheetHeaders()` menyebut 26 kolom untuk Usulan-PP, padahal 28
**File:** `Code_UseFonnte.gs` · Baris 888

```js
// ── Sheet 1: Usulan-PP (A–Z = 26 kolom) ──────────────────
```

Kenyataannya header Usulan-PP memiliki 28 entri (A–AB): termasuk kolom AA (Jenis Surat) dan AB (Ruangan Sesudah). Komentar tidak diperbarui setelah kolom baru ditambahkan.

**Saran perbaikan:** Ganti komentar menjadi `(A–AB = 28 kolom)`.

### 12. Komentar `getSuratList()` tidak menyebut kolom AA dan AB
**File:** `Code_UseFonnte.gs` · Baris 173–179

Komentar header `getSuratList()` hanya menyebut kolom A–Z (26 kolom), tapi fungsinya membaca 28 kolom (`getRange(..., 28)`) dan mengakses `r[26]` (AA = Jenis Surat) dan `r[27]` (AB = Ruangan Sesudah).

**Saran perbaikan:** Perbarui komentar dengan menambahkan `AA=JenisSurat, AB=RuanganSesudah`.

### 13. Error muat foto di admin (regenerasi PDF) tidak ditampilkan ke pengguna
**File:** `admin.html` · Bagian step 2 regenerasi PDF

Jika request `getPhoto` gagal (misalnya file Drive dihapus), kode hanya membiarkan `img.src = ''` (gambar kosong). Tidak ada pesan error atau indikator visual yang memberi tahu admin bahwa foto tidak berhasil dimuat.

**Dampak:** Admin tidak tahu apakah foto berhasil diload atau tidak sebelum print PDF.

**Saran perbaikan:** Tampilkan ikon atau teks "Foto tidak tersedia" di preview jika fetch foto gagal.

---

## CATATAN ARSITEKTUR

- **`noUrut` (No kolom A):** Dihitung dari `sheet.getLastRow()` sebelum `appendRow`. Ini aman untuk penggunaan single-user, tapi bisa menghasilkan nilai duplikat jika dua submit terjadi bersamaan (race condition). Tidak kritis untuk skala instansi kecil.
- **TTD base64 embedded di HTML:** `TTD_DATA` di `laporan-ac.html` berisi tanda tangan dalam format base64 langsung di source code. Ukuran file bisa membesar seiring jumlah teknisi bertambah. Pertimbangkan menyimpan TTD di Google Drive dan mengambilnya via `getPhoto`.
- **Tidak ada autentikasi di GAS endpoint:** Semua endpoint GET tidak memerlukan token atau password. Siapapun yang mengetahui URL GAS bisa membaca semua data arsip. Endpoint POST juga tidak diproteksi. Ini disadari dan bisa jadi by-design untuk kemudahan akses internal.
