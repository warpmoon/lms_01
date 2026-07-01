# KREDU LMS 리뉴얼 프로젝트 에이전트 지침서 (AGENTS.md)

이 지침서는 Classic ASP 기반의 레거시 LMS를 현대적인 Next.js 풀스택 아키텍처로 리뉴얼하는 **KREDU LMS 프로젝트**의 에이전트 가이드입니다. 이 프로젝트에서 작업을 수행할 때 반드시 아래의 컨벤션과 가이드를 준수해야 합니다.

---

## 1. 프로젝트 개요 및 기술 스택

- **목적**: Classic ASP 레거시 시스템을 Next.js 기반 고성능 풀스택 시스템으로 전환
- **프레임워크**: Next.js 16+ (App Router)
- **언어**: TypeScript
- **데이터베이스 / ORM**: PostgreSQL + Prisma ORM
- **인증**: Auth.js (NextAuth.js v5)
- **상태 관리**:
  - Server State: TanStack Query
  - Client State: Zustand
- **스타일링**: CSS Modules + CSS Variables (전역 스타일: `src/styles/globals.css`)

---

## 2. 프로젝트 디렉토리 구조 (App Router)

모든 페이지와 컴포넌트는 App Router 규격 및 도메인 주도 구조에 맞춰 구성되어 있습니다.

- `src/app/(main)`: 메인 페이지 및 공통 레이아웃
- `src/app/(auth)`: 로그인, 회원가입 등 인증 관련 페이지 (URL 경로 생략 그룹)
- `src/app/courses`: 강좌 목록 및 상세 정보
- `src/app/classroom`: 온라인 강의실 및 비디오 시청 (진도율 체크 연동)
- `src/app/admin`: 관리자 대시보드 및 운영 도구 (독립 레이아웃)
- `src/lib`: Prisma Client, Auth 설정 등 공통 유틸리티 및 라이브러리
- `src/components`: UI 컴포넌트 (Domain-driven structure)

---

## 3. 개발 컨벤션 및 스타일 가이드

### [1] Route Groups 및 파일 네이밍
- 레이아웃 분리 및 논리적 그룹화를 위해 `(groupName)` 폴더 형식을 적극 활용합니다.
- Git 호환성을 위해 디렉토리 및 파일명에 백슬래시(`\`) 등 특수문자가 포함되지 않도록 주의하며, 대괄호(`[]`)와 소괄호(`()`)는 Next.js 표준에 맞춰 사용합니다.

### [2] 데이터 처리 (Server Actions)
- 데이터 변경(Mutation) 및 간단한 조회(Query)는 API Route 대신 **Server Actions**를 우선적으로 사용합니다.
- 복잡한 비즈니스 로직은 `src/lib/actions/` 또는 해당 도메인의 Server Action 파일에 정의합니다.

### [3] 스타일링 (CSS Modules)
- 모든 컴포넌트 레벨 스타일링은 **CSS Modules**(`.module.css`)를 사용합니다.
- 전역 변수는 `src/styles/globals.css`에 선언된 CSS Variables를 참조합니다.
- Ad-hoc 유틸리티 클래스나 Tailwind CSS의 무분별한 사용은 금지됩니다. (필요 시 CSS Variables와 CSS Modules를 통해 엄격히 제어)

### [4] 데이터베이스 및 ORM (Prisma)
- 스키마가 변경될 때마다 다음 명령을 실행하여 클라이언트 동기화를 수행합니다.
  - 빌드 전 동기화: `npx prisma generate`
  - 로컬 개발 환경 DB 반영: `npx prisma db push`
- 데이터 모델 정의 시 PostgreSQL의 특징을 고려하고 관계 설정 시 복합 데이터 모델링 컨벤션을 준수합니다.

---

## 4. 타사 에이전트 지침 관리 방식

Gemini CLI, Codex, Claude Code 등 타사 에이전트 도구용 지침서(설정 파일)를 프로젝트 루트에 배치할 경우, 지침의 파편화를 방지하기 위해 **해당 지침서 내에는 본 파일(`.agents/AGENTS.md`)을 읽고 준수하라는 경로 안내만 작성**해야 합니다.
- **대상 파일**: `.claudecode.md`, `.cursorrules`, `copilot-instructions.md` 등

---

## 5. 실행 및 빌드 명령

- **의존성 설치**: `npm install`
- **로컬 개발 서버**: `npm run dev`
- **프로덕션 빌드**: `npm run build`
- **빌드 후 실행**: `npm run start`
