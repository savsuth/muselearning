"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CalendarCheck, CheckCircle, Exam, FileText, Rows, SquaresFour, Sparkle, Tray } from "@phosphor-icons/react";
import { useState } from "react";
import { useMe, useStore } from "@/lib/store";
import { cn, dueLabel, fmtDate, fmtTime, greeting, isStaff, myCourses, relative, startOfDay, workItems } from "@/lib/logic";
import type { WorkItem } from "@/lib/types";
import { CourseCard } from "@/components/course-card";
import { useNow } from "@/lib/now";
import { EmptyState, Panel, Segmented, StatusChip } from "@/components/ui";

type View = "cards" | "list";

export default function DashboardPage() {
  const me = useMe()!;
  const data = useStore((s) => s.data);
  const [view, setView] = useState<View>("cards");
  const [day, setDay] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const courses = myCourses(data, me.id);
  const teaching = courses.filter((c) => isStaff(data, me.id, c.id));
  const learning = courses.filter((c) => !isStaff(data, me.id, c.id));
  const favorites = courses.filter((c) => c.favorite);
  const now = useNow();
  const work = workItems(data, me.id).filter((w) => learning.some((c) => c.id === w.courseId));
  const todo = work.filter((w) => (w.status === "upcoming" || w.status === "missing") && new Date(w.dueAt).getTime() > now - 7 * 86_400_000);
  const firstName = me.name.split(" ")[0];

  const week = (() => {
    const start = startOfDay(new Date(now));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const end = d.getTime() + 86_400_000;
      const items = work.filter((w) => {
        const t = new Date(w.dueAt).getTime();
        return t >= d.getTime() && t < end;
      });
      return { i, date: d, items, open: items.filter((x) => x.status === "upcoming").length };
    });
  })();

  const dueThisWeek = week.reduce((s, d) => s + d.open, 0);
  const missing = work.filter((w) => w.status === "missing").length;

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-8 lg:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm text-muted">{fmtDate(new Date(now).toISOString(), { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 text-[32px] leading-tight font-semibold tracking-[-0.03em]">
            {greeting(new Date(now))}, {firstName}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted">
            {teaching.length > 0 && learning.length === 0
              ? `You are teaching ${teaching.length} ${teaching.length === 1 ? "course" : "courses"} this term.`
              : dueThisWeek === 0
                ? "Nothing due in the next seven days. Enjoy it."
                : `${dueThisWeek} ${dueThisWeek === 1 ? "thing" : "things"} due in the next seven days${missing ? `, and ${missing} missing` : ""}.`}
          </p>
        </div>
        {learning.length > 0 && <Segmented<View>
          label="Dashboard view"
          value={view}
          onChange={setView}
          options={[
            { value: "cards", label: "Cards" },
            { value: "list", label: "Planner" },
          ]}
        />}
      </header>

      {learning.length > 0 && (
        <div className="mb-8 grid grid-cols-7 gap-1.5 sm:gap-2.5" role="group" aria-label="Next seven days">
          {week.map((d) => {
            const active = day === d.i;
            const isToday = d.i === 0;
            return (
              <button
                key={d.i}
                onClick={() => {
                  setDay(active ? null : d.i);
                  setView("list");
                }}
                aria-pressed={active}
                className={cn(
                  "group flex flex-col items-start rounded-[12px] border px-2 py-2.5 text-left transition-[background-color,border-color,transform] active:scale-[0.98] sm:px-3.5 sm:py-3",
                  active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <span className={cn("text-[11px] font-medium sm:text-xs", isToday ? "text-accent" : "text-muted")}>{isToday ? "Today" : fmtDate(d.date.toISOString(), { weekday: "short" })}</span>
                <span className="text-lg font-semibold tabular-nums sm:text-[22px]">{d.date.getDate()}</span>
                <span className="mt-1.5 flex h-1.5 w-full gap-0.5">
                  {d.items.slice(0, 4).map((it) => (
                    <span key={it.id} className="h-full flex-1 rounded-full" style={{ background: data.courses.find((c) => c.id === it.courseId)?.color, opacity: it.status === "upcoming" ? 1 : 0.3 }} />
                  ))}
                </span>
                <span className="mt-1.5 hidden text-xs text-muted sm:block">{d.items.length ? (d.open ? `${d.open} due` : "Done") : "Free"}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {view === "cards" ? (
            favorites.length === 0 ? (
              <EmptyState icon={<SquaresFour size={22} />} title="No courses on your dashboard" body="Star courses from All courses to pin them here." action={<Link href="/courses" className="text-sm font-medium text-accent hover:underline">Browse all courses</Link>} />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {favorites.map((c, i) => (
                  <motion.div key={c.id} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}>
                    <CourseCard course={c} />
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <Planner work={work} day={day} onClearDay={() => setDay(null)} />
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {teaching.length > 0 && <GradingQueue courseIds={teaching.map((c) => c.id)} />}
          {learning.length > 0 && <TodoList items={todo.slice(0, 7)} />}
          {learning.length > 0 && <RecentFeedback />}
          <ComingUp />
        </aside>
      </div>
    </div>
  );
}

function SideHeading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
      <h2 className="text-[15px] font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

function TodoList({ items }: { items: WorkItem[] }) {
  const data = useStore((s) => s.data);
  return (
    <section aria-label="To do">
      <SideHeading>To do</SideHeading>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted">
          <CheckCircle size={18} className="text-success" /> All caught up.
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((w) => {
            const c = data.courses.find((x) => x.id === w.courseId)!;
            const Icon = w.kind === "quiz" ? Exam : FileText;
            return (
              <li key={w.id}>
                <Link href={w.href} className="group -mx-2 flex gap-3 rounded-[10px] px-2 py-2.5 transition-colors hover:bg-surface-2">
                  <Icon size={20} className="mt-0.5 shrink-0" style={{ color: c.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium group-hover:text-accent">{w.title}</span>
                    <span className="block truncate text-xs text-muted">{c.code}</span>
                    <span className={cn("mt-0.5 block text-xs", w.status === "missing" ? "font-medium text-danger" : "text-muted")}>
                      {w.points} pts, {w.status === "missing" ? "missing" : dueLabel(w.dueAt).replace("Due ", "due ")}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RecentFeedback() {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const recent = data.submissions
    .filter((s) => s.userId === me && s.score !== undefined && s.gradedAt)
    .sort((a, b) => (b.gradedAt ?? "").localeCompare(a.gradedAt ?? ""))
    .slice(0, 3);
  if (!recent.length) return null;
  return (
    <section aria-label="Recent feedback">
      <SideHeading>Recent feedback</SideHeading>
      <ul className="flex flex-col">
        {recent.map((s) => {
          const a = data.assignments.find((x) => x.id === s.assignmentId)!;
          const c = data.courses.find((x) => x.id === a.courseId)!;
          const pct = ((s.score ?? 0) / a.points) * 100;
          return (
            <li key={s.id}>
              <Link href={`/courses/${a.courseId}/assignments/${a.id}`} className="group -mx-2 flex items-start gap-3 rounded-[10px] px-2 py-2.5 transition-colors hover:bg-surface-2">
                <span className="mt-0.5 flex size-10 shrink-0 flex-col items-center justify-center rounded-[10px] bg-success-soft text-success">
                  <span className="text-[13px] leading-none font-semibold tabular-nums">{Math.round(pct)}</span>
                  <span className="text-[9px] leading-none">%</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-accent">{a.title}</span>
                  <span className="block text-xs text-muted">
                    {c.code}, {s.score}/{a.points}
                  </span>
                  {s.comments[0] && <span className="mt-1 line-clamp-2 block text-xs text-muted italic">&ldquo;{s.comments[s.comments.length - 1].body}&rdquo;</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ComingUp() {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const ids = new Set(myCourses(data, me).map((c) => c.id));
  const now = useNow();
  const events = data.events
    .filter((e) => (e.courseId ? ids.has(e.courseId) : e.userId === me) && new Date(e.endAt).getTime() > now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 4);
  return (
    <section aria-label="Coming up">
      <SideHeading action={<Link href="/calendar" className="text-xs font-medium text-accent hover:underline">View calendar</Link>}>Coming up</SideHeading>
      <ul className="flex flex-col">
        {events.map((e) => {
          const c = data.courses.find((x) => x.id === e.courseId);
          const live = new Date(e.startAt).getTime() <= now;
          return (
            <li key={e.id} className="flex gap-3 py-2.5">
              <CalendarCheck size={20} className="mt-0.5 shrink-0" style={{ color: c?.color ?? "var(--muted)" }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{e.title}</span>
                <span className="block text-xs text-muted">
                  {live ? <span className="font-medium text-success">Happening now</span> : `${relative(e.startAt)}, ${fmtTime(e.startAt)}`}
                  {e.location ? `, ${e.location}` : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function GradingQueue({ courseIds }: { courseIds: string[] }) {
  const data = useStore((s) => s.data);
  const rows = data.assignments
    .filter((a) => courseIds.includes(a.courseId))
    .map((a) => ({ a, n: data.submissions.filter((s) => s.assignmentId === a.id && s.submittedAt && s.score === undefined).length }))
    .filter((r) => r.n > 0)
    .sort((x, y) => y.n - x.n);
  return (
    <Panel className="p-4">
      <SideHeading>To grade</SideHeading>
      {rows.length === 0 ? (
        <p className="flex items-center gap-2 py-3 text-sm text-muted">
          <Sparkle size={18} className="text-success" /> Every submission is graded.
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map(({ a, n }) => {
            const c = data.courses.find((x) => x.id === a.courseId)!;
            return (
              <li key={a.id}>
                <Link href={`/courses/${a.courseId}/gradebook?a=${a.id}`} className="group -mx-2 flex items-center gap-3 rounded-[10px] px-2 py-2.5 hover:bg-surface-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-accent text-sm font-semibold text-on-accent tabular-nums">{n}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:text-accent">{a.title}</span>
                    <span className="block text-xs text-muted">{c.code}, {n === 1 ? "1 submission" : `${n} submissions`} waiting</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function Planner({ work, day, onClearDay }: { work: WorkItem[]; day: number | null; onClearDay: () => void }) {
  const data = useStore((s) => s.data);
  const start = startOfDay(new Date());
  const filtered = work.filter((w) => {
    const t = new Date(w.dueAt).getTime();
    if (day !== null) {
      const ds = start.getTime() + day * 86_400_000;
      return t >= ds && t < ds + 86_400_000;
    }
    return t >= start.getTime() - 7 * 86_400_000;
  });
  const byDay = new Map<string, WorkItem[]>();
  for (const w of filtered) {
    const k = startOfDay(new Date(w.dueAt)).toISOString();
    byDay.set(k, [...(byDay.get(k) ?? []), w]);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (!days.length)
    return <EmptyState icon={<Tray size={22} />} title="Nothing scheduled" body={day !== null ? "No work is due that day." : "No upcoming work."} action={day !== null ? <button onClick={onClearDay} className="text-sm font-medium text-accent hover:underline">Show all days</button> : undefined} />;
  return (
    <div className="flex flex-col gap-8">
      {day !== null && (
        <button onClick={onClearDay} className="flex items-center gap-1.5 self-start text-sm font-medium text-accent hover:underline">
          <Rows size={16} /> Show every day
        </button>
      )}
      {days.map(([k, items]) => {
        const d = new Date(k);
        const diff = Math.round((d.getTime() - start.getTime()) / 86_400_000);
        return (
          <section key={k} className="grid grid-cols-1 gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
            <div className="md:pt-3">
              <p className={cn("text-sm font-semibold", diff === 0 && "text-accent")}>{diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday" : fmtDate(k, { weekday: "long" })}</p>
              <p className="text-xs text-muted">{fmtDate(k, { month: "long", day: "numeric" })}</p>
            </div>
            <Panel className="divide-y divide-line overflow-hidden">
              {items.map((w) => {
                const c = data.courses.find((x) => x.id === w.courseId)!;
                return (
                  <Link key={w.id} href={w.href} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2">
                    <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium" style={{ color: c.color }}>
                        <span className="dark:brightness-[1.6]">{c.code} {w.kind === "quiz" ? "Quiz" : "Assignment"}</span>
                      </span>
                      <span className="block truncate text-[15px] font-medium group-hover:text-accent">{w.title}</span>
                    </span>
                    <span className="hidden text-right text-xs text-muted sm:block">
                      <span className="block">{w.points} pts</span>
                      <span className="block">{fmtTime(w.dueAt)}</span>
                    </span>
                    <StatusChip status={w.status} />
                  </Link>
                );
              })}
            </Panel>
          </section>
        );
      })}
    </div>
  );
}
