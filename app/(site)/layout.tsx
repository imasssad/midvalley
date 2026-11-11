// Layout of the public website (every page except the admin panel): the shared header, footer, structured data
// and Google Tag Manager (components/SiteChrome.tsx).
import { SiteChrome } from "@/components/SiteChrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
