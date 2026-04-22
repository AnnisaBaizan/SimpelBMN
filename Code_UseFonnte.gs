// ============================================================
//  SURAT USULAN & BERITA ACARA PERBAIKAN BMN — GAS Backend
//  Deploy: Web App | Execute as: Me | Access: Anyone
// ============================================================

// ==================== CONFIG ====================
const CONFIG = {
  SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID',       // ID Google Sheets arsip
  DRIVE_FOLDER_ID: 'GANTI_DENGAN_FOLDER_ID',            // ID folder Drive untuk foto
  EMAIL_TUJUAN: 'sarpras@instansi.go.id',              // Email notifikasi tim Sarpras
  EMAIL_AKTIF: false,
  NAMA_INSTANSI: 'Politeknik Kesehatan Palembang',      // Nama instansi di email notif
  NOMOR_PREFIX: 'KN.01.03/Sarpras/PP',                  // Prefix nomor surat usulan
  SHEET_NAME: 'Usulan-PP',                              // Sheet arsip surat usulan

  // --- Berita Acara PP ---
  BA_SHEET_NAME: 'BA-PP',                               // Sheet arsip berita acara
  BA_NOMOR_PREFIX: 'KN.01.03/Sarpras/BA-PP',            // Prefix nomor berita acara
  BA_DRIVE_FOLDER_ID: 'GANTI_DENGAN_FOLDER_ID_BA',      // ID folder Drive untuk foto & TTD BA

  // --- Database Aset BMN (spreadsheet terpisah) ---
  ASET_SPREADSHEET_ID: 'GANTI_DENGAN_aset_SPREADSHEET_ID',
  ASET_SHEET_NAME: 'ASET2026',                          // Tab nama sheet aset

  // --- WhatsApp via Fonnte (https://fonnte.com) ---
  WA_TOKEN: 'GANTI_DENGAN_TOKEN_FONNTE',
  WA_TUJUAN: '628123456789',
  WA_AKTIF: false,

  // --- Laporan Pemeliharaan/Perbaikan AC ---
  L_PP_AC_SHEET_NAME: 'L-PP-AC',
  L_PP_AC_NOMOR_PREFIX: 'KN.01.03/Sarpras/L-PP-AC',
  L_PP_AC_DRIVE_FOLDER_ID: 'GANTI_DENGAN_FOLDER_ID_L_PP_AC',
};

// ================================================

