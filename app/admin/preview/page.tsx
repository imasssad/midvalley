import type { Metadata } from "next";
import { PreviewCanvas } from "@/components/admin/PreviewCanvas";

export const metadata: Metadata = { title: "Preview" };

// Shown inside the editor's preview frame. It holds no data of its own: the editor sends the draft to it with
// postMessage (same origin only), and it draws the website's own section components with that draft.
export default function PreviewPage() {
  return <PreviewCanvas />;
}
