"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Megaphone, PaperPlaneRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { cn, fmtDateTime, relative } from "@/lib/logic";
import { useCourse } from "@/components/course-context";
import { Avatar, Button, EmptyState, Field, Html, PageHeader, Panel, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";

export default function AnnouncementsPage() {
  const { course, data, me, staff } = useCourse();
  const markRead = useStore((s) => s.markAnnouncementRead);
  const post = useStore((s) => s.postAnnouncement);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const reduce = useReducedMotion();
  const list = data.announcements.filter((a) => a.courseId === course?.id).sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  const unreadIds = list.filter((a) => !a.readBy.includes(me)).map((a) => a.id);
  const [highlight] = useState(() => new Set(unreadIds));

  const unreadKey = unreadIds.join(",");
  useEffect(() => {
    if (!unreadKey) return;
    const t = setTimeout(() => unreadKey.split(",").forEach(markRead), 1200);
    return () => clearTimeout(t);
  }, [unreadKey, markRead]);

  if (!course) return null;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Announcements" actions={staff && !composing ? <Button variant="primary" size="sm" onClick={() => setComposing(true)}><Megaphone size={16} /> New announcement</Button> : undefined} />
      <AnimatePresence>
        {composing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Panel className="p-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!title.trim() || !body.trim()) return;
                  post(course.id, title.trim(), body);
                  toast("Announcement posted", "Students were notified.");
                  setTitle("");
                  setBody("");
                  setComposing(false);
                }}
                className="flex flex-col gap-4"
              >
                <Field label="Title">{(id) => <input id={id} value={title} onChange={(e) => setTitle(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
                <Field label="Message" hint="Blank lines become new paragraphs.">{(id) => <textarea id={id} rows={5} value={body} onChange={(e) => setBody(e.target.value)} className={cn(inputClass, "py-2.5")} />}</Field>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setComposing(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={!title.trim() || !body.trim()}>
                    <PaperPlaneRight size={16} weight="fill" /> Post
                  </Button>
                </div>
              </form>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
      {list.length === 0 ? (
        <EmptyState icon={<Megaphone size={22} />} title="No announcements yet" body="Announcements from your instructor appear here and in your Activity panel." />
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((a, i) => {
            const author = data.users.find((u) => u.id === a.authorId);
            const isNew = highlight.has(a.id);
            return (
              <motion.li key={a.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <Panel className={cn("p-6", isNew && "ring-2 ring-accent/30")}>
                  <div className="flex items-start gap-3">
                    <Avatar user={author} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">{a.title}</h2>
                        {isNew && <span className="rounded-full bg-accent px-2 text-[11px] leading-5 font-semibold text-on-accent">New</span>}
                      </div>
                      <p className="text-xs text-muted">
                        {author?.name}, <time dateTime={a.postedAt} title={fmtDateTime(a.postedAt)}>{relative(a.postedAt)}</time>
                      </p>
                      <Html html={a.body} className="mt-3" />
                    </div>
                  </div>
                </Panel>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
