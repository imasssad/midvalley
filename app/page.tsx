// Homepage: promo banner, value strip, About intro (the page's h1), Storage Options with the photo gallery,
// Facility Features, Our Locations, reviews (only once there are some) and the closing call to action.
// Every word and photo comes from the editable content (content/site.json, later the admin panel).
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { AboutIntro } from "@/components/home/AboutIntro";
import { FeaturesList } from "@/components/home/FeaturesList";
import { HeroBanner } from "@/components/home/HeroBanner";
import { HomeLocations } from "@/components/home/HomeLocations";
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
      <AboutIntro content={content} />
      <StorageOptions content={content} />
      <FeaturesList content={content} />
      <HomeLocations content={content} />
      <Testimonials content={content} />
      <CtaBand content={content} heading={content.home.cta.heading} variant="rent" />
    </>
  );
}
