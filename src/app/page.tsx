import { UnicodeGenerator } from "@/features/unicode-generator/components/UnicodeGenerator";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-4xl text-ink sm:text-5xl">
        Typography Playground
      </h1>
      <UnicodeGenerator />
    </main>
  );
}
