const SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

async function checkAttendance(userName, studyName, week) {
  const data = { name: userName, study: studyName, week: week, date: new Date().toLocaleDateString('ko-KR') };
  try {
    await fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
    alert('✅ 출석 체크 완료! ' + userName + '님, 수고하셨어요 🎉');
  } catch (e) {
    alert('잠시 후 다시 시도해주세요.');
  }
}
