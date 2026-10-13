"use client";

import Link from "next/link";
import { CourseCover } from "@/components/course-cover";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CalendarBlank, ChalkboardTeacher, Clock, MapPin, Star, Users } from "@phosphor-icons/react";
import { useState } from "react";
import { useMe, useStore } from "@/lib/store";
import { cn, dueLabel, myCourses } from "@/lib/logic";
import { courseSnapshot } from "@/lib/course-utils";
import { useNow } from "@/lib/now";
import type { Course } from "@/lib/types";
import { Avatar, Chip, PageHeader, ProgressRing, Segmented } from "@/components/ui";
import { toast } from "@/lib/toast";

type Filter = "all" | "starred";

export default function CoursesHub() {
  const me = useMe()!;
  const data = useStore((s) => s.data);
  const [filter, setFilter] = useState<Filter>("all");
  const reduce = useReducedMotion();
  const courses = myCourses(data, me.id);
  const shown = filter === "starred" ? courses.filter((c) => c.favorite) : courses;
  const credits = courses.reduce((s, c) => s + c.credits, 0);

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        title="Courses"
        sub={`Fall 2026, ${courses.length} ${courses.length === 1 ? "course" : "courses"}, ${credits} credits`}
        actions={<Segmented<Filter> label="Filter courses" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "starred", label: "Starred" }]} />}
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {shown.map((c, i) => (
          <motion.div key={c.id} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}>
            <CourseRow course={c} />
          </motion.div>
        ))}
      </div>
      {shown.length === 0 && <p className="py-16 text-center text-sm text-muted">No starred courses. Star a course to pin it to your dashboard.</p>}
    </div>
  );
}

function CourseRow({ course }: { course: Course }) {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const toggle = useStore((s) => s.toggleFavorite);
  const now = useNow();
  const snap = courseSnapshot(data, me, course.id, now);
  const base = `/courses/${course.id}`;
  const links = snap.staff
    ? [["Modules", "modules"], ["Assignments", "assignments"], ["Gradebook", "gradebook"], ["People", "people"]]
    : [["Modules", "modules"], ["Assignments", "assignments"], ["Grades", "grades"], ["Syllabus", "syllabus"]];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-card transition-shadow duration-300 hover:shadow-pop sm:flex-row">
      <Link href={base} className="relative block h-40 shrink-0 overflow-hidden sm:h-auto sm:w-60" aria-label={`Open ${course.name}`}>
        <CourseCover course={course} className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]" />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#16171b]">{course.code}</span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Link href={base} className="block text-lg leading-snug font-semibold tracking-tight hover:underline" style={{ color: course.color }}>
              <span className="dark:brightness-[1.6]">{course.nickname ?? course.name}</span>
            </Link>
            <p className="mt-0.5 text-sm text-muted">{course.subtitle}</p>
          </div>
          <button
            onClick={() => {
              toggle(course.id);
              toast(course.favorite ? "Removed from dashboard" : "Added to dashboard", course.code, "info");
            }}
            aria-pressed={course.favorite}
            aria-label={course.favorite ? `Unstar ${course.name}` : `Star ${course.name}`}
            className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-2"
          >
            <Star size={20} weight={course.favorite ? "fill" : "regular"} className={course.favorite ? "text-warning" : "text-faint"} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
          {snap.teacher && (
            <span className="flex items-center gap-1.5">
              <ChalkboardTeacher size={16} /> {snap.teacher.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarBlank size={16} /> {course.meets}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={16} /> {course.room}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {course.topics.slice(0, 4).map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
          {course.topics.length > 4 && <Chip>+{course.topics.length - 4}</Chip>}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-3">
          {snap.staff ? (
            <>
              <Stat icon={<Users size={18} />} value={String(snap.students)} label="Students" />
              <Stat icon={<Clock size={18} />} value={String(snap.toGrade)} label="To grade" accent={snap.toGrade > 0} />
              <div className="min-w-0">
                <p className="text-xs text-muted">Next deadline</p>
                {snap.nextStaffDue ? (
                  <Link href={`${base}/assignments/${snap.nextStaffDue.id}`} className="block truncate text-sm font-medium hover:text-accent">
                    {snap.nextStaffDue.title}
                  </Link>
                ) : (
                  <p className="text-sm text-muted">None scheduled</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <ProgressRing value={snap.progress.pct} size={40} stroke={4} color={course.color} label={`${Math.round(snap.progress.pct * 100)}%`} />
                <div>
                  <p className="text-xs text-muted">Progress</p>
                  <p className="text-sm font-medium tabular-nums">
                    {snap.progress.done}/{snap.progress.total} items
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted">Current grade</p>
                <p className="text-sm font-semibold tabular-nums">
                  {snap.grade?.pct == null ? "-" : `${snap.grade.pct.toFixed(1)}%`} <span className="text-accent">{snap.grade?.letter}</span>
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted">Up next</p>
                {snap.next ? (
                  <Link href={snap.next.href} className="block min-w-0">
                    <span className="block truncate text-sm font-medium hover:text-accent">{snap.next.title}</span>
                    <span className={cn("block truncate text-xs", snap.next.status === "missing" ? "font-medium text-danger" : "text-muted")}>{snap.next.status === "missing" ? "Missing" : dueLabel(snap.next.dueAt)}</span>
                  </Link>
                ) : (
                  <p className="text-sm text-muted">All caught up</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-3">
          {links.map(([label, slug]) => (
            <Link key={slug} href={`${base}/${slug}`} className="rounded-[8px] px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg">
              {label}
            </Link>
          ))}
          <Link href={base} className="ml-auto flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-soft">
            Open course <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
        {snap.ta && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Avatar user={snap.ta} size={18} /> TA: {snap.ta.name}
          </p>
        )}
      </div>
    </article>
  );
}

function Stat({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex size-10 items-center justify-center rounded-[10px]", accent ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted")}>{icon}</span>
      <div>
        <p className="text-lg leading-none font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
