import { KineticPlayground } from "@/features/kinetic-engine/components/KineticPlayground";

export default function KineticPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-4xl text-ink sm:text-5xl">
        Kinetic Typography
      </h1>
      <KineticPlayground />
    </main>
  );
}
