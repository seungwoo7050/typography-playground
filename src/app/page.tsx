import { UnicodeGenerator } from "@/features/unicode-generator/components/UnicodeGenerator";
import { HeroHeading } from "@/components/layout/HeroHeading";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <HeroHeading>Typography Playground</HeroHeading>
      <UnicodeGenerator />
    </main>
  );
}
