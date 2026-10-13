"use client";

import Link from "next/link";
import { CourseCover } from "./course-cover";
import { ChatsCircle, DotsThreeVertical, FileText, FolderSimple, Megaphone, Star } from "@phosphor-icons/react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn, courseGrade, roleIn } from "@/lib/logic";
import type { Course } from "@/lib/types";
import { Button, Field, Modal, inputClass } from "./ui";
import { toast } from "@/lib/toast";

export const COURSE_COLORS = ["#c4162f", "#1f5fa8", "#7a3fb0", "#0f7a63", "#b4560f", "#3d4451", "#a3125f", "#2f7d1f", "#0d6e8a", "#8a5a00"];

export function CourseCard({ course }: { course: Course }) {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const [open, setOpen] = useState(false);
  const role = roleIn(data, me, course.id);
  const unreadAnn = data.announcements.filter((a) => a.courseId === course.id && !a.readBy.includes(me)).length;
  const unreadDisc = data.discussions.filter((d) => d.courseId === course.id && !d.readBy.includes(me)).length;
  const grade = role === "student" ? courseGrade(data, me, course.id) : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-card transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-pop">
      <Link href={`/courses/${course.id}`} className="relative block h-[160px] overflow-hidden" aria-label={`${course.nickname ?? course.name}, ${course.code}`}>
        <CourseCover course={course} className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
        {grade && grade.pct !== null && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#16171b] tabular-nums shadow-sm">
            {grade.pct.toFixed(1)}% {grade.letter}
          </span>
        )}
        {role !== "student" && <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#16171b] shadow-sm">{role === "ta" ? "TA" : "Teaching"}</span>}
      </Link>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Customize ${course.name}`}
        className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
      >
        <DotsThreeVertical size={20} weight="bold" />
      </button>
      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-2">
        <Link href={`/courses/${course.id}`} className="line-clamp-1 text-[15px] font-semibold tracking-tight hover:underline" style={{ color: course.color }}>
          <span className="dark:brightness-[1.6] dark:saturate-[0.8]">{course.nickname ?? course.name}</span>
        </Link>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {course.code}
          {course.nickname ? `, ${course.name}` : ""}
        </p>
        <p className="text-xs text-faint">{course.term}</p>
        <div className="mt-auto flex items-center gap-1 pt-3 -ml-2">
          <CardIcon href={`/courses/${course.id}/announcements`} label="Announcements" count={unreadAnn} icon={<Megaphone size={20} />} />
          <CardIcon href={`/courses/${course.id}/assignments`} label="Assignments" icon={<FileText size={20} />} />
          <CardIcon href={`/courses/${course.id}/discussions`} label="Discussions" count={unreadDisc} icon={<ChatsCircle size={20} />} />
          <CardIcon href={`/courses/${course.id}/files`} label="Files" icon={<FolderSimple size={20} />} />
        </div>
      </div>
      <CustomizeModal course={course} open={open} onClose={() => setOpen(false)} />
    </article>
  );
}

function CardIcon({ href, label, icon, count }: { href: string; label: string; icon: React.ReactNode; count?: number }) {
  return (
    <Link href={href} aria-label={count ? `${label}, ${count} unread` : label} title={label} className="relative flex size-9 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-surface-2 hover:text-fg">
      {icon}
      {!!count && <span className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-semibold text-on-accent">{count}</span>}
    </Link>
  );
}

function CustomizeModal({ course, open, onClose }: { course: Course; open: boolean; onClose: () => void }) {
  const setColor = useStore((s) => s.setCourseColor);
  const setNickname = useStore((s) => s.setNickname);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const [nick, setNick] = useState(course.nickname ?? "");
  const [color, setLocalColor] = useState(course.color);
  return (
    <Modal open={open} onClose={onClose} title="Customize course card">
      <div className="flex flex-col gap-5">
        <div className="h-20 rounded-[10px]" style={{ background: color }} />
        <div>
          <p className="mb-2 text-[13px] font-medium">Color</p>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((c) => (
              <button key={c} onClick={() => setLocalColor(c)} aria-label={`Color ${c}`} aria-pressed={color === c} className={cn("size-8 rounded-full transition-transform hover:scale-110", color === c && "ring-2 ring-fg ring-offset-2 ring-offset-surface")} style={{ background: c }} />
            ))}
          </div>
        </div>
        <Field label="Nickname" hint={`Shown on your dashboard instead of "${course.name}". Only you see it.`}>
          {(id) => <input id={id} value={nick} onChange={(e) => setNick(e.target.value)} placeholder={course.name} className={cn(inputClass, "h-10")} />}
        </Field>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <button onClick={() => { toggleFavorite(course.id); toast(course.favorite ? "Removed from dashboard" : "Added to dashboard", course.code); onClose(); }} className="flex items-center gap-2 text-sm text-muted hover:text-fg">
            <Star size={16} weight={course.favorite ? "fill" : "regular"} className={course.favorite ? "text-warning" : ""} />
            {course.favorite ? "Remove from dashboard" : "Show on dashboard"}
          </button>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setColor(course.id, color);
                setNickname(course.id, nick);
                toast("Card updated", course.code);
                onClose();
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
