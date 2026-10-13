"use client";

import Link from "next/link";
import { CalendarBlank, Exam, FileText } from "@phosphor-icons/react";
import { fmtDate, fmtTime, quizPoints, startOfDay } from "@/lib/logic";
import { useCourse } from "@/components/course-context";
import { Html, PageHeader, Panel } from "@/components/ui";

export default function SyllabusPage() {
  const { course, data, staff } = useCourse();
  if (!course) return null;
  const rows = [
    ...data.assignments.filter((a) => a.courseId === course.id && (staff || a.published)).map((a) => ({ id: a.id, at: a.dueAt, title: a.title, sub: `${a.points} pts`, href: `/courses/${course.id}/assignments/${a.id}`, icon: FileText })),
    ...data.quizzes.filter((q) => q.courseId === course.id && (staff || q.published)).map((q) => ({ id: q.id, at: q.dueAt, title: q.title, sub: `${quizPoints(q)} pts`, href: `/courses/${course.id}/quizzes/${q.id}`, icon: Exam })),
    ...data.events.filter((e) => e.courseId === course.id && e.kind !== "lecture").map((e) => ({ id: e.id, at: e.startAt, title: e.title, sub: e.location ?? "", href: "/calendar", icon: CalendarBlank })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const byDay = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = startOfDay(new Date(r.at)).toISOString();
    byDay.set(k, [...(byDay.get(k) ?? []), r]);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Syllabus" sub={`${course.code} ${course.name}, ${course.term}`} />
      <Html html={course.syllabus} />
      <h2 className="mt-12 mb-3 text-xl font-semibold tracking-tight">Course summary</h2>
      <Panel className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/70 text-left text-xs text-muted">
              <th className="w-40 px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Details</th>
              <th className="w-28 px-4 py-2.5 text-right font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {[...byDay.entries()].map(([day, items]) =>
              items.map((r, i) => {
                const Icon = r.icon;
                return (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    {i === 0 && (
                      <td rowSpan={items.length} className="px-4 py-3 align-top font-medium whitespace-nowrap">
                        {fmtDate(day, { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link href={r.href} className="flex items-center gap-2.5 font-medium hover:text-accent hover:underline">
                        <Icon size={18} className="shrink-0 text-muted" /> {r.title}
                      </Link>
                      {r.sub && <span className="ml-7 text-xs text-muted">{r.sub}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-muted tabular-nums">{fmtTime(r.at)}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
