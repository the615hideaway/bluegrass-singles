/**
 * Bluegrass Singles — Google Sheets Backend
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 */

const SHEET_NAME = 'Bluegrass Singles';

const HEADERS = [
  'ID',
  'Artist Name',
  'Song Title',
  'Cover Art',
  'Description',
  'Duration',
  'Release Date',
  'Label',
  'Writers',
  'Musicians',
  'Preview Link',
  'MP3 Download Link',
  'WAV Download Link',
  'Generated One Sheet',
  'Submitted Date',
  'Payment ID',
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0d9488')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function rowToRecord_(row, rowIndex) {
  return {
    id: row[0] || String(rowIndex),
    artistName: row[1] || '',
    songTitle: row[2] || '',
    coverArt: row[3] || '',
    description: row[4] || '',
    duration: row[5] || '',
    releaseDate: row[6] || '',
    label: row[7] || '',
    writers: row[8] || '',
    musicians: row[9] || '',
    previewLink: row[10] || '',
    mp3DownloadLink: row[11] || '',
    wavDownloadLink: row[12] || '',
    generatedOneSheet: row[13] || '',
    submittedDate: row[14] || '',
    paymentId: row[15] || '',
    rowIndex: rowIndex,
  };
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = (e.parameter.action || 'list').toLowerCase();

    if (action === 'list') {
      return jsonResponse_(listSingles_());
    }

    if (action === 'get') {
      const id = e.parameter.id;
      if (!id) return jsonResponse_({ success: false, error: 'Missing id' });
      return jsonResponse_(getSingle_(id));
    }

    return jsonResponse_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = (body.action || 'add').toLowerCase();

    if (action === 'add') {
      return jsonResponse_(addSingle_(body.data || body));
    }

    if (action === 'delete') {
      return jsonResponse_(deleteSingle_(body.id));
    }

    return jsonResponse_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message });
  }
}

function listSingles_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { success: true, singles: [] };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const singles = rows
    .map((row, i) => rowToRecord_(row, i + 2))
    .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

  return { success: true, singles: singles };
}

function getSingle_(id) {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { success: false, error: 'Not found' };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      return { success: true, single: rowToRecord_(rows[i], i + 2) };
    }
  }

  return { success: false, error: 'Not found' };
}

function addSingle_(data) {
  const sheet = getSheet_();
  const id = 'BG-' + Date.now();
  const submittedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const coverArt = data.coverArt || '';
  if (coverArt.length > 45000) {
    return {
      success: false,
      error: 'Cover art is too large for Google Sheets. Please use an image URL instead of uploading a file.',
    };
  }

  const row = [
    id,
    data.artistName || '',
    data.songTitle || '',
    coverArt,
    data.description || '',
    data.duration || '',
    data.releaseDate || '',
    data.label || '',
    data.writers || '',
    data.musicians || '',
    data.previewLink || '',
    data.mp3DownloadLink || '',
    data.wavDownloadLink || '',
    data.generatedOneSheet || '',
    submittedDate,
    data.paymentId || '',
  ];

  sheet.appendRow(row);

  return {
    success: true,
    single: rowToRecord_(row, sheet.getLastRow()),
  };
}

function deleteSingle_(id) {
  if (!id) return { success: false, error: 'Missing id' };

  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { success: false, error: 'Not found' };
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      return { success: true };
    }
  }

  return { success: false, error: 'Not found' };
}