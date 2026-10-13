"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Article,
  CaretDown,
  ChatsCircle,
  CheckCircle,
  Circle,
  CloudCheck,
  CloudSlash,
  DotsThree,
  Exam,
  FileText,
  LinkSimple,
  LockKey,
  Paperclip,
  PencilSimple,
  Plus,
  StackSimple,
  TextT,
  Trash,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn, dueLabel, fmtDate } from "@/lib/logic";
import { courseModules, isItemDone, itemHref, moduleLocked } from "@/lib/course-utils";
import type { ModuleItem, ModuleItemType } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Button, EmptyState, Field, Menu, Modal, PageHeader, ProgressRing, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";

const typeIcon: Record<ModuleItemType, typeof FileText> = {
  assignment: FileText,
  quiz: Exam,
  page: Article,
  file: Paperclip,
  link: LinkSimple,
  header: TextT,
  discussion: ChatsCircle,
};

export default function ModulesPage() {
  const { course, data, me, staff, teacher } = useCourse();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [newModule, setNewModule] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const store = useStore();
  if (!course) return null;
  const mods = courseModules(data, course.id, staff);
  const allCollapsed = mods.length > 0 && mods.every((m) => collapsed[m.module.id]);

  return (
    <div>
      <PageHeader
        title="Modules"
        sub={staff ? "Students see published modules and items in this order." : "Work through each unit in order. Completed items get a check."}
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => setCollapsed(allCollapsed ? {} : Object.fromEntries(mods.map((m) => [m.module.id, true])))}>
              <StackSimple size={16} /> {allCollapsed ? "Expand all" : "Collapse all"}
            </Button>
            {teacher && (
              <Button size="sm" variant="primary" onClick={() => setNewModule(true)}>
                <Plus size={16} weight="bold" /> Module
              </Button>
            )}
          </>
        }
      />

      {mods.length === 0 ? (
        <EmptyState icon={<StackSimple size={22} />} title="No modules yet" body={teacher ? "Modules group readings, assignments and quizzes into units students work through in order." : "Your instructor has not published any modules yet."} action={teacher ? <Button variant="primary" onClick={() => setNewModule(true)}>Create the first module</Button> : undefined} />
      ) : (
        <div className="flex flex-col gap-4">
          {mods.map(({ module: m, items }, mi) => {
            const lock = staff ? { locked: false as const } : moduleLocked(data, me, course.id, m.id);
            const done = items.filter((i) => i.type !== "header" && isItemDone(data, me, i)).length;
            const total = items.filter((i) => i.type !== "header").length;
            const isCollapsed = !!collapsed[m.id];
            return (
              <motion.section key={m.id} id={m.id} layout="position" className={cn("scroll-mt-24 overflow-hidden rounded-[14px] border border-line bg-surface shadow-card", !m.published && "border-dashed")}>
                <header className="flex items-center gap-3 bg-surface-2/70 px-3 py-2.5 sm:px-4">
                  <button onClick={() => setCollapsed((c) => ({ ...c, [m.id]: !c[m.id] }))} aria-expanded={!isCollapsed} aria-controls={`mod-${m.id}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <CaretDown size={16} weight="bold" className={cn("shrink-0 text-muted transition-transform duration-200", isCollapsed && "-rotate-90")} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold tracking-tight">{m.name}</span>
                      {lock.locked && (
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <LockKey size={12} /> {lock.reason === "date" ? `Unlocks ${fmtDate(lock.at, { weekday: "short", month: "short", day: "numeric" })}` : `Complete ${lock.name} first`}
                        </span>
                      )}
                      {!lock.locked && !staff && total > 0 && <span className="block text-xs text-muted">{done === total ? "Complete" : `${done} of ${total} done`}</span>}
                      {staff && !m.published && <span className="block text-xs font-medium text-warning">Unpublished, hidden from students</span>}
                    </span>
                  </button>
                  {!staff && total > 0 && !lock.locked && (done === total ? <CheckCircle size={28} weight="fill" className="text-success" aria-label="Module complete" /> : <ProgressRing value={done / total} size={30} stroke={3} />)}
                  {staff && (
                    <button
                      onClick={() => {
                        store.toggleModulePublished(m.id);
                        toast(m.published ? "Module unpublished" : "Module published", m.name, "info");
                      }}
                      aria-label={m.published ? "Unpublish module" : "Publish module"}
                      title={m.published ? "Published. Click to unpublish." : "Unpublished. Click to publish."}
                      className={cn("flex size-8 items-center justify-center rounded-[8px] transition-colors hover:bg-surface-3", m.published ? "text-success" : "text-faint")}
                    >
                      {m.published ? <CloudCheck size={20} weight="fill" /> : <CloudSlash size={20} />}
                    </button>
                  )}
                  {teacher && (
                    <Menu
                      label={`Options for ${m.name}`}
                      items={[
                        { label: "Add item", icon: <Plus size={16} />, onSelect: () => setAdding(m.id) },
                        { label: "Rename", icon: <PencilSimple size={16} />, onSelect: () => setRenaming({ id: m.id, name: m.name }) },
                        { label: "Move up", icon: <ArrowUp size={16} />, onSelect: () => store.moveModule(m.id, -1), disabled: mi === 0 },
                        { label: "Move down", icon: <ArrowDown size={16} />, onSelect: () => store.moveModule(m.id, 1), disabled: mi === mods.length - 1 },
                        {
                          label: "Delete module",
                          icon: <Trash size={16} />,
                          danger: true,
                          onSelect: () => {
                            if (confirm(`Delete "${m.name}" and its ${items.length} items from the module list? The assignments and pages themselves are kept.`)) {
                              store.deleteModule(m.id);
                              toast("Module deleted", m.name, "info");
                            }
                          },
                        },
                      ]}
                    >
                      <DotsThree size={20} weight="bold" />
                    </Menu>
                  )}
                </header>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div id={`mod-${m.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                      {items.length === 0 ? (
                        <p className="px-12 py-5 text-sm text-muted">{teacher ? "No items yet. Use the menu to add one." : "Nothing here yet."}</p>
                      ) : (
                        <ul className="divide-y divide-line">
                          {items.map((it, ii) => (
                            <ItemRow key={it.id} item={it} locked={lock.locked} first={ii === 0} last={ii === items.length - 1} />
                          ))}
                        </ul>
                      )}
                      {teacher && (
                        <button onClick={() => setAdding(m.id)} className="flex w-full items-center gap-2 border-t border-line px-12 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-accent">
                          <Plus size={14} weight="bold" /> Add item
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </div>
      )}

      <NewModuleModal open={newModule} onClose={() => setNewModule(false)} courseId={course.id} />
      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Rename module">
        {renaming && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!renaming.name.trim()) return;
              store.renameModule(renaming.id, renaming.name.trim());
              setRenaming(null);
            }}
            className="flex flex-col gap-4"
          >
            <Field label="Module name">{(id) => <input id={id} value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} className={cn(inputClass, "h-10")} />}</Field>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setRenaming(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Save</Button>
            </div>
          </form>
        )}
      </Modal>
      <AddItemModal moduleId={adding} onClose={() => setAdding(null)} courseId={course.id} />
    </div>
  );
}

function ItemRow({ item, locked, first, last }: { item: ModuleItem; locked: boolean; first: boolean; last: boolean }) {
  const { course, data, me, staff } = useCourse();
  const store = useStore();
  const reduce = useReducedMotion();
  if (!course) return null;
  const Icon = typeIcon[item.type];
  const href = itemHref(data, course.id, item);
  const done = isItemDone(data, me, item);
  const manual = item.type === "page" || item.type === "file" || item.type === "link" || item.type === "discussion";
  const a = item.type === "assignment" ? data.assignments.find((x) => x.id === item.refId) : undefined;
  const q = item.type === "quiz" ? data.quizzes.find((x) => x.id === item.refId) : undefined;
  const meta = a ? `${dueLabel(a.dueAt)}, ${a.points} pts` : q ? `${dueLabel(q.dueAt)}, ${q.questions.reduce((s, x) => s + x.points, 0)} pts` : null;

  if (item.type === "header")
    return (
      <li className="flex items-center gap-3 px-4 py-2.5 pl-12">
        <span className="flex-1 text-xs font-semibold tracking-wide text-muted uppercase">{item.title}</span>
        {staff && <ItemControls item={item} first={first} last={last} />}
      </li>
    );

  const title = locked || !href ? (
    <span className="truncate text-sm font-medium text-muted">{item.title}</span>
  ) : item.type === "link" ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className="truncate text-sm font-medium hover:text-accent hover:underline">
      {item.title}
    </a>
  ) : (
    <Link href={href} onClick={() => manual && !done && !staff && store.toggleItemDone(item.id)} className="truncate text-sm font-medium hover:text-accent hover:underline">
      {item.title}
    </Link>
  );

  return (
    <li className={cn("group flex items-center gap-3 py-3 pr-3 pl-5 transition-colors sm:pr-4", !locked && "hover:bg-surface-2/60", staff && !item.published && "opacity-60")}>
      <span className="w-4" />
      <Icon size={20} className={cn("shrink-0", locked ? "text-faint" : "text-muted")} />
      <span className="flex min-w-0 flex-1 flex-col">
        {title}
        {meta && <span className="truncate text-xs text-muted">{meta}</span>}
      </span>
      {!staff && !locked && (
        <button
          disabled={!manual}
          onClick={() => store.toggleItemDone(item.id)}
          aria-label={done ? `Mark ${item.title} as not done` : `Mark ${item.title} as done`}
          title={manual ? (done ? "Done. Click to undo." : "Mark as done") : done ? "Completed by submitting" : "Completes when you submit"}
          className={cn("flex size-8 shrink-0 items-center justify-center rounded-full transition-colors", manual && "hover:bg-surface-3")}
        >
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.span key="done" initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 600, damping: 24 }}>
                <CheckCircle size={22} weight="fill" className="text-success" />
              </motion.span>
            ) : (
              <motion.span key="todo" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Circle size={22} className="text-line-strong" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}
      {locked && <LockKey size={16} className="text-faint" />}
      {staff && <ItemControls item={item} first={first} last={last} />}
    </li>
  );
}

