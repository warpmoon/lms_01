# Changelog

All notable changes to this project will be documented in this file.

## [2026-07-01]

#### Backend
- **[추가]** `prisma/schema.prisma` · `Book` (교재), `OrderItem` (주문상세), `Exam` (시험), `Question` (시험문제), `Choice` (선지), `Submission` (제출), `Certificate` (수료증), `AccessLog` (접속로그) 데이터 모델 신설
- **[변경]** `prisma/schema.prisma` · `Order`와 `Course` 간의 직접적인 N:1 결합 관계를 제거하고, 다중 구매/결제를 위해 `OrderItem`을 매개로 하는 1:N:1 다대다 형태의 매핑 구조로 변경
- **[변경]** `src/app/product/checkout/actions.ts` · 개편된 주문 상세 구조(`OrderItem` 중첩 생성)에 대응하여 `createOrder` 쿼리 수정 및 보완
- **[추가]** `src/app/mypage/actions.ts` · 유저의 수강 강좌(`getMyEnrollments`), 주문 내역(`getMyOrders`), 강좌별 강의 진척 백분율 분석(`getMyProgressReport`) 데이터 조회용 Server Actions 개발

#### Frontend
- **[추가]** `src/app/mypage/page.tsx` · 유저 학습 대시보드 마이페이지 신설 (Next.js 15+ 비동기 searchParams 기반 탭 라우팅 구현)
- **[추가]** `src/app/mypage/MyPage.module.css` · 탭 컨트롤, 수강 카드 정보, 실시간 진도율 progress bar, 결제 내역 테이블 UI CSS Modules 스타일 구축

#### Convention 변경
- **[신규]** `.agents/skills/frontend/SKILL.md` · 프론트엔드 컴포넌트, 상태 관리, CSS Modules, Suspense 래핑 가이드라인 신설
- **[신규]** `.agents/skills/backend/SKILL.md` · 백엔드 Server Actions 규격, Prisma 스키마 변경, Next.js 15+ 비동기 params 대응 지침 신설
- **[변경]** `AGENTS.md` · 개별 프론트엔드/백엔드 가이드를 모듈화된 개별 SKILL.md로 분할하고 루트 지침서를 경량화(관문 라우터 및 전역 규정으로 갱신)
