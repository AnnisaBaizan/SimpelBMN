# Rencana Modularisasi — SimpleBMN

Daftar fungsi, CSS, dan HTML yang diulang di beberapa file dan bisa dipindah ke satu tempat bersama.
Dokumen ini adalah **referensi perencanaan** — belum ada kode yang diubah.

---

## Gambaran Umum

| File | Baris saat ini | Estimasi baris yang bisa dipindah |
|---|---|---|
| usulan.html | ~2.220 | ~500 |
| bapp.html | ~1.749 | ~450 |
| laporan-ac.html | ~2.073 | ~450 |
| admin.html | ~1.463 | ~120 |
| Code_UseFonnte.gs | ~1.345 | ~25 (uploadFoto) |

> **Update 2026-04-22 (batch 2):** Radio button "Berdasarkan Surat Usulan PP?" sekarang sudah konsisten menggunakan `.radio-group` di bapp.html dan laporan-ac.html → **siap dijadikan component**. Jenis Surat di usulan.html sekarang `<select>` dropdown (bukan radio). `JENIS_LAP_CONFIG` (laporan-ac) dan `JENIS_LAP_CONFIG_AC` (admin) sudah terpisah — kandidat untuk endpoint GAS `getJenisConfig` di fase modularisasi lanjutan.
>
> **Update 2026-04-23 (batch 3):** Pola `ttdIsKey`/`ttdKeyVal` (simpan nama kunci vs base64) kini **konsisten di semua 3 halaman form** (usulan, bapp, laporan-ac) — siap dijadikan bagian dari `partials/ttd-section.html`. Fungsi `loadTTDIntoEl` di `admin.html` kini menjadi satu-satunya entry point load TTD di admin, menggantikan raw `getPhoto` fetch — kandidat untuk `shared.js`.

Pendekatan yang disarankan: tambahkan dua file baru —
- `shared.css` — CSS bersama (dilink dari semua halaman)
- `shared.js` — fungsi JS bersama (dilink dari semua halaman, diproses oleh `build.js`)

---

## 1. Fungsi JavaScript yang Bisa Dipisah → `shared.js`

### 1a. `sleep(ms)` — **identik di 4 file**

| File | Baris |
|---|---|
| usulan.html | 1835 |
| bapp.html | 1726 |
| laporan-ac.html | 1864 |
| admin.html | 859 |

