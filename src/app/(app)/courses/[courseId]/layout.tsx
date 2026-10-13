"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { CaretRight, Eye, List, LockKey } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/logic";
import { useCourse } from "@/components/course-context";
import { ButtonLink, EmptyState } from "@/components/ui";

const SECTIONS: { slug: string; label: string; staffOnly?: boolean; studentOnly?: boolean }[] = [
  { slug: "", label: "Home" },
  { slug: "announcements", label: "Announcements" },
  { slug: "modules", label: "Modules" },
  { slug: "assignments", label: "Assignments" },
  { slug: "quizzes", label: "Quizzes" },
  { slug: "discussions", label: "Discussions" },
  { slug: "grades", label: "Grades", studentOnly: true },
  { slug: "gradebook", label: "Gradebook", staffOnly: true },
  { slug: "people", label: "People" },
  { slug: "pages", label: "Pages" },
  { slug: "files", label: "Files" },
  { slug: "syllabus", label: "Syllabus" },
];

export default function CourseLayout({ children }: { children: ReactNode }) {
  const { course, data, staff, role } = useCourse();
  const pathname = usePathname();
  const open = useStore((s) => s.courseNavOpen);
  const setOpen = useStore((s) => s.setCourseNavOpen);
  const reduce = useReducedMotion();

  if (!course)
    return (
      <div className="mx-auto max-w-xl px-6 py-24">
        <EmptyState icon={<LockKey size={22} />} title="Course not found" body="It may have been removed, or you are not enrolled." action={<ButtonLink href="/courses">All courses</ButtonLink>} />
      </div>
    );
  if (!role)
    return (
      <div className="mx-auto max-w-xl px-6 py-24">
        <EmptyState icon={<LockKey size={22} />} title="You are not enrolled in this course" body={`${course.code} ${course.name} is only visible to its students and staff.`} action={<ButtonLink href="/dashboard">Back to dashboard</ButtonLink>} />
      </div>
    );

  const base = `/courses/${course.id}`;
  const parts = pathname.slice(base.length).split("/").filter(Boolean);
  const section = SECTIONS.find((s) => s.slug === (parts[0] ?? "")) ?? SECTIONS[0];
  const leaf = parts[1] ? leafTitle(parts[0], parts[1]) : null;

  function leafTitle(kind: string, id: string) {
    if (kind === "assignments") return data.assignments.find((a) => a.id === id)?.title;
    if (kind === "quizzes") return data.quizzes.find((q) => q.id === id)?.title;
    if (kind === "discussions") return data.discussions.find((d) => d.id === id)?.title;
    if (kind === "pages") return data.pages.find((p) => p.courseId === course!.id && p.slug === id)?.title;
    return null;
  }

  const visible = SECTIONS.filter((s) => (s.staffOnly ? staff : s.studentOnly ? !staff : true));

  return (
    <div>
      <div className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Hide course navigation" : "Show course navigation"}
            aria-expanded={open}
            className="hidden size-9 items-center justify-center rounded-[10px] transition-colors hover:bg-surface-2 lg:flex"
            style={{ color: course.color }}
          >
            <List size={24} weight="bold" className="dark:brightness-[1.6]" />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[15px]">
            <Link href={base} className="shrink-0 font-medium hover:underline" style={{ color: course.color }}>
              <span className="dark:brightness-[1.6]">{course.code}</span>
            </Link>
            {section.slug && (
              <>
                <CaretRight size={14} className="shrink-0 text-faint" />
                <Link href={`${base}/${section.slug}`} className={cn("shrink-0 hover:underline", leaf ? "text-muted" : "font-medium text-fg")}>
                  {section.label}
                </Link>
              </>
            )}
            {leaf && (
              <>
                <CaretRight size={14} className="shrink-0 text-faint" />
                <span className="truncate font-medium">{leaf}</span>
              </>
            )}
          </nav>
          {staff && (
            <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted sm:flex">
              <Eye size={14} /> {role === "ta" ? "TA view" : "Instructor view"}
            </span>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-thin lg:hidden">
          {visible.map((s) => {
            const active = s.slug === section.slug;
            return (
              <Link key={s.slug} href={`${base}${s.slug ? `/${s.slug}` : ""}`} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium", active ? "bg-fg text-bg" : "text-muted hover:bg-surface-2")}>
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex">
        <AnimatePresence initial={false}>
          {open && (
            <motion.aside
              aria-label="Course navigation"
              initial={reduce ? { opacity: 0 } : { width: 0, opacity: 0 }}
              animate={{ width: 228, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-hidden lg:block"
            >
              <div className="w-[228px] px-4 py-6">
                <p className="mb-3 truncate px-3 text-xs text-muted">{course.term}</p>
                <ul className="flex flex-col gap-0.5">
                  {visible.map((s) => {
                    const active = s.slug === section.slug;
                    return (
                      <li key={s.slug}>
                        <Link
                          href={`${base}${s.slug ? `/${s.slug}` : ""}`}
                          aria-current={active ? "page" : undefined}
                          className={cn("relative flex h-9 items-center rounded-[8px] px-3 text-sm transition-colors", active ? "font-semibold text-fg" : "text-muted hover:bg-surface-2 hover:text-fg")}
                        >
                          {active && <motion.span layoutId="course-nav-active" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                          {s.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
