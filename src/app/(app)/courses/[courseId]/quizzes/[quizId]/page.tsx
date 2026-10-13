"use client";

import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle, Exam, Flag, Info, LockKey, Play, Timer, XCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { bestAttempt, cn, fmtDateTime, gradeQuestion, quizPoints, quizStatus } from "@/lib/logic";
import type { Quiz, QuizAnswer, QuizAttempt, QuizQuestion } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Button, ButtonLink, EmptyState, Html, Kbd, Modal, Panel, ProgressRing, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useNow } from "@/lib/now";

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { course, data, me, staff } = useCourse();
  const [review, setReview] = useState<string | null>(null);
  const quiz = data.quizzes.find((q) => q.id === quizId && q.courseId === course?.id);
  if (!course) return null;
  if (!quiz || (!quiz.published && !staff)) return <EmptyState icon={<Exam size={22} />} title="Quiz not found" action={<ButtonLink href={`/courses/${course.id}/quizzes`}>All quizzes</ButtonLink>} />;
  if (staff) return <StaffPreview quiz={quiz} />;
  const attempts = data.attempts.filter((a) => a.quizId === quiz.id && a.userId === me);
  const open = attempts.find((a) => !a.submittedAt);
  if (open) return <Taking quiz={quiz} attempt={open} onSubmitted={(id) => setReview(id)} />;
  const reviewing = review ? attempts.find((a) => a.id === review) : undefined;
  if (reviewing) return <Results quiz={quiz} attempt={reviewing} onBack={() => setReview(null)} />;
  return <Intro quiz={quiz} attempts={attempts} onReview={setReview} />;
}

function Intro({ quiz, attempts, onReview }: { quiz: Quiz; attempts: QuizAttempt[]; onReview: (id: string) => void }) {
  const start = useStore((s) => s.startQuiz);
  const status = quizStatus(quiz, attempts);
  const done = attempts.filter((a) => a.submittedAt);
  const best = bestAttempt(attempts);
  const pts = quizPoints(quiz);
  const left = quiz.attemptsAllowed - done.length;
  const now = useNow();
  const closed = new Date(quiz.dueAt).getTime() < now;
  const locked = status === "locked";
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em]">{quiz.title}</h1>
      <Html html={quiz.description} className="mt-2 text-muted" />
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-4">
        {[
          ["Due", fmtDateTime(quiz.dueAt)],
          ["Points", String(pts)],
          ["Questions", String(quiz.questions.length)],
          ["Time limit", quiz.timeLimitMin ? `${quiz.timeLimitMin} minutes` : "None"],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface px-4 py-3">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-0.5 text-sm font-medium">{v}</p>
          </div>
        ))}
      </div>

      {best && (
        <Panel className="mt-6 flex items-center gap-5 p-5">
          <ProgressRing value={(best.score ?? 0) / pts} size={64} stroke={6} color="var(--success)" label={`${Math.round(((best.score ?? 0) / pts) * 100)}%`} />
          <div>
            <p className="text-sm text-muted">Kept score</p>
            <p className="text-2xl font-semibold tabular-nums">
              {best.score}
              <span className="text-base font-normal text-muted"> / {pts}</span>
            </p>
          </div>
        </Panel>
      )}

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[15px] font-semibold">Attempts</h2>
          <Panel className="divide-y divide-line">
            {done.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  Attempt {i + 1}
                  <span className="ml-2 text-xs text-muted">{fmtDateTime(a.submittedAt!)}</span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="font-semibold tabular-nums">
                    {a.score}/{pts}
                  </span>
                  {Object.keys(a.answers).length > 0 && (
                    <button onClick={() => onReview(a.id)} className="text-sm font-medium text-accent hover:underline">
                      Review
                    </button>
                  )}
                </span>
              </div>
            ))}
          </Panel>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-3 rounded-[14px] border border-line bg-surface-2/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-muted">
          <Info size={18} className="mt-0.5 shrink-0" />
          {locked
            ? `Opens ${quiz.availableFrom ? fmtDateTime(quiz.availableFrom) : "soon"}.`
            : closed
              ? "This quiz is closed."
              : left <= 0
                ? "You have used every attempt."
                : `The timer starts when you begin and keeps running if you leave. ${left} of ${quiz.attemptsAllowed} ${quiz.attemptsAllowed === 1 ? "attempt" : "attempts"} left.`}
        </p>
        <Button
          variant="primary"
          size="lg"
          disabled={locked || closed || left <= 0}
          onClick={() => {
            start(quiz.id);
          }}
        >
          {locked ? <LockKey size={18} /> : <Play size={18} weight="fill" />} {done.length ? "Retake quiz" : "Start quiz"}
        </Button>
      </div>
    </div>
  );
}