```js
// Implementasi saat ini (sama persis di semua file):
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

Tidak ada perbedaan sama sekali. Bisa langsung dipindah.

---

### 1b. `buildDropdown(cfg)` — **hampir identik di 3 file**

| File | Baris | Perbedaan |
|---|---|---|
| usulan.html | 1677–1714 | variabel `freshSearch` |
| bapp.html | 1036–1064 | sama, format lebih ringkas |
| laporan-ac.html | 1310–1345 | variabel `inp`, ada komentar tambahan |

Logika inti (render item, highlight saat fokus, tutup saat klik luar) **identik**. Perbedaan hanya gaya penulisan.
Bisa disatukan menjadi satu fungsi dengan parameter `cfg`:

```js
// Signature yang disarankan:
function buildDropdown({
  searchId,   // id input pencarian
  listId,     // id container dropdown
  items,      // array { label, value, meta? }
  onSelect,   // callback(item)
  emptyText,  // teks jika tidak ada hasil (opsional)
})
```

---

### 1c. `toggleManualMode(e)` — **identik di 3 file**

| File | Baris | Perbedaan |
|---|---|---|
| usulan.html | 1433–1436 | `e.preventDefault()` selalu dipanggil |
| bapp.html | 1066–1069 | `if (e) e.preventDefault()` (opsional) |
| laporan-ac.html | 1173–1176 | `e.preventDefault()` |

Fungsi ini hanya memanggil `activateManualMode()` atau `switchBackToDropdown()` berdasarkan flag `isManualMode`. Bisa jadi satu fungsi generik dengan parameter callback:

```js
function toggleManualMode(e, { isManualMode, activate, switchBack }) {
  if (e) e.preventDefault();
  isManualMode ? switchBack() : activate();
}
```

---

### 1d. `activateManualMode()` — **hampir identik di 3 file**

| File | Baris | Perbedaan |
|---|---|---|
| usulan.html | 1438–1447 | panggil `updatePreview()` di akhir |
| bapp.html | 1071–1077 | tidak ada panggil preview |
| laporan-ac.html | 1199–1207 | panggil `syncPreview()` di akhir |

Pola umum: set `isManualMode = true`, sembunyikan `wrapDropdown`, tampilkan `wrapManual`, ubah teks tombol. Bisa dibuat generik:

```js
function activateManualMode({
  wrapDropdownId,
  wrapManualId,
  toggleBtnId,
  onActivated, // callback opsional (updatePreview / syncPreview)
})
```

---

### 1e. `switchBackToDropdown()` — **pola sama di 3 file, field ID beda**

| File | Baris | Perbedaan |
|---|---|---|
| usulan.html | 1449–1468 | field: nup, namaBarang, merek, tipe |
| bapp.html | 1079–1091 | field: nup, namaBarang, merek, tipe (ID beda) |
| laporan-ac.html | 1178–1197 | field: nupAC, namaBarangAC, merekAC, tipeAC |

Pola umum: set `isManualMode = false`, kosongkan manual inputs, kosongkan hidden inputs, tampilkan `wrapDropdown`, sembunyikan `wrapManual`, rebuild NUP dropdown.

```js
function switchBackToDropdown({
  wrapDropdownId,
  wrapManualId,
  toggleBtnId,
  manualFieldIds,   // array id input manual yang dikosongkan
  hiddenFieldIds,   // array id hidden input yang direset
  onSwitched,       // callback (buildNupDropdown, syncPreview, dll)
})
```

---

### 1f. `buildNupDropdown()` — **logika sama, data source beda**

| File | Baris | Perbedaan |
|---|---|---|
| usulan.html | 1554–1584 | pakai `getActiveAset()` (filter per jenisSurat) |
| bapp.html | 958–977 | pakai `asetData` langsung |
| laporan-ac.html | 1211–1239 | pakai `asetData` langsung |

Bisa disatukan dengan parameter `getItems`:

```js
function buildNupDropdown({ getItems, searchId, listId, onSelect })
// Tiap file tinggal pass: getItems: () => getActiveAset()  atau  () => asetData
```

---

### 1g. `buildNamaDropdown()` — **logika sama di 3 file**

| File | Baris |
|---|---|
| usulan.html | 1586–1603 |
| bapp.html | 979–991 |
| laporan-ac.html | 1235–1253 |

Filter unique nama dari asetData berdasarkan NUP terpilih. Bisa disatukan persis seperti `buildNupDropdown`.

---

### 1h. `buildMerkDropdown()` dan `buildTipeDropdown()` — **logika sama di 3 file**

| File | buildMerk baris | buildTipe baris |
|---|---|---|
| usulan.html | 1605–1640 | 1648–1674 |
| bapp.html | 993–1017 | 1019–1034 |
| laporan-ac.html | 1253–1283 | 1283–1307 |

Pola cascade dropdown ini (NUP → Nama → Merk → Tipe) identik secara logika. Seluruh cascade bisa dijadikan satu modul `CascadeDropdown`:

```js
// Inisialisasi sekali:
const cascade = new CascadeDropdown({
  getData: () => asetData,         // atau getActiveAset()
  fields: {
    nup:   { searchId: 'searchNup',   listId: 'listNup',   hiddenId: 'nup' },
    nama:  { searchId: 'searchNama',  listId: 'listNama',  hiddenId: 'namaBarang' },
    merk:  { searchId: 'searchMerk',  listId: 'listMerk',  hiddenId: 'merek' },
    tipe:  { searchId: 'searchTipe',  listId: 'listTipe',  hiddenId: 'tipe' },
  },
  onComplete: syncPreview,
});
```

---

### 1i. Fungsi foto: `compressAndPreview(file, thumbId, hiddenId)` — **pola sama di 3 file**

Di semua halaman, setiap file foto punya `onchange` handler yang: baca file → resize/compress → tampilkan thumbnail → simpan ke hidden input. Logika ini ditulis berulang untuk setiap slot foto (ada 5–6 slot per halaman).

Saat ini tidak ada nama fungsi bersama — tiap handler inline. Bisa dibuat:

```js
function attachPhotoHandler(fileInputId, thumbId, hiddenId, { maxW = 1200, quality = 0.75 } = {})
```

---

### 1j. `formatTanggal(dateStr)` — **saat ini hanya di admin.html, tapi perlu di semua halaman**

| File | Baris |
|---|---|
| admin.html | 1006–1012 |

Konversi tanggal ke format Indonesia (mis. "22 April 2026"). Di halaman lain, konversi dilakukan inline atau tidak konsisten. Bisa disatukan di `shared.js`.

---

### 1k. `showModal() / hideModal() / setStep()` — **identik di bapp.html dan laporan-ac.html**

| File | Baris |
|---|---|
| bapp.html | ~1720–1724 |
| laporan-ac.html | ~1858–1862 |

```js
// Identik:
function showModal() { document.getElementById('loadingModal').classList.add('show'); }
function hideModal() { document.getElementById('loadingModal').classList.remove('show'); }
function setStep(id, status, icon) { ... }
```

Bisa dipindah ke `shared.js` apa adanya.

---

## 2. CSS yang Bisa Dipisah → `shared.css`

### 2a. Reset & base body

```css
/* Muncul di: usulan.html, bapp.html, laporan-ac.html, admin.html */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 13px; background: #f0f2f5; color: #222; }
```

---

### 2b. `.app-header` dan turunannya — **identik di 5 file**

| File | Baris |
|---|---|
| usulan.html | 24–42 |
| bapp.html | 13–26 |
| laporan-ac.html | 13–25 |
| admin.html | 11–18 |
| index.html | ada |

Termasuk: `.app-header`, `.app-header h1`, `.app-header small`, `.app-header .hdr-right`, `.btn-nav`, `.btn-nav:hover`.

---

### 2c. `.main-layout` — **identik di 3 file**

```css
/* usulan.html:44, bapp.html:28, laporan-ac.html:28 */
.main-layout {
  display: grid;
  grid-template-columns: 430px 1fr;
  gap: 0;
  height: calc(100vh - 50px);
  overflow: hidden;
}
```

---

### 2d. `.form-panel` dan turunannya — **hampir identik di 3 file**

Termasuk: `.form-panel`, `.form-panel h2`, `.form-section`, `.form-section h3`, `.form-row`, `label`, `label span.req`, `input[type=text]`, `input[type=date]`, `select`, `textarea`, `input:focus`, `input[readonly]`.

---

### 2e. `.photo-grid` dan `.photo-thumb` — **identik di 3 file**

```css
/* usulan.html:151, bapp.html:67, laporan-ac.html:99 */
.photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.photo-thumb { width: 100%; max-height: 80px; object-fit: cover; ... }
```

**Catatan:** bapp.html mendefinisikan `.photo-thumb` dua kali (baris 75–79 dan baris 80) — duplikat dalam satu file.

---

### 2f. `.searchable-wrap`, `.search-input`, `.dropdown-list`, `.dropdown-item` — **hampir identik di 3 file**

| File | Baris dropdown-list |
|---|---|
| usulan.html | 527–555 |
| bapp.html | 139–155 |
| laporan-ac.html | 68–86 |

Sedikit perbedaan di `z-index` (100 vs 200) dan warna border. Bisa dinormalisasi ke satu nilai.

---

### 2g. `.radio-group` — **identik di 2 file**

```css
/* usulan.html:131, bapp.html:62 */
.radio-group { display: flex; gap: 18px; flex-wrap: wrap; }
.radio-group label { display: flex; align-items: center; gap: 5px; ... }
```

---

### 2h. Modal loading overlay — **identik di bapp.html dan laporan-ac.html**

Termasuk: `.modal-overlay`, `.modal-box`, `.modal-spinner`, `@keyframes spin`, `.modal-title`, `.modal-steps-list`, `.modal-step-item`.

---

### 2i. Print media query — **identik di bapp.html dan laporan-ac.html**

```css
@media print {
  .form-panel, .app-header { display: none !important; }
  .preview-panel { height: auto; overflow: visible; }
}
```

---

## 3. HTML yang Bisa Dijadikan Template/Komponen

### 3a. App header navbar

Muncul di semua halaman dengan struktur identik. Satu-satunya perbedaan: judul halaman dan link navigasi aktif.

```html
<!-- Pola yang berulang: -->
<header class="app-header">
  <div>
    <h1>Judul Halaman</h1>
    <small>Sub-judul</small>
  </div>
  <div class="hdr-right">
    <a href="index.html" class="btn-nav">🏠 Beranda</a>
    ...
  </div>
