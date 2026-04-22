# Known Issues — SimpleBMN

Daftar masalah yang ditemukan saat pembacaan seluruh proyek pada 2026-04-22.
**Tidak ada isu yang langsung diperbaiki di sini** — ini hanya dokumentasi untuk tindak lanjut.

> **Update 2026-04-22:** Issue CRITICAL #1 sudah diperbaiki sekalian saat menambah Foto 6 pada Laporan AC. `getLaporanACList` sekarang membaca 34 kolom (A–AH), foto5 dan foto6 keduanya benar.

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

### 3. Admin regenerasi PDF tidak bisa menampilkan TTD list-based dari Laporan AC
**File:** `admin.html` · Bagian `startRegenPDF` (sekitar baris 930–970)

TTD Pelaksana dan Pengawas di `laporan-ac.html` bisa disimpan sebagai **nama kunci** (misalnya `"Heriyanto"`) jika dipilih dari daftar, atau sebagai **URL Drive** jika digambar manual. Ketika admin me-regen PDF laporan AC, kode admin memanggil `getPhoto?url=<nilai_ttd>`. Jika nilainya adalah nama kunci (bukan URL), `getPhotoBase64()` akan gagal karena format URL tidak valid.

**Dampak:** TTD Pelaksana/Pengawas tidak muncul saat regenerasi PDF untuk entri Laporan AC yang menggunakan TTD dari daftar.

**Saran perbaikan:** Di admin, sebelum memanggil `getPhoto`, deteksi apakah nilai TTD adalah URL Drive atau nama kunci. Jika nama kunci, cari base64-nya dari `TTD_DATA` yang sudah ada di `laporan-ac.html` (atau embed TTD_DATA di admin juga).

### 4. `PELAKSANA_PROFILE` dan `TTD_DATA` hardcoded hanya untuk 2 teknisi
**File:** `laporan-ac.html` · Bagian `const PELAKSANA_LIST` dan `const TTD_DATA`

Daftar teknisi dan tanda tangan bawaan hanya berisi 'Heriyanto' dan 'Iqbal'. Menambah teknisi baru berarti harus mengubah kode HTML secara langsung, lalu redeploy ke Vercel.

**Dampak:** Operasional — setiap penambahan teknisi memerlukan intervensi developer.

**Saran perbaikan:** Pindahkan data pelaksana ke sheet Google Sheets atau ke folder Drive tertentu agar bisa dikelola tanpa menyentuh kode.

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

### 10. Template email notifikasi tidak menyertakan field AC dan Jenis Surat
**File:** `Code_UseFonnte.gs` · Fungsi `kirimEmailNotifikasi()` (baris 359–448)

Email notifikasi hanya menampilkan field surat umum (nama barang, merek, tipe, kondisi, keluhan). Tidak ada field AC-specific seperti `jenisSurat`, `ruanganSesudah`, atau keterangan jenis surat (Perbaikan vs Pemindahan).

**Dampak:** Tim Sarpras yang menerima email tidak bisa membedakan jenis surat dari email saja.

**Saran perbaikan:** Tambahkan baris "Jenis Surat" di tabel email, dan tampilkan "Ruangan Sesudah" untuk `ac-pemindahan`.

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
