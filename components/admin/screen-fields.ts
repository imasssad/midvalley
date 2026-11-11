// The human side of each admin screen: which fields it shows, their labels and help text, and list behaviour.
// Validation comes from lib/content-schema.ts and what a screen may save from lib/screens.ts.
// To make a new field editable: add it to the schema and the defaults (content/site.json), then describe it here.
import { iconNames } from "@/lib/content-schema";
import { screenKeys, screens, type ScreenKey } from "@/lib/screens";

/** "url": a full https:// link. "href": a page of this site (/contact) or a full link. "tel": a phone number. */
export type TextInput = "text" | "email" | "url" | "href" | "tel";
export type PhotoVariant = "photo" | "logo" | "banner" | "bannerOptional";

export type Field =
  | { kind: "text"; key: string; label: string; help?: string; multiline?: boolean; max: number; inputType?: TextInput; placeholder?: string }
  | { kind: "toggle"; key: string; label: string; help?: string }
  | { kind: "check"; key: string; label: string; help?: string }
  | { kind: "select"; key: string; label: string; help?: string; options: { value: string; label: string }[] }
  | { kind: "radio"; key: string; label: string; help?: string; options: { value: string; label: string; help?: string }[] }
  | { kind: "group"; key?: string; label: string; help?: string; fields: Field[] }
  | {
      kind: "list";
      key: string;
      label: string;
      help?: string;
      itemName: string;
      itemTitle: (item: Record<string, unknown>, index: number) => string;
      fields: Field[];
      newItem?: () => Record<string, unknown>;
      max?: number;
      /** Items can be edited but not added, removed or moved. */
      fixed?: boolean;
      /** Start with every item folded to its title (for long lists). */
      collapse?: boolean;
    }
  | { kind: "strings"; key: string; label: string; help?: string; itemName: string; max: number; maxLength: number; multiline?: boolean }
  /** `optional`: the photo may be removed (the part is then shown without one). */
  | { kind: "photo"; key: string; label: string; help?: string; variant?: PhotoVariant; optional?: boolean }
  /** A list of photos (a gallery): each one uploaded, described, moved or removed on its own. */
  | { kind: "photos"; key: string; label: string; help?: string; max: number };

/** A card of fields on a screen. `path` is where in the content its fields live. */
export type Block = { path: string[]; title?: string; help?: string; fields: Field[] };

const photoHelp = "JPG, PNG or WebP, up to 8 MB. A copy sized for the web is made automatically; your original file is kept.";
const link = (key: string, label: string, help?: string): Field => ({ kind: "text", key, label, help, max: 500, inputType: "url", placeholder: "https://" });
const line = (key: string, label: string, max: number, help?: string): Field => ({ kind: "text", key, label, max, help });
const para = (key: string, label: string, max: number, help?: string): Field => ({ kind: "text", key, label, max, help, multiline: true });
const photo = (key: string, label: string, help?: string, variant: PhotoVariant = "photo"): Field => ({
  kind: "photo",
  key,
  label,
  help: help ? `${help} ${photoHelp}` : photoHelp,
  variant,
});

const iconLabels: Record<(typeof iconNames)[number], string> = {
  card: "Card",
  phone: "Phone",
  key: "Key",
  tag: "Price tag",
  pin: "Map pin",
  people: "People",
  shield: "Shield",
  clock: "Clock",
  chevron: "Arrow",
  instagram: "Instagram",
  map: "Map",
  mail: "Envelope",
};

const pageSeo = (key: string, label: string): Field => ({
  kind: "group",
  key,
  label,
  fields: [
    line("title", "Title in Google and on the browser tab", 70, "About 50–60 characters. Put the most important words first."),
    para("description", "Description in Google", 170, "One or two sentences, about 150 characters."),
  ],
});

