---
name: backend
description: KREDU LMS 프로젝트에서 PostgreSQL 데이터베이스, Prisma ORM, Next.js Server Actions 및 Dynamic API Route의 비동기 파라미터 제어를 안전하게 구현하기 위한 백엔드 개발 가이드라인입니다.
---

# 백엔드 개발 지침 (backend/SKILL.md)

이 지침서는 Next.js App Router 기반의 KREDU LMS 백엔드 영역(서버 로직, 데이터 모델, DB 통신)을 작업할 때 반드시 준수해야 하는 코딩 표준과 데이터 처리 규칙을 정의합니다.

---

## 1. 데이터 처리 및 Server Actions

- **Server Actions 우선 적용**: 데이터 생성, 수정, 삭제(Mutation) 및 간단한 개별 데이터 조회는 API Route 대신 **Server Actions**를 우선적으로 정의하여 사용합니다.
- **로직 격리**: 복잡한 서버 비즈니스 로직은 `src/lib/actions/` 또는 해당 도메인의 Server Action 파일에 완전히 분리하여 작성합니다.
- **인라인 선언 시 지시어 오타 주의**: Server Component가 아닌 곳(예: 클라이언트 액션 폼 바인딩 등)에서 인라인으로 Server Action을 정의할 때, 인라인 지시어 문자열은 **반드시 `"use server"`로 정확히 작성**해야 합니다.
  
  ```typescript
  // ✅ 올바른 사용 예시 (use server 띄어쓰기 및 소문자 확인)
  <form action={async () => { "use server"; await signOut(); }}>

  // ❌ 잘못된 사용 예시 (useServer 등의 카멜케이스 오타로 인한 런타임 에러 방지)
  <form action={async () => { "useServer"; await signOut(); }}>
  ```

---

## 2. 데이터베이스 및 ORM (Prisma)

- **스키마 변경 동기화**: Prisma 스키마(`prisma/schema.prisma`)가 수정될 때마다 다음 명령을 실행하여 클라이언트 동기화를 수행합니다.
  - 빌드 전 동기화: `npx prisma generate`
  - 로컬 개발 환경 DB 반영: `npx prisma db push`
- **로컬 격리 DB 활용**: 로컬 개발 중에는 5433 포트의 격리된 PostgreSQL 개발 서버를 사용하므로, 데이터가 타인의 작업 영역에 영향을 미치지 않도록 관리합니다.

---

## 3. Dynamic Route 파라미터 처리 (Next.js 15+ 필수 규칙)

Next.js 15 이상 버전부터 Dynamic Route의 `params`와 `searchParams`는 **비동기(Promise) 객체**입니다. 타입 에러 및 빌드 오류 방지를 위해 반드시 `Promise` 타입을 명시하고 `await params`로 처리해야 합니다.

```typescript
// ✅ Page 컴포넌트의 올바른 처리 패턴
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseDetail(courseId);
  // ...
}

// ✅ Route Handler (API)의 올바른 처리 패턴
export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    // ...
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
```

---

## 4. 작업 전후 공통 체크리스트
- [ ] Server Action 내 인라인 지시어가 `"use server"`로 완벽히 일치하는가?
- [ ] Dynamic Route 및 API의 `params` 타입이 `Promise`로 지정되고 비동기로 처리되었는가?
- [ ] Prisma Schema 수정 후 `db push` 및 `generate`를 성공적으로 완료했는가?
- [ ] API 키나 계정 비밀번호 등의 보안 위험 요소가 노출되지 않았는가?
