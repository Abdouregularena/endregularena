import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { PacksPreview } from "@/components/home/packs-preview";
import { HowItWorks } from "@/components/home/how-it-works";
import { CTA } from "@/components/home/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <PacksPreview />
      <HowItWorks />
      <CTA />
    </>
  );
}
