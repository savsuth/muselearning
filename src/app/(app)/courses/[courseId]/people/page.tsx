"use client";

import Link from "next/link";
import { EnvelopeSimple, MagnifyingGlass, Users } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/logic";
import type { Role, User } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Avatar, ButtonLink, EmptyState, Modal, PageHeader, Panel, Segmented, inputClass } from "@/components/ui";

type F = "all" | "student" | "staff";
const roleLabel: Record<Role, string> = { student: "Student", teacher: "Instructor", ta: "Teaching assistant" };

export default function PeoplePage() {
  const { course, data, me } = useCourse();
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<User | null>(null);
  if (!course) return null;
  const rows = data.enrollments
    .filter((e) => e.courseId === course.id)
    .map((e) => ({ e, u: data.users.find((u) => u.id === e.userId)! }))
    .filter(({ e }) => (f === "all" ? true : f === "student" ? e.role === "student" : e.role !== "student"))
    .filter(({ u }) => u.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.e.role === b.e.role ? a.u.name.localeCompare(b.u.name) : a.e.role === "teacher" ? -1 : b.e.role === "teacher" ? 1 : a.e.role === "ta" ? -1 : 1));
  const counts = { student: data.enrollments.filter((e) => e.courseId === course.id && e.role === "student").length, staff: data.enrollments.filter((e) => e.courseId === course.id && e.role !== "student").length };
  const openRole = open ? data.enrollments.find((e) => e.courseId === course.id && e.userId === open.id) : undefined;

  return (
    <div>
      <PageHeader title="People" sub={`${counts.student} students and ${counts.staff} staff`} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <MagnifyingGlass size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" aria-label="Search people" className={cn(inputClass, "h-10 pl-9")} />
        </div>
        <Segmented<F> label="Filter by role" value={f} onChange={setF} options={[{ value: "all", label: "Everyone" }, { value: "student", label: "Students" }, { value: "staff", label: "Staff" }]} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="Nobody matches that search" />
      ) : (
        <Panel className="divide-y divide-line overflow-hidden">
          {rows.map(({ e, u }) => (
            <button key={u.id} onClick={() => setOpen(u)} className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-2/60">
              <Avatar user={u} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">
                  {u.name}
                  {u.id === me && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
                </span>
                <span className="block text-xs text-muted">{u.pronouns}</span>
              </span>
              <span className="hidden text-sm text-muted sm:block">{e.section ?? ""}</span>
              <span className={cn("w-36 text-right text-sm", e.role !== "student" ? "font-medium text-accent" : "text-muted")}>{roleLabel[e.role]}</span>
            </button>
          ))}
        </Panel>
      )}
      <Modal open={!!open} onClose={() => setOpen(null)} title="Profile">
        {open && (
          <div className="flex flex-col items-center text-center">
            <Avatar user={open} size={84} />
            <p className="mt-3 text-xl font-semibold tracking-tight">{open.name}</p>
            <p className="text-sm text-muted">
              {open.pronouns ? `${open.pronouns}, ` : ""}
              {openRole ? roleLabel[openRole.role] : ""}
              {openRole?.section ? `, ${openRole.section}` : ""}
            </p>
            {open.bio && <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{open.bio}</p>}
            <p className="mt-3 text-sm">
              <Link href={`mailto:${open.email}`} className="text-muted hover:underline">
                {open.email}
              </Link>
            </p>
            {open.id !== me && (
              <ButtonLink href={`/inbox?compose=1&to=${open.id}&course=${course.id}`} variant="primary" className="mt-6">
                <EnvelopeSimple size={16} /> Send a message
              </ButtonLink>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
