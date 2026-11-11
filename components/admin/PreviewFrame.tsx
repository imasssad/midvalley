"use client";

// Shows the website as it will look with the draft content: a frame (app/admin/preview) drawn at real computer, tablet or
// phone width and scaled down to fit. The frame can't be clicked or focused; it's a picture that updates live.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { SiteContent } from "@/lib/content-schema";
import { PREVIEW_MSG, type PreviewLayout, type PreviewTarget } from "./preview-protocol";

const WIDTHS = { computer: 1280, tablet: 820, phone: 390 } as const;
export type Device = keyof typeof WIDTHS;

type Props = {
  target: PreviewTarget;
  content: SiteContent;
  title: string;
  device?: Device;
  /** Drawn on top of the scaled page, for example clickable areas. Positions are in page pixels × scale. */
  overlay?: (layout: PreviewLayout & { scale: number }) => ReactNode;
  onLayout?: (layout: PreviewLayout & { scale: number }) => void;
};

export function PreviewFrame({ target, content, title, device = "computer", overlay, onLayout }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<PreviewLayout>({ height: 0, zones: [] });

  const width = WIDTHS[device];
  const scale = boxWidth ? Math.min(1, boxWidth / width) : 0;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The latest draft, for a frame that (re)loads after it changed.
  const latest = useRef({ target, content });
  const send = () =>
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MSG.content, ...latest.current, now: Date.now() }, location.origin);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: string } & PreviewLayout;
      if (d?.type === PREVIEW_MSG.ready) {
        setReady(true);
        send();
      }
      if (d?.type === PREVIEW_MSG.layout) setLayout({ height: d.height, zones: d.zones });
    };
    window.addEventListener("message", onMessage);
    // The frame may have started before this listener existed; ask it to say ready again.
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MSG.hello }, location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    latest.current = { target, content };
    if (ready) send();
  }, [ready, target, content]);

  useEffect(() => {
    if (scale && layout.height) onLayout?.({ ...layout, scale });
  }, [layout, scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const height = layout.height || 480;
  return (
    <div ref={box} className="preview-box" data-device={device}>
      <div className="preview-scaler" style={{ width: width * scale, height: height * scale }}>
        <iframe
          ref={frame}
          src="/admin/preview"
          title={title}
          tabIndex={-1}
          aria-hidden="true"
          style={{ width, height, transform: `scale(${scale})`, visibility: scale && layout.height ? "visible" : "hidden" }}
        />
        {overlay && scale > 0 && layout.height > 0 && <div className="preview-overlay">{overlay({ ...layout, scale })}</div>}
      </div>
      {!layout.height && <p className="preview-loading">Loading preview…</p>}
    </div>
  );
}
