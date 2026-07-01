# KREDU LMS 리뉴얼 프로젝트 에이전트 지침서 (AGENTS.md)

이 지침서는 Next.js 풀스택 아키텍처 기반의 **KREDU LMS 프로젝트**의 에이전트 가이드입니다. 이 프로젝트에서 작업을 수행할 때 반드시 아래의 컨벤션과 가이드를 준수해야 합니다.

---

## 1. 프로젝트 개요 및 기술 스택

- **목적**: Next.js 기반 고성능 풀스택 LMS(학습관리시스템) 사이트 구축
- **프레임워크**: Next.js 16+ (App Router)
- **언어**: TypeScript
- **데이터베이스 / ORM**: PostgreSQL + Prisma ORM
- **인증**: Auth.js (NextAuth.js v5)
- **상태 관리**:
  - Server State: TanStack Query
  - Client State: Zustand
- **스타일링**: CSS Modules + CSS Variables (전역 스타일: `src/styles/globals.css`)

---

## 2. 주요 기능 요구사항 명세

### [1] 사용자 페이지 (Client Portal)
- **회원가입 및 로그인**: Auth.js 기반의 안전한 이메일/패스워드 회원가입 및 역할별(USER, INSTRUCTOR, ADMIN) 권한 관리
- **수강 신청 및 결제**: 포트원 SDK를 연동한 결제 시스템 구축
- **교재 및 수강 결제 쇼핑몰**: 도서 및 교재를 강좌와 함께 결제할 수 있는 심플한 이커머스 기능
- **학습 관리 (진도율)**: 비디오 플레이어 연동을 통한 동영상 시청 위치 및 학습 완료 여부 실시간 체크
- **내 학습 페이지**: 마이페이지를 통한 본인의 수강 현황, 결제 내역, 진도율 리포트 조회
- **온라인 시험**: 강좌별 온라인 시험 응시, 타이머 적용, 채점 및 결과 조회 기능

### [2] 운영자 페이지 (Admin Dashboard)
- **강좌 및 카테고리 관리**: 신규 강좌 등록, 카테고리 분류 관리, 강사 배정
- **수강 및 동영상 등록**: 챕터별 비디오 콘텐츠 업로드 및 재생 시간 설정
- **시험문제 등록**: 강좌와 연계된 문제 출제 및 배점 설정 기능
- **회원 관리**: 전체 회원 상태 조회, 권한(역할) 수정, 수강 권한 수동 부여
- **학습 일정 모니터링 & 통계**: 전체 학생들의 진도율 추이, 학습 시간, 매출 통계 조회
- **문자 일괄 전송**: 학생 그룹별(수강생, 미수료자 등) SMS 알림 일괄 발송 기능
- **수료증 출력**: 진도율 및 시험 점수가 수료 기준을 충족한 경우 PDF/인쇄 형식의 수료증 발급
- **게시판 관리**: Q&A, 수강 후기, 공지사항 관리 및 답변 작성 기능
- **접속 기기 및 IP 추적**: 중복 로그인 방지 및 보안 강화를 위해 유저별 접속 기기 정보 및 IP 주소 로깅/추적 기능

---

## 3. 프로젝트 디렉토리 구조 (App Router)

모든 페이지와 컴포넌트는 App Router 규격 및 도메인 주도 구조에 맞춰 구성되어 있습니다.

- `src/app/(main)`: 메인 페이지 및 공통 레이아웃
- `src/app/(auth)`: 로그인, 회원가입 등 인증 관련 페이지 (URL 경로 생략 그룹)
- `src/app/courses`: 강좌 목록, 상세 정보, 쇼핑몰 결제 페이지
- `src/app/classroom`: 온라인 강의실, 비디오 시청, 온라인 시험 응시 페이지
- `src/app/mypage`: 내 학습 현황, 수강 내역, 진도율 리포트 (마이페이지)
- `src/app/admin`: 관리자 대시보드 및 운영 도구 (독립 레이아웃)
- `src/lib`: Prisma Client, Auth 설정 등 공통 유틸리티 및 라이브러리
- `src/components`: UI 컴포넌트 (Domain-driven structure)