</header>
```

Dengan `build.js` yang sudah ada, bisa dibuat sebagai HTML fragment yang di-include saat build.

---

### 3b. Searchable dropdown widget

```html
<!-- Pola yang berulang di setiap cascade dropdown: -->
<div id="rowXxx" class="form-row">
  <label>Label <span class="req">*</span></label>
  <div class="searchable-wrap">
    <input type="text" class="search-input" id="searchXxx" placeholder="Cari...">
    <div class="dropdown-list" id="listXxx"></div>
  </div>
  <input type="hidden" id="xxx">
</div>
```

---

### 3c. Photo upload item

```html
<!-- Pola yang berulang untuk setiap slot foto: -->
<div class="photo-item">
  <label>Nama Foto</label>
  <input type="file" id="fileXxx" accept="image/*" onchange="handlePhoto(this, 'thumbXxx', 'hiddenXxx')">
  <img class="photo-thumb" id="thumbXxx">
  <input type="hidden" id="hiddenXxx">
</div>
```

---

### 3d. Modal loading overlay

```html
<!-- Identik di bapp.html dan laporan-ac.html -->
<div class="modal-overlay" id="loadingModal">
  <div class="modal-box">
    <div class="modal-spinner"></div>
    <div class="modal-title">Menyimpan data...</div>
    <ul class="modal-steps-list">
      <li class="modal-step-item" id="ms1">...</li>
      <li class="modal-step-item" id="ms2">...</li>
      <li class="modal-step-item" id="ms3">...</li>
    </ul>
  </div>
