"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatsCircle, Plus, PushPin } from "@phosphor-icons/react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn, countReplies, lastActivity, plain, relative } from "@/lib/logic";
import type { Discussion } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Avatar, Button, EmptyState, Field, Modal, PageHeader, Panel, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";


export default function DiscussionsPage() {
  const { course, data } = useCourse();
  const [creating, setCreating] = useState(false);
  if (!course) return null;
  const list = data.discussions.filter((d) => d.courseId === course.id).sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
  const pinned = list.filter((d) => d.pinned);
  const rest = list.filter((d) => !d.pinned);

  return (
    <div>
      <PageHeader title="Discussions" actions={<Button variant="primary" size="sm" onClick={() => setCreating(true)}><Plus size={16} weight="bold" /> Discussion</Button>} />
      {list.length === 0 ? (
        <EmptyState icon={<ChatsCircle size={22} />} title="No discussions yet" body="Start one to ask the class a question." />
      ) : (
        <div className="flex flex-col gap-6">
          {pinned.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">Pinned</h2>
              <Panel className="divide-y divide-line overflow-hidden">
                {pinned.map((d) => (
                  <Row key={d.id} d={d} courseId={course.id} />
                ))}
              </Panel>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">Discussions</h2>
              <Panel className="divide-y divide-line overflow-hidden">
                {rest.map((d) => (
                  <Row key={d.id} d={d} courseId={course.id} />
                ))}
              </Panel>
            </section>
          )}
        </div>
      )}
      <NewDiscussion open={creating} onClose={() => setCreating(false)} courseId={course.id} />
    </div>
  );
}

function NewDiscussion({ open, onClose, courseId }: { open: boolean; onClose: () => void; courseId: string }) {
  const create = useStore((s) => s.createDiscussion);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Start a discussion" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !body.trim()) return;
          const id = create(courseId, title.trim(), body);
          toast("Discussion posted");
          setTitle("");
          setBody("");
          onClose();
          router.push(`/courses/${courseId}/discussions/${id}`);
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Topic">{(id) => <input id={id} value={title} onChange={(e) => setTitle(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
        <Field label="Message">{(id) => <textarea id={id} rows={6} value={body} onChange={(e) => setBody(e.target.value)} className={cn(inputClass, "py-2.5")} />}</Field>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!title.trim() || !body.trim()}>
            Post
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Row({ d, courseId }: { d: Discussion; courseId: string }) {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const author = data.users.find((u) => u.id === d.authorId);
  const unread = !d.readBy.includes(me);
  const n = countReplies(d.replies);
  return (
    <Link href={`/courses/${courseId}/discussions/${d.id}`} className="group flex gap-4 px-4 py-4 transition-colors hover:bg-surface-2/60">
      <Avatar user={author} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {d.pinned && <PushPin size={14} weight="fill" className="shrink-0 text-accent" />}
          <p className={cn("truncate text-[15px] group-hover:text-accent", unread ? "font-semibold" : "font-medium")}>{d.title}</p>
          {unread && <span className="shrink-0 rounded-full bg-accent px-1.5 text-[10px] leading-4 font-semibold text-on-accent">New</span>}
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted">{plain(d.body)}</p>
        <p className="mt-1 text-xs text-faint">
          {author?.name}, last activity {relative(lastActivity(d))}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center rounded-[10px] bg-surface-2 px-3 py-1.5">
        <span className="text-[15px] font-semibold tabular-nums">{n}</span>
        <span className="text-[10px] text-muted">{n === 1 ? "reply" : "replies"}</span>
      </div>
    </Link>
  );
}
