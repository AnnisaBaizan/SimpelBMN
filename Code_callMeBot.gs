// ============================================================
//  SURAT USULAN PERBAIKAN BMN — Google Apps Script Backend
//  Deploy: Web App | Execute as: Me | Access: Anyone
// ============================================================

// ==================== CONFIG ====================
const CONFIG = {
  SPREADSHEET_ID  : 'GANTI_DENGAN_SPREADSHEET_ID',       // ID Google Sheets arsip
  DRIVE_FOLDER_ID : 'GANTI_DENGAN_DRIVE_FOLDER_ID',      // ID folder Google Drive untuk foto
  EMAIL_TUJUAN    : 'sarpras@instansi.go.id',             // Email notifikasi tim Sarpras
  NAMA_INSTANSI   : 'Politeknik Kesehatan Palembang',     // Nama instansi di email notif
  NOMOR_PREFIX    : 'KN.01.03/Sarpras',                   // Prefix nomor surat (sebelum /urut/tahun)
  SHEET_NAME      : 'Arsip Surat',                        // Nama sheet arsip

  // --- WhatsApp via CallMeBot (https://callmebot.com) ---
  WA_PHONE        : '6281532250712',                      // Nomor WA penerima format 62xxx (nomor yang daftar CallMeBot)
  WA_APIKEY       : 'GANTI_DENGAN_APIKEY_CALLMEBOT',     // APIKEY dari balasan bot CallMeBot
  WA_AKTIF        : true,                                 // Set false untuk nonaktifkan WA notif
};
// ================================================

// -------- doGet --------
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  let result;

  if (action === 'getNomor') {
    result = getNomorSurat();
  } else {
    result = { error: 'Action tidak dikenal. Gunakan ?action=getNomor' };
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
//  HANDLE SUBMIT
//  1. Buat subfolder Drive  → upload 4 foto
//  2. Append baris ke Sheets
//  3. Kirim email notifikasi HTML
// ============================================================
function handleSubmit(d) {
  try {
    const tahun = new Date().getFullYear();
    const namaFolder = d.nomor + ' - ' + d.nama;
    const timestamp  = new Date();

    // --- 1. Upload foto ke Google Drive ---
    const parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const subFolder    = parentFolder.createFolder(namaFolder);

    const fotoLinks = {
      nup         : uploadFoto(subFolder, d.fotoNup,         'Foto_NUP_'         + d.nup),
      merek       : uploadFoto(subFolder, d.fotoMerek,       'Foto_Merek_'       + d.nup),
      kerusakan   : uploadFoto(subFolder, d.fotoKerusakan,   'Foto_Kerusakan_'   + d.nup),
      keseluruhan : uploadFoto(subFolder, d.fotoKeseluruhan, 'Foto_Keseluruhan_' + d.nup),
    };

    // --- 2. Append ke Spreadsheet ---
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" tidak ditemukan.');

    const lastRow = sheet.getLastRow();
    const noUrut  = lastRow; // header di row 1, data mulai row 2

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
      d.merekTipe,                     // J: Merek/Tipe
      d.ruangan,                       // K: Ruangan (DBR)
      d.nup,                           // L: NUP BMN
      d.kondisi,                       // M: Kondisi
      d.keluhan,                       // N: Keluhan
      fotoLinks.nup,                   // O: Link Foto NUP
      fotoLinks.merek,                 // P: Link Foto Merek
      fotoLinks.kerusakan,             // Q: Link Foto Kerusakan
      fotoLinks.keseluruhan,           // R: Link Foto Keseluruhan
      'Menunggu Tindak Lanjut',        // S: Status
      '',                              // T: Keterangan
    ]);

    // Format kolom tanggal submit
    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 3).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sheet.getRange(newRow, 4).setNumberFormat('dd/mm/yyyy');

    // --- 3. Kirim email notifikasi ---
    kirimEmailNotifikasi(d, fotoLinks, timestamp);

    // --- 4. Kirim WhatsApp notifikasi ---
    if (CONFIG.WA_AKTIF) {
      kirimWhatsApp(d, fotoLinks);
    }

    return {
      status  : 'ok',
      message : 'Data berhasil disimpan. Folder: ' + namaFolder,
      folder  : subFolder.getUrl(),
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
    let b64data  = base64String;

    const match = base64String.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      b64data  = match[2];
    }

    const ext   = mimeType.split('/')[1] || 'jpg';
    const blob  = Utilities.newBlob(Utilities.base64Decode(b64data), mimeType, fileName + '.' + ext);
    const file  = folder.createFile(blob);
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
          <td style="padding:8px 12px;font-weight:bold;">Merek / Tipe</td>
          <td style="padding:8px 12px;">${d.merekTipe || '-'}</td>
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
          <td style="padding:8px 12px;">${d.keluhan.replace(/\n/g,'<br>')}</td>
        </tr>
      </table>

      <div style="margin-top:16px;padding:12px;background:#eaf4fb;border-radius:6px;border-left:4px solid #2980b9;">
        <p style="margin:0 0 8px;font-weight:bold;font-size:13px;">📎 Lampiran Foto:</p>
        <ul style="margin:0;padding-left:18px;font-size:12px;line-height:2;">
          <li>Foto NUP: <a href="${fotoLinks.nup}">${fotoLinks.nup !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
          <li>Foto Merek/Tipe: <a href="${fotoLinks.merek}">${fotoLinks.merek !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
          <li>Foto Kerusakan: <a href="${fotoLinks.kerusakan}">${fotoLinks.kerusakan !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
          <li>Foto Keseluruhan: <a href="${fotoLinks.keseluruhan}">${fotoLinks.keseluruhan !== '-' ? 'Lihat Foto' : 'Tidak ada'}</a></li>
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
    to      : CONFIG.EMAIL_TUJUAN,
    subject : '[BMN] Usulan Perbaikan Baru — ' + d.nomor + ' — ' + d.nama,
    htmlBody: body,
  });
}

// ============================================================
//  KIRIM NOTIFIKASI WHATSAPP via CallMeBot
//  Daftar & dapatkan APIKEY gratis: https://callmebot.com
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
• Merek/Tipe  : ${d.merekTipe || '-'}
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
━━━━━━━━━━━━━━━━━━━━
_Pesan otomatis Sistem BMN_`;

    // CallMeBot pakai GET request dengan teks yang di-encode
    const pesanEncoded = encodeURIComponent(pesan);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${CONFIG.WA_PHONE}&text=${pesanEncoded}&apikey=${CONFIG.WA_APIKEY}`;

    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const status = resp.getResponseCode();

    if (status === 200) {
      Logger.log('WhatsApp terkirim ke: ' + CONFIG.WA_PHONE);
    } else {
      Logger.log('WhatsApp gagal, status: ' + status + ' — ' + resp.getContentText());
    }
  } catch (e) {
    // WA error tidak menghentikan proses submit
    Logger.log('WhatsApp error (non-fatal): ' + e.message);
  }
}
