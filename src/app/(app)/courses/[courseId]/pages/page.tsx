"use client";

import Link from "next/link";
import { Article, House } from "@phosphor-icons/react";
import { fmtDate } from "@/lib/logic";
import { useCourse } from "@/components/course-context";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export default function PagesPage() {
  const { course, data, staff } = useCourse();
  if (!course) return null;
  const pages = data.pages.filter((p) => p.courseId === course.id && (staff || p.published)).sort((a, b) => (a.frontPage ? -1 : b.frontPage ? 1 : a.title.localeCompare(b.title, undefined, { numeric: true })));
  return (
    <div>
      <PageHeader title="Pages" />
      {pages.length === 0 ? (
        <EmptyState icon={<Article size={22} />} title="No pages yet" />
      ) : (
        <Panel className="divide-y divide-line overflow-hidden">
          {pages.map((p) => (
            <Link key={p.id} href={`/courses/${course.id}/pages/${p.slug}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2/60">
              {p.frontPage ? <House size={20} className="text-accent" /> : <Article size={20} className="text-muted" />}
              <span className="min-w-0 flex-1 truncate font-medium group-hover:text-accent">{p.title}</span>
              {p.frontPage && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Front page</span>}
              <span className="text-xs text-muted">Updated {fmtDate(p.updatedAt)}</span>
            </Link>
          ))}
        </Panel>
      )}
    </div>
  );
}
