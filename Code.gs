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
    var raw = e.postData.contents;

    // Handle form-encoded payload (from hidden form submit)
    var data;
    if (e.postData.type === 'application/x-www-form-urlencoded' && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      data = JSON.parse(raw);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Check-In Sheet');

    if (!sheet) {
      return respond({ status: 'error', message: 'Sheet "Check-In Sheet" not found' });
    }

    var targetRow = findDateRow(sheet, data.date);

    if (targetRow === -1) {
      return respond({ status: 'error', message: 'Date "' + data.date + '" not found in column A' });
    }

    if (data.bodyweight !== '') sheet.getRange(targetRow, 2).setValue(data.bodyweight);
    if (data.steps !== '')     sheet.getRange(targetRow, 3).setValue(data.steps);
    if (data.diet)             sheet.getRange(targetRow, 4).setValue(data.diet);
    if (data.stepsAdhere)      sheet.getRange(targetRow, 5).setValue(data.stepsAdhere);
    if (data.training)         sheet.getRange(targetRow, 6).setValue(data.training);
    if (data.cardio)           sheet.getRange(targetRow, 7).setValue(data.cardio);
    if (data.water)            sheet.getRange(targetRow, 8).setValue(data.water);
    if (data.comments)         sheet.getRange(targetRow, 9).setValue(data.comments);

    return respond({ status: 'ok', row: targetRow, date: data.date });

  } catch (err) {
    return respond({ status: 'error', message: err.toString() });
  }
}

/**
 * Find the first row in column A that matches the given date string (e.g. "14/3").
 * Handles: Date objects (including Apps Script date quirks), text like "14/3", "14/03", "14/03/2026".
 */
function findDateRow(sheet, dateToFind) {
  var parts = dateToFind.split('/');
  var targetDay = parseInt(parts[0], 10);
  var targetMonth = parseInt(parts[1], 10);

  var lastRow = sheet.getLastRow();
  var dateCol = sheet.getRange(1, 1, lastRow, 1).getValues();

  for (var i = 0; i < dateCol.length; i++) {
    var cellValue = dateCol[i][0];
    if (!cellValue && cellValue !== 0) continue;

    var day = -1, month = -1;

    // Try calling getDate/getMonth (works for Date objects even when instanceof fails)
    try {
      if (typeof cellValue === 'object' && cellValue.getDate && cellValue.getMonth) {
        day = cellValue.getDate();
        month = cellValue.getMonth() + 1;
      }
    } catch (e) {}

    // Fall back to string parsing
    if (day === -1) {
      var str = String(cellValue).trim();
      // Try d/m or dd/mm format
      var m = str.match(/^(\d{1,2})\/(\d{1,2})/);
      if (m) {
        day = parseInt(m[1], 10);
        month = parseInt(m[2], 10);
      } else {
        // Try parsing full date strings like "Sat Mar 14 2026 ..."
        var monthNames = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
        var dm = str.match(/(\w{3})\s+(\d{1,2})\s+\d{4}/);
        if (dm && monthNames[dm[1]]) {
          day = parseInt(dm[2], 10);
          month = monthNames[dm[1]];
        }
      }
    }

    if (day === targetDay && month === targetMonth) {
      return i + 1;
    }
  }

  return -1;
}

function doGet(e) {
  // Handle data writes via GET (JSONP-style, avoids CORS/POST redirect issues)
  if (e && e.parameter && e.parameter.data) {
    var callback = e.parameter.callback || '';
    try {
      var data = JSON.parse(e.parameter.data);
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Check-In Sheet');
      if (!sheet) return jsonp(callback, { status: 'error', message: 'Sheet not found' });

      var targetRow = findDateRow(sheet, data.date);
      if (targetRow === -1) return jsonp(callback, { status: 'error', message: 'Date "' + data.date + '" not found' });

      if (data.bodyweight !== '') sheet.getRange(targetRow, 2).setValue(data.bodyweight);
      if (data.steps !== '')     sheet.getRange(targetRow, 3).setValue(data.steps);
      if (data.diet)             sheet.getRange(targetRow, 4).setValue(data.diet);
      if (data.stepsAdhere)      sheet.getRange(targetRow, 5).setValue(data.stepsAdhere);
      if (data.training)         sheet.getRange(targetRow, 6).setValue(data.training);
      if (data.cardio)           sheet.getRange(targetRow, 7).setValue(data.cardio);
      if (data.water)            sheet.getRange(targetRow, 8).setValue(data.water);
      if (data.comments)         sheet.getRange(targetRow, 9).setValue(data.comments);

      return jsonp(callback, { status: 'ok', row: targetRow, date: data.date });
    } catch (err) {
      return jsonp(callback, { status: 'error', message: err.toString() });
    }
  }

  if (e && e.parameter && e.parameter.test) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Check-In Sheet');
    if (!sheet) return respond({ error: 'Sheet not found' });

    var dateToFind = e.parameter.test;
    var row = findDateRow(sheet, dateToFind);

    var lastRow = sheet.getLastRow();
    var dateCol = sheet.getRange(1, 1, lastRow, 1).getValues();

    var allMatches = [];
    var parts = dateToFind.split('/');
    var targetDay = parseInt(parts[0], 10);
    var targetMonth = parseInt(parts[1], 10);
    var monthNames = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };

    for (var i = 0; i < dateCol.length; i++) {
      var cellValue = dateCol[i][0];
      if (!cellValue && cellValue !== 0) continue;
      var day = -1, month = -1;
      try {
        if (typeof cellValue === 'object' && cellValue.getDate && cellValue.getMonth) {
          day = cellValue.getDate();
          month = cellValue.getMonth() + 1;
        }
      } catch (e) {}
      if (day === -1) {
        var str = String(cellValue).trim();
        var m = str.match(/^(\d{1,2})\/(\d{1,2})/);
        if (m) { day = parseInt(m[1], 10); month = parseInt(m[2], 10); }
        else {
          var dm = str.match(/(\w{3})\s+(\d{1,2})\s+\d{4}/);
          if (dm && monthNames[dm[1]]) { day = parseInt(dm[2], 10); month = monthNames[dm[1]]; }
        }
      }
      if (day === targetDay && month === targetMonth) {
        allMatches.push(i + 1);
      }
    }

    // Show what's around the expected area (rows 80-95)
    var nearby = [];
    for (var j = 79; j < Math.min(95, dateCol.length); j++) {
      var v = dateCol[j][0];
      nearby.push({
        row: j + 1,
        value: String(v),
        type: typeof v,
        isDate: v instanceof Date
      });
    }

    return respond({
      looking_for: dateToFind,
      first_match: row,
      all_matches: allMatches,
      rows_80_to_95: nearby
    });
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

function jsonp(callback, obj) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return respond(obj);
}
