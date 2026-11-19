// Homepage, in this order: promo banner with the quick Rent/Call actions, value strip, About (the page's one h1,
// so it is the first section heading), Our Locations, Storage Options with the photo gallery, Storage Sizes (only
// while switched on and holding sizes), Facility Features
// (blue band), reviews (only once there are some) and the closing call to action. Every word and photo comes from the editable content
// (content/site.json, later the admin panel); only the decorative section numbers (01, 02...) are generated, and
// they skip Storage Sizes while it is hidden.
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { AboutIntro } from "@/components/home/AboutIntro";
import { FeaturesList } from "@/components/home/FeaturesList";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Locations } from "@/components/home/Locations";
import { StorageOptions } from "@/components/home/StorageOptions";
import { Testimonials } from "@/components/home/Testimonials";
import { numbersAfterSizes, UnitSizes } from "@/components/home/UnitSizes";
import { ValueStrip } from "@/components/home/ValueStrip";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home", "/");
}

export default async function HomePage() {
  const content = await getSiteContent();
  const no = numbersAfterSizes(content);
  return (
    <>
      <HeroBanner content={content} />
      <ValueStrip content={content} />
      <AboutIntro content={content} no="01" />
      <Locations content={content} no="02" />
      <StorageOptions content={content} no="03" />
      <UnitSizes content={content} no="04" />
      <FeaturesList content={content} no={no.features} />
      <Testimonials content={content} no={no.reviews} />
      <CtaBand content={content} heading={content.home.cta.heading} variant="rent" />
    </>
  );
}
