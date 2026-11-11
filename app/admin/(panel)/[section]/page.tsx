import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScreenEditor } from "@/components/admin/ScreenEditor";
import { requireUser } from "@/lib/auth";
import { readContent } from "@/lib/content";
import { isScreenKey, screens } from "@/lib/screens";
import { uploadMode } from "@/lib/storage";

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  return { title: isScreenKey(section) ? screens[section].title : "Edit" };
}

export default async function ScreenPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isScreenKey(section)) notFound();
  const user = await requireUser();
  if (screens[section].ownerOnly && user.role !== "owner") {
    return (
      <header className="page-head">
        <h1>Only an owner can change this</h1>
        <p className="lede-admin">Ask an owner if something here needs to change.</p>
      </header>
    );
  }
  const content = await readContent();
  return <ScreenEditor key={section} screen={section} content={content} uploadMode={uploadMode()} />;
}
