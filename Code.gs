/**
 * Checkpoint — Google Apps Script backend
 *
 * SETUP:
 * 1. Open your Google Sheet ("Gautam Prabhu Roadmap test")
 * 2. Extensions → Apps Script
 * 3. Delete any existing code, paste this entire file
 * 4. Deploy → Manage deployments → Edit → Version: New version → Deploy
 * 5. The URL stays the same when you edit an existing deployment
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Check-In Sheet');

    if (!sheet) {
      return respond({ status: 'error', message: 'Sheet "Check-In Sheet" not found' });
    }

    var dateToFind = data.date; // e.g. "14/3"
    var lastRow = sheet.getLastRow();
    var dateCol = sheet.getRange(1, 1, lastRow, 1).getValues();
    var displayFormats = sheet.getRange(1, 1, lastRow, 1).getDisplayValues();

    var targetRow = -1;
    for (var i = 0; i < dateCol.length; i++) {
      var cellValue = dateCol[i][0];

      // Try display value first (what you see in the sheet)
      var displayStr = String(displayFormats[i][0]).trim();
      if (displayStr === dateToFind) {
        targetRow = i + 1;
        break;
      }

      // Try Date object conversion
      if (cellValue instanceof Date && !isNaN(cellValue.getTime())) {
        var dateStr = cellValue.getDate() + '/' + (cellValue.getMonth() + 1);
        if (dateStr === dateToFind) {
          targetRow = i + 1;
          break;
        }
      }

      // Try raw string match
      var rawStr = String(cellValue).trim();
      if (rawStr === dateToFind) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      // Log some sample values for debugging
      var samples = [];
      for (var j = 0; j < Math.min(dateCol.length, 100); j++) {
        var v = dateCol[j][0];
        var d = displayFormats[j][0];
        if (v !== '' && d !== '') {
          samples.push('Row ' + (j+1) + ': display="' + d + '" raw="' + v + '" type=' + typeof v);
        }
        if (samples.length >= 10) break;
      }
      return respond({
        status: 'error',
        message: 'Date "' + dateToFind + '" not found in column A',
        debug_samples: samples
      });
    }

    // Column mapping (1-indexed):
    // A=1 Date | B=2 Bodyweight | C=3 Steps | D=4 Diet | E=5 Steps | F=6 Training | G=7 Cardio | H=8 Water | I=9 Comments
    if (data.bodyweight !== '') sheet.getRange(targetRow, 2).setValue(data.bodyweight);
    if (data.steps !== '')     sheet.getRange(targetRow, 3).setValue(data.steps);
    if (data.diet)             sheet.getRange(targetRow, 4).setValue(data.diet);
    if (data.stepsAdhere)      sheet.getRange(targetRow, 5).setValue(data.stepsAdhere);
    if (data.training)         sheet.getRange(targetRow, 6).setValue(data.training);
    if (data.cardio)           sheet.getRange(targetRow, 7).setValue(data.cardio);
    if (data.water)            sheet.getRange(targetRow, 8).setValue(data.water);
    if (data.comments)         sheet.getRange(targetRow, 9).setValue(data.comments);

    return respond({ status: 'ok', row: targetRow, date: dateToFind });

  } catch (err) {
    return respond({ status: 'error', message: err.toString() });
  }
}

function doGet(e) {
  // If called with ?test=DATE, try to find the date and return debug info
  if (e && e.parameter && e.parameter.test) {
    var dateToFind = e.parameter.test;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Check-In Sheet');
    if (!sheet) return respond({ error: 'Sheet not found' });

    var lastRow = sheet.getLastRow();
    var dateCol = sheet.getRange(1, 1, lastRow, 1).getValues();
    var displayFormats = sheet.getRange(1, 1, lastRow, 1).getDisplayValues();

    var samples = [];
    var found = -1;
    for (var i = 0; i < dateCol.length; i++) {
      var v = dateCol[i][0];
      var d = String(displayFormats[i][0]).trim();
      if (d === dateToFind) { found = i + 1; }
      if (v !== '' && d !== '' && samples.length < 15) {
        samples.push({
          row: i + 1,
          display: d,
          raw: String(v),
          type: typeof v,
          isDate: v instanceof Date
        });
      }
    }
    return respond({ looking_for: dateToFind, found_row: found, samples: samples });
  }

  return ContentService
    .createTextOutput('Checkpoint backend is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
