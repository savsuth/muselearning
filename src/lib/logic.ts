import type { Assignment, Data, Discussion, Reply, Quiz, QuizAnswer, QuizAttempt, QuizQuestion, Role, Submission, WorkItem, WorkStatus } from "./types";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function roleIn(data: Data, userId: string, courseId: string): Role | undefined {
  return data.enrollments.find((e) => e.userId === userId && e.courseId === courseId)?.role;
}

export function isStaff(data: Data, userId: string, courseId: string) {
  const r = roleIn(data, userId, courseId);
  return r === "teacher" || r === "ta";
}

export function myCourses(data: Data, userId: string) {
  const ids = new Set(data.enrollments.filter((e) => e.userId === userId).map((e) => e.courseId));
  return data.courses.filter((c) => ids.has(c.id));
}

export function assignmentStatus(a: Assignment, sub: Submission | undefined, now = Date.now()): WorkStatus {
  if (sub?.excused) return "excused";
  if (sub?.score !== undefined) return "graded";
  if (sub?.submittedAt) return new Date(sub.submittedAt).getTime() > new Date(a.dueAt).getTime() ? "late" : "submitted";
  if (a.availableFrom && new Date(a.availableFrom).getTime() > now) return "locked";
  if (new Date(a.dueAt).getTime() < now && a.submissionTypes.length > 0) return "missing";
  return "upcoming";
}

export function quizStatus(q: Quiz, attempts: QuizAttempt[], now = Date.now()): WorkStatus {
  const done = attempts.filter((t) => t.submittedAt);
  if (done.length) return "graded";
  if (q.availableFrom && new Date(q.availableFrom).getTime() > now) return "locked";
  if (new Date(q.dueAt).getTime() < now) return "missing";
  return "upcoming";
}

export function bestAttempt(attempts: QuizAttempt[]) {
  return attempts.filter((a) => a.submittedAt).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}

export function quizPoints(q: Quiz) {
  return q.questions.reduce((s, x) => s + x.points, 0);
}

