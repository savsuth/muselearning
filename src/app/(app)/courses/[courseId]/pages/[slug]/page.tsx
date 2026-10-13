"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Article, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { fmtDate } from "@/lib/logic";
import { courseModules, itemHref } from "@/lib/course-utils";
import { useCourse } from "@/components/course-context";
import { ButtonLink, EmptyState, Html } from "@/components/ui";

export default function PageView() {
  const { slug } = useParams<{ slug: string }>();
  const { course, data, staff } = useCourse();
  if (!course) return null;
  const page = data.pages.find((p) => p.courseId === course.id && p.slug === slug);
  if (!page || (!page.published && !staff)) return <EmptyState icon={<Article size={22} />} title="Page not found" action={<ButtonLink href={`/courses/${course.id}/pages`}>All pages</ButtonLink>} />;

  const flat = courseModules(data, course.id, staff).flatMap((m) => m.items.filter((i) => i.type !== "header"));
  const at = flat.findIndex((i) => i.type === "page" && i.refId === page.id);
  const prev = at > 0 ? flat[at - 1] : undefined;
  const next = at >= 0 && at < flat.length - 1 ? flat[at + 1] : undefined;

  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] text-balance">{page.title}</h1>
      <p className="mt-2 text-sm text-muted">Updated {fmtDate(page.updatedAt, { month: "long", day: "numeric", year: "numeric" })}</p>
      <Html html={page.body} className="mt-6" />
      {(prev || next) && (
        <nav aria-label="Module navigation" className="mt-12 grid grid-cols-2 gap-3 border-t border-line pt-6">
          {prev ? (
            <Link href={itemHref(data, course.id, prev) ?? "#"} className="group flex flex-col gap-1 rounded-[14px] border border-line p-4 transition-colors hover:border-line-strong">
              <span className="flex items-center gap-1 text-xs text-muted">
                <ArrowLeft size={12} /> Previous
              </span>
              <span className="truncate text-sm font-medium group-hover:text-accent">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={itemHref(data, course.id, next) ?? "#"} className="group flex flex-col items-end gap-1 rounded-[14px] border border-line p-4 text-right transition-colors hover:border-line-strong">
              <span className="flex items-center gap-1 text-xs text-muted">
                Next <ArrowRight size={12} />
              </span>
              <span className="max-w-full truncate text-sm font-medium group-hover:text-accent">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
