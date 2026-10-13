import type { Data, ModuleItem } from "./types";
import { courseGrade, roleIn, workItems } from "./logic";

export function itemHref(data: Data, courseId: string, item: ModuleItem): string | undefined {
  const base = `/courses/${courseId}`;
  switch (item.type) {
    case "assignment":
      return `${base}/assignments/${item.refId}`;
    case "quiz":
      return `${base}/quizzes/${item.refId}`;
    case "discussion":
      return `${base}/discussions/${item.refId}`;
    case "page": {
      const p = data.pages.find((x) => x.id === item.refId);
      return p ? `${base}/pages/${p.slug}` : undefined;
    }
    case "file":
      return `${base}/files?f=${item.refId}`;
    case "link":
      return item.url;
    default:
      return undefined;
  }
}

export function courseModules(data: Data, courseId: string, staff: boolean) {
  return data.modules
    .filter((m) => m.courseId === courseId && (staff || m.published))
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      module: m,
      items: data.moduleItems.filter((i) => i.moduleId === m.id && (staff || i.published)).sort((a, b) => a.position - b.position),
    }));
}

export function isItemDone(data: Data, userId: string, item: ModuleItem) {
  if (item.type === "header") return true;
  if ((data.completedItems[userId] ?? []).includes(item.id)) return true;
  if (item.type === "assignment") return data.submissions.some((s) => s.assignmentId === item.refId && s.userId === userId && (s.submittedAt || s.score !== undefined));
  if (item.type === "quiz") return data.attempts.some((a) => a.quizId === item.refId && a.userId === userId && a.submittedAt);
  return false;
}

export function moduleLocked(data: Data, userId: string, courseId: string, moduleId: string) {
  const mods = courseModules(data, courseId, false);
  const entry = mods.find((m) => m.module.id === moduleId);
  if (!entry) return { locked: false as const };
  if (entry.module.unlockAt && new Date(entry.module.unlockAt).getTime() > Date.now()) return { locked: true as const, reason: "date" as const, at: entry.module.unlockAt };
  for (const pre of entry.module.prerequisiteIds) {
    const p = mods.find((m) => m.module.id === pre);
    if (p && !p.items.every((i) => isItemDone(data, userId, i))) return { locked: true as const, reason: "prereq" as const, name: p.module.name };
  }
  return { locked: false as const };
}

export function courseProgress(data: Data, userId: string, courseId: string) {
  const mods = courseModules(data, courseId, false);
  const items = mods.flatMap((m) => m.items).filter((i) => i.type !== "header");
  const done = items.filter((i) => isItemDone(data, userId, i)).length;
  let next: { item: ModuleItem; moduleName: string } | undefined;
  for (const m of mods) {
    if (moduleLocked(data, userId, courseId, m.module.id).locked) continue;
    const it = m.items.find((i) => i.type !== "header" && !isItemDone(data, userId, i));
    if (it) {
      next = { item: it, moduleName: m.module.name };
      break;
    }
  }
  return { done, total: items.length, pct: items.length ? done / items.length : 0, next };
}

export function courseSnapshot(data: Data, userId: string, courseId: string, now: number) {
  const role = roleIn(data, userId, courseId);
  const staffRole = role === "teacher" || role === "ta";
  const enrolled = data.enrollments.filter((e) => e.courseId === courseId);
  const teacher = data.users.find((u) => u.id === enrolled.find((e) => e.role === "teacher")?.userId);
  const ta = data.users.find((u) => u.id === enrolled.find((e) => e.role === "ta")?.userId);
  const students = enrolled.filter((e) => e.role === "student").length;
  const toGrade = data.submissions.filter((s) => s.submittedAt && s.score === undefined && data.assignments.find((a) => a.id === s.assignmentId)?.courseId === courseId).length;
  const progress = courseProgress(data, userId, courseId);
  const grade = staffRole ? null : courseGrade(data, userId, courseId);
  const next = staffRole ? undefined : workItems(data, userId, courseId).find((w) => (w.status === "upcoming" || w.status === "missing") && new Date(w.dueAt).getTime() > now - 7 * 86_400_000);
  const nextStaffDue = data.assignments.filter((a) => a.courseId === courseId && new Date(a.dueAt).getTime() > now).sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  return { role, staff: staffRole, teacher, ta, students, toGrade, progress, grade, next, nextStaffDue };
}

export function unitStates(data: Data, userId: string, courseId: string) {
  return courseModules(data, courseId, false).map(({ module, items }) => {
    const real = items.filter((i) => i.type !== "header");
    const done = real.filter((i) => isItemDone(data, userId, i)).length;
    const lock = moduleLocked(data, userId, courseId, module.id);
    const state: "done" | "active" | "locked" | "open" = lock.locked ? "locked" : real.length && done === real.length ? "done" : done > 0 ? "active" : "open";
    return { module, done, total: real.length, state, lock };
  });
}