export function workItems(data: Data, userId: string, courseId?: string): WorkItem[] {
  const now = Date.now();
  const courses = new Set(courseId ? [courseId] : myCourses(data, userId).map((c) => c.id));
  const items: WorkItem[] = [];
  for (const a of data.assignments) {
    if (!courses.has(a.courseId) || !a.published) continue;
    const sub = data.submissions.find((s) => s.assignmentId === a.id && s.userId === userId);
    items.push({ kind: "assignment", id: a.id, courseId: a.courseId, groupId: a.groupId, title: a.title, points: a.points, dueAt: a.dueAt, status: assignmentStatus(a, sub, now), score: sub?.score, href: `/courses/${a.courseId}/assignments/${a.id}` });
  }
  for (const q of data.quizzes) {
    if (!courses.has(q.courseId) || !q.published) continue;
    const att = data.attempts.filter((t) => t.quizId === q.id && t.userId === userId);
    const best = bestAttempt(att);
    items.push({ kind: "quiz", id: q.id, courseId: q.courseId, groupId: q.groupId, title: q.title, points: quizPoints(q), dueAt: q.dueAt, status: quizStatus(q, att, now), score: best?.score, href: `/courses/${q.courseId}/quizzes/${q.id}` });
  }
  return items.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export interface GroupGrade {
  id: string;
  name: string;
  weight: number;
  earned: number;
  possible: number;
  pct: number | null;
}

export interface CourseGrade {
  groups: GroupGrade[];
  pct: number | null;
  letter: string;
  earned: number;
  possible: number;
}

export function courseGrade(data: Data, userId: string, courseId: string, whatIf: Record<string, number> = {}): CourseGrade {
  const items = workItems(data, userId, courseId);
  const groups = data.groups.filter((g) => g.courseId === courseId);
  let earnedAll = 0;
  let possibleAll = 0;
  const gg: GroupGrade[] = groups.map((g) => {
    let earned = 0;
    let possible = 0;
    for (const it of items.filter((x) => x.groupId === g.id)) {
      const override = whatIf[it.id];
      const score = override !== undefined ? override : it.score;
      if (score === undefined || it.status === "excused") continue;
      earned += score;
      possible += it.points;
    }
    earnedAll += earned;
    possibleAll += possible;
    return { id: g.id, name: g.name, weight: g.weight, earned, possible, pct: possible > 0 ? (earned / possible) * 100 : null };
  });
  const counted = gg.filter((g) => g.pct !== null);
  const wsum = counted.reduce((s, g) => s + g.weight, 0);
  const pct = wsum > 0 ? counted.reduce((s, g) => s + (g.pct as number) * g.weight, 0) / wsum : null;
  return { groups: gg, pct, letter: pct === null ? "-" : letter(pct), earned: earnedAll, possible: possibleAll };
}

const SCALE: [number, string][] = [
  [93, "A"],
  [90, "A-"],
  [87, "B+"],
  [83, "B"],
  [80, "B-"],
  [77, "C+"],
  [73, "C"],
  [70, "C-"],
  [67, "D+"],
  [63, "D"],
  [60, "D-"],
  [0, "F"],
];

export function letter(pct: number) {
  return SCALE.find(([min]) => pct >= min)?.[1] ?? "F";
}

export function letterThresholds() {
  return SCALE;
}

export function gradeQuestion(q: QuizQuestion, a: QuizAnswer): boolean {
  if (a === null || a === undefined || a === "") return false;
  switch (q.type) {
    case "single":
    case "truefalse":
      return Array.isArray(q.correct) && (q.correct as number[])[0] === a;
    case "multi": {
      if (!Array.isArray(a)) return false;
      const want = [...(q.correct as number[])].sort().join(",");
      return [...a].sort().join(",") === want;
    }
    case "short":
      return (q.correct as string[]).some((c) => c.trim().toLowerCase() === String(a).trim().toLowerCase());
    case "numeric": {
      const n = Number(a);
      return !Number.isNaN(n) && Math.abs(n - (q.correct as number)) <= (q.tolerance ?? 0);
    }
  }
}

export function scoreAttempt(quiz: Quiz, answers: Record<string, QuizAnswer>) {
  return quiz.questions.reduce((s, q) => s + (gradeQuestion(q, answers[q.id] ?? null) ? q.points : 0), 0);
}

const dayMs = 86_400_000;

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat(undefined, opts).format(new Date(iso));
}

export function fmtTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function fmtDateTime(iso: string) {
  return `${fmtDate(iso, { weekday: "short", month: "short", day: "numeric" })} at ${fmtTime(iso)}`;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function relative(iso: string, now = Date.now()) {
  const t = new Date(iso).getTime();
  const diff = t - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60_000) return "just now";
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < dayMs) return rtf.format(Math.round(diff / 3_600_000), "hour");
  const days = Math.round((startOfDay(new Date(t)).getTime() - startOfDay(new Date(now)).getTime()) / dayMs);
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  return fmtDate(iso, { month: "short", day: "numeric" });
}

export function dueLabel(iso: string) {
  const t = new Date(iso).getTime();
  const days = Math.round((startOfDay(new Date(t)).getTime() - startOfDay(new Date()).getTime()) / dayMs);
  if (days === 0) return `Due today at ${fmtTime(iso)}`;
  if (days === 1) return `Due tomorrow at ${fmtTime(iso)}`;
  if (days > 1 && days < 7) return `Due ${fmtDate(iso, { weekday: "long" })} at ${fmtTime(iso)}`;
  return `Due ${fmtDate(iso, { month: "short", day: "numeric" })} at ${fmtTime(iso)}`;
}

export function fileSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function textToHtml(s: string) {
  return s
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function plain(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function countReplies(r: Reply[]): number {
  return r.reduce((s, x) => s + 1 + countReplies(x.replies), 0);
}

export function lastActivity(d: Discussion): string {
  const walk = (r: Reply[]): string[] => r.flatMap((x) => [x.at, ...walk(x.replies)]);
  return [d.postedAt, ...walk(d.replies)].sort().pop()!;
}
