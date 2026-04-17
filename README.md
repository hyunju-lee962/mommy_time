# 엄마시간 (Mommy Time)

> 아이와 함께 만드는 시간 — 읽고, 이야기하고, 추억을 쌓는 공간

---

## 🌸 서비스 소개

엄마시간은 영어 학습 플랫폼이 아니에요.  
엄마와 아이가 함께 읽고, 이야기하고, 놀면서 추억을 쌓는 공간이에요.  
영어와 문해력은 그 과정에서 자연스럽게 따라와요.

### 핵심 가치
- **함께하는 시간** — 엄마가 옆에 있다는 것만으로 아이에게는 세상이 달라져요
- **대화가 생겨요** — 책 한 권이 저녁 밥상의 이야기 거리가 돼요
- **자연스럽게 자라요** — 즐거운 경험 속에서 영어와 문해력이 스며들어요
- **추억이 쌓여요** — 함께한 시간들이 아이가 평생 기억하는 장면이 돼요

---

## 🗂 서비스 구조

### 페이지 구성

```
index.html                 메인 페이지 (서비스 소개)
pages/
  about.html               엄마시간이란 (철학 + 편지)
  journey.html             배움 여정 (프로그램 목록)
  join.html                참여 안내 (준비중 + FAQ)
admin.html                 관리자 로그인
admin/
  index.html               대시보드
  students.html            수강생 관리
  content.html             콘텐츠 잠금/공개
  stats.html               학습 현황
  settings.html            사이트 설정
studies/
  jolly-phonics/           Jolly Phonics 파닉스
  magic-school-bus/        매직스쿨버스 원서 읽기
assets/
  css/
    common.css             공통 스타일 (변수, nav, 모달, 버튼)
    main.css               레거시 (학습 페이지용)
    admin.css              관리자 페이지 스타일
  js/
    nav.js                 네비게이션 + 로그인 모달
    auth.js                수강 코드 검증 + 콘텐츠 접근 제어
    main.js                TTS + 언어 전환 유틸
    admin.js               관리자 기능
GAS_Code.gs                Google Apps Script (Sheets 쓰기)
SETUP_GUIDE.txt            Google Sheets 설정 가이드
```

---

## 🔐 접근 권한 구조

```
누구나 (로그인 없이)
  ├── 메인, 소개, 배움여정, 참여안내
  ├── Jolly Phonics Group 1, Unit 1 (무료 체험)
  └── Magic School Bus Week 1 (무료 체험)

수강생 (코드 입력 후)
  └── 모든 콘텐츠 전체
```

### 로그인 흐름
1. 네비게이션 우측 **[로그인]** 클릭
2. 모달 팝업 — 수강 코드 입력
3. 처음 방문 시 → 닉네임 설정
4. 완료 → 네비에 `👋 OO님` 표시
5. 재방문 시 → 자동 로그인 (7일 유지)

---

## 📚 콘텐츠 구조

### Jolly Phonics (파닉스)

| Group | 테마 | Units |
|-------|------|-------|
| G1 🟣 | 기초 음가 | U1~U7 (s,a,t ~ j,v,x) |
| G2 🩵 | 이중자음 & Blends | U1~U5 |
| G3 🔵 | 장모음 | U1~U6 |
| G4 🟠 | r-통제 & 이중모음 | U1~U6 |
| G5 🟢 | 변형음 & 묵음 | U1~U6 |
| G6 🔵 | 접미사 & 어원 | U1~U6 |
| G7 🔴 | 고급 패턴 | U1~U6 |

**각 Unit = 10 Steps**
| Step | 내용 |
|------|------|
| 01 | 🔊 Sound Introduction |
| 02 | ✍️ Letter Formation |
| 03 | 👂 Sound Discrimination |
| 04 | 📖 Word Cards |
| 05 | 🔤 Blending Practice |
| 06 | 📚 Decodable Stories (5편) |
| 07 | ⭐ Tricky Words |
| 08 | 🎮 Games (Mom vs Kid) |
| 09 | 💬 Talk Together (하브루타) |
| 10 | 📔 My Phonics Journal |

