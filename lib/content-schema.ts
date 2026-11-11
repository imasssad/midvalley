// The one schema for everything editable on the website (same approach as rapidselfstorage). It gives the
// TypeScript types, and it validates the defaults in content/site.json and anything the admin panel saves.
// Every section is read (and, from Phase 3, saved) on its own, so one bad section never blanks the page.
import { z } from "zod";
import { phoneDigits } from "./phone";

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const required = (max: number) => text(max).min(1, "This can't be empty.");

/** A full https:// link. Empty is allowed where the field is optional. */
const link = z
  .string()
  .trim()
  .max(500, "This link is too long.")
  .refine((v) => /^https:\/\/\S+$/i.test(v), "Use a full link that starts with https://");
const optionalLink = z.union([z.literal(""), link]);

/** A page on this website ("/contact") or a full link. */
const href = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^(\/[^\s]*|https:\/\/\S+)$/i.test(v), "Use a page like /contact or a full https:// link.");

/** A photo: a file under /images (shipped with the site) or /media (uploaded in the admin panel). */
export const photoSchema = z.object({
  src: z
    .string()
    .trim()
    .refine((v) => /^\/(images|media)\/[\w./-]+$/.test(v), "Pick a photo."),
  alt: text(250),
  /** CSS object-position, e.g. "50% 40%": which part of the photo stays in view when it is cropped. */
  focus: z
    .string()
    .trim()
    .regex(/^\d{1,3}% \d{1,3}%$/)
    .default("50% 50%"),
});
export type Photo = z.infer<typeof photoSchema>;

export const iconNames = ["card", "phone", "key", "tag", "pin", "people", "shield", "clock", "chevron", "instagram", "map", "mail"] as const;
export type IconName = (typeof iconNames)[number];

export { phoneDigits };

const phone = required(30).refine((v) => phoneDigits(v) !== null, "Enter a 10-digit phone number, like (559) 734-7368.");

// ---- Sections ----

export const locationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  /** "Visalia Noble" */
  name: required(60),
  /** "Noble": used in "Call Noble (559) 734-7368" */
  shortName: required(30),
  address: z.object({ street: required(80), city: required(40), state: required(2), zip: required(10) }),
  phone,
  /** Header boxes and buttons: "Mid Valley Storage Noble" */
  brandName: required(60),
  /** Storedge tenant portal (Make a payment). */
  paymentUrl: link,
  /** Online rental / move-in. PLACEHOLDER: the old QuikStor reserve links, not confirmed by the client yet. */
  rentOnlineUrl: optionalLink,
  rentOnlineConfirmed: z.boolean(),
  mapsUrl: optionalLink,
  /** Google Maps embed (only Santa Fe had one on the old site). */
  mapEmbedUrl: optionalLink,
  /** From the old Facility Features copy (gates open 6AM, close 8PM). */
  gateHours: text(80),
  /** PLACEHOLDER: empty until the client gives office hours; renders only when filled. */
  officeHours: text(120),
});
export type Location = z.infer<typeof locationSchema>;

export const businessSchema = z.object({
  name: required(60),
  logo: photoSchema.extend({ src: z.string().trim().refine((v) => /^\/(images|media)\/[\w./-]+$/.test(v)) }),
  instagramUrl: optionalLink,
});

export const locationsSchema = z.object({
  items: z.array(locationSchema).min(1).max(4),
});

export const headerSchema = z.object({
  paymentLabel: required(30),
  callLabel: required(30),
  rentLabel: required(30),
  mobilePaymentLabel: required(30),
  /** Phone only: "Call" + location short name + phone */
  mobileCallWord: required(15),
});

export const navSchema = z.object({
  items: z.array(z.object({ label: required(30), href })).min(1).max(8),
});

export const heroSchema = z.object({
  /** "image": the promo banner. "video": the original header video. */
  mode: z.enum(["image", "video"]),
  banner: z.object({
    desktop: photoSchema,
    tablet: photoSchema,
    mobile: photoSchema,
    /** Describes the whole banner, including its text, for people who can't see it. */
    alt: required(400),
  }),
  disclaimer: text(300),
  video: z.object({ src: z.string().trim().regex(/^\/(video|media)\/[\w./-]+\.mp4$/), poster: photoSchema }),
});

export const valueStripSchema = z.object({
  enabled: z.boolean(),
  items: z.array(z.object({ icon: z.enum(iconNames), text: required(60) })).max(6),
});

const ctaSchema = z.object({ heading: required(80) });