export const screenBlocks: Record<ScreenKey, Block[]> = {
  banner: [
    {
      path: ["hero"],
      title: "What shows at the top of the homepage",
      fields: [
        {
          kind: "radio",
          key: "mode",
          label: "Top of the homepage",
          options: [
            { value: "image", label: "Promo image", help: "Your promo banner and its small print (set below)." },
            {
              value: "video",
              label: "Original video",
              help: "The original header video, without the banner. Your banner is kept, so you can switch back at any time.",
            },
          ],
        },
      ],
    },
    {
      path: ["hero", "banner"],
      title: "Banner images",
      help: "The banner is shown whole, never cropped. Use a file at least 1600 pixels wide for computers. The tablet and phone versions are optional: leave one empty and that screen size shows the computer banner.",
      fields: [
        photo("desktop", "Computer banner (required)", "A wide banner, for example 2:1.", "banner"),
        photo("tablet", "Tablet banner (optional)", "For screens 541–1100 pixels wide, for example 3:2.", "bannerOptional"),
        photo("mobile", "Phone banner (optional)", "For phones (up to 540 pixels wide), usually a tall picture.", "bannerOptional"),
        para(
          "alt",
          "Describe the banner, including all its words",
          400,
          "Read out to people who can't see the banner, and used by Google. Include the offer, prices and phone number exactly as the banner shows them.",
        ),
      ],
    },
    {
      path: ["hero"],
      title: "Small print",
      fields: [
        para(
          "disclaimer",
          "Small print under the banner",
          300,
          "For example: *Valid at Noble location only. New customers only. Please visit office for full details. Clear this box to hide the small print. It isn't shown in video mode.",
        ),
      ],
    },
    {
      path: ["hero", "video"],
      title: "Original video",
      help: "The video itself (hero-original.mp4) always stays on the site, so “Original video” can be chosen at any time.",
      fields: [photo("poster", "Still picture for the video", "Shown while the video loads, and instead of it for visitors who prefer less motion.")],
    },
  ],

  locations: [
    {
      path: ["locations"],
      title: "Your locations",
      help: "Shown in this order everywhere: header, homepage, contact page, buttons and footer.",
      fields: [
        {
          kind: "list",
          key: "items",
          label: "Locations",
          itemName: "location",
          fixed: true,
          itemTitle: (l, i) => String(l.name || `Location ${i + 1}`),
          fields: [
            {
              kind: "group",
              label: "Names",
              fields: [
                line("name", "Location name", 60, "For example: Visalia Noble. Shown in bold in the header's payment boxes, on cards and buttons."),
                line("brandName", "Name with the business name", 60, "For example: Mid Valley Storage Noble. Shown in the header's call boxes."),
                line("shortName", "Short name", 30, "For example: Noble."),
              ],
            },
            {
              kind: "group",
              key: "address",
              label: "Address",
              help: "The street is also shown under the location name in the header's payment boxes.",
              fields: [line("street", "Street", 80, "For example: 15323 E. Noble Ave."), line("city", "City", 40), line("state", "State", 2, "Two letters, for example CA."), line("zip", "ZIP code", 10)],
            },
            { kind: "text", key: "phone", label: "Phone number", max: 30, inputType: "tel", help: "A 10-digit number, typed as visitors should see it, for example (559) 734-7368." },
            {
              kind: "group",
              label: "Links",
              help: "Copy each full address from your browser's address bar. Use “Open link” to check it.",
              fields: [
                link("paymentUrl", "“Make a payment” link (Storedge)", "Your Storedge tenant login page for this location."),
                link("rentOnlineUrl", "“Rent Online” link (optional)", "Where people rent a unit online. Leave it empty to hide the Rent Online buttons for this location."),
                {
                  kind: "check",
                  key: "rentOnlineConfirmed",
                  label: "The client confirmed this Rent Online link",
                  help: "Tick this once the Rent Online link has been checked and confirmed. It is a reminder for you; visitors don't see it.",
                },
                link("mapsUrl", "Google Maps link (optional)", "Opens when visitors tap the address or “Get directions”."),
                link("mapEmbedUrl", "Map shown on the contact page (optional)", "A Google Maps “Embed a map” address. Leave it empty for no map."),
              ],
            },
            {
              kind: "group",
              label: "Hours",
              fields: [
                line("gateHours", "Gate hours", 80, "For example: 6AM to 8PM. Leave empty to hide."),
                line("officeHours", "Office hours (optional)", 120, "Leave empty to hide office hours on the website."),
              ],
            },
          ],
        },
      ],
    },
    {
      path: ["business"],
      title: "Instagram",
      fields: [link("instagramUrl", "Instagram page (optional)", "Shown in the footer and on the contact page. Leave empty to hide it.")],
    },
  ],

  home: [
    {
      path: ["valueStrip"],
      title: "Value strip",
      help: "The row of short points right under the banner.",
      fields: [
        { kind: "toggle", key: "enabled", label: "Show the value strip" },
        {
          kind: "list",
          key: "items",
          label: "Points",
          itemName: "point",
          max: 6,
          itemTitle: (v, i) => String(v.text || `Point ${i + 1}`),
          newItem: () => ({ icon: "tag", text: "" }),
          fields: [
            { kind: "select", key: "icon", label: "Icon", options: iconNames.map((n) => ({ value: n, label: iconLabels[n] })) },
            line("text", "Words", 60),
          ],
        },
      ],
    },
    {
      path: ["home", "about"],
      title: "About (the first section)",
      fields: [
        line("eyebrow", "Small line above the heading", 60),
        line("heading", "Heading", 140, "This is the homepage's main heading for Google, so keep the words people search for."),
        { kind: "strings", key: "paragraphs", label: "Paragraphs", itemName: "paragraph", max: 4, maxLength: 1500, multiline: true },
        photo("photo", "Photo"),
      ],
    },
    {
      path: ["home", "locations"],
      title: "Our Locations",
      help: "The location cards themselves come from Locations & contact.",
      fields: [line("heading", "Heading", 60)],
    },
    {
      path: ["home", "storageOptions"],
      title: "Storage Options",
      fields: [
        line("heading", "Heading", 60),
        {
          kind: "list",
          key: "items",
          label: "Options",
          itemName: "storage option",
          max: 6,
          collapse: true,
          itemTitle: (o, i) => String(o.title || `Option ${i + 1}`),
          newItem: () => ({ title: "", text: "" }),
          fields: [line("title", "Title", 60), para("text", "Text", 800), { ...photo("photo", "Photo (optional)"), optional: true } as Field],
        },
        { kind: "photos", key: "gallery", label: "Photo gallery", help: "Up to 8 photos under the options. Visitors can open each one large.", max: 8 },
      ],
    },
    {
      path: ["home", "features"],
      title: "Facility Features",
      help: "The blue section with the list of features. The full Facility Features page has its own screen.",
      fields: [
        line("heading", "Heading", 60),
        para("intro", "Introduction", 800),
        { kind: "strings", key: "list", label: "Features list", itemName: "feature", max: 20, maxLength: 90 },
        photo("photo", "Photo"),
      ],
    },
    {
      path: ["home", "cta"],
      title: "Closing band",
      help: "The dark band at the bottom of the homepage with the Rent Online and Call buttons.",
      fields: [line("heading", "Closing heading", 80)],
    },
  ],

  about: [
    {
      path: ["about"],
      title: "Page title",
      fields: [line("heading", "Page heading", 80), photo("heroPhoto", "Title photo")],
    },
    {
      path: ["about"],
      title: "Our Story",
      fields: [
        line("storyHeading", "Heading", 60),
        { kind: "strings", key: "story", label: "Story paragraphs", itemName: "paragraph", max: 6, maxLength: 2500, multiline: true },
        { kind: "photos", key: "photos", label: "Story photos", help: "Up to 8 photos next to the story. Groups of four look best.", max: 8 },
      ],
    },
    {
      path: ["about"],
      title: "Our History",
      help: "The timeline. Remove every year to hide the section.",
      fields: [
        line("historyHeading", "Heading", 60),
        {
          kind: "list",
          key: "timeline",
          label: "Timeline",
          itemName: "year",
          max: 12,
          itemTitle: (t, i) => String(t.year || `Year ${i + 1}`),
          newItem: () => ({ year: "", text: "" }),
          fields: [line("year", "Year", 10), para("text", "What happened", 300)],
        },
      ],
    },
    {
      path: ["about"],
      title: "Closing band",
      fields: [
        { kind: "group", key: "cta", label: "Closing heading", fields: [line("heading", "Heading", 80)] },
        line("reserveWord", "Word before each location on its button", 30, "For example: Reserve at (the button reads “Reserve at Visalia Noble”)."),
      ],
    },
  ],

  features: [
    {
      path: ["features"],
      title: "Page title",
      fields: [line("heading", "Page heading", 80), photo("heroPhoto", "Title photo")],
    },
    {
      path: ["features"],
      title: "Features",
      help: "One section per feature, in this order.",
      fields: [
        {
          kind: "list",
          key: "items",
          label: "Features",
          itemName: "feature",
          max: 12,
          collapse: true,
          itemTitle: (f, i) => String(f.title || `Feature ${i + 1}`),
          newItem: () => ({ title: "", text: "", photo: { src: "", alt: "", focus: "50% 50%" } }),
          fields: [line("title", "Title", 60), para("text", "Text", 1500), photo("photo", "Photo")],
        },
      ],
    },
    {
      path: ["features", "cta"],
      title: "Closing band",
      fields: [line("heading", "Closing heading", 80)],
    },
  ],

  contact: [
    {
      path: ["contact"],
      title: "Page title",
      fields: [line("heading", "Page heading", 80), photo("heroPhoto", "Title photo")],
    },
    {
      path: ["contact"],
      title: "Contact form",
      fields: [
        line("formHeading", "Form heading", 80),
        line("submitLabel", "Send button", 30),
        {
          kind: "group",
          key: "fields",
          label: "Field labels",
          fields: [line("name", "Name field", 40), line("phone", "Phone field", 40), line("email", "Email field", 40), line("location", "Location field", 40), line("message", "Message field", 40)],
        },
        {
          kind: "group",
          key: "messages",
          label: "Messages visitors see",
          help: "Shown when something is missing, while sending, and after sending.",
          fields: [
            line("nameMissing", "When the name is missing", 120),
            line("emailMissing", "When the email is missing", 120),
            line("emailInvalid", "When the email isn't valid", 120),
            line("locationMissing", "When no location is chosen", 120),
            line("fixErrors", "Above the button, when something needs fixing", 120),
            line("sending", "While sending", 60),
            para("sent", "After the message was sent", 200),
            para("failed", "When sending failed", 200),
            para("offline", "When the visitor is offline", 200),
            para("tooMany", "When too many messages were sent", 200),
            line("sendAnother", "Button after sending, for a new message", 60),
          ],
        },
      ],
    },
  ],

  reviews: [
    {
      path: ["testimonials"],
      title: "Reviews",
      help: "Only use real reviews, with the customer's permission. The section stays hidden until there is at least one.",
      fields: [
        line("heading", "Section heading", 60),
        {
          kind: "list",
          key: "items",
          label: "Reviews",
          itemName: "review",
          max: 12,
          itemTitle: (r, i) => String(r.name || `Review ${i + 1}`),
          newItem: () => ({ quote: "", name: "" }),
          fields: [para("quote", "What they said", 600), line("name", "Their name", 60, "For example: Maria G.")],
        },
      ],
    },
  ],

  employee: [
    {
      path: ["employee"],
      title: "Employee Portal page",
      help: "The password and the Google Calendar are not set here. They are settings in Vercel (EMPLOYEE_PORTAL_PASSWORD and EMPLOYEE_CALENDAR_EMBED_URL) that your developer changes, so they never appear in the website's content.",
      fields: [
        line("heading", "Page heading", 60),
        para("placeholder", "Shown while the portal isn't set up yet", 200),
        line("calendarTitle", "Calendar name (read out by screen readers)", 100),
        line("passwordLabel", "Password field label", 40),
        line("submitLabel", "Log in button", 30),
        line("logoutLabel", "Log out button", 30),
        para("wrongPassword", "When the password is wrong", 160),
        para("tooManyTries", "After too many tries", 160, "{minutes} becomes the number of minutes to wait."),
      ],
    },
  ],

  header: [
    {
      path: ["business"],
      title: "Logo and business name",
      fields: [
        photo("logo", "Logo", "Shown at the top left of every page and, in white, in the footer. A file with a see-through background works best.", "logo"),
        line("name", "Business name", 60, "Used by Google and when a link to the site is shared."),
      ],
    },
    {
      path: ["header"],
      title: "Header buttons",
      help: "The labels of the two rows of boxes at the top right. The boxes themselves show each location's name, address and phone from Locations & contact.",
      fields: [
        line("paymentLabel", "Payment row label", 30, "For example: Make a payment."),
        line("callLabel", "Call row label", 30, "For example: Make a Call."),
        line("rentLabel", "Rent Online buttons", 30, "On the location cards, under the banner and in the closing band."),
        line("mobilePaymentLabel", "Payment button on phones", 30),
        line("mobileCallWord", "Word before the phone number on call buttons", 15, "For example: Call (the button reads “Call (559) 734-7368”)."),
      ],
    },
    {
      path: ["nav"],
      title: "Menu links",
      help: "Shown in this order in the header and the footer.",
      fields: [
        {
          kind: "list",
          key: "items",
          label: "Links",
          itemName: "menu link",
          max: 8,
          itemTitle: (l, i) => String(l.label || `Link ${i + 1}`),
          newItem: () => ({ label: "", href: "/" }),
          fields: [
            line("label", "Words in the menu", 30),
            {
              kind: "text",
              key: "href",
              label: "Goes to",
              max: 500,
              inputType: "href",
              placeholder: "/contact",
              help: "A page of this website, like /about-us, /facilityfeatures or /contact, or a full link starting with https://",
            },
          ],
        },
      ],
    },
  ],

  footer: [
    {
      path: ["footer"],
      title: "Footer",
      fields: [
        { kind: "photos", key: "gallery", label: "Photo strip", help: "Up to 8 small square photos across the footer.", max: 8 },
        line("contactButtonLabel", "Contact button", 30),
        line("followHeading", "Heading above Instagram", 40),
        line("employeeHeading", "Heading above the Employee Portal link", 40),
        line("employeeLinkLabel", "Employee Portal link", 40),
        line("copyright", "Copyright line", 80, "{year} becomes the current year, for example: Mid Valley Storage © {year}"),
      ],
    },
  ],

  seo: [
    {
      path: ["seo"],
      title: "Google results",
      help: "What Google shows for each page. Changes can take a few days to appear in Google.",
      fields: [
        pageSeo("home", "Homepage"),
        pageSeo("about", "About Us page"),
        pageSeo("features", "Facility Features page"),
        pageSeo("contact", "Contact page"),
        pageSeo("employee", "Employee Portal page"),
        pageSeo("notFound", "Page not found (404)"),
      ],
    },
    {
      path: ["seo"],
      title: "Sharing",
      fields: [photo("shareImage", "Picture shown when a link is shared", "Used by Facebook, text messages and others. 1200 × 630 pixels works best.")],
    },
  ],

  labels: [
    {
      path: ["labels"],
      title: "Small words around the site",
      fields: [
        line("directions", "Directions link", 40),
        line("gateHours", "Gate hours label", 40),
        line("officeHours", "Office hours label", 40),
        line("instagram", "Instagram link", 40),
        line("galleryOpen", "Open a gallery photo (read out by screen readers)", 60),
        line("previousPhoto", "Previous photo button", 40),
        line("nextPhoto", "Next photo button", 40),
        line("close", "Close button", 30),
        line("photoCount", "Photo count", 40, "{current} and {total} are filled in, for example “2 of 4”."),
        line("onThisPage", "“On this page” (Facility Features)", 40),
        line("required", "Explains the * on required form fields", 40),
        line("newTab", "Read out after links that open a new tab", 40),
        line("skipToContent", "Skip link for keyboard users", 40),
      ],
    },
    {
      path: ["notFound"],
      title: "Page not found (404)",
      help: "Shown when someone follows a broken link.",
      fields: [line("heading", "Big heading", 40), line("text", "Text", 120), line("linkLabel", "Link back to the homepage", 40)],
    },
  ],
};

