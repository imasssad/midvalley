// Homepage, in this order: promo banner with the quick Rent/Call actions, value strip, Our Locations, Storage
// Options with the photo gallery, About (the page's one h1), Facility Features (blue band), reviews (only once
// there are some) and the closing call to action. Every word and photo comes from the editable content
// (content/site.json, later the admin panel); only the decorative section numbers (01, 02...) are generated.
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { AboutIntro } from "@/components/home/AboutIntro";
import { FeaturesList } from "@/components/home/FeaturesList";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Locations } from "@/components/home/Locations";
import { StorageOptions } from "@/components/home/StorageOptions";
import { Testimonials } from "@/components/home/Testimonials";
import { ValueStrip } from "@/components/home/ValueStrip";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home", "/");
}

export default async function HomePage() {
  const content = await getSiteContent();
  return (
    <>
      <HeroBanner content={content} />
      <ValueStrip content={content} />
      <Locations content={content} no="01" />
      <StorageOptions content={content} no="02" />
      <AboutIntro content={content} no="03" />
      <FeaturesList content={content} no="04" />
      <Testimonials content={content} no="05" />
      <CtaBand content={content} heading={content.home.cta.heading} variant="rent" />
    </>
  );
}
