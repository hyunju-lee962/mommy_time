/**
 * Mommy Time — Admin 공통 스크립트 (admin.js)
 * Google Sheets 읽기/쓰기 + Admin 인증
 *
 * ⚠️ 배포 전 설정:
 *   CONFIG.SHEET_ID  → Google Sheets ID
 *   CONFIG.API_KEY   → Google API Key (읽기용)
 *   CONFIG.GAS_URL   → Google Apps Script 웹앱 URL (쓰기용)
 *   CONFIG.ADMIN_PW  → 관리자 비밀번호
 */

(function () {
  'use strict';

  window.AdminCfg = {
    SHEET_ID:  'YOUR_SHEET_ID_HERE',
    API_KEY:   'YOUR_GOOGLE_API_KEY_HERE',
    GAS_URL:   'YOUR_GAS_URL_HERE',      // Apps Script 웹앱 URL (쓰기용)
    ADMIN_PW:  'mommytime2024!',         // 관리자 비밀번호 (배포 전 변경!)
    LS_KEY:    'mt_admin',
    SESSION_H: 4,                        // 세션 유지 시간(h)
    TABS: {
      STUDENTS: 'students',
      CONTENT:  'content',
      SETTINGS: 'settings',
    },
  };

  // ══════════════════════════════
  //  Admin 인증
  // ══════════════════════════════
  window.AdminAuth = {
    isLoggedIn: function () {
      var s = localStorage.getItem(AdminCfg.LS_KEY);
      var e = localStorage.getItem(AdminCfg.LS_KEY + '_exp');
      if (!s || !e) return false;
      if (Date.now() > parseInt(e, 10)) { AdminAuth.logout(); return false; }
      return true;
    },
    login: function (pw) {
      if (pw !== AdminCfg.ADMIN_PW) return false;
      var exp = Date.now() + AdminCfg.SESSION_H * 3600000;
      localStorage.setItem(AdminCfg.LS_KEY, '1');
      localStorage.setItem(AdminCfg.LS_KEY + '_exp', String(exp));
      return true;
    },
    logout: function () {
      localStorage.removeItem(AdminCfg.LS_KEY);
      localStorage.removeItem(AdminCfg.LS_KEY + '_exp');
    },
    guard: function () {
      if (!AdminAuth.isLoggedIn()) {
        window.location.replace('/admin.html');
      }
    },
  };

  // ══════════════════════════════
  //  Google Sheets 읽기 (API Key)
  // ══════════════════════════════
  window.SheetsRead = {
    getRange: function (tab, range, cb) {
      var full = encodeURIComponent(tab + '!' + range);
      var url  = 'https://sheets.googleapis.com/v4/spreadsheets/'
               + AdminCfg.SHEET_ID + '/values/' + full
               + '?key=' + AdminCfg.API_KEY;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) return cb('API 오류: ' + xhr.status, null);
        try {
          var data = JSON.parse(xhr.responseText);
          cb(null, data.values || []);
        } catch (e) { cb('파싱 오류', null); }
      };
      xhr.send();
    },

    /** students 탭 전체 읽기 */
    getStudents: function (cb) {
      SheetsRead.getRange(AdminCfg.TABS.STUDENTS, 'A2:F200', function (err, rows) {
        if (err) return cb(err, null);
        var students = rows.map(function (r) {
          return {
            code:    r[0] || '',
            name:    r[1] || '',
            expires: r[2] || '',
            groups:  r[3] || 'ALL',
            active:  (r[4] || 'TRUE').toUpperCase() === 'TRUE',
            memo:    r[5] || '',
          };
        }).filter(function (s) { return s.code; });
        cb(null, students);
      });
    },

    /** content 탭 전체 읽기 */
    getContent: function (cb) {
      SheetsRead.getRange(AdminCfg.TABS.CONTENT, 'A2:E100', function (err, rows) {
        if (err) return cb(err, null);
        var content = rows.map(function (r) {
          return {
            id:      r[0] || '',   // 예: G1, G1-U1, G1-U1-S01
            label:   r[1] || '',
            type:    r[2] || '',   // group / unit / step
            locked:  (r[3] || 'FALSE').toUpperCase() === 'TRUE',
            memo:    r[4] || '',
          };
        }).filter(function (c) { return c.id; });
        cb(null, content);
      });
    },

    /** settings 탭 읽기 */
    getSettings: function (cb) {
      SheetsRead.getRange(AdminCfg.TABS.SETTINGS, 'A2:C50', function (err, rows) {
        if (err) return cb(err, null);
        var settings = {};
        rows.forEach(function (r) {
          if (r[0]) settings[r[0]] = { value: r[1] || '', memo: r[2] || '' };
        });
        cb(null, settings);
      });
    },
  };

  // ══════════════════════════════
  //  Google Sheets 쓰기 (Apps Script)
  // ══════════════════════════════
  window.SheetsWrite = {
    /**
     * Apps Script 웹앱에 POST 요청
     * action: 'addStudent' | 'updateStudent' | 'deleteStudent'
     *         'updateContent' | 'updateSetting'
     */
    post: function (action, payload, cb) {
      if (!AdminCfg.GAS_URL || AdminCfg.GAS_URL === 'YOUR_GAS_URL_HERE') {
        // GAS 미설정 시 안내
        return cb('Google Apps Script URL이 설정되지 않았어요.\nSETUP_GUIDE.txt를 참고해주세요.');
      }
      var xhr = new XMLHttpRequest();
      xhr.open('POST', AdminCfg.GAS_URL, true);
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) return cb('서버 오류: ' + xhr.status);
        try {
          var res = JSON.parse(xhr.responseText);
          if (res.success) cb(null, res);
          else cb(res.error || '알 수 없는 오류');
        } catch (e) { cb('응답 파싱 오류'); }
      };
      xhr.send(JSON.stringify({ action: action, data: payload }));
    },

    addStudent:    function (d, cb) { SheetsWrite.post('addStudent', d, cb); },
    updateStudent: function (d, cb) { SheetsWrite.post('updateStudent', d, cb); },
    deleteStudent: function (d, cb) { SheetsWrite.post('deleteStudent', d, cb); },
    updateContent: function (d, cb) { SheetsWrite.post('updateContent', d, cb); },
    updateSetting: function (d, cb) { SheetsWrite.post('updateSetting', d, cb); },
  };

  // ══════════════════════════════
  //  유틸리티
  // ══════════════════════════════
  window.AdminUtil = {
    /** 랜덤 수강 코드 생성 (6자리) */
    genCode: function () {
      var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      var code  = '';
      for (var i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    },

    /** 오늘 기준 N개월 후 날짜 */
    addMonths: function (n) {
      var d = new Date();
      d.setMonth(d.getMonth() + n);
      return d.toISOString().slice(0, 10);
    },

    /** 날짜 만료 여부 */
    isExpired: function (dateStr) {
      return dateStr < new Date().toISOString().slice(0, 10);
    },

    /** 토스트 메시지 */
    toast: function (msg, type) {
      var t = document.createElement('div');
      var bg = type === 'error' ? '#E24B4A' : type === 'warn' ? '#F9C74F' : '#52B788';
      t.style.cssText = [
        'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
        'padding:14px 20px', 'border-radius:14px',
        'background:' + bg, 'color:#fff',
        'font-family:Nunito,sans-serif', 'font-size:14px', 'font-weight:700',
        'box-shadow:0 4px 20px rgba(0,0,0,.15)',
        'animation:toastIn .3s ease',
        'max-width:300px', 'line-height:1.5',
      ].join(';');
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () {
        t.style.animation = 'toastOut .3s ease forwards';
        setTimeout(function () { t.remove(); }, 300);
      }, 3000);
    },

    /** 로딩 오버레이 */
    showLoading: function (msg) {
      var el = document.getElementById('adminLoading');
      if (el) { el.querySelector('.al-msg').textContent = msg || '처리 중...'; el.style.display = 'flex'; }
    },
    hideLoading: function () {
      var el = document.getElementById('adminLoading');
      if (el) el.style.display = 'none';
    },
  };

})();