/** The fields of a group without a key sit at the same level as their group. */
function flatFields(fields: Field[]): Field[] {
  return fields.flatMap((f) => (f.kind === "group" && !f.key ? flatFields(f.fields) : [f]));
}

// A field outside its screen's scopes (lib/screens.ts) would show up but never be saved. Say so while developing.
if (process.env.NODE_ENV !== "production") {
  for (const key of screenKeys) {
    for (const block of screenBlocks[key]) {
      for (const f of flatFields(block.fields)) {
        const path = [...block.path, f.key ?? ""];
        if (!screens[key].scopes.some((scope) => scope.every((k, i) => path[i] === k))) {
          console.error(`screen-fields: the "${key}" screen shows ${path.join(".")}, which isn't in its scopes in lib/screens.ts, so it would never be saved.`);
        }
      }
    }
  }
}

const photoParts: Record<string, string> = { src: "Photo file", alt: "Description", focus: "Crop", width: "Photo file", height: "Photo file", original: "Photo file" };
/** Parts of the content no field shows, named for the history page. */
const hiddenLabels: Record<string, { screen: ScreenKey; label: string }> = {
  "hero.previousBanner": { screen: "banner", label: "Promo banner › Previous banner (kept for “Restore previous banner”)" },
  "hero.video.src": { screen: "banner", label: "Promo banner › Video file" },
};