</div>
```

---

## 4. Template UI — Layout / Include / Yield / Stack (Pola MVC)

Selain JS dan CSS, struktur HTML itu sendiri berulang di semua halaman. Pola yang umum di MVC (Blade, Jinja2, ERB, dll.) bisa diterapkan di sini melalui `build.js` yang sudah ada — tanpa framework baru, cukup tambahkan dukungan directive sederhana saat build.

---

### Konsep yang Berlaku

| Pola MVC | Padanan di SimpleBMN | Keterangan |
|---|---|---|
| `@extends('layout')` | Setiap halaman extends `layouts/base.html` | Halaman hanya isi slot, base yang urus `<head>`, header, body wrapper |
| `@yield('slot')` | Placeholder di base layout | Diisi oleh halaman child |
| `@section('slot')` | Blok konten di halaman child | Disisipkan ke dalam `@yield` yang sesuai |
| `@include('partial')` | Sisipkan fragment HTML | Bisa terima variabel (misal: judul, ID elemen) |
| `@push('stack')` | Tambah CSS/JS dari child ke slot di base | Untuk CSS atau script spesifik per halaman |
| `@stack('stack')` | Tempat di base yang menampung push | Di akhir `<head>` atau sebelum `</body>` |

---

### 4a. Base Layout — `layouts/base.html`

Satu file induk yang dipakai semua halaman. Berisi bagian yang 100% sama:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- @yield('title') --> — BMN Poltekkes</title>
  <!-- shared.css di-inline saat build -->
  <!-- @stack('head-styles') -->  ← CSS tambahan per halaman di-push ke sini
</head>
<body>
  <!-- @include('partials/header.html') -->  ← atau @yield('header') jika tiap halaman beda judul

  <!-- @yield('content') -->                ← konten utama setiap halaman

  <!-- shared.js di-inline saat build -->
  <!-- @stack('scripts') -->                ← JS tambahan per halaman di-push ke sini
</body>
</html>
```

**Halaman yang menggunakan base ini:** semua (index, usulan, bapp, laporan-ac, admin).