// -------- doGet --------
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  let result;

  if (action === 'getNomor') {
    result = getNomorSurat();
  } else if (action === 'getNomorBA') {
    result = getNomorBA();
  } else if (action === 'getAset') {
    result = getDataAset();
  } else if (action === 'getSuratList') {
    result = getSuratList();
  } else if (action === 'getSuratUsulanList') {
    result = getSuratUsulanList();
  } else if (action === 'getBASuratList') {
    result = getBASuratList();
  } else if (action === 'getPhoto') {
    result = getPhotoBase64(e.parameter.url);
  } else if (action === 'getNomorLaporanAC') {
    result = getNomorLaporanAC();
  } else if (action === 'getLaporanACList') {
    result = getLaporanACList();
  } else {
    result = { error: 'Action tidak dikenal.' };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// -------- doPost --------
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: 'JSON tidak valid: ' + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = payload.action || '';
  let result;

  if (action === 'submit') {
    result = handleSubmit(payload);
  } else if (action === 'submitBA') {
    result = handleSubmitBA(payload);
  } else if (action === 'submitLaporanAC') {
    result = handleSubmitLaporanAC(payload);
  } else {
    result = { status: 'error', error: 'Action tidak dikenal.' };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  GET NOMOR SURAT
//  Hitung urutan berdasarkan data di spreadsheet tahun berjalan
// ============================================================
function getNomorSurat() {
  const tahun = new Date().getFullYear();
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" tidak ditemukan.');

    const lastRow = sheet.getLastRow();
    let urut = 1;

    if (lastRow > 1) {
      // Kolom B = Nomor Surat (index 2)
      const nomorList = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
      const tahunStr = String(tahun);
      const count = nomorList.filter(n => n && String(n).includes('/' + tahunStr)).length;
      urut = count + 1;
    }

    const urutStr = String(urut).padStart(3, '0');
    const nomor = CONFIG.NOMOR_PREFIX + '/' + urutStr + '/' + tahun;

    return { status: 'ok', urut: urut, nomor: nomor };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  GET DATA ASET dari Spreadsheet Database BMN
//  Kolom: NUP, Nama Barang, Merk, Tipe  (tab ASET2026)
// ============================================================
function getDataAset() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ASET_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.ASET_SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.ASET_SHEET_NAME + '" tidak ditemukan.');

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'ok', data: [] };

    // Baca header row 1 untuk mapping kolom
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(h => String(h).trim().toLowerCase());

    const colNUP = headers.indexOf('nup');
    const colNama = headers.indexOf('nama barang');
    const colMerk = headers.indexOf('merk');
    const colTipe = headers.indexOf('tipe');

    if ([colNUP, colNama, colMerk, colTipe].includes(-1)) {
      throw new Error('Kolom tidak ditemukan. Pastikan header: NUP, Nama Barang, Merk, Tipe');
    }

    const maxCol = Math.max(colNUP, colNama, colMerk, colTipe) + 1;
    const rawData = sheet.getRange(2, 1, lastRow - 1, maxCol).getValues();

    const data = rawData
      .filter(row => row[colNUP] || row[colNama])
      .map(row => ({
        nup : String(row[colNUP]  || '').trim(),
        nama: String(row[colNama] || '').trim(),
        merk: String(row[colMerk] || '').trim(),
        tipe: String(row[colTipe] || '').trim(),
      }));

    return { status: 'ok', count: data.length, data: data };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  GET DAFTAR SURAT dari Spreadsheet Arsip (untuk Admin)
//  Kolom: A=No, B=Nomor, C=TglSubmit, D=TglSurat, E=Nama,
//         F=NIP, G=Jabatan, H=Bagian, I=NamaBarang,
//         J=Merek, K=Tipe, L=Ruangan, M=NUP, N=Kondisi, O=Keluhan,
//         P=FotoNUP, Q=FotoMerek, R=FotoKerusakan, S=FotoKeseluruhan, T=FotoLainLain,
//         U=TTDPenerima, V=TTDPengirim, W=NamaPenerima, X=NIPPenerima,
//         Y=Status, Z=Keterangan
// ============================================================
function getSuratList() {
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" tidak ditemukan.');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'ok', data: [] };

    const raw = sheet.getRange(2, 1, lastRow - 1, 28).getValues();
    const data = raw
      .filter(r => r[1])
      .map(r => ({
        nomor       : String(r[1]  || ''),
        tanggalSurat: r[3] ? Utilities.formatDate(new Date(r[3]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
        nama        : String(r[4]  || ''),
        nip         : String(r[5]  || ''),
        jabatan     : String(r[6]  || ''),
        bagian      : String(r[7]  || ''),
        namaBarang  : String(r[8]  || ''),
        merek       : String(r[9]  || ''),
        tipe        : String(r[10] || ''),
        ruangan     : String(r[11] || ''),
        nup         : String(r[12] || ''),
        kondisi     : String(r[13] || ''),
        keluhan     : String(r[14] || ''),
        fotoNup         : String(r[15] || '-'),
        fotoMerek       : String(r[16] || '-'),
        fotoKerusakan   : String(r[17] || '-'),
        fotoKeseluruhan : String(r[18] || '-'),
        fotoLainLain    : String(r[19] || '-'),
        ttdPenerima     : String(r[20] || '-'),
        ttdPengirim     : String(r[21] || '-'),
        namaPenerima    : String(r[22] || ''),
        nipPenerima     : String(r[23] || ''),
        jenisSurat      : String(r[26] || 'umum'),
        ruanganSesudah  : String(r[27] || ''),
      }))
      .reverse();
    return { status: 'ok', count: data.length, data: data };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  GET PHOTO — ambil file Drive by URL, return base64
//  URL format Google Drive: https://drive.google.com/file/d/FILE_ID/...
// ============================================================
function getPhotoBase64(driveUrl) {
  try {
    if (!driveUrl || driveUrl === '-') return { status: 'ok', base64: null };
    // Extract file ID dari berbagai format URL Drive
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return { status: 'error', error: 'URL tidak valid' };
    const fileId = match[1];
    const file   = DriveApp.getFileById(fileId);
    const blob   = file.getBlob();
    const b64    = Utilities.base64Encode(blob.getBytes());
    const mime   = blob.getContentType() || 'image/jpeg';
    return { status: 'ok', base64: 'data:' + mime + ';base64,' + b64 };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

//  1. Buat subfolder Drive  → upload 4 foto
//  2. Append baris ke Sheets
//  3. Kirim email notifikasi HTML
// ============================================================
function handleSubmit(d) {
  try {
    const tahun = new Date().getFullYear();
    const namaFolder = d.nomor + ' - ' + d.nama;
    const timestamp = new Date();

    // --- 1. Upload foto ke Google Drive ---
    const parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const subFolder = parentFolder.createFolder(namaFolder);

    const fotoLinks = {
      nup: uploadFoto(subFolder, d.fotoNup, 'Foto_NUP_' + d.nup),
      merek: uploadFoto(subFolder, d.fotoMerek, 'Foto_Merek_' + d.nup),
      kerusakan: uploadFoto(subFolder, d.fotoKerusakan, 'Foto_Kerusakan_' + d.nup),
      keseluruhan: uploadFoto(subFolder, d.fotoKeseluruhan, 'Foto_Keseluruhan_' + d.nup),
      lainlain: uploadFoto(subFolder, d.fotoLainLain, 'Foto_LainLain_' + d.nup),
      ttdPenerima: uploadFoto(subFolder, d.ttdPenerima, 'TTD_Penerima_' + d.nup),
      ttdPengirim: uploadFoto(subFolder, d.ttdPengirim, 'TTD_Pengirim_' + d.nup),
    };

    // --- 2. Append ke Spreadsheet ---
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" tidak ditemukan.');

    const lastRow = sheet.getLastRow();
    const noUrut = lastRow; // header di row 1, data mulai row 2

    sheet.appendRow([
      noUrut,                          // A: No
      d.nomor,                         // B: Nomor Surat
      timestamp,                       // C: Tanggal Submit
      d.tanggalSurat,                  // D: Tanggal Surat
      d.nama,                          // E: Nama
      d.nip,                           // F: NIP
      d.jabatan,                       // G: Jabatan
      d.bagian,                        // H: Unit/Bagian
      d.namaBarang,                    // I: Nama Barang
      d.merek,                         // J: Merek
      d.tipe,                          // K: Tipe
      d.ruangan,                       // L: Ruangan (DBR)
      d.nup,                           // M: NUP BMN
      d.kondisi,                       // N: Kondisi
      d.keluhan,                       // O: Keluhan
      fotoLinks.nup,                   // P: Link Foto NUP
      fotoLinks.merek,                 // Q: Link Foto Merek
      fotoLinks.kerusakan,             // R: Link Foto Kerusakan
      fotoLinks.keseluruhan,           // S: Link Foto Keseluruhan
      fotoLinks.lainlain,              // T: Link Foto Lain-lain
      fotoLinks.ttdPenerima,           // U: TTD Penerima
      fotoLinks.ttdPengirim,           // V: TTD Pengirim
      d.namaPenerima || '',            // W: Nama Penerima
      d.nipPenerima  || '',            // X: NIP Penerima
      'Menunggu Tindak Lanjut',        // Y: Status
      '',                              // Z: Keterangan
      d.jenisSurat   || 'umum',        // AA: Jenis Surat
      d.ruanganSesudah || '',          // AB: Ruangan Sesudah (DBR)
    ]);

    // Format kolom tanggal submit
    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 3).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sheet.getRange(newRow, 4).setNumberFormat('dd/mm/yyyy');

    // --- 3. Kirim email notifikasi ---
    if (CONFIG.EMAIL_AKTIF) {
      kirimEmailNotifikasi(d, fotoLinks, timestamp);
    }

    // --- 4. Kirim WhatsApp notifikasi ---
    if (CONFIG.WA_AKTIF) {
      kirimWhatsApp(d, fotoLinks);
    }

    return {
      status: 'ok',
      message: 'Data berhasil disimpan. Folder: ' + namaFolder,
      folder: subFolder.getUrl(),
    };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// -------- Upload satu foto (base64 → Drive) --------
function uploadFoto(folder, base64String, fileName) {
  if (!base64String || base64String.length < 100) return '-';
  try {
    // base64 bisa berformat "data:image/jpeg;base64,..."
    let mimeType = 'image/jpeg';
    let b64data = base64String;

    const match = base64String.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      b64data = match[2];
    }

    const ext = mimeType.split('/')[1] || 'jpg';
    const blob = Utilities.newBlob(Utilities.base64Decode(b64data), mimeType, fileName + '.' + ext);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log('Upload foto gagal: ' + e.message);
    return 'Gagal upload: ' + e.message;
  }
}

// -------- Kirim email notifikasi HTML --------
function kirimEmailNotifikasi(d, fotoLinks, timestamp) {
  const tgl = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd MMMM yyyy HH:mm');

  const body = `
  <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
    <div style="background:#1a3a5c;color:#fff;padding:20px 24px;">
      <h2 style="margin:0;font-size:16px;">📋 Surat Usulan Perbaikan BMN Baru</h2>
      <p style="margin:4px 0 0;font-size:12px;opacity:.8;">${CONFIG.NAMA_INSTANSI} — ${tgl}</p>
    </div>
    <div style="padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#f5f7fa;">
          <td style="padding:8px 12px;font-weight:bold;width:35%;">Nomor Surat</td>
          <td style="padding:8px 12px;">${d.nomor}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:bold;">Tanggal Surat</td>
          <td style="padding:8px 12px;">${d.tanggalSurat}</td>
        </tr>
        <tr style="background:#f5f7fa;">
          <td style="padding:8px 12px;font-weight:bold;">Nama Pengusul</td>
          <td style="padding:8px 12px;">${d.nama}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:bold;">NIP</td>
          <td style="padding:8px 12px;">${d.nip}</td>
        </tr>
        <tr style="background:#f5f7fa;">
          <td style="padding:8px 12px;font-weight:bold;">Jabatan</td>
          <td style="padding:8px 12px;">${d.jabatan}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:bold;">Unit / Bagian</td>
          <td style="padding:8px 12px;">${d.bagian}</td>
        </tr>
        <tr style="background:#f5f7fa;">
          <td style="padding:8px 12px;font-weight:bold;">Nama Barang</td>
          <td style="padding:8px 12px;">${d.namaBarang}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:bold;">Merek</td>
          <td style="padding:8px 12px;">${d.merek || '-'}</td>
        </tr>
        <tr style="background:#f5f7fa;">
          <td style="padding:8px 12px;font-weight:bold;">Tipe</td>
          <td style="padding:8px 12px;">${d.tipe || '-'}</td>
        </tr>
        <tr style="background:#f5f7fa;">
          <td style="padding:8px 12px;font-weight:bold;">Ruangan (DBR)</td>
          <td style="padding:8px 12px;">${d.ruangan}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:bold;">NUP BMN</td>
          <td style="padding:8px 12px;">${d.nup}</td>
        </tr>
        <tr style="background:#f5f7fa;">
          <td style="padding:8px 12px;font-weight:bold;">Kondisi</td>
          <td style="padding:8px 12px;color:${d.kondisi === 'Rusak Berat' ? '#c0392b' : '#e67e22'};font-weight:bold;">${d.kondisi}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Keluhan</td>
          <td style="padding:8px 12px;">${d.keluhan.replace(/\n/g, '<br>')}</td>
        </tr>
      </table>

      <div style="margin-top:16px;padding:12px;background:#eaf4fb;border-radius:6px;border-left:4px solid #2980b9;">
        <p style="margin:0 0 8px;font-weight:bold;font-size:13px;">📎 Lampiran Foto:</p>
        <ul style="margin:0;padding-left:18px;font-size:12px;line-height:2;">
          <li>Foto NUP: <a href="${fotoLinks.nup}">${fotoLinks.nup !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
          <li>Foto Merek/Tipe: <a href="${fotoLinks.merek}">${fotoLinks.merek !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
          <li>Foto Kerusakan: <a href="${fotoLinks.kerusakan}">${fotoLinks.kerusakan !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
          <li>Foto Keseluruhan: <a href="${fotoLinks.keseluruhan}">${fotoLinks.keseluruhan !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
          <li>Foto Lain-lain: <a href="${fotoLinks.lainlain}">${fotoLinks.lainlain !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
        </ul>
      </div>

      <p style="margin-top:20px;font-size:12px;color:#888;">
        Email ini dikirim otomatis oleh Sistem Surat Usulan Perbaikan BMN — ${CONFIG.NAMA_INSTANSI}.
        Silakan tindak lanjuti sesuai prosedur yang berlaku.
      </p>
    </div>
  </div>
  `;

  MailApp.sendEmail({
    to: CONFIG.EMAIL_TUJUAN,
    subject: '[BMN] Usulan Perbaikan Baru — ' + d.nomor + ' — ' + d.nama,
    htmlBody: body,
  });
}

// ============================================================
//  KIRIM NOTIFIKASI WHATSAPP via Fonnte
//  Daftar & dapatkan token gratis: https://fonnte.com
// ============================================================
function kirimWhatsApp(d, fotoLinks) {
  try {
    const kondisiEmoji = d.kondisi === 'Rusak Berat' ? '🔴' : '🟡';

    const pesan =
      `📋 *SURAT USULAN PERBAIKAN BMN*
${CONFIG.NAMA_INSTANSI}
━━━━━━━━━━━━━━━━━━━━
📄 *Nomor:* ${d.nomor}
📅 *Tanggal:* ${d.tanggalSurat}

👤 *Pengusul*
• Nama    : ${d.nama}
• NIP     : ${d.nip}
• Jabatan : ${d.jabatan}
• Bagian  : ${d.bagian}

🖥️ *Detail Barang*
• Nama Barang : ${d.namaBarang}
• Merek       : ${d.merek || '-'}
• Tipe        : ${d.tipe  || '-'}
• Ruangan     : ${d.ruangan}
• NUP BMN     : ${d.nup}
• Kondisi     : ${kondisiEmoji} ${d.kondisi}

📝 *Keluhan:*
${d.keluhan}

📎 *Foto Lampiran:*
• NUP        : ${fotoLinks.nup !== '-' ? fotoLinks.nup : 'Tidak ada'}
• Merek/Tipe : ${fotoLinks.merek !== '-' ? fotoLinks.merek : 'Tidak ada'}
• Kerusakan  : ${fotoLinks.kerusakan !== '-' ? fotoLinks.kerusakan : 'Tidak ada'}
• Keseluruhan: ${fotoLinks.keseluruhan !== '-' ? fotoLinks.keseluruhan : 'Tidak ada'}
• Lain-lain  : ${fotoLinks.lainlain !== '-' ? fotoLinks.lainlain : 'Tidak ada'}
━━━━━━━━━━━━━━━━━━━━
_Pesan otomatis Sistem BMN_`;

    const options = {
      method: 'POST',
      headers: { 'Authorization': CONFIG.WA_TOKEN },
      payload: {
        target: CONFIG.WA_TUJUAN,
        message: pesan,
      },
      muteHttpExceptions: true,
    };

    const resp = UrlFetchApp.fetch('https://api.fonnte.com/send', options);
    const result = JSON.parse(resp.getContentText());

    if (!result.status) {
      Logger.log('WhatsApp gagal: ' + JSON.stringify(result));
    } else {
      Logger.log('WhatsApp terkirim ke: ' + CONFIG.WA_TUJUAN);
    }
  } catch (e) {
    Logger.log('WhatsApp error (non-fatal): ' + e.message);
  }
}

// ============================================================
//  GET NOMOR BERITA ACARA
// ============================================================
function getNomorBA() {
  const tahun = new Date().getFullYear();
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.BA_SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.BA_SHEET_NAME + '" tidak ditemukan.');

    const lastRow = sheet.getLastRow();
    let urut = 1;
    if (lastRow > 1) {
      const nomorList = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
      const count = nomorList.filter(n => n && String(n).includes('/' + tahun)).length;
      urut = count + 1;
    }
    const urutStr = String(urut).padStart(3, '0');
    const nomor   = CONFIG.BA_NOMOR_PREFIX + '/' + urutStr + '/' + tahun;
    return { status: 'ok', urut: urut, nomor: nomor };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  GET DAFTAR SURAT USULAN (untuk dropdown BA-PP)
//  Return: nomor, namaBarang, tipe, merek, ruangan, nup, fotoNup, fotoMerek
// ============================================================
function getSuratUsulanList() {
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" tidak ditemukan.');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'ok', data: [] };

    const raw  = sheet.getRange(2, 1, lastRow - 1, 27).getValues();
    const data = raw
      .filter(r => r[1])
      .map(r => ({
        nomor      : String(r[1]  || ''),
        namaBarang : String(r[8]  || ''),
        merek      : String(r[9]  || ''),
        tipe       : String(r[10] || ''),
        ruangan    : String(r[11] || ''),
        nup        : String(r[12] || ''),
        fotoNup    : String(r[15] || '-'),
        fotoMerek  : String(r[16] || '-'),
        jenisSurat : String(r[26] || 'umum'),
      }))
      .reverse();
    return { status: 'ok', count: data.length, data: data };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  GET DAFTAR BERITA ACARA (untuk admin)
//  Kolom: A=No, B=NomorBA, C=TglSubmit, D=TglBA, E=NoSuratUsulan,
//         F=NamaBarang, G=Tipe, H=Merek, I=Ruangan, J=NUP,
//         K=LainLain, L=Kondisi, M=Rincian,
//         N=NamaPelaksana, O=JabPelaksana, P=NamaPengawas, Q=JabPengawas,
//         R=NamaPenggunaBMN, S=JabPenggunaBMN,
//         T=TTDPelaksana, U=TTDPengawas, V=TTDPenggunaBMN,
//         W=Foto1, X=Foto2, Y=Foto3, Z=Foto4, AA=Foto5, AB=Foto6
// ============================================================
function getBASuratList() {
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.BA_SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.BA_SHEET_NAME + '" tidak ditemukan.');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'ok', data: [] };

    const raw  = sheet.getRange(2, 1, lastRow - 1, 28).getValues();
    const data = raw
      .filter(r => r[1])
      .map(r => ({
        nomor          : String(r[1]  || ''),
        tanggalBA      : r[3] ? Utilities.formatDate(new Date(r[3]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
        noSuratUsulan  : String(r[4]  || ''),
        namaBarang     : String(r[5]  || ''),
        tipe           : String(r[6]  || ''),
        merek          : String(r[7]  || ''),
        ruangan        : String(r[8]  || ''),
        nup            : String(r[9]  || ''),
        lainLain       : String(r[10] || ''),
        kondisi        : String(r[11] || ''),
        rincian        : String(r[12] || ''),
        namaPelaksana  : String(r[13] || ''),
        jabPelaksana   : String(r[14] || ''),
        namaPengawas   : String(r[15] || ''),
        jabPengawas    : String(r[16] || ''),
        namaPengguna   : String(r[17] || ''),
        jabPengguna    : String(r[18] || ''),
        ttdPelaksana   : String(r[19] || '-'),
        ttdPengawas    : String(r[20] || '-'),
        ttdPengguna    : String(r[21] || '-'),
        foto1          : String(r[22] || '-'),
        foto2          : String(r[23] || '-'),
        foto3          : String(r[24] || '-'),
        foto4          : String(r[25] || '-'),
        foto5          : String(r[26] || '-'),
        foto6          : String(r[27] || '-'),
      }))
      .reverse();
    return { status: 'ok', count: data.length, data: data };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  HANDLE SUBMIT BERITA ACARA
// ============================================================
function handleSubmitBA(d) {
  try {
    const timestamp  = new Date();
    const namaFolder = d.nomor + ' - ' + (d.namaPelaksana || 'BA');
    const parentFolder = DriveApp.getFolderById(CONFIG.BA_DRIVE_FOLDER_ID);
    const subFolder    = parentFolder.createFolder(namaFolder);

    // Upload atau simpan URL foto 1 & 2 (bisa jadi sudah URL Drive jika auto-fill)
    function resolveAtauUpload(nilaiInput, namaFile) {
      if (!nilaiInput || nilaiInput === '-' || nilaiInput.length < 10) return '-';
      if (nilaiInput.startsWith('https://')) return nilaiInput; // sudah URL Drive
      return uploadFoto(subFolder, nilaiInput, namaFile);       // base64 → upload
    }

    const foto1 = resolveAtauUpload(d.foto1, 'Foto1_NUP');
    const foto2 = resolveAtauUpload(d.foto2, 'Foto2_Merek');
    const foto3 = resolveAtauUpload(d.foto3, 'Foto3_SparePart');
    const foto4 = resolveAtauUpload(d.foto4, 'Foto4_Setelah1');
    const foto5 = resolveAtauUpload(d.foto5, 'Foto5_Setelah2');
    const foto6 = resolveAtauUpload(d.foto6, 'Foto6_LainLain');

    // Upload TTD (base64 PNG dari canvas)
    const ttdPelaksana = uploadFoto(subFolder, d.ttdPelaksana, 'TTD_Pelaksana');
    const ttdPengawas  = uploadFoto(subFolder, d.ttdPengawas,  'TTD_Pengawas');
    const ttdPengguna  = uploadFoto(subFolder, d.ttdPengguna,  'TTD_PenggunaBMN');

    // Append ke sheet BA-PP
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.BA_SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.BA_SHEET_NAME + '" tidak ditemukan.');

    const noUrut = sheet.getLastRow();
    sheet.appendRow([
      noUrut,               // A: No
      d.nomor,              // B: Nomor BA
      timestamp,            // C: Tanggal Submit
      d.tanggalBA,          // D: Tanggal BA
      d.noSuratUsulan || '',// E: No Surat Usulan
      d.namaBarang,         // F: Nama Barang
      d.tipe,               // G: Tipe
      d.merek,              // H: Merek
      d.ruangan,            // I: Ruangan
      d.nup,                // J: NUP
      d.lainLain || '',     // K: Lain-lain / No.Inv
      d.kondisi,            // L: Kondisi
      d.rincian || '',      // M: Rincian Pemeliharaan/Perbaikan/Penggantian
      d.namaPelaksana,      // N: Nama Pelaksana
      d.jabPelaksana,       // O: Jabatan Pelaksana
      d.namaPengawas,       // P: Nama Pengawas
      d.jabPengawas,        // Q: Jabatan Pengawas
      d.namaPengguna,       // R: Nama Pengguna BMN
      d.jabPengguna,        // S: Jabatan Pengguna BMN
      ttdPelaksana,         // T: TTD Pelaksana (URL)
      ttdPengawas,          // U: TTD Pengawas (URL)
      ttdPengguna,          // V: TTD Pengguna BMN (URL)
      foto1,                // W: Foto 1 NUP
      foto2,                // X: Foto 2 Merek/Tipe
      foto3,                // Y: Foto 3 Spare Part
      foto4,                // Z: Foto 4 Setelah 1
      foto5,                // AA: Foto 5 Setelah 2
      foto6,                // AB: Foto 6 Lain-lain
    ]);

    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 3).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sheet.getRange(newRow, 4).setNumberFormat('dd/mm/yyyy');

    return {
      status: 'ok',
      message: 'Berita Acara berhasil disimpan.',
      folder: subFolder.getUrl(),
    };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  GET NOMOR LAPORAN PEMELIHARAAN/PERBAIKAN AC
// ============================================================
function getNomorLaporanAC() {
  const tahun = new Date().getFullYear();
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.L_PP_AC_SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.L_PP_AC_SHEET_NAME + '" tidak ditemukan.');

    const lastRow = sheet.getLastRow();
    let urut = 1;
    if (lastRow > 1) {
      const nomorList = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
      const count = nomorList.filter(n => n && String(n).includes('/' + tahun)).length;
      urut = count + 1;
    }
    const urutStr = String(urut).padStart(3, '0');
    const nomor   = CONFIG.L_PP_AC_NOMOR_PREFIX + '/' + urutStr + '/' + tahun;
    return { status: 'ok', urut: urut, nomor: nomor };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  GET DAFTAR LAPORAN AC (untuk admin)
//  Kolom: A=No, B=Nomor, C=TglSubmit, D=TglLaporan, E=NoSuratUsulan,
//         F=NamaBarang, G=Tipe, H=Merek, I=Ruangan, J=NUP,
//         K=KapasitasAC, L=Jenis1, M=Jenis2, N=Jenis3, O=Jenis4, P=Jenis5,
//         Q=Deskripsi, R=NamaPelaksana, S=JabPelaksana, T=PerusahaanPelaksana,
//         U=TTDNamaPelaksana, V=TTDJabPelaksana,
//         W=NamaPengguna, X=JabPengguna, Y=NamaPengawas,
//         Z=TTDPelaksana, AA=TTDPengguna, AB=TTDPengawas,
//         AC=Foto1, AD=Foto2, AE=Foto3, AF=Foto4, AG=Foto5, AH=Foto6
// ============================================================
function getLaporanACList() {
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.L_PP_AC_SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.L_PP_AC_SHEET_NAME + '" tidak ditemukan.');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'ok', data: [] };

    const raw  = sheet.getRange(2, 1, lastRow - 1, 34).getValues();
    const data = raw
      .filter(r => r[1])
      .map(r => ({
        nomor          : String(r[1]  || ''),
        tanggalLaporan : r[3] ? Utilities.formatDate(new Date(r[3]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
        noSuratUsulan  : String(r[4]  || ''),
        namaBarang     : String(r[5]  || ''),
        tipe           : String(r[6]  || ''),
        merek          : String(r[7]  || ''),
        ruangan        : String(r[8]  || ''),
        nup            : String(r[9]  || ''),
        kapasitasAC          : String(r[10] || ''),
        jenisCuci            : String(r[11] || ''),
        jenisIsiFreon        : String(r[12] || ''),
        jenisGantiKapasitor  : String(r[13] || ''),
        jenisGantiModul      : String(r[14] || ''),
        jenisLainLain        : String(r[15] || ''),
        deskripsi      : String(r[16] || ''),
        namaPelaksana        : String(r[17] || ''),
        jabPelaksana         : String(r[18] || ''),
        perusahaanPelaksana  : String(r[19] || ''),
        ttdNamaPelaksana     : String(r[20] || ''),
        ttdJabPelaksana      : String(r[21] || ''),
        namaPengguna         : String(r[22] || ''),
        jabPengguna          : String(r[23] || ''),
        namaPengawas         : String(r[24] || ''),
        ttdPelaksana         : String(r[25] || '-'),
        ttdPengguna          : String(r[26] || '-'),
        ttdPengawas          : String(r[27] || '-'),
        foto1                : String(r[28] || '-'),
        foto2                : String(r[29] || '-'),
        foto3                : String(r[30] || '-'),
        foto4                : String(r[31] || '-'),
        foto5                : String(r[32] || '-'),
        foto6                : String(r[33] || '-'),
      }))
      .reverse();
    return { status: 'ok', count: data.length, data: data };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// ============================================================
//  HANDLE SUBMIT LAPORAN PEMELIHARAAN/PERBAIKAN AC
// ============================================================
function handleSubmitLaporanAC(d) {
  try {
    const timestamp   = new Date();
    const namaFolder  = d.nomor + ' - ' + (d.ttdNamaPelaksana || d.namaPelaksana || 'AC');
    const parentFolder = DriveApp.getFolderById(CONFIG.L_PP_AC_DRIVE_FOLDER_ID);
    const subFolder    = parentFolder.createFolder(namaFolder);

    // Upload atau teruskan URL Drive (foto1 & foto2 bisa sudah berupa URL dari surat usulan)
    function resolveAtauUpload(nilaiInput, namaFile) {
      if (!nilaiInput || nilaiInput === '-' || nilaiInput.length < 10) return '-';
      if (nilaiInput.startsWith('https://')) return nilaiInput; // sudah URL Drive
      return uploadFoto(subFolder, nilaiInput, namaFile);       // base64 → upload
    }
    const foto1 = resolveAtauUpload(d.foto1, 'Foto1_NUP');
    const foto2 = resolveAtauUpload(d.foto2, 'Foto2_Merek');
    const foto3 = uploadFoto(subFolder, d.foto3, 'Foto3_Sebelum');
    const foto4 = uploadFoto(subFolder, d.foto4, 'Foto4_Pekerjaan1');
    const foto5 = uploadFoto(subFolder, d.foto5, 'Foto5_Pekerjaan2');
    const foto6 = uploadFoto(subFolder, d.foto6, 'Foto6_LainLain');

    // TTD: kalau base64 (gambar manual) → upload ke Drive, kalau nama (dari daftar) → simpan langsung
    const ttdPelaksana = d.ttdPelaksana && d.ttdPelaksana.startsWith('data:')
      ? uploadFoto(subFolder, d.ttdPelaksana, 'TTD_Pelaksana')
      : (d.ttdPelaksana || '-');
    const ttdPengguna  = uploadFoto(subFolder, d.ttdPengguna, 'TTD_Pengguna');
    const ttdPengawas  = d.ttdPengawas && d.ttdPengawas.startsWith('data:')
      ? uploadFoto(subFolder, d.ttdPengawas, 'TTD_Pengawas')
      : (d.ttdPengawas || '-');

    // Append ke sheet L-PP-AC
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.L_PP_AC_SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.L_PP_AC_SHEET_NAME + '" tidak ditemukan.');

    const noUrut = sheet.getLastRow();
    sheet.appendRow([
      noUrut,                        // A: No
      d.nomor,                       // B: Nomor Laporan
      timestamp,                     // C: Tanggal Submit
      d.tanggalLaporan,              // D: Tanggal Laporan
      d.noSuratUsulan || '',         // E: No Surat Usulan
      d.namaBarang,                  // F: Nama Barang
      d.tipe        || '',           // G: Tipe
      d.merek,                       // H: Merek
      d.ruangan,                     // I: Ruangan
      d.nup,                         // J: NUP
      d.kapasitasAC,                           // K: Kapasitas AC
      d.jenisCuci           ? 'Ya' : '',       // L: Cuci
      d.jenisIsiFreon       ? 'Ya' : '',       // M: Isi Freon
      d.jenisGantiKapasitor ? 'Ya' : '',       // N: Ganti Kapasitor
      d.jenisGantiModul     ? 'Ya' : '',       // O: Ganti Modul
      d.jenisLainLain       || '',             // P: Lain-lain (teks)
      d.deskripsi   || '',           // Q: Deskripsi
      d.namaPelaksana,                       // R: Nama Pelaksana (badan surat)
      d.jabPelaksana,                        // S: Jabatan Pelaksana (badan surat)
      d.perusahaanPelaksana || '',           // T: Perusahaan / Instansi Pelaksana
      d.ttdNamaPelaksana || d.namaPelaksana, // U: Nama Pelaksana (TTD)
      d.ttdJabPelaksana  || d.jabPelaksana,  // V: Jabatan Pelaksana (TTD)
      d.namaPengguna,                        // W: Nama Pengguna
      d.jabPengguna || '',                   // X: Jabatan Pengguna
      d.namaPengawas,                        // Y: Nama Pengawas
      ttdPelaksana,                          // Z: TTD Pelaksana (URL Drive atau nama kunci)
      ttdPengguna,                           // AA: TTD Pengguna (URL Drive)
      ttdPengawas,                           // AB: TTD Pengawas (URL Drive atau nama kunci)
      foto1,                                 // AC: Foto 1 NUP
      foto2,                                 // AD: Foto 2 Merek
      foto3,                                 // AE: Foto 3 Sebelum
      foto4,                                 // AF: Foto 4 Pekerjaan 1
      foto5,                                 // AG: Foto 5 Pekerjaan 2
      foto6,                                 // AH: Foto 6 Lain-lain
    ]);

    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 3).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sheet.getRange(newRow, 4).setNumberFormat('dd/mm/yyyy');

    return {
      status  : 'ok',
      message : 'Laporan AC berhasil disimpan.',
      folder  : subFolder.getUrl(),
    };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}
// ============================================================
//  SETUP SPREADSHEET HEADERS
//  Jalankan sekali dari Apps Script Editor → Run → setupSheetHeaders
//  Membuat/mengganti baris header di 3 sheet arsip BMN.
//  PERINGATAN: Fungsi ini menghapus & menulis ulang baris 1 tiap sheet.
//              Data di baris 2 ke bawah TIDAK tersentuh.
// ============================================================
function setupSheetHeaders() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  const SHEETS = {

    // ── Sheet 1: Usulan-PP (A–AB = 28 kolom) ─────────────────
    'Usulan-PP': [
      'No', 'Nomor Surat', 'Tanggal Submit', 'Tanggal Surat',
      'Nama Pengusul', 'NIP', 'Jabatan', 'Unit/Bagian',
      'Nama Barang', 'Merek', 'Tipe', 'Ruangan (DBR)', 'NUP BMN',
      'Kondisi', 'Keluhan',
      'Link Foto NUP', 'Link Foto Merek', 'Link Foto Kerusakan/Sblm Pemindahan',
      'Link Foto Keseluruhan', 'Link Foto Lain-lain/Ssdh Pemindahan',
      'TTD Penerima (Link Drive)', 'TTD Pengirim (Link Drive)',
      'Nama Penerima', 'NIP Penerima', 'Status', 'Keterangan',
      'Jenis Surat', 'Ruangan Sesudah (DBR)',
    ],

    // ── Sheet 2: BA-PP (A–AB = 28 kolom) ─────────────────────
    'BA-PP': [
      'No', 'Nomor BA', 'Tanggal Submit', 'Tanggal BA',
      'No Surat Usulan', 'Nama Barang', 'Tipe', 'Merek',
      'Ruangan', 'NUP', 'Lain-lain / No.Inv', 'Kondisi',
      'Rincian Pemeliharaan/Perbaikan/Penggantian',
      'Nama Pelaksana', 'Jabatan Pelaksana',
      'Nama Pengawas', 'Jabatan Pengawas',
      'Nama Pengguna BMN', 'Jabatan Pengguna BMN',
      'TTD Pelaksana (Link Drive)', 'TTD Pengawas (Link Drive)',
      'TTD Pengguna BMN (Link Drive)',
      'Foto 1', 'Foto 2', 'Foto 3', 'Foto 4', 'Foto 5', 'Foto 6',
    ],

    // ── Sheet 3: L-PP-AC (A–AH = 34 kolom) ───────────────────
    'L-PP-AC': [
      'No', 'Nomor Laporan', 'Tanggal Submit', 'Tanggal Laporan',
      'No Surat Usulan', 'Nama Barang', 'Tipe', 'Merek',
      'Ruangan (DBR)', 'NUP', 'Kapasitas AC',
      'Cuci', 'Isi Freon', 'Ganti Kapasitor', 'Ganti Modul', 'Lain-lain',
      'Deskripsi',
      'Nama Pelaksana', 'Jabatan Pelaksana', 'Perusahaan/Instansi Pelaksana',
      'Nama Pelaksana (TTD)', 'Jabatan Pelaksana (TTD)',
      'Nama Pengguna', 'Jabatan Pengguna', 'Nama Pengawas',
      'TTD Pelaksana', 'TTD Pengguna', 'TTD Pengawas',
      'Foto 1 NUP', 'Foto 2 Merek/Tipe',
      'Foto 3 Sebelum/Spare Part', 'Foto 4 Pekerjaan', 'Foto 5 Pekerjaan',
      'Foto 6 Lain-lain',
    ],
  };

  const HEADER_BG    = '#4a86e8';
  const HEADER_COLOR = '#ffffff';

  Object.entries(SHEETS).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('Sheet baru dibuat: ' + sheetName);
    }

    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold')
         .setFontColor(HEADER_COLOR)
         .setBackground(HEADER_BG)
         .setHorizontalAlignment('center')
         .setWrap(true);

    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(1);
    sheet.autoResizeColumns(1, headers.length);

    Logger.log('✅ ' + sheetName + ' — ' + headers.length + ' kolom header diset.');
  });

  Logger.log('Setup selesai.');
  SpreadsheetApp.flush();
}