function useRemaining(attempt: QuizAttempt, limitMin?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!limitMin) return null;
  return Math.max(0, limitMin * 60 - Math.floor((now - new Date(attempt.startedAt).getTime()) / 1000));
}

function Taking({ quiz, attempt, onSubmitted }: { quiz: Quiz; attempt: QuizAttempt; onSubmitted: (id: string) => void }) {
  const answer = useStore((s) => s.answerQuestion);
  const flag = useStore((s) => s.toggleFlag);
  const submit = useStore((s) => s.submitQuiz);
  const [i, setI] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const remaining = useRemaining(attempt, quiz.timeLimitMin);
  const q = quiz.questions[i];
  const answered = (id: string) => {
    const v = attempt.answers[id];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  };
  const unanswered = quiz.questions.filter((x) => !answered(x.id)).length;

  const finish = useCallback(
    (auto = false) => {
      submit(attempt.id);
      toast(auto ? "Time is up. Your quiz was submitted." : "Quiz submitted", undefined, auto ? "info" : "success");
      onSubmitted(attempt.id);
    },
    [submit, attempt.id, onSubmitted],
  );

  useEffect(() => {
    if (remaining === 0) finish(true);
  }, [remaining, finish]);

  const go = useCallback((n: number) => {
    setDir(n > i ? 1 : -1);
    setI(Math.max(0, Math.min(quiz.questions.length - 1, n)));
  }, [i, quiz.questions.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || confirm) return;
      if (e.key === "ArrowRight" || e.key === "j") go(i + 1);
      if (e.key === "ArrowLeft" || e.key === "k") go(i - 1);
      if (e.key.toLowerCase() === "f") flag(attempt.id, q.id);
      const n = Number(e.key);
      if (n >= 1 && q.options && n <= q.options.length) {
        if (q.type === "multi") {
          const cur = (attempt.answers[q.id] as number[] | undefined) ?? [];
          answer(attempt.id, q.id, cur.includes(n - 1) ? cur.filter((x) => x !== n - 1) : [...cur, n - 1]);
        } else answer(attempt.id, q.id, n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, q, attempt, go, flag, answer, confirm]);

  const mm = remaining !== null ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : null;
  const low = remaining !== null && remaining <= 60;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{quiz.title}</p>
            <p className="text-lg font-semibold tracking-tight">
              Question {i + 1} <span className="font-normal text-muted">of {quiz.questions.length}</span>
            </p>
          </div>
          {mm && (
            <div role="timer" aria-live={low ? "assertive" : "off"} className={cn("flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[15px] font-semibold tabular-nums transition-colors", low ? "animate-pulse bg-danger-soft text-danger" : "bg-surface-2")}>
              <Timer size={18} /> {mm}
            </div>
          )}
        </div>
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full bg-accent transition-[width] duration-500 ease-out-expo" style={{ width: `${((quiz.questions.length - unanswered) / quiz.questions.length) * 100}%` }} />
        </div>

          <motion.div
            key={q.id}
            initial={reduce ? false : { opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Panel className="p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <p className="text-[19px] leading-snug font-medium tracking-tight text-balance">{q.prompt}</p>
                <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">{q.points} pt{q.points === 1 ? "" : "s"}</span>
              </div>
              <QuestionInput q={q} value={attempt.answers[q.id] ?? null} onChange={(v) => answer(attempt.id, q.id, v)} />
            </Panel>
          </motion.div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button onClick={() => go(i - 1)} disabled={i === 0}>
            <ArrowLeft size={16} /> Previous
          </Button>
          <button onClick={() => flag(attempt.id, q.id)} aria-pressed={attempt.flagged.includes(q.id)} className={cn("flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors", attempt.flagged.includes(q.id) ? "bg-warning-soft text-warning" : "text-muted hover:bg-surface-2")}>
            <Flag size={16} weight={attempt.flagged.includes(q.id) ? "fill" : "regular"} /> {attempt.flagged.includes(q.id) ? "Flagged" : "Flag for review"}
          </button>
          {i < quiz.questions.length - 1 ? (
            <Button variant="primary" onClick={() => go(i + 1)}>
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setConfirm(true)}>
              Review and submit
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Panel className="p-4">
          <p className="mb-3 text-sm font-semibold">Questions</p>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((x, n) => {
              const isFlag = attempt.flagged.includes(x.id);
              return (
                <button
                  key={x.id}
                  onClick={() => go(n)}
                  aria-label={`Question ${n + 1}${answered(x.id) ? ", answered" : ""}${isFlag ? ", flagged" : ""}`}
                  aria-current={n === i}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-[8px] border text-sm font-medium tabular-nums transition-colors",
                    n === i ? "border-accent ring-2 ring-accent/25" : "border-line",
                    answered(x.id) ? "bg-fg text-bg" : "bg-surface hover:bg-surface-2",
                  )}
                >
                  {n + 1}
                  {isFlag && <Flag size={10} weight="fill" className="absolute -top-1 -right-1 text-warning" />}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted">
            {quiz.questions.length - unanswered} answered, {attempt.flagged.length} flagged
          </p>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => setConfirm(true)}>
            Submit quiz
          </Button>
          <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-xs text-muted">
            <span className="flex items-center justify-between">Choose option <Kbd>1-4</Kbd></span>
            <span className="flex items-center justify-between">Next / previous <span className="flex gap-1"><Kbd>←</Kbd><Kbd>→</Kbd></span></span>
            <span className="flex items-center justify-between">Flag <Kbd>F</Kbd></span>
          </div>
        </Panel>
      </aside>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit your quiz?">
        <div className="flex flex-col gap-4">
          {unanswered > 0 || attempt.flagged.length > 0 ? (
            <p className="text-sm text-muted">
              {unanswered > 0 && <><span className="font-semibold text-danger">{unanswered} unanswered</span>{attempt.flagged.length ? " and " : ". "}</>}
              {attempt.flagged.length > 0 && <><span className="font-semibold text-warning">{attempt.flagged.length} flagged</span>. </>}
              You can go back, or submit as is.
            </p>
          ) : (
            <p className="text-sm text-muted">Every question has an answer. Once you submit, this attempt is final.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirm(false)}>Keep working</Button>
            <Button variant="primary" data-autofocus onClick={() => finish()}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function QuestionInput({ q, value, onChange }: { q: QuizQuestion; value: QuizAnswer; onChange: (v: QuizAnswer) => void }) {
  if (q.type === "short" || q.type === "numeric")
    return (
      <div>
        <label htmlFor={`ans-${q.id}`} className="mb-1.5 block text-[13px] font-medium">
          {q.type === "numeric" ? "Your answer (a number)" : "Your answer"}
        </label>
        <input id={`ans-${q.id}`} inputMode={q.type === "numeric" ? "decimal" : "text"} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} autoComplete="off" className={cn(inputClass, "h-12 max-w-sm text-base")} />
      </div>
    );
  const multi = q.type === "multi";
  const sel = multi ? ((value as number[]) ?? []) : value;
  return (
    <div role={multi ? "group" : "radiogroup"} className="flex flex-col gap-2.5">
      {multi && <p className="text-xs text-muted">Select all that apply.</p>}
      {q.options!.map((opt, k) => {
        const checked = multi ? (sel as number[]).includes(k) : sel === k;
        return (
          <button
            key={k}
            role={multi ? "checkbox" : "radio"}
            aria-checked={checked}
            onClick={() => (multi ? onChange(checked ? (sel as number[]).filter((x) => x !== k) : [...(sel as number[]), k]) : onChange(k))}
            className={cn(
              "flex items-center gap-4 rounded-[12px] border px-4 py-3.5 text-left text-[15px] transition-[border-color,background-color,transform] active:scale-[0.995]",
              checked ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong hover:bg-surface-2/60",
            )}
          >
            <span className={cn("flex size-7 shrink-0 items-center justify-center border text-xs font-semibold", multi ? "rounded-[7px]" : "rounded-full", checked ? "border-accent bg-accent text-on-accent" : "border-line-strong text-muted")}>
              {checked ? <CheckCircle size={16} weight="bold" /> : k + 1}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function answerText(q: QuizQuestion, a: QuizAnswer) {
  if (a === null || a === undefined || a === "" || (Array.isArray(a) && !a.length)) return "No answer";
  if (q.type === "short" || q.type === "numeric") return String(a);
  if (Array.isArray(a)) return a.map((k) => q.options![k]).join(", ");
  return q.options![a as number];
}

function correctText(q: QuizQuestion) {
  if (q.type === "short") return (q.correct as string[])[0];
  if (q.type === "numeric") return `${q.correct}${q.tolerance ? ` (within ${q.tolerance})` : ""}`;
  return (q.correct as number[]).map((k) => q.options![k]).join(", ");
}

function Results({ quiz, attempt, onBack }: { quiz: Quiz; attempt: QuizAttempt; onBack: () => void }) {
  const pts = quizPoints(quiz);
  const pct = ((attempt.score ?? 0) / pts) * 100;
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} /> Back to quiz
      </button>
      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <Panel className="flex flex-col items-center gap-2 p-8 text-center">
          <ProgressRing value={pct / 100} size={112} stroke={9} color={pct >= 70 ? "var(--success)" : "var(--warning)"} label={<span className="text-2xl">{Math.round(pct)}%</span>} />
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {attempt.score} / {pts}
          </p>
          <p className="text-sm text-muted">{pct >= 90 ? "Excellent. You clearly know this material." : pct >= 70 ? "Solid. Review the misses below." : "Worth another look. Each miss has an explanation."}</p>
        </Panel>
      </motion.div>
      <ol className="mt-8 flex flex-col gap-4">
        {quiz.questions.map((q, n) => {
          const a = attempt.answers[q.id] ?? null;
          const ok = gradeQuestion(q, a);
          return (
            <li key={q.id}>
              <Panel className={cn("border-l-4 p-5", ok ? "border-l-success" : "border-l-danger")}>
                <div className="flex items-start gap-3">
                  {ok ? <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-success" /> : <XCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-danger" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">
                      Question {n + 1}, {ok ? q.points : 0}/{q.points} pts
                    </p>
                    <p className="mt-0.5 font-medium">{q.prompt}</p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted">Your answer: </span>
                      <span className={ok ? "text-success" : "text-danger"}>{answerText(q, a)}</span>
                    </p>
                    {!ok && (
                      <p className="text-sm">
                        <span className="text-muted">Correct: </span>
                        <span className="font-medium">{correctText(q)}</span>
                      </p>
                    )}
                    {q.explanation && <p className="mt-2 rounded-[10px] bg-surface-2 px-3 py-2 text-sm text-muted">{q.explanation}</p>}
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StaffPreview({ quiz }: { quiz: Quiz }) {
  const data = useStore((s) => s.data);
  const pts = quizPoints(quiz);
  const taken = data.attempts.filter((t) => t.quizId === quiz.id && t.submittedAt);
  const scores = taken.map((t) => t.score ?? 0);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const buckets = useMemo(() => {
    const b = [0, 0, 0, 0, 0];
    for (const s of scores) b[Math.min(4, Math.floor((s / pts) * 5))]++;
    return b;
  }, [scores, pts]);
  const max = Math.max(1, ...buckets);
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em]">{quiz.title}</h1>
        <p className="mt-1 text-sm text-muted">Instructor preview with answers. Students do not see the correct answers until they submit.</p>
        <ol className="mt-6 flex flex-col gap-4">
          {quiz.questions.map((q, n) => (
            <li key={q.id}>
              <Panel className="p-5">
                <p className="text-xs text-muted">
                  Question {n + 1}, {q.points} pts, {q.type === "multi" ? "multiple answers" : q.type === "single" ? "multiple choice" : q.type === "truefalse" ? "true or false" : q.type === "short" ? "short answer" : "numeric"}
                </p>
                <p className="mt-1 font-medium">{q.prompt}</p>
                <p className="mt-2 text-sm">
                  <span className="text-muted">Answer: </span>
                  <span className="font-medium text-success">{correctText(q)}</span>
                </p>
              </Panel>
            </li>
          ))}
        </ol>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Panel className="p-5">
          <p className="text-sm font-semibold">Results so far</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{avg === null ? "-" : `${((avg / pts) * 100).toFixed(0)}%`}</p>
          <p className="text-xs text-muted">average across {taken.length} attempts</p>
          <div className="mt-5 flex h-28 items-end gap-2" aria-label="Score distribution">
            {buckets.map((b, k) => (
              <div key={k} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] text-muted tabular-nums">{b}</span>
                <div className="w-full rounded-t-[4px] bg-accent" style={{ height: `${(b / max) * 80}px`, opacity: 0.35 + k * 0.16 }} />
                <span className="text-[10px] text-faint">{k * 20}+</span>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}
