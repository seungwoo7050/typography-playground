import { KineticPlayground } from "@/features/kinetic-engine/components/KineticPlayground";
import { HeroHeading } from "@/components/layout/HeroHeading";

export default function KineticPage() {
  return (
    // Tier 1(유니코드 생성기)과 달리 max-w-6xl로 더 넓다 — 아래
    // KineticPlayground가 데스크톱에서 캔버스 스테이지+컨트롤
    // 사이드바 2단 레이아웃을 쓰는데, max-w-4xl(896px)로는 800px
    // 캔버스 하나만으로도 거의 꽉 차 사이드바가 들어갈 자리가 없다.
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <HeroHeading>Kinetic Typography</HeroHeading>
      <KineticPlayground />
    </main>
  );
}
