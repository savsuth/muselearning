"use client";

import { useSearchParams } from "next/navigation";
import { File, FileArchive, FileAudio, FileCode, FileDoc, FilePdf, FileXls, Folder, FolderOpen, Image as ImageIcon, MagnifyingGlass, PresentationChart } from "@phosphor-icons/react";
import { useState } from "react";
import { cn, fileSize, fmtDate } from "@/lib/logic";
import type { CourseFile } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { EmptyState, Modal, PageHeader, Panel, inputClass } from "@/components/ui";

const kindIcon: Record<CourseFile["kind"], typeof File> = {
  pdf: FilePdf,
  doc: FileDoc,
  slides: PresentationChart,
  image: ImageIcon,
  zip: FileArchive,
  code: FileCode,
  sheet: FileXls,
  audio: FileAudio,
};

export default function FilesPage() {
  const { course, data } = useCourse();
  const params = useSearchParams();
  const focus = params.get("f");
  const [folder, setFolder] = useState<string | null>(() => (focus ? (data.files.find((f) => f.id === focus)?.folder ?? null) : null));
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<CourseFile | null>(() => data.files.find((f) => f.id === focus) ?? null);
  if (!course) return null;
  const all = data.files.filter((f) => f.courseId === course.id);
  const folders = [...new Set(all.map((f) => f.folder))].sort();
  const files = all.filter((f) => (folder ? f.folder === folder : true) && f.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const total = all.reduce((s, f) => s + f.size, 0);

  return (
    <div>
      <PageHeader title="Files" sub={`${all.length} files, ${fileSize(total)}`} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Folders" className="flex gap-1 overflow-x-auto md:flex-col">
          {[null, ...folders].map((name) => {
            const active = folder === name;
            const Icon = active ? FolderOpen : Folder;
            return (
              <button key={name ?? "all"} onClick={() => setFolder(name)} className={cn("flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-sm transition-colors", active ? "bg-surface font-semibold shadow-card ring-1 ring-line" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                <Icon size={18} weight={active ? "fill" : "regular"} className={active ? "text-accent" : ""} />
                <span className="flex-1 truncate">{name ?? "All files"}</span>
                <span className="text-xs text-faint tabular-nums">{name ? all.filter((f) => f.folder === name).length : all.length}</span>
              </button>
            );
          })}
        </nav>
        <div className="min-w-0">
          <div className="relative mb-4 max-w-xs">
            <MagnifyingGlass size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" aria-label="Search files" className={cn(inputClass, "h-10 pl-9")} />
          </div>
          {files.length === 0 ? (
            <EmptyState icon={<Folder size={22} />} title="No files here" />
          ) : (
            <Panel className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/70 text-left text-xs text-muted">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Folder</th>
                    <th className="hidden px-4 py-2.5 font-medium md:table-cell">Modified</th>
                    <th className="px-4 py-2.5 text-right font-medium">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => {
                    const Icon = kindIcon[f.kind];
                    return (
                      <tr key={f.id} className={cn("border-b border-line last:border-0 hover:bg-surface-2/60", f.id === focus && "bg-accent-soft/50")}>
                        <td className="px-4 py-2.5">
                          <button onClick={() => setPreview(f)} className="flex max-w-full items-center gap-3 text-left font-medium hover:text-accent">
                            <Icon size={22} className="shrink-0 text-muted" />
                            <span className="truncate">{f.name}</span>
                          </button>
                        </td>
                        <td className="hidden px-4 py-2.5 text-muted sm:table-cell">{f.folder}</td>
                        <td className="hidden px-4 py-2.5 text-muted md:table-cell">{fmtDate(f.updatedAt)}</td>
                        <td className="px-4 py-2.5 text-right text-muted tabular-nums">{fileSize(f.size)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      </div>
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? "File"}>
        {preview && (
          <div className="flex flex-col items-center text-center">
            <div className="flex size-24 items-center justify-center rounded-[14px] bg-surface-2">
              {(() => {
                const Icon = kindIcon[preview.kind];
                return <Icon size={48} weight="duotone" className="text-accent" />;
              })()}
            </div>
            <p className="mt-4 font-semibold break-all">{preview.name}</p>
            <p className="mt-1 text-sm text-muted">
              {fileSize(preview.size)}, in {preview.folder}, updated {fmtDate(preview.updatedAt, { month: "long", day: "numeric" })}
            </p>
            <p className="mt-5 rounded-[10px] bg-surface-2 px-4 py-3 text-xs text-muted">This is sample course data, so there is no file content to open.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
