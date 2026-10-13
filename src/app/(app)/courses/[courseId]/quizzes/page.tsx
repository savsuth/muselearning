"use client";

import Link from "next/link";
import { Exam, Timer } from "@phosphor-icons/react";
import { useCourse } from "@/components/course-context";
import { bestAttempt, dueLabel, quizPoints, quizStatus } from "@/lib/logic";
import { EmptyState, PageHeader, Panel, StatusChip } from "@/components/ui";

export default function QuizzesPage() {
  const { course, data, me, staff } = useCourse();
  if (!course) return null;
  const quizzes = data.quizzes.filter((q) => q.courseId === course.id && (staff || q.published)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return (
    <div>
      <PageHeader title="Quizzes" sub={staff ? "Auto-graded. Attempts and scores flow straight into the gradebook." : "Each quiz is timed once you start. Your answers save as you go."} />
      {quizzes.length === 0 ? (
        <EmptyState icon={<Exam size={22} />} title="No quizzes yet" />
      ) : (
        <Panel className="divide-y divide-line overflow-hidden">
          {quizzes.map((q) => {
            const att = data.attempts.filter((t) => t.quizId === q.id && t.userId === me);
            const best = bestAttempt(att);
            const status = quizStatus(q, att);
            const pts = quizPoints(q);
            const taken = data.attempts.filter((t) => t.quizId === q.id && t.submittedAt);
            const avg = taken.length ? taken.reduce((s, t) => s + (t.score ?? 0), 0) / taken.length : null;
            return (
              <Link key={q.id} href={`/courses/${course.id}/quizzes/${q.id}`} className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-2/60">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                  <Exam size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium group-hover:text-accent">{q.title}</span>
                  <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <span>{dueLabel(q.dueAt)}</span>
                    <span>{pts} pts</span>
                    <span>{q.questions.length} questions</span>
                    {q.timeLimitMin && (
                      <span className="flex items-center gap-1">
                        <Timer size={12} /> {q.timeLimitMin} min
                      </span>
                    )}
                  </span>
                </span>
                {staff ? (
                  <span className="text-right text-xs text-muted">
                    <span className="block">{taken.length} attempts</span>
                    {avg !== null && <span className="block">avg {avg.toFixed(1)}/{pts}</span>}
                  </span>
                ) : (
                  <>
                    {best && <span className="text-sm font-semibold tabular-nums">{best.score}<span className="font-normal text-muted">/{pts}</span></span>}
                    <StatusChip status={status} className="w-[104px] justify-center" />
                  </>
                )}
              </Link>
            );
          })}
        </Panel>
      )}
    </div>
  );
}
