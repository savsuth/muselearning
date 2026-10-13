"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, DownloadSimple, Globe, MagnifyingGlass, Paperclip, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { assignmentStatus, bestAttempt, cn, courseGrade, fileSize, fmtDateTime, quizPoints, relative } from "@/lib/logic";
import type { Assignment, User } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Avatar, Button, PageHeader, Panel, StatusChip, inputBase, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";

export default function GradebookPage() {
  const { course, data, staff } = useCourse();
  const grade = useStore((s) => s.gradeSubmission);
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const openId = params.get("a");

  if (!course) return null;
  if (!staff) return <p className="py-10 text-center text-sm text-muted">Only course staff can open the gradebook.</p>;

  const students = data.enrollments
    .filter((e) => e.courseId === course.id && e.role === "student")
    .map((e) => data.users.find((u) => u.id === e.userId)!)
    .filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.split(" ").pop()!.localeCompare(b.name.split(" ").pop()!));
  const assignments = data.assignments.filter((a) => a.courseId === course.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const quizzes = data.quizzes.filter((x) => x.courseId === course.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const cols = [...assignments.map((a) => ({ kind: "a" as const, id: a.id, title: a.title, points: a.points, dueAt: a.dueAt })), ...quizzes.map((x) => ({ kind: "q" as const, id: x.id, title: x.title, points: quizPoints(x), dueAt: x.dueAt }))].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const open = assignments.find((a) => a.id === openId);

  const setOpen = (id: string | null) => router.replace(id ? `/courses/${course.id}/gradebook?a=${id}` : `/courses/${course.id}/gradebook`, { scroll: false });

  const exportCsv = () => {
    const header = ["Student", ...cols.map((c) => `${c.title} (${c.points})`), "Total %"];
    const lines = students.map((u) => {
      const cells = cols.map((c) => {
        if (c.kind === "a") return data.submissions.find((s) => s.assignmentId === c.id && s.userId === u.id)?.score ?? "";
        return bestAttempt(data.attempts.filter((t) => t.quizId === c.id && t.userId === u.id))?.score ?? "";
      });
      const g = courseGrade(data, u.id, course.id);
      return [u.name, ...cells, g.pct === null ? "" : g.pct.toFixed(2)];
    });
    const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${course.code.replace(/\s+/g, "-")}-grades.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Gradebook"
        sub="Click a score to edit it. Click an assignment name to grade submissions one by one."
        actions={
          <Button size="sm" onClick={exportCsv}>
            <DownloadSimple size={16} /> Export CSV
          </Button>
        }
      />
      <div className="relative mb-4 max-w-xs">
        <MagnifyingGlass size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a student…" aria-label="Find a student" className={cn(inputClass, "h-10 pl-9")} />
      </div>
      <Panel className="overflow-hidden">
        <div className="max-h-[70vh] overflow-auto scrollbar-thin">
          <table className="border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 min-w-[220px] border-r border-b border-line bg-surface-2 px-4 py-3 text-left text-xs font-medium text-muted">Student</th>
                {cols.map((c) => (
                  <th key={c.id} className={cn("sticky top-0 z-10 min-w-[128px] border-b border-line bg-surface-2 px-3 py-2 text-left align-bottom", openId === c.id && "bg-accent-soft")}>
                    {c.kind === "a" ? (
                      <button onClick={() => setOpen(c.id)} className="block max-w-[150px] text-left">
                        <span className="line-clamp-2 text-xs font-semibold text-fg hover:text-accent hover:underline">{c.title}</span>
                        <span className="text-[11px] font-normal text-muted">Out of {c.points}</span>
                      </button>
                    ) : (
                      <span className="block max-w-[150px]">
                        <span className="line-clamp-2 text-xs font-semibold">{c.title}</span>
                        <span className="text-[11px] font-normal text-muted">Quiz, out of {c.points}</span>
                      </span>
                    )}
                  </th>
                ))}
                <th className="sticky top-0 right-0 z-20 min-w-[100px] border-b border-l border-line bg-surface-2 px-4 py-3 text-right text-xs font-medium text-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((u) => {
                const g = courseGrade(data, u.id, course.id);
                return (
                  <tr key={u.id} className="group">
                    <td className="sticky left-0 z-10 border-r border-b border-line bg-surface px-4 py-2 group-hover:bg-surface-2">
                      <span className="flex items-center gap-2.5">
                        <Avatar user={u} size={26} />
                        <span className="truncate font-medium">{u.name}</span>
                      </span>
                    </td>
                    {cols.map((c) => {
                      if (c.kind === "q") {
                        const best = bestAttempt(data.attempts.filter((t) => t.quizId === c.id && t.userId === u.id));
                        return (
                          <td key={c.id} className="border-b border-line px-3 py-2 tabular-nums group-hover:bg-surface-2/60">
                            {best ? best.score : <span className="text-faint">-</span>}
                          </td>
                        );
                      }
                      const a = assignments.find((x) => x.id === c.id)!;
                      const sub = data.submissions.find((s) => s.assignmentId === c.id && s.userId === u.id);
                      const st = assignmentStatus(a, sub);
                      const key = `${c.id}:${u.id}`;
                      const needs = sub?.submittedAt && sub.score === undefined;
                      return (
                        <td key={c.id} className={cn("border-b border-line px-1.5 py-1 group-hover:bg-surface-2/60", needs && "bg-accent-soft/60", openId === c.id && "bg-accent-soft/40")}>
                          {editing === key ? (
                            <input
                              autoFocus
                              defaultValue={sub?.score ?? ""}
                              inputMode="decimal"
                              aria-label={`Score for ${u.name}, ${a.title}`}
                              onBlur={(e) => {
                                commit(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
                                if (e.key === "Escape") setEditing(null);
                              }}
                              className="h-8 w-20 rounded-[6px] border border-accent bg-surface px-2 tabular-nums focus:ring-2 focus:ring-accent/25 focus:outline-none"
                            />
                          ) : (
                            <button onClick={() => setEditing(key)} aria-label={`${u.name}, ${a.title}: ${sub?.score !== undefined ? `${sub.score} of ${a.points}` : needs ? "needs grading" : st === "missing" ? "missing" : "no score"}. Edit score`} className="flex h-8 w-full items-center gap-1.5 rounded-[6px] px-2 text-left tabular-nums hover:ring-1 hover:ring-line-strong">
                              {sub?.score !== undefined ? (
                                <span className="font-medium">{sub.score}</span>
                              ) : needs ? (
                                <span className="text-xs font-semibold text-accent">Grade</span>
                              ) : st === "missing" ? (
                                <span className="text-xs font-medium text-danger">Missing</span>
                              ) : (
                                <span className="text-faint">-</span>
                              )}
                              {st === "late" && <span className="text-[10px] font-semibold text-warning">LATE</span>}
                            </button>
                          )}
                        </td>
                      );
                      function commit(v: string) {
                        setEditing(null);
                        const t = v.trim();
                        const next = t === "" ? undefined : Number(t);
                        if (next !== undefined && (Number.isNaN(next) || next < 0)) return toast("That is not a valid score", undefined, "danger");
                        if (next === sub?.score) return;
                        grade(c.id, u.id, next);
                      }
                    })}
                    <td className="sticky right-0 z-10 border-b border-l border-line bg-surface px-4 py-2 text-right font-semibold tabular-nums group-hover:bg-surface-2">
                      {g.pct === null ? "-" : `${g.pct.toFixed(1)}%`}
                      <span className="ml-1.5 text-xs font-medium text-muted">{g.letter}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <AnimatePresence>{open && <Grader key={open.id} a={open} students={students} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

function Grader({ a, students, onClose }: { a: Assignment; students: User[]; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const grade = useStore((s) => s.gradeSubmission);
  const reduce = useReducedMotion();
  const ordered = [...students].sort((x, y) => {
    const sx = data.submissions.find((s) => s.assignmentId === a.id && s.userId === x.id);
    const sy = data.submissions.find((s) => s.assignmentId === a.id && s.userId === y.id);
    const rank = (s?: typeof sx) => (s?.submittedAt && s.score === undefined ? 0 : s?.submittedAt ? 1 : 2);
    return rank(sx) - rank(sy);
  });
  const [idx, setIdx] = useState(0);
  const u = ordered[idx];
  const sub = u ? data.submissions.find((s) => s.assignmentId === a.id && s.userId === u.id) : undefined;
  const st = assignmentStatus(a, sub);
  const [score, setScore] = useState<string>(sub?.score !== undefined ? String(sub.score) : "");
  const [comment, setComment] = useState("");

  const goTo = (i: number) => {
    const next = ordered[i];
    if (!next) return;
    const s = data.submissions.find((x) => x.assignmentId === a.id && x.userId === next.id);
    setIdx(i);
    setScore(s?.score !== undefined ? String(s.score) : "");
    setComment("");
  };

  const save = (advance: boolean) => {
    const n = score.trim() === "" ? undefined : Number(score);
    if (n !== undefined && (Number.isNaN(n) || n < 0)) return toast("That is not a valid score", undefined, "danger");
    grade(a.id, u.id, n, comment.trim() || undefined);
    toast("Saved", `${u.name}: ${n ?? "ungraded"}${n !== undefined ? `/${a.points}` : ""}`);
    if (advance && idx < ordered.length - 1) goTo(idx + 1);
    else setComment("");
  };

  if (!u) return null;
  return (
    <>
      <motion.div className="fixed inset-0 z-[55] bg-[rgb(10_10_14/0.35)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        role="dialog"
        aria-label={`Grade ${a.title}`}
        initial={reduce ? { opacity: 0 } : { x: "100%" }}
        animate={{ x: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { x: "100%" }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-[560px] flex-col border-l border-line bg-surface shadow-pop"
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Grading</p>
            <p className="truncate font-semibold">{a.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close grader" className="flex size-9 items-center justify-center rounded-[10px] text-muted hover:bg-surface-2 hover:text-fg">
            <X size={18} />
          </button>
        </header>
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <button onClick={() => goTo(idx - 1)} disabled={idx === 0} aria-label="Previous student" className="flex size-9 items-center justify-center rounded-[10px] border border-line disabled:opacity-40">
            <CaretLeft size={16} />
          </button>
          <select value={idx} onChange={(e) => goTo(Number(e.target.value))} aria-label="Student" className={cn(inputClass, "h-9 flex-1")}>
            {ordered.map((s, i) => {
              const x = data.submissions.find((y) => y.assignmentId === a.id && y.userId === s.id);
              return (
                <option key={s.id} value={i}>
                  {s.name}
                  {x?.submittedAt && x.score === undefined ? " (needs grading)" : x?.score !== undefined ? ` (${x.score})` : ""}
                </option>
              );
            })}
          </select>
          <button onClick={() => goTo(idx + 1)} disabled={idx === ordered.length - 1} aria-label="Next student" className="flex size-9 items-center justify-center rounded-[10px] border border-line disabled:opacity-40">
            <CaretRight size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 scrollbar-thin">
          <div className="mb-4 flex items-center gap-3">
            <Avatar user={u} size={40} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs text-muted">{sub?.submittedAt ? `Submitted ${fmtDateTime(sub.submittedAt)}` : "No submission"}</p>
            </div>
            <StatusChip status={st} />
          </div>
          {sub?.submittedAt ? (
            <div className="flex flex-col gap-3">
              {sub.fileName && (
                <div className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-3">
                  <Paperclip size={18} className="text-muted" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{sub.fileName}</span>
                  {sub.fileSize && <span className="text-xs text-muted">{fileSize(sub.fileSize)}</span>}
                </div>
              )}
              {sub.url && (
                <a href={sub.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 truncate rounded-[10px] border border-line px-3 py-3 text-sm font-medium text-accent hover:underline">
                  <Globe size={18} /> {sub.url}
                </a>
              )}
              {sub.body && <div className="rounded-[10px] bg-surface-2 p-4 text-sm leading-relaxed whitespace-pre-wrap">{sub.body}</div>}
            </div>
          ) : (
            <p className="rounded-[10px] bg-surface-2 p-4 text-sm text-muted">Nothing submitted. You can still enter a score, for example for work handed in on paper.</p>
          )}
          {sub && sub.comments.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Comments</p>
              <ul className="flex flex-col gap-3">
                {sub.comments.map((c) => {
                  const au = data.users.find((x) => x.id === c.authorId);
                  return (
                    <li key={c.id} className="text-sm">
                      <span className="font-medium">{au?.name}</span> <span className="text-xs text-muted">{relative(c.at)}</span>
                      <p className="text-muted">{c.body}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(true);
          }}
          className="flex flex-col gap-3 border-t border-line bg-surface-2/50 p-5"
        >
          <div className="flex items-center gap-3">
            <label htmlFor="grader-score" className="text-sm font-medium">
              Score
            </label>
            <input id="grader-score" value={score} onChange={(e) => setScore(e.target.value)} inputMode="decimal" className={cn(inputBase, "h-10 w-24 text-right font-semibold tabular-nums")} />
            <span className="text-sm text-muted">/ {a.points}</span>
          </div>
          <label htmlFor="grader-comment" className="sr-only">
            Comment
          </label>
          <textarea id="grader-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave feedback (optional)…" className={cn(inputClass, "py-2")} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => save(false)}>Save</Button>
            <Button type="submit" variant="primary">
              Save and next
            </Button>
          </div>
        </form>
      </motion.aside>
    </>
  );
}
