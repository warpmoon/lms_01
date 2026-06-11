# KREDU LMS 리뉴얼 프로젝트 (Next.js Renewal)

Classic ASP 기반의 레거시 LMS를 현대적인 Next.js 풀스택 아키텍처로 리뉴얼하는 프로젝트입니다.

## 프로젝트 개요
- **목적**: 노후화된 ASP 시스템을 고성능, 유지보수가 용이한 최신 웹 스택으로 전환
- **주요 도메인**: 메인 서비스, 인증(Auth), 강좌 카탈로그, 온라인 강의실(LMS), 마이페이지, 주문/결제, 관리자 대시보드
- **핵심 기능**: 비디오 플레이어 연동 진도율 체크, Auth.js 기반 권한 관리, Prisma를 통한 복합 데이터 모델링

## 기술 스택 (Tech Stack)
- **Framework**: [Next.js 16+ (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Database/ORM**: PostgreSQL + [Prisma](https://www.prisma.io/)
- **Authentication**: [Auth.js (NextAuth.js v5)](https://authjs.dev/)
- **State Management**: TanStack Query (Server State), Zustand (Client State)
- **Styling**: CSS Modules + CSS Variables

## 주요 디렉토리 구조 (App Router)
- `src/app/(main)`: 메인 페이지 및 공통 레이아웃
- `src/app/(auth)`: 로그인, 회원가입 등 인증 관련 페이지 (URL에서 경로 생략)
- `src/app/courses`: 강좌 목록 및 상세 정보
- `src/app/classroom`: 내 강의실 및 비디오 시청 (진도율 체크 포함)
- `src/app/admin`: 관리자 전용 대시보드 및 운영 도구 (독립 레이아웃)
- `src/lib`: Prisma Client, Auth 설정 등 공통 라이브러리
- `src/components`: UI 컴포넌트 (Domain-driven structure)

## 실행 및 빌드 명령
- **의존성 설치**: `npm install`
- **로컬 개발 서버**: `npm run dev`
- **프로덕션 빌드**: `npm run build`
- **빌드 후 실행**: `npm run start`
- **데이터베이스 동기화**: `npx prisma db push` 또는 `npx prisma generate`

## 개발 컨벤션
1. **Route Groups**: 레이아웃 분리 및 논리적 그룹화를 위해 `(groupName)` 폴더 형식을 적극 활용합니다.
2. **Server Actions**: 데이터 변조(Mutation) 및 간단한 조구(Query)는 API Route 대신 Server Actions를 우선적으로 사용합니다.
3. **Styling**: 전역 스타일은 `src/styles/globals.css`에서 관리하며, 컴포넌트 레벨은 `.module.css`를 사용합니다.
4. **Git Compatibility**: 디렉토리 명에 백슬래시(`\`) 등 특수문자가 포함되지 않도록 주의하며, 대괄호(`[]`)와 소괄호(`()`)는 Next.js 표준에 맞춰 사용합니다.

## TODO / 진행 예정 사항
- [ ] 포트원(Portone) SDK 연동 결제 프로세스 구현
- [ ] 관리자 페이지 회원/강좌 관리 상세 기능
- [ ] 실시간 Q&A 및 커뮤니티 기능 고도화