---

## 4. 타사 에이전트 지침 관리 방식

Gemini CLI, Codex, Claude Code 등 타사 에이전트 도구용 지침서(설정 파일)를 프로젝트 루트에 배치할 경우, 지침의 파편화를 방지하기 위해 **해당 지침서 내에는 본 파일(`AGENTS.md`)을 읽고 준수하라는 경로 안내만 작성**해야 합니다.
- **대상 파일**: `CLAUDE.md`

---

## 5. 실행 및 빌드 명령

- **의존성 설치**: `npm install`
- **로컬 개발 서버**: `npm run dev`
- **프로덕션 빌드**: `npm run build`
- **빌드 후 실행**: `npm run start`

### 로컬 개발 DB 서버 제어 (포트 5433)
현재 로컬 개발 환경은 OS 사용자 권한으로 구동하는 **격리된 PostgreSQL 서버(포트 5433)**를 사용합니다.
컴퓨터 재부팅 후 개발을 재개할 때는 반드시 아래 명령으로 DB 서버를 먼저 시작해야 합니다.

```bash
# DB 서버 시작 (개발 재개 시 가장 먼저 실행)
/usr/lib/postgresql/16/bin/pg_ctl \
  -D prisma/db_temp \
  -l prisma/db_temp/postgresql.log \
  -o "-p 5433 -h 127.0.0.1 -k prisma/db_temp" \
  start

# DB 서버 중지
/usr/lib/postgresql/16/bin/pg_ctl -D prisma/db_temp stop

# DB 서버 상태 확인
/usr/lib/postgresql/16/bin/pg_ctl -D prisma/db_temp status
```

- **DATABASE_URL**: `postgresql://handsup@127.0.0.1:5433/kredu_lms?schema=public`
- DB 데이터 위치: `prisma/db_temp/`

---

## 📖 Read Order (작업 범위별 필독 문서)

이 파일은 라우터입니다. 아래 표에 따라 작업 범위에 맞는 문서를 추가로 읽으세요.

| 작업 범위 | 읽을 문서 |
| --- | --- |
| 포트원 결제 연동 구현 | `.agents/skills/portone_payment/SKILL.md` |
| 백엔드 스킬 지침 (Prisma/DB) | `.agents/skills/backend/SKILL.md` |
| 프론트엔드 스킬 지침 (React/TS/UI) | `.agents/skills/frontend/SKILL.md` |
| 작업 계획·승인·완료 보고 절차 | [docs/ai/workflow.md](file:///home/handsup/my-project/lms_01/docs/ai/workflow.md) |

---

## 📏 Global Conventions

### 🔴 절대 규칙 (전역, 위반 금지)
- **No Placeholders:** `replace` 도구 사용 시 `# ... (기존 코드 생략)` 같은 주석을 절대 삽입하지 않습니다. 항상 완전한 코드 블록을 제공합니다.
- **No Partial Imports:** 새로운 클래스·함수 사용 시 파일 상단 `import` 누락 및 중복을 반드시 확인합니다.
- **Security:** API 키·비밀번호 등 민감 정보는 절대 커밋하지 않습니다.

### 🟢 작업 전후 공통 체크리스트
- [ ] 모든 `import` 누락·중복 없음
- [ ] Placeholder 주석(`# ... 생략`) 없음
- [ ] 민감 정보 노출 없음

---

## 🛠 Agent Tooling Notes
- 이 프로젝트는 Codex / Antigravity / Claude Code를 혼용합니다.
- `CLAUDE.md`, `GEMINI.md`는 규칙을 담지 않으며, 이 파일(`AGENTS.md`)을 먼저 읽으라는 안내만 포함합니다.
- `.agents/skills/`는 Codex·Antigravity의 표준 스킬 디렉토리 컨벤션을 따릅니다.