### Magic School Bus (원서 읽기)
- Week 1: 태양계로 날아라 (Lost in the Solar System) ✅

---

## ⚙️ 기술 스택

```
Frontend   정적 HTML / CSS / JavaScript (Vanilla)
Hosting    Netlify (GitHub 자동 배포)
Data       Google Sheets API (수강생 관리, 콘텐츠 잠금)
Auth       Google Apps Script (Sheets 쓰기)
TTS        Web Speech API (en-GB)
```

**선택 이유:** 서버 없이 무료로 운영 가능한 구조

---

## 🚀 배포 방법

### 1. GitHub에 push
```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

### 2. Netlify 자동 배포
- GitHub push 감지 → 자동 빌드 및 배포
- 배포 확인: https://app.netlify.com → Deploys 탭

---

## 🔧 배포 전 설정 (필수)

### 1. Google Sheets 생성
탭 이름: `students`

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| code | name | expires | groups | active | memo |

예시 데이터:
```
TEST0000 | 테스트 | 2099-12-31 | ALL | TRUE | 테스트용
```

### 2. Google API Key 발급
1. https://console.cloud.google.com 접속
2. Google Sheets API 활성화
3. API Key 발급

### 3. Google Apps Script 배포
1. https://script.google.com 에서 새 프로젝트
2. `GAS_Code.gs` 내용 붙여넣기
3. `SHEET_ID` 교체 후 웹앱으로 배포

### 4. 파일 수정

**`assets/js/auth.js`**
```javascript
window.MT_CONFIG = {
  SHEET_ID: 'YOUR_SHEET_ID_HERE',   // ← 교체
  API_KEY:  'YOUR_GOOGLE_API_KEY_HERE', // ← 교체
  GAS_URL:  'YOUR_GAS_URL_HERE',    // ← 교체
};
```

**`assets/js/admin.js`**
```javascript
window.AdminCfg = {
  SHEET_ID:  'YOUR_SHEET_ID_HERE',  // ← 교체
  API_KEY:   'YOUR_GOOGLE_API_KEY_HERE', // ← 교체
  GAS_URL:   'YOUR_GAS_URL_HERE',   // ← 교체
  ADMIN_PW:  'mommytime2024!',      // ← 반드시 변경
};
```

---

## 🖥 네비게이션 구조

```
엄마시간  |  엄마시간이란  배움 여정  참여 안내  [로그인]
```

- **엄마시간이란** → `pages/about.html`
- **배움 여정** → `pages/journey.html`
- **참여 안내** → `pages/join.html`
- **[로그인]** → 모달 팝업 (수강 코드 입력)

---

## 📋 수강생 관리 (Admin)

접속: `/admin.html` → 비밀번호 입력

| 메뉴 | 기능 |
|------|------|
| 대시보드 | 수강생 현황, 콘텐츠 공개 현황 |
| 수강생 관리 | 코드 발급, 활성화/비활성화, 만료일 관리 |
| 콘텐츠 잠금 | Group/Unit/Step 단위 잠금/공개 |
| 학습 현황 | 수강생별 진행률 |
| 사이트 설정 | 공지 배너, API 설정 |

---

## 🗺 향후 계획

### 콘텐츠
- [ ] Magic School Bus Week 2~5 (책 내용 준비 필요)
- [ ] 문해력 놀이 카테고리
- [ ] 몬테소리 카테고리
- [ ] 참여 안내 페이지 완성

### 기능
- [ ] 커스텀 도메인 연결
- [ ] 학습 진행률 시각화
- [ ] 수강생 학습 리포트

---

## 💬 문의

카카오톡 채널: @엄마시간

---

*© 2025 엄마시간 · 아이와 함께 만드는 시간*