---

### 4b. Partials yang Bisa Dibuat → folder `partials/`

Berikut fragment HTML yang berulang dan layak jadi partial tersendiri:

#### `partials/header.html` — **muncul di 5 file, hampir identik**

| File | Baris header |
|---|---|
| index.html | 10–30 |
| usulan.html | 12–42 |
| bapp.html | 11–27 |
| laporan-ac.html | 11–27 |
| admin.html | 11–19 |

Perbedaan antar file hanya: judul `<h1>`, sub-judul `<small>`, dan link nav yang aktif.
Bisa jadi partial dengan variabel:

```html
<!-- @include('partials/header.html', { title: 'Surat Usulan BMN', subtitle: 'Form pengajuan', activeNav: 'usulan' }) -->
```

```html
<!-- partials/header.html -->
<header class="app-header">
  <div>
    <h1>{{ title }}</h1>
    <small>{{ subtitle }}</small>
  </div>
  <div class="hdr-right">
    <a href="index.html" class="btn-nav {{ activeNav == 'home' ? 'active' : '' }}">🏠 Beranda</a>
    <a href="usulan.html" class="btn-nav {{ activeNav == 'usulan' ? 'active' : '' }}">📋 Surat Usulan</a>
    <a href="bapp.html" class="btn-nav {{ activeNav == 'bapp' ? 'active' : '' }}">📝 Berita Acara</a>
    <a href="laporan-ac.html" class="btn-nav {{ activeNav == 'laporan' ? 'active' : '' }}">❄️ Laporan AC</a>
    <a href="admin.html" class="btn-nav {{ activeNav == 'admin' ? 'active' : '' }}">⚙️ Admin</a>
  </div>
</header>
```

---

#### `partials/searchable-dropdown.html` — **muncul di 3 file, 4 instance per file**

Setiap baris cascade dropdown (NUP, Nama, Merk, Tipe) punya struktur identik:

```html
<!-- @include('partials/searchable-dropdown.html', {
  rowId: 'rowNup', label: 'NUP BMN', required: true,
  searchId: 'searchNup', listId: 'listNup', hiddenId: 'nup',
  placeholder: 'Cari NUP...'
}) -->
```

```html
<!-- partials/searchable-dropdown.html -->
<div id="{{ rowId }}" class="form-row">
  <label>{{ label }}{% if required %}<span class="req"> *</span>{% endif %}</label>
  <div class="searchable-wrap">
    <input type="text" class="search-input" id="{{ searchId }}" placeholder="{{ placeholder }}">
    <div class="dropdown-list" id="{{ listId }}"></div>
  </div>
  <input type="hidden" id="{{ hiddenId }}">
</div>
```

Di 3 halaman ada 4 baris dropdown cascade × masing-masing → **12 instance** bisa diganti 12 baris `@include`.

---

#### `partials/photo-item.html` — **muncul di 3 file, 5–6 instance per file**

```html
<!-- @include('partials/photo-item.html', {
  label: 'Foto NUP', fileId: 'fileNup',
  thumbId: 'thumbNup', hiddenId: 'fotoNup'
}) -->
```

```html
<!-- partials/photo-item.html -->
<div class="photo-item">
  <label>{{ label }}</label>
  <input type="file" id="{{ fileId }}" accept="image/*"
         onchange="attachPhotoHandler(this, '{{ thumbId }}', '{{ hiddenId }}')">
  <img class="photo-thumb" id="{{ thumbId }}">
  <input type="hidden" id="{{ hiddenId }}">
</div>
```

Di 3 halaman ada 5–6 foto slot × masing-masing → **~16 instance** bisa diganti include.

---

#### `partials/loading-modal.html` — **identik di bapp.html dan laporan-ac.html**

```html
<!-- @include('partials/loading-modal.html', {
  step1: 'Memproses data surat',
  step2: 'Mengunggah foto & TTD',
  step3: 'Menyimpan ke arsip'
}) -->
```