function ItemControls({ item, first, last }: { item: ModuleItem; first: boolean; last: boolean }) {
  const store = useStore();
  const { teacher } = useCourse();
  return (
    <span className="flex items-center gap-0.5">
      <button
        onClick={() => store.toggleItemPublished(item.id)}
        aria-label={item.published ? `Unpublish ${item.title}` : `Publish ${item.title}`}
        title={item.published ? "Published" : "Unpublished"}
        className={cn("flex size-8 items-center justify-center rounded-[8px] hover:bg-surface-3", item.published ? "text-success" : "text-faint")}
      >
        {item.published ? <CloudCheck size={18} weight="fill" /> : <CloudSlash size={18} />}
      </button>
      {teacher && (
        <Menu
          label={`Options for ${item.title}`}
          items={[
            { label: "Move up", icon: <ArrowUp size={16} />, onSelect: () => store.moveItem(item.id, -1), disabled: first },
            { label: "Move down", icon: <ArrowDown size={16} />, onSelect: () => store.moveItem(item.id, 1), disabled: last },
            { label: "Remove from module", icon: <Trash size={16} />, danger: true, onSelect: () => confirm(`Remove "${item.title}" from this module? The item itself is kept.`) && store.deleteItem(item.id) },
          ]}
        >
          <DotsThree size={18} weight="bold" />
        </Menu>
      )}
    </span>
  );
}

