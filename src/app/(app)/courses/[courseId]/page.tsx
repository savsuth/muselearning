"use client";

import Link from "next/link";
import { CourseCover } from "@/components/course-cover";
import { ArrowRight, CalendarBlank, ChalkboardTeacher, CheckCircle, Clock, Exam, FileText, LockKey, MapPin, Megaphone, Target, Users } from "@phosphor-icons/react";
import { useCourse } from "@/components/course-context";
import { cn, dueLabel, fmtDate, fmtTime, relative, startOfDay, workItems } from "@/lib/logic";
import { courseSnapshot, itemHref, unitStates } from "@/lib/course-utils";
import { useNow } from "@/lib/now";
import { Avatar, ButtonLink, Html, Panel, ProgressRing, StatusChip } from "@/components/ui";

export default function CourseHome() {
  const { course, data, me, staff } = useCourse();
  const now = useNow();
  if (!course) return null;
  const snap = courseSnapshot(data, me, course.id, now);
  const units = unitStates(data, me, course.id);
  const front = data.pages.find((p) => p.courseId === course.id && p.frontPage);
  const latest = data.announcements.filter((a) => a.courseId === course.id).sort((a, b) => b.postedAt.localeCompare(a.postedAt))[0];
  const upcoming = workItems(data, me, course.id).filter((w) => w.status === "upcoming" || w.status === "missing").slice(0, 5);
  const weekStart = startOfDay(new Date(now)).getTime();
  const week = data.events
    .filter((e) => e.courseId === course.id && new Date(e.endAt).getTime() > now && new Date(e.startAt).getTime() < weekStart + 7 * 86_400_000)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const staffDue = data.assignments
    .filter((a) => a.courseId === course.id && new Date(a.dueAt).getTime() > now)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 5)
    .map((a) => ({ id: a.id, title: a.title, dueAt: a.dueAt, href: `/courses/${course.id}/assignments/${a.id}`, kind: "assignment" as const, status: null }));

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-[14px] text-white shadow-card">
        <CourseCover course={course} fadeLeft />
        <span className="absolute inset-0 bg-gradient-to-r from-[rgb(8_8_12/0.35)] to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-white/80">
              {course.code}, {course.term}, {course.credits} credits
            </p>
            <h1 className="mt-1 text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">{course.nickname ?? course.name}</h1>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-white/85">{course.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {course.topics.map((t) => (
                <span key={t} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
              {snap.teacher && (
                <span className="flex items-center gap-2">
                  <ChalkboardTeacher size={18} /> {snap.teacher.name}
                </span>
              )}
              <span className="flex items-center gap-2">
                <CalendarBlank size={18} /> {course.meets}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={18} /> {course.room}
              </span>
            </div>
          </div>
          {staff ? (
            <div className="flex gap-3">
              <Stat label="Students" value={snap.students} />
              <Stat label="To grade" value={snap.toGrade} />
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-[14px] bg-black/25 p-4 backdrop-blur-md">
              <ProgressRing value={snap.progress.pct} size={58} stroke={5} color="#fff" label={<span className="text-white">{Math.round(snap.progress.pct * 100)}%</span>} />
              <div className="text-sm">
                <p className="font-semibold">Course progress</p>
                <p className="text-white/75">
                  {snap.progress.done} of {snap.progress.total} items done
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="course-map">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="course-map" className="text-lg font-semibold tracking-tight">
            Course map
          </h2>
          <Link href={`/courses/${course.id}/modules`} className="text-sm font-medium text-accent hover:underline">
            All modules
          </Link>
        </div>
        <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-7">
          {units.map((u, i) => {
            const title = u.module.name.replace(/^Unit \d+:\s*/, "");
            const pct = u.total ? u.done / u.total : 0;
            const current = !staff && (u.state === "active" || u.state === "open");
            return (
              <li key={u.module.id}>
                <Link
                  href={`/courses/${course.id}/modules#${u.module.id}`}
                  className={cn(
                    "flex h-full flex-col rounded-[12px] border p-3 transition-[border-color,transform] hover:-translate-y-px",
                    current ? "border-accent/50 bg-accent-soft/40" : "border-line bg-surface hover:border-line-strong",
                    u.state === "locked" && !staff && "opacity-60",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Unit {i + 1}</span>
                    {staff ? null : u.state === "done" ? (
                      <CheckCircle size={18} weight="fill" className="text-success" />
                    ) : u.state === "locked" ? (
                      <LockKey size={16} className="text-faint" />
                    ) : (
                      <ProgressRing value={pct} size={18} stroke={2.5} />
                    )}
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[13px] leading-snug font-semibold">{title}</span>
                  <span className="mt-auto pt-2 text-[11px] text-muted">
                    {staff ? `${u.total} items` : u.state === "done" ? "Complete" : u.state === "locked" ? (u.lock.locked && u.lock.reason === "date" ? `Opens ${fmtDate(u.lock.at)}` : "Finish previous unit") : `${u.done} of ${u.total} done`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          {!staff && snap.progress.next && (
            <Link href={itemHref(data, course.id, snap.progress.next.item) ?? "#"} className="group flex items-center gap-4 rounded-[14px] border border-line bg-surface p-5 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-accent/40">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
                <ArrowRight size={22} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-muted">Pick up where you left off, {snap.progress.next.moduleName}</span>
                <span className="block truncate text-[17px] font-semibold tracking-tight group-hover:text-accent">{snap.progress.next.item.title}</span>
              </span>
            </Link>
          )}

          {latest && (
            <Panel className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Megaphone size={18} className="text-accent" /> Latest announcement
                </span>
                <Link href={`/courses/${course.id}/announcements`} className="text-sm font-medium text-accent hover:underline">
                  All announcements
                </Link>
              </div>
              <h2 className="text-lg font-semibold tracking-tight">{latest.title}</h2>
              <p className="mt-0.5 text-xs text-muted">Posted {relative(latest.postedAt, now)}</p>
              <Html html={latest.body} className="mt-2 line-clamp-4 text-muted" />
            </Panel>
          )}

          <section aria-labelledby="outcomes">
            <h2 id="outcomes" className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Target size={20} className="text-accent" /> What you will be able to do
            </h2>
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-3 rounded-[12px] border border-line bg-surface p-4 text-sm leading-relaxed">
                  <CheckCircle size={20} weight="duotone" className="mt-0.5 shrink-0 dark:brightness-[1.6]" style={{ color: course.color }} />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>

          {front && (
            <article>
              <h2 className="mb-1 text-xl font-semibold tracking-tight">{front.title}</h2>
              <p className="mb-3 text-xs text-muted">Updated {fmtDate(front.updatedAt, { month: "long", day: "numeric" })}</p>
              <Html html={front.body} />
            </article>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {snap.grade && snap.grade.pct !== null && (
            <Link href={`/courses/${course.id}/grades`} className="group rounded-[14px] border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong">
              <p className="text-sm text-muted">Current grade</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.03em] tabular-nums">{snap.grade.pct.toFixed(1)}%</span>
                <span className="text-xl font-semibold text-accent">{snap.grade.letter}</span>
              </p>
              <p className="mt-2 flex items-center gap-1 text-sm font-medium text-accent group-hover:underline">
                See all grades <ArrowRight size={14} />
              </p>
            </Link>
          )}

          <section>
            <h2 className="mb-2 border-b border-line pb-2 text-[15px] font-semibold">{staff ? "Upcoming deadlines" : "To do"}</h2>
            {!staff && upcoming.length === 0 && <p className="py-3 text-sm text-muted">Nothing due right now.</p>}
            <ul>
              {(staff ? staffDue : upcoming).map((w) => (
                <li key={w.id}>
                  <Link href={w.href} className="group -mx-2 flex gap-3 rounded-[10px] px-2 py-2.5 hover:bg-surface-2">
                    {w.kind === "quiz" ? <Exam size={20} className="mt-0.5 shrink-0 text-muted" /> : <FileText size={20} className="mt-0.5 shrink-0 text-muted" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium group-hover:text-accent">{w.title}</span>
                      <span className="block text-xs text-muted">{dueLabel(w.dueAt)}</span>
                    </span>
                    {w.status === "missing" && <StatusChip status="missing" />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 border-b border-line pb-2 text-[15px] font-semibold">This week</h2>
            {week.length === 0 ? (
              <p className="py-3 text-sm text-muted">No sessions in the next seven days.</p>
            ) : (
              <ul className="flex flex-col">
                {week.map((e) => {
                  const live = new Date(e.startAt).getTime() <= now;
                  return (
                    <li key={e.id} className="flex items-center gap-3 py-2">
                      <span className="flex w-11 shrink-0 flex-col items-center rounded-[8px] bg-surface-2 py-1">
                        <span className="text-[10px] font-medium text-muted">{fmtDate(e.startAt, { weekday: "short" })}</span>
                        <span className="text-sm leading-tight font-semibold tabular-nums">{new Date(e.startAt).getDate()}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{e.title}</span>
                        <span className="block truncate text-xs text-muted">
                          {live ? <span className="font-medium text-success">Happening now</span> : fmtTime(e.startAt)}, {e.location}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-[14px] bg-surface-2 p-4">
            <h2 className="mb-3 text-[15px] font-semibold">Course staff</h2>
            <ul className="flex flex-col gap-3">
              {[snap.teacher, snap.ta].map((u, i) =>
                u ? (
                  <li key={u.id} className="flex items-center gap-3">
                    <Avatar user={u} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{u.name}</p>
                      <p className="truncate text-xs text-muted">{i === 0 ? "Instructor" : "Teaching assistant"}</p>
                      {u.id !== me && (
                        <Link href={`/inbox?compose=1&to=${u.id}&course=${course.id}`} className="text-xs font-medium text-accent hover:underline">
                          Send a message
                        </Link>
                      )}
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
            <p className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-xs text-muted">
              <Clock size={14} className="mt-0.5 shrink-0" /> Office hours: {course.officeHours}
            </p>
          </section>

          {staff && (
            <div className="flex flex-col gap-2">
              <ButtonLink href={`/courses/${course.id}/gradebook`} variant="primary">
                Open gradebook
              </ButtonLink>
              <ButtonLink href={`/courses/${course.id}/people`}>
                <Users size={16} /> Roster
              </ButtonLink>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[96px] rounded-[14px] bg-black/25 px-4 py-3 backdrop-blur-md">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-white/75">{label}</p>
    </div>
  );
}