/**
 * Where a content path is edited, in the owner's words: "Home page › Options › Storage option 2 › Title", with a link
 * to the screen (and the field). Null if no screen shows it.
 */
export function describePath(path: (string | number)[]): { screen: ScreenKey; label: string; href: string } | null {
  const hidden = Object.entries(hiddenLabels).find(([p]) => path.join(".").startsWith(p));
  if (hidden) return { ...hidden[1], href: `/admin/${hidden[1].screen}` };
  for (const screen of screenKeys) {
    for (const block of screenBlocks[screen]) {
      if (!block.path.every((k, i) => path[i] === k)) continue;
      const labels: string[] = [screens[screen].title];
      let rest = path.slice(block.path.length);
      let fields = block.fields;
      let anchor: (string | number)[] = [...block.path];
      let found = false;
      while (rest.length) {
        const field = flatFields(fields).find((f) => f.key === rest[0]);
        if (!field) break;
        found = true;
        labels.push(field.label);
        anchor = [...anchor, rest[0]];
        if (field.kind === "group") {
          fields = field.fields;
          rest = rest.slice(1);
          continue;
        }
        if (field.kind === "list" && typeof rest[1] === "number") {
          labels.push(`${field.itemName[0].toUpperCase()}${field.itemName.slice(1)} ${rest[1] + 1}`);
          anchor = [...anchor, rest[1]];
          fields = field.fields;
          rest = rest.slice(2);
          continue;
        }
        if ((field.kind === "strings" || field.kind === "photos") && typeof rest[1] === "number") {
          labels.push(`${field.kind === "photos" ? "Photo" : field.itemName[0].toUpperCase() + field.itemName.slice(1)} ${rest[1] + 1}`);
          anchor = [...anchor, rest[1]];
          if (field.kind === "photos" && typeof rest[2] === "string" && photoParts[rest[2]]) labels.push(photoParts[rest[2]]);
        } else if (field.kind === "photo" && typeof rest[1] === "string" && photoParts[rest[1]]) {
          labels.push(photoParts[rest[1]]);
        }
        break;
      }
      if (found) return { screen, label: labels.join(" › "), href: `/admin/${screen}#f-${anchor.join("-")}` };
    }
  }
  return null;
}

/** "Home page: Heading, Photo; Footer: Copyright line" style summary of a list of changed paths. */
export function describeChanges(paths: (string | number)[][], max = 4): string {
  const byScreen = new Map<string, string[]>();
  for (const p of paths) {
    const d = describePath(p);
    if (!d) continue;
    const [title, ...rest] = d.label.split(" › ");
    const what = rest.length ? rest[rest.length - 1] : title;
    const list = byScreen.get(title) ?? [];
    if (!list.includes(what)) list.push(what);
    byScreen.set(title, list);
  }
  return [...byScreen]
    .map(([title, what]) => `${title}: ${what.slice(0, max).join(", ")}${what.length > max ? ` and ${what.length - max} more` : ""}`)
    .join("; ");
}
