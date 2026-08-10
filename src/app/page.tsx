import { UnicodeGenerator } from "@/features/unicode-generator/components/UnicodeGenerator";
import { HeroHeading } from "@/components/layout/HeroHeading";

export default function Home() {
  return (
    // 키네틱 페이지(max-w-6xl)보다는 좁게 — "가벼운 도구"라는
    // 위계를 폭 자체로도 드러낸다. 아래 UnicodeGenerator가
    // 데스크톱에서 입력 레일+카드 그리드 2단을 쓰는데, max-w-4xl로는
    // 레일(280px)+그리드가 한 줄에 2칸도 편하게 못 담는다.
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <HeroHeading>Typography Playground</HeroHeading>
      <UnicodeGenerator />
    </main>
  );
}
