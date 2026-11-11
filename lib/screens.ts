// The admin panel's screens, organised the way the owner thinks about the website: the promo banner and the
// locations first (the most used), then one screen per page, then the parts every page shares. Each screen edits
// one or more "scopes" (paths into the content), so the server knows exactly what a screen may save and two people
// editing different screens never overwrite each other. Used by the server (what a screen may save) and the
// browser (navigation). Field labels and help text live in components/admin/screen-fields.ts.
import { getAt, setAt } from "./diff";

export type ScreenKey =
  | "banner"
  | "locations"
  | "home"
  | "about"
  | "features"
  | "contact"
  | "reviews"
  | "employee"
  | "header"
  | "footer"
  | "seo"
  | "labels";

export type ScreenGroup = "top" | "pages" | "site";

export type Screen = {
  title: string;
  group: ScreenGroup;
  /** One plain sentence: what this is on the website. */
  blurb: string;
  /** Paths into the site content that this screen edits. */
  scopes: readonly (readonly string[])[];
  /** Where to see it on the website, for "See this on the website". */
  page?: string;
  ownerOnly?: boolean;
  /** What on this part is set elsewhere, or can't be changed here, so nobody hunts for it. */
  note?: string;
};

export const screens: Record<ScreenKey, Screen> = {
  banner: {
    title: "Promo banner",
    group: "top",
    blurb: "The big banner at the top of the homepage, its small print, and the switch between the banner and the original video.",
    scopes: [["hero", "mode"], ["hero", "banner"], ["hero", "disclaimer"], ["hero", "video", "poster"]],
    page: "/",
    note: "The Rent Online and Call buttons under the banner come from Locations & contact.",
  },
  locations: {
    title: "Locations & contact",
    group: "top",
    blurb: "Name, address, phone, hours and links for each location, plus your Instagram page. Used all over the site: header, buttons, location cards, contact page and footer.",
    scopes: [["locations"], ["business", "instagramUrl"]],
    page: "/contact",
  },
  home: {
    title: "Home page",
    group: "pages",
    blurb: "Every section of the homepage under the banner: the value strip, About, Storage Options with its photos, Facility Features and the closing heading.",
    scopes: [["valueStrip"], ["home"]],
    page: "/",
    note: "Reviews have their own screen. The location cards come from Locations & contact.",
  },
  about: {
    title: "About Us page",
    group: "pages",
    blurb: "The About Us page: title photo, your story and its photos, the history timeline and the closing heading.",
    scopes: [["about"]],
    page: "/about-us",
  },
  features: {
    title: "Facility Features page",
    group: "pages",
    blurb: "The Facility Features page: title photo and one section per feature, each with its photo.",
    scopes: [["features"]],
    page: "/facilityfeatures",
    note: "The short list of features on the homepage is on the Home page screen.",
  },
  contact: {
    title: "Contact page",
    group: "pages",
    blurb: "The Contact page: title, photo, and the words of the contact form (labels, button and messages).",
    scopes: [["contact"]],
    page: "/contact",
    note: "Addresses, phones and map links on this page come from Locations & contact. Messages people send arrive under Messages.",
  },
  reviews: {
    title: "Reviews",
    group: "pages",
    blurb: "Quotes from your customers on the homepage. The section only shows once there is at least one review.",
    scopes: [["testimonials"]],
    page: "/",
  },
  employee: {
    title: "Employee Portal",
    group: "pages",
    blurb: "The words on the staff-only Employee Portal page.",
    scopes: [["employee"]],
    page: "/employee",
    note: "The portal password and the Google Calendar address are not set here: your developer keeps them as settings in Vercel (EMPLOYEE_PORTAL_PASSWORD and EMPLOYEE_CALENDAR_EMBED_URL), so they never appear in the website's content.",
  },
  header: {
    title: "Header & menu",
    group: "site",
    blurb: "The top of every page: your logo, the payment and call buttons' labels, and the menu links.",
    scopes: [["header"], ["nav"], ["business", "logo"], ["business", "name"]],
    page: "/",
    note: "The location names and addresses in the header boxes come from Locations & contact.",
  },
  footer: {
    title: "Footer",
    group: "site",
    blurb: "The bottom of every page: its photo strip, headings, button and copyright line.",
    scopes: [["footer"]],
    page: "/",
    note: "Locations, phones and the Instagram link in the footer come from Locations & contact.",
  },
  seo: {
    title: "Search & sharing",
    group: "site",
    blurb: "The title and description Google shows for each page, and the picture shown when someone shares a link to your site.",
    scopes: [["seo"]],
  },
  labels: {
    title: "Labels",
    group: "site",
    blurb: "Small words used around the site (like “Get directions”), and the page people see when a link is broken.",
    scopes: [["labels"], ["notFound"]],
  },
};

export const screenKeys = Object.keys(screens) as ScreenKey[];
export const isScreenKey = (v: string): v is ScreenKey => Object.hasOwn(screens, v);

export const groupTitles: Record<ScreenGroup, string> = {
  top: "Most used",
  pages: "Pages",
  site: "On every page",
};

/** Titles of the history tools, for history entries that weren't a screen's save. */
export const toolTitles: Record<string, string> = {
  restore: "Went back to an earlier version",
  undo: "Undid a save",
  revert: "Put back one field",
  banner: "Restored the previous banner",
};

export { getAt, setAt };
