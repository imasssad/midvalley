// Title band at the top of the inner pages (About Us, Facility Features, Contact Us): the page's wide photo
// under a strong navy gradient (keeps the white h1 above AA contrast on any photo) and the page's one h1.
// The photo is above the fold, so it loads eagerly at full width. No copy of its own: everything is passed in.
import type { Photo as PhotoData } from "@/lib/content-schema";
import { Photo } from "./Photo";

type Props = {
  heading: string;
  photo: PhotoData;
  /** Optional small label above the heading (from content). */
  eyebrow?: string;
  id?: string;
};

export function PageHero({ heading, photo, eyebrow, id = "page-title" }: Props) {
  return (
    <header className="page-hero on-navy" aria-labelledby={id}>
      <Photo photo={photo} sizes="100vw" className="page-hero-photo" eager />
      <div className="page-hero-shade" aria-hidden="true" />
      <div className="wrap page-hero-inner">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 id={id}>{heading}</h1>
      </div>
    </header>
  );
}
