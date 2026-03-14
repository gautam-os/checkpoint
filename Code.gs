/**
 * Checkpoint — Google Apps Script backend
 *
 * SETUP:
 * 1. Open your Google Sheet ("Gautam Prabhu Roadmap test")
 * 2. Extensions → Apps Script
 * 3. Delete any existing code, paste this entire file
 * 4. Click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL
 * 6. Paste it into checkpoint/index.html as the SCRIPT_URL value
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Check-In Sheet');

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet "Check-In Sheet" not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var dateToFind = data.date; // e.g. "14/3"
    var lastRow = sheet.getLastRow();
    var dateCol = sheet.getRange(1, 1, lastRow, 1).getValues();

    var targetRow = -1;
    for (var i = 0; i < dateCol.length; i++) {
      var cellValue = String(dateCol[i][0]).trim();
      if (cellValue === dateToFind) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Date "' + dateToFind + '" not found in column A' }))
        .setMimeType(ContentService.MimeType.JSON);
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

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: targetRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Checkpoint backend is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
