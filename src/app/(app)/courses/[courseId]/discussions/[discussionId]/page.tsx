"use client";

import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowBendUpLeft, ChatsCircle, Heart } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { cn, countReplies, fmtDateTime, relative, roleIn } from "@/lib/logic";
import type { Reply } from "@/lib/types";
import { useCourse } from "@/components/course-context";
import { Avatar, Button, ButtonLink, EmptyState, Html, Panel, inputClass } from "@/components/ui";

export default function DiscussionPage() {
  const { discussionId } = useParams<{ discussionId: string }>();
  const { course, data, me } = useCourse();
  const markRead = useStore((s) => s.markDiscussionRead);
  const d = data.discussions.find((x) => x.id === discussionId && x.courseId === course?.id);
  useEffect(() => {
    if (d && !d.readBy.includes(me)) markRead(d.id);
  }, [d, me, markRead]);
  if (!course) return null;
  if (!d) return <EmptyState icon={<ChatsCircle size={22} />} title="Discussion not found" action={<ButtonLink href={`/courses/${course.id}/discussions`}>All discussions</ButtonLink>} />;
  const author = data.users.find((u) => u.id === d.authorId);
  const n = countReplies(d.replies);

  return (
    <div className="mx-auto max-w-3xl">
      <article>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em] text-balance">{d.title}</h1>
        <div className="mt-4 flex items-center gap-3">
          <Avatar user={author} size={40} />
          <div>
            <p className="text-sm font-semibold">
              {author?.name} <RoleTag userId={d.authorId} courseId={course.id} />
            </p>
            <p className="text-xs text-muted">{fmtDateTime(d.postedAt)}</p>
          </div>
        </div>
        <Html html={d.body} className="mt-5" />
      </article>

      <Composer discussionId={d.id} parentId={null} placeholder="Write a reply…" />

      <h2 className="mt-10 mb-4 text-[15px] font-semibold">
        {n} {n === 1 ? "reply" : "replies"}
      </h2>
      {d.replies.length === 0 ? (
        <p className="text-sm text-muted">No replies yet. Be the first.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {d.replies.map((r) => (
            <ReplyNode key={r.id} r={r} discussionId={d.id} depth={0} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RoleTag({ userId, courseId }: { userId: string; courseId: string }) {
  const data = useStore((s) => s.data);
  const role = roleIn(data, userId, courseId);
  if (role === "student" || !role) return null;
  return <span className="ml-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">{role === "ta" ? "TA" : "Instructor"}</span>;
}

function ReplyNode({ r, discussionId, depth }: { r: Reply; discussionId: string; depth: number }) {
  const users = useStore((s) => s.data.users);
  const me = useStore((s) => s.me)!;
  const like = useStore((s) => s.toggleLike);
  const { course } = useCourse();
  const [replying, setReplying] = useState(false);
  const reduce = useReducedMotion();
  const u = users.find((x) => x.id === r.authorId);
  const liked = r.likes.includes(me);
  const Wrapper = depth === 0 ? Panel : "div";
  return (
    <motion.li layout={!reduce} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Wrapper className={cn(depth === 0 ? "p-5" : "border-l-2 border-line pt-4 pl-4")}>
        <div className="flex gap-3">
          <Avatar user={u} size={depth === 0 ? 36 : 30} />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-semibold">{u?.name}</span>
              {course && <RoleTag userId={r.authorId} courseId={course.id} />}
              <span className="ml-2 text-xs text-muted">{relative(r.at)}</span>
            </p>
            <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap">{r.body}</p>
            <div className="mt-2 flex items-center gap-1">
              <button onClick={() => like(discussionId, r.id)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className={cn("flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-xs font-medium transition-colors", liked ? "text-accent" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                <motion.span key={String(liked)} initial={reduce || !liked ? false : { scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 700, damping: 15 }}>
                  <Heart size={16} weight={liked ? "fill" : "regular"} />
                </motion.span>
                {r.likes.length > 0 && <span className="tabular-nums">{r.likes.length}</span>}
              </button>
              <button onClick={() => setReplying((x) => !x)} className="flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                <ArrowBendUpLeft size={16} /> Reply
              </button>
            </div>
            <AnimatePresence>
              {replying && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Composer discussionId={discussionId} parentId={r.id} placeholder={`Reply to ${u?.name.split(" ")[0]}…`} onDone={() => setReplying(false)} compact />
                </motion.div>
              )}
            </AnimatePresence>
            {r.replies.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {r.replies.map((c) => (
                  <ReplyNode key={c.id} r={c} discussionId={discussionId} depth={depth + 1} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </Wrapper>
    </motion.li>
  );
}

function Composer({ discussionId, parentId, placeholder, onDone, compact }: { discussionId: string; parentId: string | null; placeholder: string; onDone?: () => void; compact?: boolean }) {
  const post = useStore((s) => s.postReply);
  const me = useStore((s) => s.me)!;
  const user = useStore((s) => s.data.users.find((u) => u.id === me));
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const expanded = compact || focused || text.length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        post(discussionId, parentId, text.trim());
        setText("");
        setFocused(false);
        onDone?.();
      }}
      className={cn("flex gap-3", compact ? "mt-3" : "mt-8 rounded-[14px] border border-line bg-surface p-4 shadow-card")}
    >
      {!compact && <Avatar user={user} size={36} />}
      <div className="flex-1">
        <label className="sr-only" htmlFor={`compose-${parentId ?? "root"}`}>
          {placeholder}
        </label>
        <textarea
          id={`compose-${parentId ?? "root"}`}
          rows={expanded ? 3 : 1}
          value={text}
          autoFocus={compact}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClass, "resize-none py-2.5 transition-[height]")}
        />
        {expanded && (
          <div className="mt-2 flex justify-end gap-2">
            {onDone && (
              <Button size="sm" variant="ghost" onClick={onDone}>
                Cancel
              </Button>
            )}
            <Button size="sm" type="submit" variant="primary" disabled={!text.trim()} onMouseDown={(e) => e.preventDefault()}>
              Post reply
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
