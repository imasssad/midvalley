// Homepage, in this order: promo banner with the quick Rent/Call actions, value strip, About (the page's one h1,
// so it is the first section heading), Our Locations, Storage Options with the photo gallery, Storage Sizes (only
// while switched on and holding sizes), the three steps to rent, Facility Features (blue band), Security, the
// questions and answers (FAQ), reviews (only once there are some) and the closing call to action. Every word and
// photo comes from the editable content (content/site.json, later the admin panel); only the decorative section
// numbers (01, 02...) are generated, and they skip the sections that are switched off or empty
// (components/home/sectionNumbers.ts). The specials bar above the header is drawn by components/SiteChrome.tsx.
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { AboutIntro } from "@/components/home/AboutIntro";
import { Faq, FaqJsonLd } from "@/components/home/Faq";
import { FeaturesList } from "@/components/home/FeaturesList";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Locations } from "@/components/home/Locations";
import { RentSteps } from "@/components/home/RentSteps";
import { homeNumbers } from "@/components/home/sectionNumbers";
import { Security } from "@/components/home/Security";
import { StorageOptions } from "@/components/home/StorageOptions";
import { Testimonials } from "@/components/home/Testimonials";
import { UnitSizes } from "@/components/home/UnitSizes";
import { ValueStrip } from "@/components/home/ValueStrip";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home", "/");
}

export default async function HomePage() {
  const content = await getSiteContent();
  const no = homeNumbers(content);
  return (
    <>
      <HeroBanner content={content} />
      <ValueStrip content={content} />
      <AboutIntro content={content} no={no.about} />
      <Locations content={content} no={no.locations} />
      <StorageOptions content={content} no={no.options} />
      <UnitSizes content={content} no={no.sizes} />
      <RentSteps content={content} no={no.steps} />
      <FeaturesList content={content} no={no.features} />
      <Security content={content} no={no.security} />
      <Faq content={content} no={no.faq} />
      <Testimonials content={content} no={no.reviews} />
      <CtaBand content={content} heading={content.home.cta.heading} variant="rent" />
      <FaqJsonLd content={content} />
    </>
  );
}
