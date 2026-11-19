// The specials bar: a slim glossy navy bar with the current offer at the very top of every public page, above the
// header (components/SiteChrome.tsx). In normal document flow, never fixed, and nothing to dismiss. A small glossy
// tag chip, the offer in white condensed caps, the optional small print in light blue-grey, and an optional compact
// orange button (the bar's one orange accent). Phones: the offer and small print run on together beside a round
// 44px orange arrow button (its words stay its accessible name), so the bar stays short above the header.
// Shown while switched on and inside its dates (whole days in California time, lib/format.ts). The page is cached
// (for up to an hour), so the server's decision can be a little stale around midnight: the tiny inline script
// re-checks the dates against the visitor's clock before the bar is painted, so it appears and disappears on time.
// Every word comes from content.specials (admin: Specials bar); the bar's name for screen readers from labels.
import type { SiteContent } from "@/lib/content-schema";
import { specialsWindow } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { NewTabNote } from "./NewTab";

const recheck = `(function(){var e=document.getElementById("specials-bar");if(!e)return;var n=Date.now();e.hidden=!(n>=Number(e.getAttribute("data-from"))&&n<Number(e.getAttribute("data-until")))})()`;
/** Far past / far future, for open-ended dates (valid Date range limits). */
const NEVER = 8.64e15;

/** `preview` (admin panel): always drawn, whatever the switch and the dates say, and without the script. */
export function SpecialsBar({ content, now, preview = false }: { content: SiteContent; now: number; preview?: boolean }) {
  const { specials, labels } = content;
  if (!specials.text) return null;
  if (!preview && !specials.enabled) return null;
  const { from, until } = specialsWindow(specials);
  if (!preview && until <= now) return null; // already over: nothing to re-check
  const showButton = Boolean(specials.buttonLabel && specials.buttonUrl);
  return (
    <>
      <aside
        id={preview ? undefined : "specials-bar"}
        className="specials"
        aria-label={labels.specialsBar}
        data-from={Number.isFinite(from) ? from : -NEVER}
        data-until={Number.isFinite(until) ? until : NEVER}
        hidden={!preview && now < from}
        suppressHydrationWarning
      >
        <div className="wrap specials-inner">
          <span className="specials-tag" aria-hidden="true">
            <Icon name="tag" size={16} />
          </span>
          <p className="specials-copy">
            <strong className="specials-text">{specials.text}</strong>
            {specials.finePrint && <span className="specials-fine"> {specials.finePrint}</span>}
          </p>
          {showButton && (
            <a className="btn btn-cta specials-btn" href={specials.buttonUrl} {...externalLinkProps(specials.buttonUrl)}>
              <span className="specials-btn-label">{specials.buttonLabel}</span>
              <Icon name="arrow" size={18} className="icon-arrow" />
              {externalLinkProps(specials.buttonUrl).target && <NewTabNote text={labels.newTab} />}
            </a>
          )}
        </div>
      </aside>
      {!preview && <script dangerouslySetInnerHTML={{ __html: recheck }} />}
    </>
  );
}
