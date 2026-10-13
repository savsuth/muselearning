"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, CheckSquare, Exam, FileText, MapPin, Square } from "@phosphor-icons/react";
import { useState } from "react";
import { useMe, useStore } from "@/lib/store";
import { cn, fmtDate, fmtTime, myCourses, startOfDay, workItems } from "@/lib/logic";
import { useNow } from "@/lib/now";
import { Button, Panel, Segmented } from "@/components/ui";

type View = "month" | "week" | "agenda";

interface CalItem {
  id: string;
  courseId?: string;
  title: string;
  start: Date;
  end?: Date;
  allDay: boolean;
  kind: "lecture" | "lab" | "office" | "exam" | "personal" | "assignment" | "quiz";
  href?: string;
  location?: string;
  done?: boolean;
}

const DAY = 86_400_000;
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

export default function CalendarPage() {
  const me = useMe()!;
  const data = useStore((s) => s.data);
  const now = useNow();
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date(now)));
  const [selected, setSelected] = useState(() => startOfDay(new Date(now)));
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [dir, setDir] = useState(0);

  const courses = myCourses(data, me.id);
  const ids = new Set(courses.map((c) => c.id));
  const color = (cid?: string) => courses.find((c) => c.id === cid)?.color ?? "var(--muted)";

  const items: CalItem[] = [
    ...data.events.filter((e) => (e.courseId ? ids.has(e.courseId) : e.userId === me.id) && !hidden.has(e.courseId ?? "personal")).map((e) => ({ id: e.id, courseId: e.courseId, title: e.title, start: new Date(e.startAt), end: new Date(e.endAt), allDay: false, kind: e.kind, location: e.location })),
    ...workItems(data, me.id)
      .filter((w) => !hidden.has(w.courseId))
      .map((w) => ({ id: w.id, courseId: w.courseId, title: w.title, start: new Date(w.dueAt), allDay: true, kind: w.kind, href: w.href, done: w.status === "graded" || w.status === "submitted" || w.status === "late" })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const on = (d: Date) => items.filter((i) => startOfDay(i.start).getTime() === d.getTime());

  const shift = (n: number) => {
    setDir(n);
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + n, 1);
    else d.setDate(d.getDate() + n * 7);
    setCursor(startOfDay(d));
  };

  const today = startOfDay(new Date(now));
  const title = view === "month" ? fmtDate(cursor.toISOString(), { month: "long", year: "numeric" }) : (() => {
    const s = new Date(cursor.getTime() - cursor.getDay() * DAY);
    const e = new Date(s.getTime() + 6 * DAY);
    return `${fmtDate(s.toISOString(), { month: "short", day: "numeric" })} to ${fmtDate(e.toISOString(), { month: "short", day: "numeric", year: "numeric" })}`;
  })();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-2 text-[26px] font-semibold tracking-[-0.02em]">Calendar</h1>
        {view !== "agenda" && (
          <div className="flex items-center gap-1">
            <button onClick={() => shift(-1)} aria-label="Previous" className="flex size-9 items-center justify-center rounded-[10px] hover:bg-surface-2">
              <CaretLeft size={18} />
            </button>
            <button onClick={() => shift(1)} aria-label="Next" className="flex size-9 items-center justify-center rounded-[10px] hover:bg-surface-2">
              <CaretRight size={18} />
            </button>
            <Button size="sm" onClick={() => { setCursor(today); setSelected(today); }}>
              Today
            </Button>
            <p className="ml-2 text-lg font-medium tabular-nums">{title}</p>
          </div>
        )}
        <div className="ml-auto">
          <Segmented<View> label="Calendar view" value={view} onChange={setView} options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }, { value: "agenda", label: "Agenda" }]} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
            <motion.div key={`${view}-${cursor.toISOString()}`} initial={reduce ? false : { opacity: 0, x: dir * 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
              {view === "month" && <Month cursor={cursor} today={today} selected={selected} onSelect={setSelected} on={on} color={color} />}
              {view === "week" && <Week cursor={cursor} today={today} on={on} color={color} now={now} />}
              {view === "agenda" && <Agenda items={items.filter((i) => i.start.getTime() >= today.getTime() - DAY && i.start.getTime() < today.getTime() + 30 * DAY)} color={color} today={today} />}
            </motion.div>
        </div>
        <aside className="flex flex-col gap-6">
          {view === "month" && <DayDetail day={selected} items={on(selected)} color={color} />}
          <section>
            <h2 className="mb-2 text-sm font-semibold">Calendars</h2>
            <ul className="flex flex-col gap-0.5">
              {[...courses.map((c) => ({ id: c.id, label: c.nickname ?? c.name, color: c.color })), { id: "personal", label: "Personal", color: "var(--muted)" }].map((c) => {
                const off = hidden.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() =>
                        setHidden((h) => {
                          const n = new Set(h);
                          if (n.has(c.id)) n.delete(c.id);
                          else n.add(c.id);
                          return n;
                        })
                      }
                      aria-pressed={!off}
                      className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-sm hover:bg-surface-2"
                    >
                      {off ? <Square size={18} style={{ color: c.color }} /> : <CheckSquare size={18} weight="fill" style={{ color: c.color }} />}
                      <span className={cn("truncate", off && "text-muted")}>{c.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Chip({ it, color }: { it: CalItem; color: (c?: string) => string }) {
  const body = (
    <span className={cn("flex items-center gap-1 truncate rounded-[5px] px-1.5 py-0.5 text-[11px] leading-4 font-medium", it.done && "line-through opacity-50")} style={{ background: `color-mix(in oklab, ${color(it.courseId)} 14%, transparent)`, color: "var(--fg)" }}>
      <span className="h-3 w-[3px] shrink-0 rounded-full" style={{ background: color(it.courseId) }} />
      {!it.allDay && <span className="text-muted tabular-nums">{fmtTime(it.start.toISOString()).replace(":00", "")}</span>}
      <span className="truncate">{it.title}</span>
    </span>
  );
  return it.href ? (
    <Link href={it.href} onClick={(e) => e.stopPropagation()} className="block hover:brightness-95">
      {body}
    </Link>
  ) : (
    body
  );
}

function Month({ cursor, today, selected, onSelect, on, color }: { cursor: Date; today: Date; selected: Date; onSelect: (d: Date) => void; on: (d: Date) => CalItem[]; color: (c?: string) => string }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return startOfDay(d);
  });
  const weekdays = days.slice(0, 7).map((d) => fmtDate(d.toISOString(), { weekday: "short" }));
  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line bg-surface-2/70">
        {weekdays.map((w) => (
          <div key={w} className="px-2 py-2 text-center text-xs font-medium text-muted">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const list = on(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = d.getTime() === today.getTime();
          const isSel = d.getTime() === selected.getTime();
          return (
            <div
              key={d.toISOString()}
              onClick={() => onSelect(d)}
              className={cn("relative min-h-[92px] cursor-pointer border-line p-1.5 text-left transition-colors sm:min-h-[118px]", i % 7 !== 6 && "border-r", i < 35 && "border-b", !inMonth && "bg-surface-2/40", isSel ? "bg-accent-soft/60" : "hover:bg-surface-2/60")}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(d);
                }}
                aria-label={`${fmtDate(d.toISOString(), { weekday: "long", month: "long", day: "numeric" })}, ${list.length} ${list.length === 1 ? "item" : "items"}`}
                aria-pressed={isSel}
                className={cn("mb-1 flex size-7 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-colors", isToday ? "bg-accent text-on-accent" : inMonth ? "text-fg hover:bg-surface-3" : "text-faint hover:bg-surface-3")}
              >
                {d.getDate()}
              </button>
              <div className="hidden flex-col gap-0.5 sm:flex">
                {list.slice(0, 3).map((it) => (
                  <Chip key={it.id} it={it} color={color} />
                ))}
                {list.length > 3 && <span className="px-1.5 text-[11px] font-medium text-muted">{list.length - 3} more</span>}
              </div>
              {list.length > 0 && (
                <div className="flex gap-0.5 px-1 sm:hidden">
                  {list.slice(0, 4).map((it) => (
                    <span key={it.id} className="size-1.5 rounded-full" style={{ background: color(it.courseId) }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Week({ cursor, today, on, color, now }: { cursor: Date; today: Date; on: (d: Date) => CalItem[]; color: (c?: string) => string; now: number }) {
  const start = new Date(cursor.getTime() - cursor.getDay() * DAY);
  const days = Array.from({ length: 7 }, (_, i) => startOfDay(new Date(start.getTime() + i * DAY + 3_600_000)));
  const rowH = 52;
  const nowDate = new Date(now);
  const nowTop = ((nowDate.getHours() + nowDate.getMinutes() / 60 - HOURS[0]) * rowH);
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line bg-surface-2/70">
            <div />
            {days.map((d) => {
              const isToday = d.getTime() === today.getTime();
              return (
                <div key={d.toISOString()} className="border-l border-line px-2 py-2 text-center">
                  <p className="text-xs text-muted">{fmtDate(d.toISOString(), { weekday: "short" })}</p>
                  <p className={cn("mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums", isToday && "bg-accent text-on-accent")}>{d.getDate()}</p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line">
            <div className="px-2 py-1.5 text-right text-[10px] text-muted">Due</div>
            {days.map((d) => (
              <div key={d.toISOString()} className="flex min-h-[34px] flex-col gap-0.5 border-l border-line p-1">
                {on(d)
                  .filter((i) => i.allDay)
                  .map((it) => (
                    <Chip key={it.id} it={it} color={color} />
                  ))}
              </div>
            ))}
          </div>
          <div className="relative grid max-h-[620px] grid-cols-[56px_repeat(7,minmax(0,1fr))] overflow-y-auto scrollbar-thin">
            <div>
              {HOURS.map((h) => (
                <div key={h} style={{ height: rowH }} className="pr-2 text-right text-[10px] text-muted">
                  <span className={cn("relative", h !== HOURS[0] && "-top-1.5")}>{fmtTime(new Date(2026, 0, 1, h).toISOString()).replace(":00", "")}</span>
                </div>
              ))}
            </div>
            {days.map((d) => {
              const isToday = d.getTime() === today.getTime();
              return (
                <div key={d.toISOString()} className="relative border-l border-line" style={{ height: rowH * HOURS.length }}>
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: rowH }} className="border-b border-line/60" />
                  ))}
                  {on(d)
                    .filter((i) => !i.allDay)
                    .map((it) => {
                      const top = (it.start.getHours() + it.start.getMinutes() / 60 - HOURS[0]) * rowH;
                      const height = Math.max(22, (((it.end?.getTime() ?? it.start.getTime() + 3_600_000) - it.start.getTime()) / 3_600_000) * rowH - 2);
                      return (
                        <div key={it.id} className="absolute inset-x-1 overflow-hidden rounded-[6px] px-1.5 py-1 text-[11px] leading-tight" style={{ top, height, background: `color-mix(in oklab, ${color(it.courseId)} 16%, var(--surface))`, borderLeft: `3px solid ${color(it.courseId)}` }}>
                          <p className="truncate font-semibold">{it.title}</p>
                          <p className="truncate text-muted">
                            {fmtTime(it.start.toISOString())}
                            {it.location ? `, ${it.location}` : ""}
                          </p>
                        </div>
                      );
                    })}
                  {isToday && nowTop > 0 && nowTop < rowH * HOURS.length && (
                    <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
                      <span className="-ml-1 size-2 rounded-full bg-accent" />
                      <span className="h-0.5 flex-1 bg-accent" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Agenda({ items, color, today }: { items: CalItem[]; color: (c?: string) => string; today: Date }) {
  const byDay = new Map<number, CalItem[]>();
  for (const it of items) {
    const k = startOfDay(it.start).getTime();
    byDay.set(k, [...(byDay.get(k) ?? []), it]);
  }
  return (
    <div className="flex flex-col gap-6">
      {[...byDay.entries()].map(([k, list]) => {
        const diff = Math.round((k - today.getTime()) / DAY);
        return (
          <section key={k} className="grid grid-cols-1 gap-2 sm:grid-cols-[130px_minmax(0,1fr)]">
            <div className="sm:pt-3">
              <p className={cn("text-sm font-semibold", diff === 0 && "text-accent")}>{diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday" : fmtDate(new Date(k).toISOString(), { weekday: "long" })}</p>
              <p className="text-xs text-muted">{fmtDate(new Date(k).toISOString(), { month: "long", day: "numeric" })}</p>
            </div>
            <Panel className="divide-y divide-line overflow-hidden">
              {list.map((it) => (
                <AgendaRow key={it.id} it={it} color={color} />
              ))}
            </Panel>
          </section>
        );
      })}
    </div>
  );
}

function AgendaRow({ it, color }: { it: CalItem; color: (c?: string) => string }) {
  const Icon = it.kind === "quiz" ? Exam : FileText;
  const inner = (
    <div className={cn("flex items-center gap-4 px-4 py-3", it.href && "hover:bg-surface-2/60")}>
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: color(it.courseId) }} />
      <span className="w-20 shrink-0 text-xs text-muted tabular-nums">{it.allDay ? "Due " + fmtTime(it.start.toISOString()) : fmtTime(it.start.toISOString())}</span>
      <span className="min-w-0 flex-1">
        <span className={cn("flex items-center gap-1.5 truncate text-sm font-medium", it.done && "text-muted line-through")}>
          {it.allDay && <Icon size={15} className="shrink-0 text-muted" />}
          {it.title}
        </span>
        {it.location && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} /> {it.location}
          </span>
        )}
      </span>
    </div>
  );
  return it.href ? <Link href={it.href}>{inner}</Link> : inner;
}

function DayDetail({ day, items, color }: { day: Date; items: CalItem[]; color: (c?: string) => string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">{fmtDate(day.toISOString(), { weekday: "long" })}</h2>
      <p className="mb-3 text-sm text-muted">{fmtDate(day.toISOString(), { month: "long", day: "numeric", year: "numeric" })}</p>
      {items.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">Nothing scheduled.</p>
      ) : (
        <Panel className="divide-y divide-line overflow-hidden">
          {items.map((it) => (
            <AgendaRow key={it.id} it={it} color={color} />
          ))}
        </Panel>
      )}
    </section>
  );
}
