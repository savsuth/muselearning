"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  CalendarBlank,
  Exam,
  FileText,
  Moon,
  NotePencil,
  SquaresFour,
  Tray,
  UserCircle,
  Users,
  ChatsCircle,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { cn, dueLabel, myCourses } from "@/lib/logic";
import { toggleTheme } from "@/lib/theme";
import { Kbd } from "./ui";

interface Cmd {
  id: string;
  group: string;
  title: string;
  sub?: string;
  icon: ReactNode;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(<AnimatePresence>{open && <PaletteBody onClose={onClose} />}</AnimatePresence>, document.body);
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();

  const all = useMemo<Cmd[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };
    const courses = myCourses(data, me);
    const ids = new Set(courses.map((c) => c.id));
    const code = (cid: string) => data.courses.find((c) => c.id === cid)?.code ?? "";
    const cmds: Cmd[] = [
      { id: "nav-dash", group: "Go to", title: "Dashboard", icon: <SquaresFour size={18} />, run: go("/dashboard") },
      { id: "nav-cal", group: "Go to", title: "Calendar", icon: <CalendarBlank size={18} />, run: go("/calendar") },
      { id: "nav-inbox", group: "Go to", title: "Inbox", icon: <Tray size={18} />, run: go("/inbox") },
      { id: "nav-acct", group: "Go to", title: "Account and settings", icon: <UserCircle size={18} />, run: go("/account") },
      { id: "nav-courses", group: "Go to", title: "All courses", icon: <BookOpen size={18} />, run: go("/courses") },
      { id: "act-theme", group: "Actions", title: "Toggle dark mode", icon: <Moon size={18} />, run: () => { toggleTheme(); onClose(); } },
      { id: "act-msg", group: "Actions", title: "New message", icon: <NotePencil size={18} />, run: go("/inbox?compose=1") },
    ];
    for (const c of courses) {
      cmds.push({ id: `c-${c.id}`, group: "Courses", title: c.nickname ?? c.name, sub: c.code, icon: <span className="size-3 rounded-[4px]" style={{ background: c.color }} />, run: go(`/courses/${c.id}`) });
      for (const s of ["Modules", "Assignments", "Grades", "Discussions", "People", "Syllabus"]) {
        cmds.push({ id: `c-${c.id}-${s}`, group: "Course pages", title: `${c.code} ${s}`, sub: c.name, icon: <ArrowRight size={16} />, run: go(`/courses/${c.id}/${s.toLowerCase()}`) });
      }
    }
    for (const a of data.assignments.filter((x) => ids.has(x.courseId))) cmds.push({ id: a.id, group: "Assignments", title: a.title, sub: `${code(a.courseId)}, ${dueLabel(a.dueAt)}`, icon: <FileText size={18} />, run: go(`/courses/${a.courseId}/assignments/${a.id}`) });
    for (const x of data.quizzes.filter((x) => ids.has(x.courseId))) cmds.push({ id: x.id, group: "Quizzes", title: x.title, sub: `${code(x.courseId)}, ${dueLabel(x.dueAt)}`, icon: <Exam size={18} />, run: go(`/courses/${x.courseId}/quizzes/${x.id}`) });
    for (const p of data.pages.filter((x) => ids.has(x.courseId))) cmds.push({ id: p.id, group: "Pages", title: p.title, sub: code(p.courseId), icon: <BookOpen size={18} />, run: go(`/courses/${p.courseId}/pages/${p.slug}`) });
    for (const d of data.discussions.filter((x) => ids.has(x.courseId))) cmds.push({ id: d.id, group: "Discussions", title: d.title, sub: code(d.courseId), icon: <ChatsCircle size={18} />, run: go(`/courses/${d.courseId}/discussions/${d.id}`) });
    const people = new Set(data.enrollments.filter((e) => ids.has(e.courseId)).map((e) => e.userId));
    for (const u of data.users.filter((u) => people.has(u.id) && u.id !== me)) cmds.push({ id: `u-${u.id}`, group: "People", title: u.name, sub: u.title, icon: <Users size={18} />, run: go(`/inbox?compose=1&to=${u.id}`) });
    return cmds;
  }, [data, me, router, onClose]);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return all.filter((c) => c.group === "Go to" || c.group === "Actions" || c.group === "Courses");
    return all
      .map((c) => {
        const hay = `${c.title} ${c.sub ?? ""} ${c.group}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const score = (c.title.toLowerCase().startsWith(words[0]) ? 0 : 1) + (c.group === "Course pages" ? 0.5 : 0);
        return { c, score };
      })
      .filter((x): x is { c: Cmd; score: number } => !!x)
      .sort((a, b) => a.score - b.score)
      .slice(0, 40)
      .map((x) => x.c);
  }, [q, all]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(results.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[sel]?.run();
    } else if (e.key === "Escape") onClose();
  };

  return (
        <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div className="fixed inset-0 bg-[rgb(10_10_14/0.45)] backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search muselearning"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[620px] overflow-hidden rounded-[16px] border border-line bg-surface shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlass size={20} className="text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={onKey}
                placeholder="Search courses, assignments, pages, people…"
                aria-label="Search"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
              />
              <Kbd>Esc</Kbd>
            </div>
            <ul ref={listRef} role="listbox" className="max-h-[min(440px,60vh)] overflow-y-auto overscroll-contain p-2 scrollbar-thin">
              {results.length === 0 && <li className="px-4 py-12 text-center text-sm text-muted">No matches for &ldquo;{q}&rdquo;. Try a course code or an assignment name.</li>}
              {results.map((c, i) => {
                const header = results[i - 1]?.group !== c.group ? c.group : null;
                return (
                  <li key={c.id} role="option" aria-selected={i === sel}>
                    {header && <p className="px-3 pt-3 pb-1.5 text-xs font-medium text-faint">{header}</p>}
                    <button
                      data-idx={i}
                      onMouseMove={() => setSel(i)}
                      onClick={c.run}
                      className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left", i === sel ? "bg-surface-2" : "")}
                    >
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-line", i === sel ? "text-accent" : "text-muted")}>{c.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.title}</span>
                        {c.sub && <span className="block truncate text-xs text-muted">{c.sub}</span>}
                      </span>
                      {i === sel && <ArrowRight size={16} className="text-muted" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd> to open</span>
            </div>
          </motion.div>
        </div>
  );
}
