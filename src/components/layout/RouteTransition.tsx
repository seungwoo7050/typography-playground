"use client";

import { usePathname } from "next/navigation";

const DURATION_MS = 300;

/**
 * 라우트가 바뀔 때 새 페이지가 살짝 아래서 떠오르며 나타나게 한다 —
 * 지금까지 "/" ↔ "/kinetic" 이동이 기본 Next 네비게이션 그대로라
 * 순간 이동처럼 느껴졌다.
 *
 * React의 <ViewTransition>(Next 16 App Router가 "설정 없이 동작"한다고
 * 문서화된 기능)을 먼저 검토했지만, 이 프로젝트의 실제 react
 * 패키지(19.2.4, stable)에는 export되어 있지 않다 — Next 내부
 * RSC 런타임이 쓰는 React canary와 앱이 import하는 "react" 패키지가
 * 다르다(직접 `'ViewTransition' in require('react')`로 확인).
 * canary로 올리는 건 프로덕션 안정성 트레이드오프라 사용자 확인 없이
 * 단행하지 않는다 — 대신 StyleCard 크로스페이드와 똑같은 기법
 * (key 리마운트 + CSS @keyframes + fill-mode:both)을 재사용한다.
 *
 * 진입 애니메이션만 있고 퇴장 애니메이션은 없다 — 이전 페이지가
 * React에 의해 즉시 언마운트되므로, 대칭적인 두 방향 전환을 하려면
 * 이전 콘텐츠를 잠깐 붙잡아두는 트랜지션 그룹이 필요하다(지금은
 * 의도적으로 미룸 — 복잡도 대비 얻는 것이 크지 않다고 판단).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      style={{
        animationName: "route-transition-enter",
        animationDuration: `${DURATION_MS}ms`,
        animationTimingFunction: "ease-out",
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