```html
<!-- partials/loading-modal.html -->
<div class="modal-overlay" id="loadingModal">
  <div class="modal-box">
    <div class="modal-spinner"></div>
    <div class="modal-title">Menyimpan data…</div>
    <ul class="modal-steps-list">
      <li class="modal-step-item" id="ms1"><span class="si">⏳</span> {{ step1 }}</li>
      <li class="modal-step-item" id="ms2"><span class="si">⏳</span> {{ step2 }}</li>
      <li class="modal-step-item" id="ms3"><span class="si">⏳</span> {{ step3 }}</li>
    </ul>
  </div>
</div>
```

---

#### `partials/kondisi-radio.html` — **muncul di usulan.html dan bapp.html**

```html
<!-- @include('partials/kondisi-radio.html', { name: 'kondisi' }) -->
```

```html
<!-- partials/kondisi-radio.html -->
<div class="radio-group">
  <label><input type="radio" name="{{ name }}" value="Rusak Ringan"> Rusak Ringan</label>
  <label><input type="radio" name="{{ name }}" value="Rusak Berat"> Rusak Berat</label>
</div>
```

---

#### `partials/ttd-section.html` — **pola TTD canvas+list, muncul di bapp.html dan laporan-ac.html**

Setiap section TTD (Pelaksana, Pengawas, Pengguna) punya struktur serupa: mode toggle (dari daftar / gambar manual), preview canvas, tombol clear. Bisa jadi partial dengan variabel nama role dan ID elemen.

---

### 4c. Slot `@yield` yang Perlu Ada di Base Layout

| Slot | Diisi oleh | Isi |
|---|---|---|
| `title` | Setiap halaman | Judul tab browser |
| `head-styles` | via `@push` | CSS tambahan spesifik halaman |
| `header` | base atau override | Navbar (umumnya dari partial header) |
| `content` | Setiap halaman | Seluruh konten utama (form + preview) |
| `scripts` | via `@push` | JS spesifik per halaman |

---

### 4d. Opsi Implementasi di `build.js`

Karena proyek sudah pakai `build.js` sebagai build step custom, ada dua jalur:

**Opsi A — Directive custom di `build.js`** *(tanpa dependensi baru)*

`build.js` sudah mem-parse HTML untuk replace placeholder. Cukup tambahkan regex untuk:
```
<!-- @include('partials/header.html', {...}) -->
<!-- @yield('content') -->
<!-- @extends('layouts/base.html') -->
```

Proses: baca file child → ekstrak tiap `@section` → sisipkan ke slot `@yield` di base layout → tulis ke `dist/`.

**Opsi B — Nunjucks** *(+1 dependensi, template engine matang)*

```bash
npm install nunjucks
```

Nunjucks mendukung `extends`, `block`, `include`, `macro` (setara partial berparameter) out of the box. `build.js` cukup memanggil `nunjucks.render()` lalu lanjut inject env placeholder seperti sekarang.

```njk
{# usulan.html #}
{% extends "layouts/base.html" %}

{% block title %}Surat Usulan BMN{% endblock %}

{% block content %}
  <div class="main-layout">
    ...
  </div>
{% endblock %}

{% block scripts %}
  <script>/* JS spesifik usulan */</script>
{% endblock %}
```

**Opsi B lebih disarankan** karena: sintaks standar, sudah handle edge case (loop di partial, escape variabel, whitespace), dan tidak perlu maintain regex parser sendiri.

---

### 4e. Struktur Folder Setelah Template System Diterapkan

```
SimpleBMN/
├── layouts/
│   └── base.html               ← Master layout (head, header, body wrapper, footer)
│
├── partials/
│   ├── header.html             ← Navbar + judul halaman
│   ├── searchable-dropdown.html← Satu baris dropdown cascade (NUP/Nama/Merk/Tipe)
│   ├── photo-item.html         ← Satu slot foto (file input + thumb + hidden)
│   ├── loading-modal.html      ← Modal overlay submit
│   ├── kondisi-radio.html      ← Radio Rusak Ringan / Rusak Berat
│   └── ttd-section.html        ← Section TTD (canvas + daftar)
│
├── pages/                      ← Source halaman (template child)
│   ├── index.html
│   ├── usulan.html
│   ├── bapp.html
│   ├── laporan-ac.html
│   └── admin.html
│
├── shared.css                  ← CSS bersama
├── shared.js                   ← Fungsi JS bersama
├── build.js                    ← Diperluas: template render + inject env + embed TTD
└── dist/                       ← Output final (deploy ke Vercel)
    ├── index.html
    ├── usulan.html
    └── ...
```

