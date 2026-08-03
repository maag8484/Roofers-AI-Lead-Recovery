import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Problem } from "./components/Problem";
import { HowItWorks } from "./components/HowItWorks";
import { WhoItsFor } from "./components/WhoItsFor";
import { DashboardPreview } from "./components/DashboardPreview";
import { Pricing } from "./components/Pricing";
import { TheMath } from "./components/TheMath";
import { SmithAiTrust } from "./components/SmithAiTrust";
import { ComparisonTable } from "./components/ComparisonTable";
import { Faq } from "./components/Faq";
import { BottomCta, FinalCta } from "./components/ClosingCtas";
import { Footer } from "./components/Footer";
import "./home-v2.css";

/**
 * /home-v2 — redesigned landing page.
 *
 * CONTENT + PALETTE PARITY: every headline, paragraph, list item, stat, FAQ
 * and CTA is verbatim from the live page at "/", and every colour matches
 * tailwind.config.js (#2563eb brand, emerald success, ink-900 darks).
 *
 * The section rhythm deliberately alternates so no two adjacent bands share a
 * layout:
 *
 *   Hero            full-bleed aurora stage + scroll-linked phone
 *   Problem         PINNED scroll sequence (desktop) / stack (mobile)
 *   HowItWorks      alternating zig-zag on a scroll-drawn spine
 *   WhoItsFor       counter-scrolling marquee rows
 *   DashboardPreview 3D-tilted browser frame, bento grid, dark band
 *   Pricing         sticky plan card beside scrolling benefits
 *   TheMath         dark band, proportional ROI axis (signature)
 *   SmithAiTrust    off-axis parallax split
 *   ComparisonTable opposed stacks that dim each other on hover
 *   Faq             sticky rail + accordion
 *   BottomCta       bordered card with parallax accents
 *   FinalCta        full-bleed gradient
 *
 * Backgrounds alternate white / mist / ink so the page has a light-dark
 * cadence rather than twelve white sections in a row.
 *
 * The live homepage is untouched; all styling is namespaced under .hv2.
 */
export default function HomeV2Page() {
  // NO overflow-x-hidden here. A clipped root becomes the scroll container and
  // every `position: sticky` descendant (nav, pinned Problem, pricing card,
  // FAQ rail) stops pinning to the viewport. Decorations are clipped by their
  // own .hv2-clip wrappers inside each section instead.
  return (
    <div className="hv2 flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <WhoItsFor />
        <DashboardPreview />
        <Pricing />
        <TheMath />
        <SmithAiTrust />
        <ComparisonTable />
        <Faq />
        <BottomCta />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
