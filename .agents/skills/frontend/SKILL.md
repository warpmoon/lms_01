---
name: frontend
description: KREDU LMS 프로젝트에서 React, TypeScript, UI 컴포넌트 설계 및 CSS Modules 스타일링 작업을 반복적이고 일관성 있게 구현하기 위한 프론트엔드 개발 가이드라인입니다.
---

# 프론트엔드 개발 지침 (frontend/SKILL.md)

이 지침서는 Next.js App Router 기반의 KREDU LMS 프론트엔드 영역을 작업할 때 반드시 준수해야 하는 코딩 표준과 컴포넌트 설계 규칙을 정의합니다.

---

## 1. 컴포넌트 스타일링 및 CSS Modules

- **CSS Modules 원칙**: 컴포넌트 레벨의 모든 스타일링은 반드시 **CSS Modules**(`.module.css`)를 사용하여 스타일의 오염과 충돌을 방지합니다.
- **전역 변수 참조**: 색상, 폰트 크기, 간격 등 디자인 시스템에 정의된 변수들은 `src/styles/globals.css`에 선언된 CSS Variables를 참조하여 사용합니다.
- **Tailwind CSS 사용 자제**: Ad-hoc 유틸리티 클래스나 Tailwind CSS의 무분별한 사용은 금지되며, 일관된 UI 설계를 위해 CSS Variables와 CSS Modules를 통해서만 제어합니다.

---

## 2. 파일 네이밍 및 Route Groups

- **Route Groups**: 레이아웃 분리 및 논리적 그룹화를 위해 `(groupName)` 폴더 형식을 적극 활용합니다. (예: `src/app/(auth)/login/page.tsx`)
- **Git 호환성 확보**: 디렉토리 및 파일명에 백슬래시(`\`) 등 OS 호환을 방해하는 특수문자가 포함되지 않도록 주의하며, 대괄호(`[]`)와 소괄호(`()`)는 Next.js 표준 라우팅 규칙에 맞춰 사용합니다.

---

## 3. Client State 관리 (Zustand)

- **Zustand 사용**: 전역적인 클라이언트 상태(모달 열림 상태, 사이드바 토글, 장바구니 등)는 Zustand 스토어를 이용해 명확하게 격리하여 관리합니다.
- **서버 상태와의 구분**: TanStack Query를 통해 가져오는 서버 상태(Server State)는 Zustand 스토어에 복제하여 보관하지 않고, 서버 쿼리의 데이터 상태를 다이렉트로 소비합니다.

---

## 4. Next.js 16+ 클라이언트 제약 사항 준수

### [1] useSearchParams() 사용 시 Suspense 래핑 필수
클라이언트 컴포넌트에서 `useSearchParams()`를 호출하는 UI 로직은 **반드시 `<Suspense>` 경계로 감싸주어야 합니다.** 그렇지 않으면 정적 빌드 단계에서 클라이언트 사이드 렌더링으로 베일아웃(bailout)을 유발해 빌드가 실패합니다.

```typescript
// ✅ 올바른 사용 패턴 (내부 폼 컴포넌트 분리 및 Suspense 래핑)
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SearchFormContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  return <div>검색어: {query}</div>;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <SearchFormContent />
    </Suspense>
  );
}
```

---

## 5. 작업 전후 공통 체크리스트
- [ ] 컴포넌트 스타일이 CSS Modules(`.module.css`)로 온전히 맵핑되었는가?
- [ ] `useSearchParams()`를 사용한 클라이언트 파일이 `<Suspense>`로 래핑되었는가?
- [ ] 불필요한 인라인 스타일이나 Tailwind CSS 클래스가 사용되지 않았는가?
- [ ] 모든 import 누락이나 중복이 해결되었는가?