function NewModuleModal({ open, onClose, courseId }: { open: boolean; onClose: () => void; courseId: string }) {
  const addModule = useStore((s) => s.addModule);
  const [name, setName] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="New module">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addModule(courseId, name.trim());
          toast("Module created", "It starts unpublished. Publish it when it is ready.");
          setName("");
          onClose();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Module name" hint="For example: Unit 7: Accessibility in practice">
          {(id) => <input id={id} value={name} onChange={(e) => setName(e.target.value)} className={cn(inputClass, "h-10")} />}
        </Field>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!name.trim()}>
            Create module
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddItemModal({ moduleId, onClose, courseId }: { moduleId: string | null; onClose: () => void; courseId: string }) {
  const data = useStore((s) => s.data);
  const addItem = useStore((s) => s.addModuleItem);
  const createAssignment = useStore((s) => s.createAssignment);
  const [type, setType] = useState<ModuleItemType>("assignment");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState("20");
  const [due, setDue] = useState(() => {
    const d = new Date(Date.now() + 7 * 86_400_000);
    d.setHours(23, 59, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
  });
  const [ref, setRef] = useState("");
  const [url, setUrl] = useState("https://");

  const groups = data.groups.filter((g) => g.courseId === courseId);
  const options =
    type === "assignment"
      ? data.assignments.filter((a) => a.courseId === courseId).map((a) => ({ id: a.id, label: a.title }))
      : type === "quiz"
        ? data.quizzes.filter((q) => q.courseId === courseId).map((q) => ({ id: q.id, label: q.title }))
        : type === "page"
          ? data.pages.filter((p) => p.courseId === courseId).map((p) => ({ id: p.id, label: p.title }))
          : type === "file"
            ? data.files.filter((f) => f.courseId === courseId).map((f) => ({ id: f.id, label: f.name }))
            : type === "discussion"
              ? data.discussions.filter((d) => d.courseId === courseId).map((d) => ({ id: d.id, label: d.title }))
              : [];

  const reset = () => {
    setTitle("");
    setRef("");
    setUrl("https://");
    onClose();
  };

  const submit = () => {
    if (!moduleId) return;
    if (type === "header") {
      if (!title.trim()) return;
      addItem(moduleId, { type, title: title.trim() });
    } else if (type === "link") {
      if (!title.trim() || !/^https?:\/\/.+\..+/.test(url)) return;
      addItem(moduleId, { type, title: title.trim(), url });
    } else if (type === "assignment" && mode === "new") {
      if (!title.trim()) return;
      const id = createAssignment({
        courseId,
        groupId: groups[0]?.id ?? "",
        title: title.trim(),
        description: "<p>Instructions coming soon.</p>",
        points: Number(points) || 0,
        dueAt: new Date(due).toISOString(),
        submissionTypes: ["text", "file"],
      });
      addItem(moduleId, { type, title: title.trim(), refId: id });
    } else {
      const opt = options.find((o) => o.id === ref);
      if (!opt) return;
      addItem(moduleId, { type, title: type === "file" ? `File: ${opt.label}` : opt.label, refId: opt.id });
    }
    toast("Item added", "Unpublished until you publish it.");
    reset();
  };

  const types: { v: ModuleItemType; label: string }[] = [
    { v: "assignment", label: "Assignment" },
    { v: "quiz", label: "Quiz" },
    { v: "page", label: "Page" },
    { v: "discussion", label: "Discussion" },
    { v: "file", label: "File" },
    { v: "link", label: "External link" },
    { v: "header", label: "Text header" },
  ];

  return (
    <Modal open={!!moduleId} onClose={reset} title="Add an item" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => {
            const Icon = typeIcon[t.v];
            return (
              <button type="button" key={t.v} onClick={() => { setType(t.v); setRef(""); }} aria-pressed={type === t.v} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors", type === t.v ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-fg")}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {type === "assignment" && (
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} className="accent-[var(--accent)]" /> New assignment
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} className="accent-[var(--accent)]" /> Existing
            </label>
          </div>
        )}

        {(type === "header" || type === "link" || (type === "assignment" && mode === "new")) && (
          <Field label={type === "header" ? "Header text" : "Title"}>{(id) => <input id={id} value={title} onChange={(e) => setTitle(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
        )}
        {type === "link" && <Field label="URL" hint="Opens in a new tab.">{(id) => <input id={id} type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>}
        {type === "assignment" && mode === "new" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Points">{(id) => <input id={id} type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
            <Field label="Due">{(id) => <input id={id} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
          </div>
        )}
        {type !== "header" && type !== "link" && !(type === "assignment" && mode === "new") && (
          <Field label={`Choose a ${type}`}>
            {(id) => (
              <select id={id} value={ref} onChange={(e) => setRef(e.target.value)} className={cn(inputClass, "h-10")}>
                <option value="">Select one</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button onClick={reset}>Cancel</Button>
          <Button type="submit" variant="primary">
            Add item
          </Button>
        </div>
      </form>
    </Modal>
  );
}
