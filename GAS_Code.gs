/**
 * Mommy Time — Google Apps Script (Code.gs)
 * Sheets 쓰기 웹앱
 *
 * 사용법:
 *  1. https://script.google.com 에서 새 프로젝트 생성
 *  2. 이 코드 전체 복사 붙여넣기
 *  3. SHEET_ID 값을 본인 Sheets ID로 교체
 *  4. [배포] → [새 배포] → [웹앱] → 액세스: 모든 사용자
 *  5. 배포 URL을 admin.js의 GAS_URL에 붙여넣기
 */

var SHEET_ID = 'YOUR_SHEET_ID_HERE';  // ← 여기 교체!

var TABS = {
  STUDENTS: 'students',
  CONTENT:  'content',
  SETTINGS: 'settings',
  PROGRESS: 'progress',
};

function doPost(e) {
  var res = ContentService.createTextOutput();
  res.setMimeType(ContentService.MimeType.JSON);

  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    var data   = body.data;
    var result = { success: false };

    if      (action === 'addStudent')    result = addStudent(data);
    else if (action === 'updateStudent') result = updateStudent(data);
    else if (action === 'deleteStudent') result = deleteStudent(data);
    else if (action === 'updateContent') result = updateContent(data);
    else if (action === 'updateSetting') result = updateSetting(data);
    else if (action === 'logProgress')   result = logProgress(data);
    else result = { success: false, error: '알 수 없는 action: ' + action };

    res.setContent(JSON.stringify(result));
  } catch (err) {
    res.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }

  return res;
}

// ── 수강생 추가 ──
function addStudent(data) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TABS.STUDENTS);
  if (!sheet) return { success: false, error: 'students 탭이 없어요.' };

  // 중복 코드 체크
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.code) {
      return { success: false, error: '이미 존재하는 코드예요: ' + data.code };
    }
  }

  sheet.appendRow([
    data.code, data.name, data.expires,
    data.groups, data.active, data.memo
  ]);
  return { success: true };
}

// ── 수강생 수정 ──
function updateStudent(data) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TABS.STUDENTS);
  if (!sheet) return { success: false, error: 'students 탭이 없어요.' };

  var rows = sheet.getDataRange().getValues();
  var targetCode = data.origCode || data.code;

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === targetCode) {
      var row = i + 1;
      sheet.getRange(row, 1, 1, 6).setValues([[
        data.code, data.name, data.expires,
        data.groups, data.active, data.memo
      ]]);
      return { success: true };
    }
  }
  return { success: false, error: '코드를 찾을 수 없어요: ' + targetCode };
}

// ── 수강생 삭제 ──
function deleteStudent(data) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TABS.STUDENTS);
  if (!sheet) return { success: false, error: 'students 탭이 없어요.' };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.code) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: '코드를 찾을 수 없어요: ' + data.code };
}

// ── 콘텐츠 잠금 업데이트 ──
function updateContent(data) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TABS.CONTENT);

  // content 탭이 없으면 생성
  if (!sheet) {
    sheet = ss.insertSheet(TABS.CONTENT);
    sheet.appendRow(['id', 'label', 'type', 'locked', 'memo']);
  }

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[
        data.id, data.label || data.id, data.type || '', data.locked, data.memo || ''
      ]]);
      return { success: true };
    }
  }

  // 없으면 추가
  sheet.appendRow([data.id, data.label || data.id, data.type || '', data.locked, data.memo || '']);
  return { success: true };
}

// ── 설정 업데이트 ──
function updateSetting(data) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TABS.SETTINGS);

  if (!sheet) {
    sheet = ss.insertSheet(TABS.SETTINGS);
    sheet.appendRow(['key', 'value', 'memo']);
  }

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.key) {
      sheet.getRange(i + 1, 1, 1, 3).setValues([[
        data.key, data.value, data.memo || ''
      ]]);
      return { success: true };
    }
  }

  sheet.appendRow([data.key, data.value, data.memo || '']);
  return { success: true };
}

// ── 학습 진행 기록 ──
function logProgress(data) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TABS.PROGRESS);

  if (!sheet) {
    sheet = ss.insertSheet(TABS.PROGRESS);
    sheet.appendRow(['code', 'stepId', 'completedAt', 'name', 'memo']);
  }

  // 중복 체크 (같은 코드 + 같은 스텝)
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.code && rows[i][1] === data.stepId) {
      // 이미 기록됨 — 날짜 업데이트
      sheet.getRange(i + 1, 3).setValue(data.completedAt || new Date().toISOString());
      return { success: true };
    }
  }

  sheet.appendRow([
    data.code,
    data.stepId,
    data.completedAt || new Date().toISOString(),
    data.name || '',
    data.memo || '',
  ]);
  return { success: true };
}

// ── GET 요청 (상태 확인용) ──
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Mommy Time GAS 웹앱 정상 작동 중!' }))
    .setMimeType(ContentService.MimeType.JSON);
}
