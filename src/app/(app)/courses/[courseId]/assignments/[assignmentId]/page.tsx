"use client";

import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowsClockwise, CalendarBlank, CheckCircle, CloudArrowUp, FileText, Globe, LinkSimple, LockKey, PaperPlaneRight, Paperclip, Target, TextAlignLeft, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { assignmentStatus, cn, fileSize, fmtDateTime, relative } from "@/lib/logic";
import type { Assignment, RubricCriterion, Submission, SubmissionType } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Avatar, Button, ButtonLink, EmptyState, Html, Panel, Segmented, StatusChip, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useNow } from "@/lib/now";

export default function AssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { course, data, me, staff } = useCourse();
  const a = data.assignments.find((x) => x.id === assignmentId && x.courseId === course?.id);
  if (!course) return null;
  if (!a || (!a.published && !staff)) return <EmptyState icon={<FileText size={22} />} title="Assignment not found" action={<ButtonLink href={`/courses/${course.id}/assignments`}>All assignments</ButtonLink>} />;
  const sub = data.submissions.find((s) => s.assignmentId === a.id && s.userId === me);
  const status = assignmentStatus(a, sub);

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em] text-balance">{a.title}</h1>
            {!staff && <StatusChip status={status} />}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-4">
            <Meta icon={<CalendarBlank size={16} />} label="Due" value={fmtDateTime(a.dueAt)} />
            <Meta icon={<Target size={16} />} label="Points" value={String(a.points)} />
            <Meta icon={<CloudArrowUp size={16} />} label="Submitting" value={a.submissionTypes.length ? a.submissionTypes.map((t) => (t === "text" ? "Text" : t === "file" ? "File" : "URL")).join(", ") : "On paper"} />
            <Meta icon={<LockKey size={16} />} label="Available" value={a.availableFrom ? `From ${fmtDateTime(a.availableFrom)}` : "Now"} />
          </dl>
        </div>
        <Html html={a.description} />
        {a.rubric && <Rubric rubric={a.rubric} scores={sub?.rubricScores} />}
      </div>
      <aside className="flex flex-col gap-5 xl:sticky xl:top-24 xl:self-start">
        {staff ? <StaffSubmissions a={a} /> : <StudentPanel a={a} sub={sub} />}
        {!staff && sub && (sub.submittedAt || sub.comments.length > 0) && <Comments a={a} sub={sub} />}
      </aside>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Rubric({ rubric, scores }: { rubric: RubricCriterion[]; scores?: Record<string, number> }) {
  const total = rubric.reduce((s, c) => s + c.points, 0);
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Rubric</h2>
      <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/70 text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">Criteria</th>
              <th className="px-4 py-2.5 font-medium">Ratings</th>
              <th className="w-20 px-4 py-2.5 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rubric.map((c) => {
              const got = scores?.[c.id];
              return (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="w-[34%] px-4 py-3 align-top">
                    <p className="font-medium">{c.description}</p>
                    {c.longDescription && <p className="mt-0.5 text-xs text-muted">{c.longDescription}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.ratings.map((r) => {
                        const closest = got !== undefined && c.ratings.reduce((best, x) => (Math.abs(x.points - got) < Math.abs(best.points - got) ? x : best)) === r;
                        return (
                          <span key={r.label} className={cn("rounded-[8px] border px-2.5 py-1.5 text-xs", closest ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted")}>
                            {r.label} <span className="tabular-nums opacity-70">{r.points}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-top font-medium tabular-nums">
                    {got !== undefined ? <>{got}<span className="text-muted">/{c.points}</span></> : c.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface-2/70">
              <td colSpan={2} className="px-4 py-2.5 text-right text-xs text-muted">Total</td>
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                {scores ? Object.values(scores).reduce((s, x) => s + x, 0) : ""}
                {scores ? "/" : ""}
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function StudentPanel({ a, sub }: { a: Assignment; sub?: Submission }) {
  const status = assignmentStatus(a, sub);
  const [resubmitting, setResubmitting] = useState(false);
  const reduce = useReducedMotion();
  const now = useNow();

  if (a.submissionTypes.length === 0)
    return (
      <Panel className="p-5">
        <p className="text-sm font-semibold">Completed in class</p>
        <p className="mt-1 text-sm text-muted">This is graded on paper. Your score appears here once it is entered.</p>
        {sub?.score !== undefined && <ScoreBlock a={a} sub={sub} />}
      </Panel>
    );

  if (status === "locked")
    return (
      <Panel className="flex flex-col items-center p-8 text-center">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
          <LockKey size={22} />
        </span>
        <p className="font-semibold">Not open yet</p>
        <p className="mt-1 text-sm text-muted">Submissions open {a.availableFrom ? fmtDateTime(a.availableFrom) : "soon"}.</p>
      </Panel>
    );

  if (sub?.submittedAt && !resubmitting)
    return (
      <Panel className="overflow-hidden">
        {sub.score !== undefined ? (
          <ScoreBlock a={a} sub={sub} />
        ) : (
          <div className="flex items-center gap-3 border-b border-line bg-success-soft px-5 py-4">
            <motion.span initial={reduce ? false : { scale: 0.3, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 16 }}>
              <CheckCircle size={30} weight="fill" className="text-success" />
            </motion.span>
            <div>
              <p className="font-semibold text-success">Submitted</p>
              <p className="text-xs text-success/80">Waiting to be graded</p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3 p-5 text-sm">
          <p className="text-muted">
            Attempt {sub.attempt}, {fmtDateTime(sub.submittedAt)}
            {status === "late" && <span className="ml-1 font-medium text-warning">(late)</span>}
          </p>
          {sub.fileName && (
            <div className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5">
              <Paperclip size={18} className="text-muted" />
              <span className="min-w-0 flex-1 truncate font-medium">{sub.fileName}</span>
              {sub.fileSize && <span className="text-xs text-muted">{fileSize(sub.fileSize)}</span>}
            </div>
          )}
          {sub.url && (
            <a href={sub.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 truncate rounded-[10px] border border-line px-3 py-2.5 font-medium text-accent hover:underline">
              <Globe size={18} /> {sub.url}
            </a>
          )}
          {sub.body && <p className="line-clamp-6 rounded-[10px] bg-surface-2 p-3 whitespace-pre-wrap text-muted">{sub.body}</p>}
          {sub.score === undefined && (
            <Button size="sm" onClick={() => setResubmitting(true)} className="self-start">
              <ArrowsClockwise size={16} /> Resubmit
            </Button>
          )}
        </div>
      </Panel>
    );

  return <SubmitForm a={a} onDone={() => setResubmitting(false)} onCancel={resubmitting ? () => setResubmitting(false) : undefined} late={new Date(a.dueAt).getTime() < now} />;
}

function ScoreBlock({ a, sub }: { a: Assignment; sub: Submission }) {
  const pct = ((sub.score ?? 0) / a.points) * 100;
  return (
    <div className="border-b border-line bg-surface-2/60 px-5 py-5">
      <p className="text-xs font-medium text-muted">Your grade</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[40px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{sub.score}</span>
        <span className="text-lg text-muted">/ {a.points}</span>
        <span className="ml-auto rounded-full bg-success-soft px-2.5 py-1 text-sm font-semibold text-success tabular-nums">{pct.toFixed(1)}%</span>
      </p>
      {sub.gradedAt && <p className="mt-2 text-xs text-muted">Graded {relative(sub.gradedAt)}</p>}
    </div>
  );
}

function SubmitForm({ a, onDone, onCancel, late }: { a: Assignment; onDone: () => void; onCancel?: () => void; late: boolean }) {
  const me = useStore((s) => s.me)!;
  const draft = useStore((s) => s.data.drafts[`${me}:${a.id}`]);
  const saveDraft = useStore((s) => s.saveDraft);
  const submit = useStore((s) => s.submitAssignment);
  const [mode, setMode] = useState<SubmissionType>(a.submissionTypes[0]);
  const [body, setBody] = useState(draft ?? "");
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [url, setUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== "text") return;
    const t = setTimeout(() => {
      if (body !== (draft ?? "")) {
        saveDraft(a.id, body);
        setSaved(true);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [body, mode, a.id, draft, saveDraft]);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  const go = () => {
    setError(null);
    if (mode === "text" && words < 3) return setError("Write a few words before submitting.");
    if (mode === "file" && !file) return setError("Choose a file to upload.");
    if (mode === "url" && !/^https?:\/\/[^\s]+\.[^\s]+/.test(url)) return setError("Enter a full link starting with https://");
    submit(a.id, mode === "text" ? { body } : mode === "file" ? { fileName: file!.name, fileSize: file!.size } : { url });
    toast("Submitted", late ? "It is past the due date, so it will be marked late." : `${a.title} is in. Nice work.`);
    onDone();
  };

  const tabs = a.submissionTypes.map((t) => ({ value: t, label: t === "text" ? "Text" : t === "file" ? "File" : "Website" }));

  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">{onCancel ? "New attempt" : "Submit assignment"}</h2>
        {onCancel && (
          <button onClick={onCancel} aria-label="Cancel resubmission" className="text-muted hover:text-fg">
            <X size={18} />
          </button>
        )}
      </div>
      {tabs.length > 1 && (
        <div className="mb-4">
          <Segmented<SubmissionType> label="Submission type" value={mode} onChange={(v) => { setMode(v); setError(null); }} options={tabs} />
        </div>
      )}
      {late && <p className="mb-3 rounded-[10px] bg-warning-soft px-3 py-2 text-xs font-medium text-warning">This is past due. It will be marked late.</p>}

      {mode === "text" && (
        <div>
          <label htmlFor="sub-body" className="sr-only">Your response</label>
          <textarea id="sub-body" rows={9} value={body} onChange={(e) => { setBody(e.target.value); setSaved(false); }} placeholder="Write your response here…" className={cn(inputClass, "resize-y py-2.5 leading-relaxed")} />
          <p className="mt-1.5 flex justify-between text-xs text-muted">
            <span className="tabular-nums">{words} {words === 1 ? "word" : "words"}</span>
            <AnimatePresence>{saved && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Draft saved</motion.span>}</AnimatePresence>
          </p>
        </div>
      )}
      {mode === "file" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) setFile({ name: f.name, size: f.size });
          }}
          className={cn("flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed px-4 py-8 text-center transition-colors", drag ? "border-accent bg-accent-soft" : "border-line-strong")}
        >
          {file ? (
            <div className="flex w-full items-center gap-3 rounded-[10px] bg-surface-2 px-3 py-2.5 text-left">
              <Paperclip size={18} className="text-muted" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted">{fileSize(file.size)}</span>
              <button onClick={() => setFile(null)} aria-label="Remove file" className="text-muted hover:text-fg"><X size={16} /></button>
            </div>
          ) : (
            <>
              <CloudArrowUp size={30} className="mb-2 text-muted" />
              <p className="text-sm font-medium">Drop a file here</p>
              <p className="text-xs text-muted">or</p>
              <Button size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>Choose a file</Button>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile({ name: f.name, size: f.size }); }} />
              <p className="mt-3 text-[11px] text-faint">Only the file name and size are stored on this device.</p>
            </>
          )}
        </div>
      )}
      {mode === "url" && (
        <div className="relative">
          <LinkSimple size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" aria-label="Website URL" className={cn(inputClass, "h-10 pl-9")} />
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
      <Button variant="primary" className="mt-4 w-full" onClick={go}>
        <PaperPlaneRight size={16} weight="fill" /> Submit
      </Button>
    </Panel>
  );
}

function Comments({ a, sub }: { a: Assignment; sub: Submission }) {
  const users = useStore((s) => s.data.users);
  const add = useStore((s) => s.addSubmissionComment);
  const [text, setText] = useState("");
  return (
    <Panel className="p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
        <TextAlignLeft size={18} /> Feedback and comments
      </h2>
      {sub.comments.length === 0 && <p className="mb-3 text-sm text-muted">No comments yet. Leave a note for your instructor.</p>}
      <ul className="flex flex-col gap-4">
        {sub.comments.map((c) => {
          const u = users.find((x) => x.id === c.authorId);
          return (
            <li key={c.id} className="flex gap-3">
              <Avatar user={u} size={32} />
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{u?.name}</span> <span className="text-xs text-muted">{relative(c.at)}</span>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap text-fg/90">{c.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          add(a.id, sub.userId, text.trim());
          setText("");
        }}
        className="mt-4 flex gap-2"
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" aria-label="Add a comment" className={cn(inputClass, "h-10")} />
        <Button type="submit" variant="secondary" aria-label="Send comment" disabled={!text.trim()}>
          <PaperPlaneRight size={16} />
        </Button>
      </form>
    </Panel>
  );
}

function StaffSubmissions({ a }: { a: Assignment }) {
  const data = useStore((s) => s.data);
  const students = data.enrollments.filter((e) => e.courseId === a.courseId && e.role === "student").map((e) => data.users.find((u) => u.id === e.userId)!);
  const rows = students.map((u) => {
    const s = data.submissions.find((x) => x.assignmentId === a.id && x.userId === u.id);
    return { u, s, status: assignmentStatus(a, s) };
  });
  const submitted = rows.filter((r) => r.s?.submittedAt).length;
  const graded = rows.filter((r) => r.s?.score !== undefined);
  const avg = graded.length ? graded.reduce((x, r) => x + (r.s!.score ?? 0), 0) / graded.length : null;
  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-line border-b border-line text-center">
        <div className="py-4">
          <p className="text-xl font-semibold tabular-nums">{submitted}</p>
          <p className="text-xs text-muted">Submitted</p>
        </div>
        <div className="py-4">
          <p className="text-xl font-semibold tabular-nums">{submitted - graded.filter((r) => r.s?.submittedAt).length}</p>
          <p className="text-xs text-muted">To grade</p>
        </div>
        <div className="py-4">
          <p className="text-xl font-semibold tabular-nums">{avg === null ? "-" : avg.toFixed(1)}</p>
          <p className="text-xs text-muted">Average</p>
        </div>
      </div>
      <ul className="max-h-[420px] divide-y divide-line overflow-y-auto scrollbar-thin">
        {rows.map(({ u, s, status }) => (
          <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar user={u} size={28} />
            <span className="min-w-0 flex-1 truncate text-sm">{u.name}</span>
            {s?.score !== undefined ? <span className="text-sm font-semibold tabular-nums">{s.score}</span> : <StatusChip status={status === "upcoming" ? "upcoming" : status} />}
          </li>
        ))}
      </ul>
      <div className="border-t border-line p-4">
        <ButtonLink href={`/courses/${a.courseId}/gradebook?a=${a.id}`} variant="primary" className="w-full">
          Grade in gradebook
        </ButtonLink>
      </div>
    </Panel>
  );
}
