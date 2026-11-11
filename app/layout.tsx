import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/Footer";
import { Gtm, GtmNoScript } from "@/components/Gtm";
import { Header } from "@/components/Header";
import { LocalBusinessJsonLd } from "@/components/LocalBusinessJsonLd";
import { Motion } from "@/components/Motion";
import { getSiteContent, getYear } from "@/lib/content";
import { SITE_URL } from "@/lib/links";
import "./globals.css";
import "./styles/shared.css";
import "./styles/chrome.css";
import "./styles/home.css";
import "./styles/pages.css";

// Archivo (display, variable width + weight) and Inter (text), self-hosted through next/font: no layout shift,
// no request to Google Fonts. Files copied from @fontsource-variable (OFL, see app/fonts/LICENSE-*).
const archivo = localFont({
  src: "./fonts/archivo-variable.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});
const inter = localFont({ src: "./fonts/inter-variable.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });

// Before first paint: lets CSS hide [data-reveal] content only when JS runs, and shows it again if the app
// hasn't started within 4s, so a slow or failed load never leaves sections invisible.
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");setTimeout(function(){if(!window.__mvsMotion)d.classList.remove("js")},4000)})()`;

// Every page sets its own title (lib/seo.ts); the default here covers pages without one, like not-found.
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSiteContent();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.notFound.title, template: "%s" },
    formatDetection: { telephone: true, address: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2340",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [content, year] = await Promise.all([getSiteContent(), getYear()]);
  return (
    <html lang="en-US" className={`${archivo.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <GtmNoScript />
        <a className="skip-link" href="#main">
          {content.labels.skipToContent}
        </a>
        <Header content={content} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer content={content} year={year} />
        <Motion />
        <LocalBusinessJsonLd content={content} />
        <Gtm />
      </body>
    </html>
  );
}
