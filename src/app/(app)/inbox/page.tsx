"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Archive, ArrowLeft, MagnifyingGlass, NotePencil, PaperPlaneRight, Star, Tray, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useMe, useStore } from "@/lib/store";
import { cn, fmtDateTime, myCourses, relative } from "@/lib/logic";
import type { Conversation } from "@/lib/types";
import { Avatar, Button, EmptyState, Field, Modal, Segmented, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";

type Box = "inbox" | "unread" | "starred" | "archived";

export default function InboxPage() {
  const me = useMe()!;
  const data = useStore((s) => s.data);
  const params = useSearchParams();
  const router = useRouter();
  const [box, setBox] = useState<Box>("inbox");
  const [q, setQ] = useState("");
  const selectedId = params.get("c");
  const composing = params.get("compose") === "1";

  const mine = data.conversations
    .filter((c) => c.participantIds.includes(me.id))
    .sort((a, b) => b.messages[b.messages.length - 1].at.localeCompare(a.messages[a.messages.length - 1].at));
  const list = mine
    .filter((c) => (box === "archived" ? c.archived.includes(me.id) : !c.archived.includes(me.id)))
    .filter((c) => (box === "unread" ? !c.readBy.includes(me.id) : box === "starred" ? c.starred.includes(me.id) : true))
    .filter((c) => !q || `${c.subject} ${c.messages.map((m) => m.body).join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const selected = mine.find((c) => c.id === selectedId);
  const unread = mine.filter((c) => !c.readBy.includes(me.id) && !c.archived.includes(me.id)).length;

  const select = (id: string | null) => router.replace(id ? `/inbox?c=${id}` : "/inbox", { scroll: false });

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col md:h-[100dvh]">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
        <h1 className="mr-2 text-[22px] font-semibold tracking-tight">Inbox</h1>
        <Segmented<Box>
          label="Mailbox"
          value={box}
          onChange={setBox}
          options={[
            { value: "inbox", label: "Inbox" },
            { value: "unread", label: "Unread", count: unread },
            { value: "starred", label: "Starred" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <Button variant="primary" size="sm" className="ml-auto" onClick={() => router.replace("/inbox?compose=1", { scroll: false })}>
          <NotePencil size={16} /> Compose
        </Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className={cn("flex w-full flex-col border-r border-line md:w-[380px] md:shrink-0", selected && "hidden md:flex")}>
          <div className="border-b border-line p-3">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages…" aria-label="Search messages" className={cn(inputClass, "h-9 pl-9")} />
            </div>
          </div>
          {list.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Tray size={22} />} title={box === "inbox" ? "Inbox zero" : "Nothing here"} body={box === "inbox" ? "New messages from classmates and instructors land here." : undefined} />
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto scrollbar-thin">
              {list.map((c) => (
                <ConvRow key={c.id} c={c} active={c.id === selectedId} onClick={() => select(c.id)} />
              ))}
            </ul>
          )}
        </div>
        <div className={cn("min-w-0 flex-1", !selected && "hidden md:block")}>
          {selected ? (
            <Thread key={selected.id} c={selected} onBack={() => select(null)} />
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-center">
              <div>
                <Tray size={40} weight="duotone" className="mx-auto text-faint" />
                <p className="mt-3 font-medium">Select a conversation</p>
                <p className="mt-1 text-sm text-muted">Or start a new one with Compose.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Compose open={composing} onClose={() => router.replace(selected ? `/inbox?c=${selected.id}` : "/inbox", { scroll: false })} presetTo={params.get("to")} presetCourse={params.get("course")} onSent={(id) => select(id)} />
    </div>
  );
}

function ConvRow({ c, active, onClick }: { c: Conversation; active: boolean; onClick: () => void }) {
  const me = useStore((s) => s.me)!;
  const users = useStore((s) => s.data.users);
  const courses = useStore((s) => s.data.courses);
  const last = c.messages[c.messages.length - 1];
  const others = c.participantIds.filter((p) => p !== me).map((p) => users.find((u) => u.id === p)!);
  const unread = !c.readBy.includes(me);
  const course = courses.find((x) => x.id === c.courseId);
  return (
    <li>
      <button onClick={onClick} className={cn("relative flex w-full gap-3 border-b border-line px-4 py-3.5 text-left transition-colors", active ? "bg-accent-soft/60" : "hover:bg-surface-2/60")}>
        {unread && <span className="absolute top-1/2 left-1.5 size-1.5 -translate-y-1/2 rounded-full bg-accent" aria-label="Unread" />}
        <Avatar user={others[0]} size={36} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{others.map((o) => o.name.split(" ")[0]).join(", ")}</span>
            <span className="ml-auto shrink-0 text-[11px] text-faint">{relative(last.at)}</span>
          </span>
          <span className={cn("block truncate text-sm", unread ? "text-fg" : "text-muted")}>{c.subject}</span>
          <span className="block truncate text-xs text-muted">{last.body}</span>
          {course && <span className="mt-1 inline-block text-[11px] font-medium" style={{ color: course.color }}><span className="dark:brightness-[1.6]">{course.code}</span></span>}
        </span>
        {c.starred.includes(me) && <Star size={14} weight="fill" className="shrink-0 text-warning" />}
      </button>
    </li>
  );
}

function Thread({ c, onBack }: { c: Conversation; onBack: () => void }) {
  const me = useStore((s) => s.me)!;
  const users = useStore((s) => s.data.users);
  const reply = useStore((s) => s.replyConversation);
  const markRead = useStore((s) => s.markConversationRead);
  const star = useStore((s) => s.toggleStar);
  const archive = useStore((s) => s.toggleArchive);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!c.readBy.includes(me)) markRead(c.id);
  }, [c, me, markRead]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [c.messages.length, reduce]);

  const others = c.participantIds.filter((p) => p !== me).map((p) => users.find((u) => u.id === p)!);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
        <button onClick={onBack} aria-label="Back to list" className="flex size-9 items-center justify-center rounded-[10px] hover:bg-surface-2 md:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{c.subject}</h2>
          <p className="truncate text-xs text-muted">With {others.map((o) => o.name).join(", ")}</p>
        </div>
        <button onClick={() => star(c.id)} aria-pressed={c.starred.includes(me)} aria-label={c.starred.includes(me) ? "Unstar" : "Star"} className="flex size-9 items-center justify-center rounded-[10px] hover:bg-surface-2">
          <Star size={18} weight={c.starred.includes(me) ? "fill" : "regular"} className={c.starred.includes(me) ? "text-warning" : "text-muted"} />
        </button>
        <button
          onClick={() => {
            archive(c.id);
            toast(c.archived.includes(me) ? "Moved to inbox" : "Archived", c.subject, "info");
            onBack();
          }}
          aria-label={c.archived.includes(me) ? "Move to inbox" : "Archive"}
          className="flex size-9 items-center justify-center rounded-[10px] text-muted hover:bg-surface-2"
        >
          <Archive size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin sm:px-6">
        <ul className="mx-auto flex max-w-2xl flex-col gap-5">
          <AnimatePresence initial={false}>
            {c.messages.map((m) => {
              const u = users.find((x) => x.id === m.authorId);
              const mine = m.authorId === me;
              return (
                <motion.li key={m.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                  <Avatar user={u} size={34} />
                  <div className={cn("max-w-[80%]", mine && "text-right")}>
                    <p className="mb-1 text-xs text-muted">
                      <span className="font-medium text-fg">{mine ? "You" : u?.name}</span>, <time dateTime={m.at}>{fmtDateTime(m.at)}</time>
                    </p>
                    <p className={cn("inline-block rounded-[14px] px-4 py-2.5 text-left text-[15px] leading-relaxed whitespace-pre-wrap", mine ? "rounded-tr-[4px] bg-accent text-on-accent" : "rounded-tl-[4px] border border-line bg-surface")}>{m.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          reply(c.id, text.trim());
          setText("");
        }}
        className="border-t border-line p-3 sm:p-4"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <label htmlFor="reply" className="sr-only">
            Reply
          </label>
          <textarea
            id="reply"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }}
            placeholder="Write a reply. ⌘ Enter sends…"
            className={cn(inputClass, "max-h-40 min-h-10 resize-y py-2.5")}
          />
          <Button type="submit" variant="primary" disabled={!text.trim()} aria-label="Send">
            <PaperPlaneRight size={16} weight="fill" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function Compose({ open, onClose, presetTo, presetCourse, onSent }: { open: boolean; onClose: () => void; presetTo: string | null; presetCourse: string | null; onSent: (id: string) => void }) {
  return <Modal open={open} onClose={onClose} title="New message" wide>{open && <ComposeForm key={`${presetTo}-${presetCourse}`} onClose={onClose} presetTo={presetTo} presetCourse={presetCourse} onSent={onSent} />}</Modal>;
}

function ComposeForm({ onClose, presetTo, presetCourse, onSent }: { onClose: () => void; presetTo: string | null; presetCourse: string | null; onSent: (id: string) => void }) {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const send = useStore((s) => s.sendMessage);
  const courses = myCourses(data, me);
  const [courseId, setCourseId] = useState(presetCourse ?? courses[0]?.id ?? "");
  const [to, setTo] = useState<string[]>(presetTo ? [presetTo] : []);
  const [find, setFind] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const people = data.enrollments
    .filter((e) => e.courseId === courseId && e.userId !== me)
    .map((e) => ({ u: data.users.find((u) => u.id === e.userId)!, role: e.role }))
    .filter(({ u }) => !to.includes(u.id) && u.name.toLowerCase().includes(find.toLowerCase()))
    .sort((a, b) => (a.role === b.role ? a.u.name.localeCompare(b.u.name) : a.role === "student" ? 1 : -1));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!to.length) return setError("Add at least one recipient.");
        if (!subject.trim() || !body.trim()) return setError("Add a subject and a message.");
        const id = send({ subject: subject.trim(), participantIds: to, courseId: courseId || undefined, body: body.trim() });
        toast("Message sent");
        onSent(id);
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Course">
        {(id) => (
          <select id={id} value={courseId} onChange={(e) => setCourseId(e.target.value)} className={cn(inputClass, "h-10")}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} {c.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <div>
        <label htmlFor="to-find" className="mb-1.5 block text-[13px] font-medium">
          To
        </label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-[10px] border border-input/60 px-2 py-1.5 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20">
          {to.map((uid) => {
            const u = data.users.find((x) => x.id === uid)!;
            return (
              <span key={uid} className="flex items-center gap-1.5 rounded-full bg-surface-2 py-0.5 pr-1 pl-0.5 text-sm">
                <Avatar user={u} size={22} /> {u.name}
                <button type="button" onClick={() => setTo(to.filter((x) => x !== uid))} aria-label={`Remove ${u.name}`} className="flex size-5 items-center justify-center rounded-full hover:bg-surface-3">
                  <X size={12} />
                </button>
              </span>
            );
          })}
          <input id="to-find" value={find} onChange={(e) => setFind(e.target.value)} placeholder={to.length ? "" : "Search people in this course…"} className="h-7 min-w-[140px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-faint" />
        </div>
        {find && people.length > 0 && (
          <ul className="mt-1 max-h-48 overflow-y-auto rounded-[10px] border border-line bg-surface p-1 shadow-pop">
            {people.slice(0, 8).map(({ u, role }) => (
              <li key={u.id}>
                <button type="button" onClick={() => { setTo([...to, u.id]); setFind(""); setError(null); }} className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-sm hover:bg-surface-2">
                  <Avatar user={u} size={26} /> {u.name}
                  <span className="ml-auto text-xs text-muted">{role === "teacher" ? "Instructor" : role === "ta" ? "TA" : "Student"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Field label="Subject">{(id) => <input id={id} value={subject} onChange={(e) => setSubject(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
      <Field label="Message" error={error ?? undefined}>{(id) => <textarea id={id} rows={6} value={body} onChange={(e) => { setBody(e.target.value); setError(null); }} className={cn(inputClass, "py-2.5")} />}</Field>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          <PaperPlaneRight size={16} weight="fill" /> Send
        </Button>
      </div>
    </form>
  );
}