---

## 5. Google Apps Script — Duplikat di `Code_UseFonnte.gs`

### 4a. `uploadFoto()` — **duplikat di 3 file .gs**

| File | Baris |
|---|---|
| Code_UseFonnte.gs | 334–356 |
| Code_MetaWA.gs | 172–194 |
| Code_callMeBot.gs | ~169+ |

Implementasi identik persis. GAS tidak mendukung `import/require`, tapi solusi: buat satu file `Code_Shared.gs` yang menjadi satu project library, atau cukup pastikan hanya `Code_UseFonnte.gs` yang di-deploy dan file lain dihapus/diarsipkan jika tidak dipakai.

---

## 6. Urutan Prioritas Pengerjaan

Disusun dari yang paling aman (tidak ada logic, tidak mungkin breaking) ke yang paling invasif:

| Prioritas | Fase | Item | Alasan |
|---|---|---|---|
| 🔴 1 | CSS | `shared.css` — `.app-header`, `.form-panel`, `.main-layout` | CSS murni, identik 100%, zero risk |
| 🔴 2 | CSS | `shared.css` — dropdown, photo-grid, modal, print | CSS murni, zero risk |
| 🟡 3 | JS | `shared.js` — `sleep`, `formatTanggal`, `showModal/hideModal/setStep` | Identik persis, tinggal cut-paste |
| 🟡 4 | JS | `shared.js` — `buildDropdown()` generik | Butuh refactor parameter kecil |
| 🟡 5 | JS | `shared.js` — `attachPhotoHandler()` | Menghilangkan banyak handler inline |
| 🟡 6 | JS | `CascadeDropdown` class/module | Refactor lebih besar, test per halaman |
| 🟢 7 | Template | Setup Nunjucks di `build.js` | +1 dependensi, tapi tidak ubah output |
| 🟢 8 | Template | `partials/header.html` | Partial paling simpel, tidak ada state |
| 🟢 9 | Template | `partials/loading-modal.html` | Identik di 2 file, mudah |
| 🟢 10 | Template | `partials/kondisi-radio.html` | Kecil, mudah |
| 🟢 11 | Template | `partials/photo-item.html` | Butuh refactor handler foto dulu (fase 5) |
| 🟢 12 | Template | `partials/searchable-dropdown.html` | Butuh `CascadeDropdown` dulu (fase 6) |
| 🟢 13 | Template | `layouts/base.html` + `@extends` semua halaman | Terbesar, lakukan terakhir |
| ⬛ 14 | GAS | `Code_Shared.gs` untuk `uploadFoto` | Hanya jika 3 file .gs tetap aktif semua |

---

## 7. Struktur File Target (Setelah Semua Fase Selesai)

```
SimpleBMN/
│
├── layouts/
│   └── base.html               ← Master layout
│
├── partials/
│   ├── header.html             ← Navbar
│   ├── searchable-dropdown.html
│   ├── photo-item.html
│   ├── loading-modal.html
│   ├── kondisi-radio.html
│   └── ttd-section.html
│
├── pages/                      ← Source halaman (child template)
│   ├── index.html
│   ├── usulan.html
│   ├── bapp.html
│   ├── laporan-ac.html
│   └── admin.html
│
├── shared.css                  ← CSS bersama
├── shared.js                   ← Fungsi JS bersama
│
├── build.js                    ← Render template + inject env + embed TTD → dist/
├── vercel.json
├── KOP.png
├── TTDSapras/
├── TTDPelaksana/
├── TTDAtasanLangsung/
├── Code_UseFonnte.gs
│
├── README.md
├── KNOWN_ISSUES.md
└── MODULAR_PLAN.md
```

`build.js` menjadi satu-satunya entry point build: jalankan Nunjucks render → inject env placeholder → inline TTD base64 → tulis ke `dist/`. Output `dist/` tetap file HTML statis standar, kompatibel penuh dengan Vercel.
