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
- **[버그수정]** `src/lib/auth.ts` · Auth.js(NextAuth)의 jwt 및 session 콜백 함수를 수정하여 클라이언트 세션 객체에 사용자 고유 식별자(`user.id`) 바인딩이 누락되던 심각한 보안/라우트 접근 불가 예외 교정 완료
- **[추가]** `src/app/admin/actions.ts` · 어드민 대시보드 4대 핵심 지표(전체 유저, 강좌 수, 당일 매출액, Q&A 개수) DB 실시간 집계 쿼리 및 최근 가입/결제완료/질문등록 이벤트를 시간순으로 병합 조회하는 타임라인 Server Actions 개발
- **[추가]** `prisma/schema.prisma` · 4대 유형별 시험을 지원하기 위해 `QuestionType` Enum (`OX`, `MULTIPLE_CHOICE`, `SHORT_ANSWER`, `DESCRIPTIVE`) 신설, `Question`에 `type` 및 `correctAnswer` 컬럼 추가, `Submission`에 제출 답안 원본 보관용 `answersJson` 컬럼 추가 마이그레이션 적용
- **[추가]** `src/app/admin/courses/[courseId]/exam/actions.ts` · 어드민용 시험 상세조회(`getCourseExamDetails`), 시험 규격 저장(`createOrUpdateExam`), 4대 유형별 문항 및 N개 선택지 트랜잭션 출제(`createQuestion`), 문항 삭제(`deleteQuestion`) Server Actions 개발
- **[변경]** `src/app/classroom/[courseId]/exam/actions.ts` · OX(선지대조), 객관식(선지대조), 단답형(텍스트 공백/대소문자 제거 비교) 채점 조건 분기 및 제출 답안 `answersJson` 문자열 저장 맵핑이 적용된 확장 채점 엔진 업데이트 완료

