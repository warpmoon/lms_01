# Changelog

All notable changes to this project will be documented in this file.

## [2026-07-01]

#### Backend
- **[추가]** `prisma/schema.prisma` · `Book` (교재), `OrderItem` (주문상세), `Exam` (시험), `Question` (시험문제), `Choice` (선지), `Submission` (제출), `Certificate` (수료증), `AccessLog` (접속로그) 데이터 모델 신설
- **[변경]** `prisma/schema.prisma` · `Order`와 `Course` 간의 직접적인 N:1 결합 관계를 제거하고, 다중 구매/결제를 위해 `OrderItem`을 매개로 하는 1:N:1 다대다 형태의 매핑 구조로 변경
- **[변경]** `src/app/product/checkout/actions.ts` · 개편된 주문 상세 구조(`OrderItem` 중첩 생성)에 대응하여 `createOrder` 쿼리 수정 및 보완
- **[추가]** `src/app/mypage/actions.ts` · 유저의 수강 강좌(`getMyEnrollments`), 주문 내역(`getMyOrders`), 강좌별 강의 진척 백분율 분석(`getMyProgressReport`) 데이터 조회용 Server Actions 개발
- **[추가]** `src/app/classroom/[courseId]/exam/actions.ts` · 보안을 위해 정답여부(`isCorrect`)를 소거하고 시험지를 가져오는 `getExamData` 및 서버 사이드 채점 & 채점기록을 누적 저장하는 `submitExam` Server Actions 개발
- **[변경]** `src/app/product/checkout/actions.ts` · 포트원 V2 외부 결제 상세 조회 API를 통한 실시간 금액 위변조 교차 검증(`verifyPayment`) 및 검증 실패 시 자동 결제 취소 API 연동
- **[추가]** `src/app/product/checkout/actions.ts` · 결제 검증 완료와 동시에 `prisma.$transaction`을 실행하여 주문한 강좌들의 수강 진도(`Progress`) 데이터를 일괄 자동 생성(수강 권한 즉시 활성화)하는 비즈니스 파이프라인 탑재
- **[추가]** `.env`, `.env.example` · 포트원 API 연동용 `PORTONE_API_SECRET` 환경 변수 기입 및 가이드 갱신
- **[추가]** `src/app/admin/courses/actions.ts` · 카테고리 생성/삭제 및 강좌 개설/수정/삭제 CRUD 비즈니스 로직과 담당 강사(User 중 강사/어드민) 풀 조회 Server Actions 개발
- **[추가]** `src/app/admin/courses/[courseId]/lessons/actions.ts` · 특정 강좌의 레슨 리스트 정렬 조회(`getCourseAndLessons`), 강의 신규 등록(`createLesson`), 정보 수정(`updateLesson`), 삭제(`deleteLesson`)를 연동하는 백오피스 Server Actions 개발
- **[추가]** `src/app/admin/users/actions.ts` · 어드민 전체 가입 회원 조회(`getAllUsers`), 수강 신청 승인을 위한 강좌 목록 조회(`getAllCoursesList`), 회원 등급 변경(`updateUserRole`), 특정 유저 수강 승인 부여(`grantCourseAccess`) 및 회수(`revokeCourseAccess`)를 위한 Server Actions 개발

#### Frontend
- **[추가]** `src/app/mypage/page.tsx` · 유저 학습 대시보드 마이페이지 신설 (Next.js 15+ 비동기 searchParams 기반 탭 라우팅 구현)
- **[추가]** `src/app/mypage/MyPage.module.css` · 탭 컨트롤, 수강 카드 정보, 실시간 진도율 progress bar, 결제 내역 테이블 UI CSS Modules 스타일 구축
- **[추가]** `src/app/classroom/[courseId]/exam/page.tsx` · 온라인 시험 응시 진입 관문 및 동적 params Promise 비동기 래핑 페이지 구축
- **[추가]** `src/app/classroom/[courseId]/exam/ExamForm.tsx` · 실시간 타이머(시간 경과 시 자동 수집), 문항 무결성 렌더링, 채점 결과 화면 탭 전환을 수행하는 클라이언트 모듈 구축
- **[추가]** `src/app/classroom/[courseId]/exam/ExamPage.module.css` · 플로팅 스톱워치, 시험지 서식, Pass/Fail 결과 연출 카드 UI CSS Modules 스타일 구축
- **[추가]** `src/app/admin/courses/page.tsx` · 어드민용 강좌/카테고리 관리 대시보드 페이지 구축 (ADMIN 역할 세션 검증 적용)
- **[추가]** `src/app/admin/courses/CourseForm.tsx` · 분류 생성, 신규 강좌 정보 기입 및 강사 지정 배정 모달 폼 컨트롤과 전체 카테고리별 테이블 목록 렌더링을 처리하는 백오피스 인터랙션 클라이언트 단 구축
- **[변경]** `src/app/admin/courses/CourseForm.tsx` · 각 강좌 행의 액션 셀에 '강의 관리' Link 바로가기 단추 이식 완료
- **[추가]** `src/app/admin/courses/[courseId]/lessons/page.tsx` · 어드민용 특정 강좌 산하의 세부 레슨 관리 라우팅 페이지 구축
- **[추가]** `src/app/admin/courses/[courseId]/lessons/LessonForm.tsx` · 강의 순서(Order) 매핑, 영상 재생 시간(분/초 분할 연산 입력), 비디오 주소 정보 입력 모달 폼 제어 및 레슨 테이블 리스트 렌더링 클라이언트 단 구축
- **[추가]** `src/app/admin/courses/[courseId]/lessons/AdminLessons.module.css` · 레슨 목록 테이블, 등록/수정 모달창 서식 UI CSS Modules 스타일 구축
- **[추가]** `src/app/admin/users/page.tsx` · 어드민용 전체 회원 조회 및 관리 대시보드 페이지 구축
- **[추가]** `src/app/admin/users/UserManagementForm.tsx` · 유저 권한 변경 동기화, 개별 회원 전용 수강 권한 상세 목록 모달 컨트롤러, 수동 권한 승인 및 회수 핸들링 클라이언트 단 개발
- **[추가]** `src/app/admin/users/AdminUsers.module.css` · 회원 테이블 목록, 모달 오버레이 팝업, 수강 강좌 인라인 배지 UI CSS Modules 스타일 구축

#### Convention 변경
- **[신규]** `.agents/skills/frontend/SKILL.md` · 프론트엔드 컴포넌트, 상태 관리, CSS Modules, Suspense 래핑 가이드라인 신설
- **[신규]** `.agents/skills/backend/SKILL.md` · 백엔드 Server Actions 규격, Prisma 스키마 변경, Next.js 15+ 비동기 params 대응 지침 신설
- **[변경]** `AGENTS.md` · 개별 프론트엔드/백엔드 가이드를 모듈화된 개별 SKILL.md로 분할하고 루트 지침서를 경량화(관문 라우터 및 전역 규정으로 갱신)
