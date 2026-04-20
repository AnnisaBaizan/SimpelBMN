// create-template.js
// Buat ulang Template_Spreadsheet_BMN.xlsx dengan 3 sheet lengkap
// Jalankan: node create-template.js
//
// Instalasi dependensi (sekali saja):
//   npm install xlsx

const XLSX = require('xlsx');
const path = require('path');

// ============================================================
//  DEFINISI HEADER PER SHEET
// ============================================================

const HEADERS = {

  // ── Sheet 1: Usulan-PP (A–Z, 26 kolom) ──
  'Usulan-PP': [
    'No',
    'Nomor Surat',
    'Tanggal Submit',
    'Tanggal Surat',
    'Nama Pengusul',
    'NIP',
    'Jabatan',
    'Unit/Bagian',
    'Nama Barang',
    'Merek',
    'Tipe',
    'Ruangan (DBR)',
    'NUP BMN',
    'Kondisi',
    'Keluhan',
    'Link Foto NUP',
    'Link Foto Merek',
    'Link Foto Kerusakan',
    'Link Foto Keseluruhan',
    'Link Foto Lain-lain',
    'TTD Penerima (Link Drive)',
    'TTD Pengirim (Link Drive)',
    'Nama Penerima',
    'NIP Penerima',
    'Status',
    'Keterangan',
  ],

  // ── Sheet 2: BA-PP (A–AB, 28 kolom) ──
  'BA-PP': [
    'No',
    'Nomor BA',
    'Tanggal Submit',
    'Tanggal BA',
    'No Surat Usulan',
    'Nama Barang',
    'Tipe',
    'Merek',
    'Ruangan',
    'NUP',
    'Lain-lain / No.Inv',
    'Kondisi',
    'Rincian Pemeliharaan/Perbaikan/Penggantian',
    'Nama Pelaksana',
    'Jabatan Pelaksana',
    'Nama Pengawas',
    'Jabatan Pengawas',
    'Nama Pengguna BMN',
    'Jabatan Pengguna BMN',
    'TTD Pelaksana (Link Drive)',
    'TTD Pengawas (Link Drive)',
    'TTD Pengguna BMN (Link Drive)',
    'Foto 1 - NUP (Link Drive)',
    'Foto 2 - Merek/Tipe (Link Drive)',
    'Foto 3 - Spare Part (Link Drive)',
    'Foto 4 - Setelah 1 (Link Drive)',
    'Foto 5 - Setelah 2 (Link Drive)',
    'Foto 6 - Lain-lain (Link Drive)',
  ],

  // ── Sheet 3: L-PP-AC (A–AF, 32 kolom) ──
  'L-PP-AC': [
    'No',
    'Nomor Laporan',
    'Tanggal Submit',
    'Tanggal Laporan',
    'No Surat Usulan',
    'Nama Barang',
    'Tipe',
    'Merek',
    'Ruangan (DBR)',
    'NUP',
    'Kapasitas AC',
    'Cuci',
    'Isi Freon',
    'Ganti Kapasitor',
    'Ganti Modul',
    'Lain-lain (Keterangan)',
    'Deskripsi',
    'Nama Pelaksana (Badan Surat)',
    'Jabatan Pelaksana (Badan Surat)',
    'Nama Pelaksana (TTD)',
    'Jabatan Pelaksana (TTD)',
    'Nama Pengguna',
    'Jabatan Pengguna',
    'Nama Pengawas',
    'TTD Pelaksana (Link Drive)',
    'TTD Pengguna (Link Drive)',
    'TTD Pengawas (Link Drive)',
    'Foto 1 - NUP (Link Drive)',
    'Foto 2 - Merek/Tipe (Link Drive)',
    'Foto 3 - Sebelum/Spare Part (Link Drive)',
    'Foto 4 - Pekerjaan 1 (Link Drive)',
    'Foto 5 - Pekerjaan 2 (Link Drive)',
  ],
};

// ============================================================
//  STYLE HELPER
// ============================================================

const HEADER_STYLE = {
  font  : { bold: true, color: { rgb: 'FFFFFF' } },
  fill  : { fgColor: { rgb: '1A3A5C' } },
  border: {
    top   : { style: 'thin', color: { rgb: '999999' } },
    bottom: { style: 'thin', color: { rgb: '999999' } },
    left  : { style: 'thin', color: { rgb: '999999' } },
    right : { style: 'thin', color: { rgb: '999999' } },
  },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};

// Kolom yang isinya tanggal (0-based index dalam header array)
const DATE_COLS = {
  'Usulan-PP': [2, 3],          // C, D
  'BA-PP'    : [2, 3],          // C, D
  'L-PP-AC'  : [2, 3],          // C, D
};

// ============================================================
//  BUILD WORKBOOK
// ============================================================

const wb = XLSX.utils.book_new();

Object.entries(HEADERS).forEach(([sheetName, headers]) => {
  // Buat worksheet dengan baris header saja
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Lebar kolom otomatis berdasarkan panjang teks header
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 12) }));

  // Tinggi baris header
  ws['!rows'] = [{ hpt: 30 }];

  // Apply style ke header (biru gelap, putih)
  headers.forEach((_, colIdx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    if (!ws[cellAddr]) return;
    ws[cellAddr].s = HEADER_STYLE;
  });

  // Format kolom tanggal (kolom C dan D) — format number cell date
  const dateCols = DATE_COLS[sheetName] || [];
  dateCols.forEach(colIdx => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        ...HEADER_STYLE,
        numFmt: 'DD/MM/YYYY',
      };
    }
  });

  // Freeze row pertama (header tetap)
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };

  // Auto-filter pada header
  ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1` };

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  console.log(`✅ Sheet "${sheetName}" — ${headers.length} kolom`);
});

// ============================================================
//  SIMPAN FILE
// ============================================================

const OUTPUT = path.join(__dirname, 'Template_Spreadsheet_BMN.xlsx');
XLSX.writeFile(wb, OUTPUT, { bookType: 'xlsx', cellStyles: true });

console.log(`\n📁 Template berhasil dibuat: Template_Spreadsheet_BMN.xlsx`);
console.log('   Import ke Google Drive lalu bagi menjadi 3 sheet:');
console.log('   • Usulan-PP  (26 kolom A–Z)');
console.log('   • BA-PP      (28 kolom A–AB)');
console.log('   • L-PP-AC    (32 kolom A–AF)');
