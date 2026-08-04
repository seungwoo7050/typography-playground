import { KineticPlayground } from "@/features/kinetic-engine/components/KineticPlayground";
import { HeroHeading } from "@/components/layout/HeroHeading";

export default function KineticPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <HeroHeading>Kinetic Typography</HeroHeading>
      <KineticPlayground />
    </main>
  );
}
