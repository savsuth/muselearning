"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDown, FileText, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { assignmentStatus, cn, dueLabel } from "@/lib/logic";
import type { SubmissionType } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Button, EmptyState, Field, Modal, PageHeader, Segmented, StatusChip, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useNow } from "@/lib/now";

type Filter = "all" | "upcoming" | "past" | "missing";

export default function AssignmentsPage() {
  const { course, data, me, staff, teacher } = useCourse();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const now = useNow();
  if (!course) return null;
  const groups = data.groups.filter((g) => g.courseId === course.id);
  const students = data.enrollments.filter((e) => e.courseId === course.id && e.role === "student").map((e) => e.userId);
  const rows = data.assignments
    .filter((a) => a.courseId === course.id && (staff || a.published))
    .map((a) => {
      const sub = data.submissions.find((s) => s.assignmentId === a.id && s.userId === me);
      return { a, sub, status: assignmentStatus(a, sub, now) };
    })
    .filter(({ a, status }) => {
      if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (filter === "upcoming") return new Date(a.dueAt).getTime() >= now;
      if (filter === "past") return new Date(a.dueAt).getTime() < now;
      if (filter === "missing") return status === "missing";
      return true;
    })
    .sort((x, y) => x.a.dueAt.localeCompare(y.a.dueAt));
  const missingCount = staff ? 0 : data.assignments.filter((a) => a.courseId === course.id && assignmentStatus(a, data.submissions.find((s) => s.assignmentId === a.id && s.userId === me), now) === "missing").length;

  return (
    <div>
      <PageHeader title="Assignments" actions={teacher ? <Button variant="primary" size="sm" onClick={() => setCreating(true)}><Plus size={16} weight="bold" /> Assignment</Button> : undefined} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <MagnifyingGlass size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignments…" aria-label="Search assignments" className={cn(inputClass, "h-10 pl-9")} />
        </div>
        {!staff && (
          <Segmented<Filter>
            label="Filter assignments"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
              { value: "missing", label: "Missing", count: missingCount },
            ]}
          />
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title={q || filter !== "all" ? "No assignments match" : "No assignments yet"} body={q || filter !== "all" ? "Try a different search or filter." : undefined} />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => {
            const list = rows.filter((r) => r.a.groupId === g.id);
            if (!list.length) return null;
            const isClosed = closed[g.id];
            return (
              <section key={g.id} className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-card">
                <button onClick={() => setClosed((c) => ({ ...c, [g.id]: !c[g.id] }))} aria-expanded={!isClosed} className="flex w-full items-center gap-3 bg-surface-2/70 px-4 py-3 text-left">
                  <CaretDown size={16} weight="bold" className={cn("text-muted transition-transform", isClosed && "-rotate-90")} />
                  <span className="flex-1 text-[15px] font-semibold tracking-tight">{g.name}</span>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted ring-1 ring-line">{g.weight}% of total</span>
                </button>
                {!isClosed && (
                  <ul className="divide-y divide-line">
                    {list.map(({ a, sub, status }) => {
                      const submitted = students.filter((u) => data.submissions.some((s) => s.assignmentId === a.id && s.userId === u && s.submittedAt)).length;
                      const toGrade = data.submissions.filter((s) => s.assignmentId === a.id && s.submittedAt && s.score === undefined).length;
                      return (
                        <li key={a.id}>
                          <Link href={`/courses/${course.id}/assignments/${a.id}`} className={cn("group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2/60", !a.published && "opacity-60")}>
                            <FileText size={22} className="shrink-0 text-muted" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px] font-medium group-hover:text-accent">{a.title}</span>
                              <span className="block text-xs text-muted">
                                {dueLabel(a.dueAt)}
                                {!a.published && ", unpublished"}
                              </span>
                            </span>
                            {staff ? (
                              <span className="hidden text-right text-xs text-muted sm:block">
                                <span className="block">{submitted}/{students.length} submitted</span>
                                {toGrade > 0 && <span className="block font-medium text-accent">{toGrade} to grade</span>}
                              </span>
                            ) : (
                              <span className="hidden text-right text-sm tabular-nums sm:block">
                                {sub?.score !== undefined ? (
                                  <span className="font-semibold">
                                    {sub.score}
                                    <span className="font-normal text-muted">/{a.points}</span>
                                  </span>
                                ) : (
                                  <span className="text-muted">-/{a.points}</span>
                                )}
                              </span>
                            )}
                            {!staff && <StatusChip status={status} className="w-[104px] justify-center" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
      <CreateAssignmentModal open={creating} onClose={() => setCreating(false)} courseId={course.id} />
    </div>
  );
}

function CreateAssignmentModal({ open, onClose, courseId }: { open: boolean; onClose: () => void; courseId: string }) {
  const data = useStore((s) => s.data);
  const create = useStore((s) => s.createAssignment);
  const router = useRouter();
  const groups = data.groups.filter((g) => g.courseId === courseId);
  const [title, setTitle] = useState("");
  const [group, setGroup] = useState(groups[0]?.id ?? "");
  const [points, setPoints] = useState("50");
  const [due, setDue] = useState(() => {
    const d = new Date(Date.now() + 7 * 86_400_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
  });
  const [types, setTypes] = useState<SubmissionType[]>(["text", "file"]);
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) return setError("Give the assignment a title.");
    if (!types.length) return setError("Pick at least one way to submit.");
    const id = create({
      courseId,
      groupId: group,
      title: title.trim(),
      description: desc.trim() ? desc.trim().split(/\n{2,}/).map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("") : "<p>Instructions coming soon.</p>",
      points: Number(points) || 0,
      dueAt: new Date(due).toISOString(),
      submissionTypes: types,
    });
    toast("Assignment created", title.trim());
    onClose();
    router.push(`/courses/${courseId}/assignments/${id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="New assignment" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Title" error={error ?? undefined}>{(id) => <input id={id} value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} className={cn(inputClass, "h-10")} />}</Field>
        <Field label="Instructions">{(id) => <textarea id={id} rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} className={cn(inputClass, "py-2.5")} />}</Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Group">
            {(id) => (
              <select id={id} value={group} onChange={(e) => setGroup(e.target.value)} className={cn(inputClass, "h-10")}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Points">{(id) => <input id={id} type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
          <Field label="Due">{(id) => <input id={id} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium">Students submit</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {(["text", "file", "url"] as SubmissionType[]).map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input type="checkbox" checked={types.includes(t)} onChange={(e) => setTypes(e.target.checked ? [...types, t] : types.filter((x) => x !== t))} className="size-4 accent-[var(--accent)]" />
                {t === "text" ? "Text entry" : t === "file" ? "File upload" : "Website URL"}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            Create and open
          </Button>
        </div>
      </form>
    </Modal>
  );
}