#### Frontend
- **[추가]** `src/app/mypage/page.tsx` · 유저 학습 대시보드 마이페이지 신설 (Next.js 15+ 비동기 searchParams 기반 탭 라우팅 구현)
- **[추가]** `src/app/mypage/MyPage.module.css` · 탭 컨트롤, 수강 카드 정보, 실시간 진도율 progress bar, 결제 내역 테이블 UI CSS Modules 스타일 구축
- **[추가]** `src/app/classroom/[courseId]/exam/page.tsx` · 온라인 시험 응시 진입 관문 및 동적 params Promise 비동기 래핑 페이지 구축
- **[추가]** `src/app/classroom/[courseId]/exam/ExamForm.tsx` · 실시간 타이머(시간 경과 시 자동 수집), 문항 무결성 렌더링, 채점 결과 화면 탭 전환을 수행하는 클라이언트 모듈 구축
- **[추가]** `src/app/classroom/[courseId]/exam/ExamPage.module.css` · 플로팅 스톱워치, 시험지 서식, Pass/Fail 결과 연출 카드 UI CSS Modules 스타일 구축
- **[추가]** `src/app/admin/courses/page.tsx` · 어드민용 강좌/카테고리 관리 대시보드 페이지 구축 (ADMIN 역할 세션 검증 적용)
- **[추가]** `src/app/admin/courses/CourseForm.tsx` · 분류 생성, 신규 강좌 정보 기입 및 강사 지정 배정 모달 폼 컨트롤과 전체 카테고리별 테이블 목록 렌더링을 처리하는 백오피스 인터랙션 클라이언트 단 구축
- **[변경]** `src/app/admin/courses/CourseForm.tsx` · 각 강좌 행의 액션 셀에 '강의 관리' 및 '시험 출제' Link 바로가기 단추 이식 완료
- **[추가]** `src/app/admin/courses/[courseId]/lessons/page.tsx` · 어드민용 특정 강좌 산하의 세부 레슨 관리 라우팅 페이지 구축
- **[추가]** `src/app/admin/courses/[courseId]/lessons/LessonForm.tsx` · 강의 순서(Order) 매핑, 영상 재생 시간(분/초 연산 입력), 비디오 주소 정보 입력 모달 폼 제어 및 레슨 테이블 리스트 렌더링 클라이언트 단 구축
- **[추가]** `src/app/admin/courses/[courseId]/lessons/AdminLessons.module.css` · 레슨 목록 테이블, 등록/수정 모달창 서식 UI CSS Modules 스타일 구축
- **[추가]** `src/app/admin/users/page.tsx` · 어드민용 전체 회원 조회 및 관리 대시보드 페이지 구축
- **[추가]** `src/app/admin/users/UserManagementForm.tsx` · 유저 권한 변경 동기화, 개별 회원 전용 수강 권한 상세 목록 모달 컨트롤러, 수동 권한 승인 및 회수 핸들링 클라이언트 단 개발
- **[추가]** `src/app/admin/users/AdminUsers.module.css` · 회원 테이블 목록, 모달 오버레이 팝업, 수강 강좌 인라인 배지 UI CSS Modules 스타일 구축
- **[변경]** `src/app/admin/page.tsx` · 대시보드 메인 페이지의 하드코딩 지표를 걷어내고 실시간 DB 수치 및 다각도 타임라인 테이블 동적 연동 완료
- **[변경]** `src/app/admin/AdminPage.module.css` · 가입, 결제완료, Q&A 알림 타임라인 배지 등급별 컬러 스타일링 추가 구축
- **[버그수정]** `src/app/admin/courses/CourseForm.tsx` · 카테고리가 0개일 때 '신규 강좌 개설' 잠금 단추의 비활성화(disabled)를 지우고, 클릭 시 카테고리 추가 팝업을 연계하여 안내 가이드를 띄우도록 사용성(UX) 오류 긴급 교정 완료
- **[버그수정]** `AdminCourses.module.css`, `AdminLessons.module.css`, `AdminUsers.module.css` · 모달창 내 입력 박스(input, textarea, select)에 `box-sizing: border-box`를 일괄 부여하여 가로 영역 우측으로 폼 요소가 삐져나가던 레이아웃 버그 보정 완료
- **[추가]** `src/app/admin/courses/[courseId]/exam/page.tsx` · 어드민 시험 출제 매니저 라우트 페이지 신설 (ADMIN 세션 가드 및 Promise params 반영)
- **[추가]** `src/app/admin/courses/[courseId]/exam/ExamForm.tsx` · 드롭다운 선택에 따라 OX(참/거짓), 객관식(N개 선지 동적 가감), 단답형(정답 텍스트), 서술형(모범 가이드) 입력 필드가 동적으로 노출되는 대화형 문항 출제 및 시험 타이머 기본 규격 설정 제어 클라이언트 컴포넌트 개발 완료
- **[추가]** `src/app/admin/courses/[courseId]/exam/AdminExam.module.css` · 가로 이탈 방지형 폼 박스 모델, 출제 문항 정보 카드, OX 정답체크 및 라디오 단추 CSS Modules 스타일링 신설
- **[변경]** `src/app/classroom/[courseId]/exam/ExamForm.tsx` · 4대 문제 유형 구조에 반응하여 OX형 라디오, 객관식 라디오, 단답형 text input, 서술형 textarea를 문항 카드마다 적확하게 교체해 렌더링하는 다차원 시험 응시실 화면으로 고도화 확장 완료

#### Convention 변경
- **[신규]** `.agents/skills/frontend/SKILL.md` · 프론트엔드 컴포넌트, 상태 관리, CSS Modules, Suspense 래핑 가이드라인 신설
- **[신규]** `.agents/skills/backend/SKILL.md` · 백엔드 Server Actions 규격, Prisma 스키마 변경, Next.js 15+ 비동기 params 대응 지침 신설
- **[변경]** `AGENTS.md` · 개별 프론트엔드/백엔드 가이드를 모듈화된 개별 SKILL.md로 분할하고 루트 지침서를 경량화(관문 라우터 및 전역 규정으로 갱신)