export const homeSchema = z.object({
  about: z.object({ eyebrow: required(60), heading: required(140), paragraphs: z.array(required(1500)).min(1).max(4), photo: photoSchema }),
  storageOptions: z.object({
    heading: required(60),
    items: z.array(z.object({ title: required(60), text: required(800), photo: photoSchema.optional() })).min(1).max(6),
    gallery: z.array(photoSchema).max(8),
  }),
  features: z.object({ heading: required(60), intro: required(800), list: z.array(required(90)).min(1).max(20), photo: photoSchema }),
  locations: z.object({ heading: required(60) }),
  cta: ctaSchema,
});

export const testimonialsSchema = z.object({
  heading: required(60),
  /** Empty on purpose: the old site had no reviews. The section renders only when this has items. */
  items: z.array(z.object({ quote: required(600), name: required(60) })).max(12),
});

export const aboutSchema = z.object({
  heading: required(80),
  /** Wide photo behind the page title (the old page used this photo as its title background). */
  heroPhoto: photoSchema,
  storyHeading: required(60),
  story: z.array(required(2500)).min(1).max(6),
  photos: z.array(photoSchema).max(8),
  historyHeading: required(60),
  timeline: z.array(z.object({ year: required(10), text: required(300) })).max(12),
  cta: ctaSchema,
  /** "Reserve at Visalia Noble": the word before each location's name on the buttons. */
  reserveWord: required(30),
});

export const featuresSchema = z.object({
  heading: required(80),
  heroPhoto: photoSchema,
  items: z.array(z.object({ title: required(60), text: required(1500), photo: photoSchema })).min(1).max(12),
  cta: ctaSchema,
});

export const contactSchema = z.object({
  heading: required(80),
  heroPhoto: photoSchema,
  formHeading: required(80),
  submitLabel: required(30),
  /** Form labels, from the old site's form. */
  fields: z.object({ name: required(40), phone: required(40), email: required(40), location: required(40), message: required(40) }),
  /** Form messages (new for the rebuild). */
  messages: z.object({
    nameMissing: required(120),
    emailMissing: required(120),
    emailInvalid: required(120),
    locationMissing: required(120),
    fixErrors: required(120),
    sending: required(60),
    sent: required(200),
    failed: required(200),
    offline: required(200),
    tooMany: required(200),
  }),
});

export const footerSchema = z.object({
  gallery: z.array(photoSchema).max(8),
  contactButtonLabel: required(30),
  followHeading: required(40),
  employeeHeading: required(40),
  employeeLinkLabel: required(40),
  /** "{year}" becomes the current year. */
  copyright: required(80),
});

const pageSeo = z.object({ title: required(70), description: required(170) });
export const seoSchema = z.object({
  home: pageSeo,
  about: pageSeo,
  features: pageSeo,
  contact: pageSeo,
  employee: pageSeo,
  notFound: pageSeo,
  shareImage: photoSchema,
});

/** Small interface words added for the rebuild (not on the old site). Editable like everything else. */
export const labelsSchema = z.object({
  directions: required(40),
  gateHours: required(40),
  officeHours: required(40),
  galleryOpen: required(60),
  /** Read out by screen readers after links that open another website. */
  newTab: required(40),
  instagram: required(40),
  /** Explains the * on required form fields. */
  required: required(40),
  skipToContent: required(40),
  close: required(30),
  previousPhoto: required(40),
  nextPhoto: required(40),
  /** "1 of 4" in the photo viewer: {current} and {total} are filled in. */
  photoCount: required(40),
  onThisPage: required(40),
});

/** The not-found page (the old site's 404 words). */
export const notFoundSchema = z.object({ heading: required(40), text: required(120), linkLabel: required(40) });

export const employeeSchema = z.object({
  heading: required(60),
  /** Shown only when the portal isn't set up yet (no password or calendar in the environment). */
  placeholder: required(200),
  /** The Google Calendar's title (iframe title for screen readers). */
  calendarTitle: required(100),
  passwordLabel: required(40),
  submitLabel: required(30),
  logoutLabel: required(30),
  wrongPassword: required(160),
  /** "{minutes}" becomes the number of minutes to wait. */
  tooManyTries: required(160),
})

export const sectionSchemas = {
  business: businessSchema,
  locations: locationsSchema,
  header: headerSchema,
  nav: navSchema,
  hero: heroSchema,
  valueStrip: valueStripSchema,
  home: homeSchema,
  testimonials: testimonialsSchema,
  about: aboutSchema,
  features: featuresSchema,
  contact: contactSchema,
  footer: footerSchema,
  employee: employeeSchema,
  labels: labelsSchema,
  notFound: notFoundSchema,
  seo: seoSchema,
} as const;
export type SectionKey = keyof typeof sectionSchemas;
export const sectionKeys = Object.keys(sectionSchemas) as SectionKey[];

export const siteContentSchema = z.object({ version: z.literal(1), ...sectionSchemas });
export type SiteContent = z.infer<typeof siteContentSchema>;
