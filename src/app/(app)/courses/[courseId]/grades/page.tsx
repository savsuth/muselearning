"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, Calculator, Info, Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn, courseGrade, fmtDate, letterThresholds, workItems } from "@/lib/logic";
import { useCourse } from "@/components/course-context";
import { Button, PageHeader, Panel, StatusChip, inputBase } from "@/components/ui";

export default function GradesPage() {
  const { course, data, me, staff } = useCourse();
  const whatIf = useStore((s) => s.whatIf);
  const setWhatIf = useStore((s) => s.setWhatIf);
  const clearWhatIf = useStore((s) => s.clearWhatIf);
  const reduce = useReducedMotion();
  const [target, setTarget] = useState(93);

  const items = course ? workItems(data, me, course.id) : [];
  const real = course ? courseGrade(data, me, course.id) : null;
  const scoped = Object.fromEntries(Object.entries(whatIf).filter(([k]) => items.some((i) => i.id === k)));
  const hypo = course ? courseGrade(data, me, course.id, scoped) : null;
  const hasWhatIf = Object.keys(scoped).length > 0;

  const need = (() => {
    if (!course) return null;
    const remaining = items.filter((i) => i.score === undefined && scoped[i.id] === undefined && i.status !== "excused");
    if (!remaining.length) return null;
    const trial = (p: number) => courseGrade(data, me, course.id, { ...scoped, ...Object.fromEntries(remaining.map((r) => [r.id, r.points * p])) }).pct ?? 0;
    const EPS = 1e-6;
    if (trial(1) < target - EPS) return { possible: false as const, max: trial(1) };
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (trial(mid) >= target - EPS) hi = mid;
      else lo = mid;
    }
    return { possible: true as const, pct: hi * 100, count: remaining.length };
  })();

  if (!course) return null;
  if (staff)
    return (
      <div className="py-10 text-center text-sm text-muted">
        Instructors use the <Link href={`/courses/${course.id}/gradebook`} className="font-medium text-accent hover:underline">gradebook</Link>.
      </div>
    );

  const g = hasWhatIf ? hypo! : real!;
  const groups = data.groups.filter((x) => x.courseId === course.id);

  return (
    <div>
      <PageHeader title="Grades" sub="Click any score to try a what-if grade. Real grades never change." />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/70 text-left text-xs text-muted">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((grp) => {
                    const rows = items.filter((i) => i.groupId === grp.id);
                    const gg = g.groups.find((x) => x.id === grp.id);
                    return [
                      ...rows.map((it) => {
                        const wi = scoped[it.id];
                        return (
                          <tr key={it.id} className="border-b border-line">
                            <td className="px-4 py-3">
                              <Link href={it.href} className="font-medium hover:text-accent hover:underline">
                                {it.title}
                              </Link>
                              <span className="block text-xs text-muted">{grp.name}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-muted">{fmtDate(it.dueAt, { month: "short", day: "numeric" })}</td>
                            <td className="px-4 py-3">
                              <StatusChip status={it.status} />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <input
                                  aria-label={`What-if score for ${it.title}`}
                                  inputMode="decimal"
                                  value={wi !== undefined ? String(wi) : it.score !== undefined ? String(it.score) : ""}
                                  placeholder="-"
                                  onChange={(e) => {
                                    const v = e.target.value.trim();
                                    if (v === "" || (it.score !== undefined && Number(v) === it.score)) setWhatIf(it.id, undefined);
                                    else if (!Number.isNaN(Number(v))) setWhatIf(it.id, Math.max(0, Math.min(it.points * 1.5, Number(v))));
                                  }}
                                  className={cn("h-8 w-16 rounded-[8px] border bg-transparent px-2 text-right font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent/25", wi !== undefined ? "border-accent bg-accent-soft text-accent" : "border-transparent hover:border-line-strong focus:border-accent")}
                                />
                                <span className="text-muted">/ {it.points}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      }),
                      <tr key={`${grp.id}-total`} className="border-b border-line bg-surface-2/40">
                        <td className="px-4 py-2.5 text-xs font-semibold" colSpan={3}>
                          {grp.name} <span className="font-normal text-muted">({grp.weight}% of total)</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">{gg?.pct === null || gg?.pct === undefined ? "-" : `${gg.pct.toFixed(1)}%`}</td>
                      </tr>,
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <aside className="flex flex-col gap-5 xl:sticky xl:top-24 xl:self-start">
          <Panel className={cn("p-6 transition-colors", hasWhatIf && "border-accent/50")}>
            <p className="text-sm text-muted">{hasWhatIf ? "What-if total" : "Total"}</p>
            <motion.p key={g.pct?.toFixed(2)} initial={reduce ? false : { opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">{g.pct === null ? "-" : g.pct.toFixed(2)}</span>
              <span className="text-xl text-muted">%</span>
              <span className="ml-auto text-3xl font-semibold text-accent">{g.letter}</span>
            </motion.p>
            {hasWhatIf && real?.pct !== null && real && (
              <p className="mt-2 text-sm text-muted">
                Real grade: <span className="font-medium text-fg">{real.pct?.toFixed(2)}% {real.letter}</span>
              </p>
            )}
            <ul className="mt-5 flex flex-col gap-3">
              {g.groups.map((x) => (
                <li key={x.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted">
                      {x.name} <span className="text-faint">{x.weight}%</span>
                    </span>
                    <span className="font-medium tabular-nums">{x.pct === null ? "-" : `${x.pct.toFixed(1)}%`}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <motion.div className="h-full rounded-full" style={{ background: course.color }} animate={{ width: `${Math.min(100, x.pct ?? 0)}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </li>
              ))}
            </ul>
            {hasWhatIf && (
              <Button size="sm" className="mt-5 w-full" onClick={clearWhatIf}>
                <ArrowCounterClockwise size={16} /> Revert to real scores
              </Button>
            )}
          </Panel>

          <Panel className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Calculator size={18} className="text-accent" /> What do I need?
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <label htmlFor="target" className="text-muted">
                To finish with
              </label>
              <select id="target" value={target} onChange={(e) => setTarget(Number(e.target.value))} className={cn(inputBase, "h-9 pr-8")}>
                {letterThresholds()
                  .filter(([m]) => m >= 60)
                  .map(([m, l]) => (
                    <option key={l} value={m}>
                      {l} ({m}%)
                    </option>
                  ))}
              </select>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              {!need ? (
                <span className="text-muted">Everything is graded. Your grade is final.</span>
              ) : need.possible ? (
                need.pct <= 0.5 ? (
                  <span className="flex items-start gap-1.5">
                    <Sparkle size={16} weight="fill" className="mt-0.5 shrink-0 text-success" /> You already have it locked in, even with zeros on the rest.
                  </span>
                ) : (
                  <>
                    Average at least <span className="font-semibold text-accent tabular-nums">{need.pct.toFixed(1)}%</span> on the {need.count} remaining {need.count === 1 ? "item" : "items"}.
                  </>
                )
              ) : (
                <span className="text-muted">
                  Out of reach this term. A perfect score on everything left gets you to {need.max.toFixed(2)}%.
                </span>
              )}
            </p>
          </Panel>

          <p className="flex items-start gap-2 px-1 text-xs text-muted">
            <Info size={14} className="mt-0.5 shrink-0" /> Ungraded work is left out of the totals, and groups are weighted by the percentages your instructor set.
          </p>
        </aside>
      </div>
    </div>
  );
}
