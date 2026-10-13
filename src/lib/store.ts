"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildSeed } from "./seed";
import { scoreAttempt, textToHtml, uid } from "./logic";
import type { Assignment, Data, ModuleItemType, QuizAnswer, Reply, Submission, User } from "./types";

interface State {
  data: Data;
  me: string | null;
  whatIf: Record<string, number>;
  courseNavOpen: boolean;
  signIn: (userId: string) => void;
  signOut: () => void;
  resetDemo: () => void;
  setCourseNavOpen: (open: boolean) => void;

  submitAssignment: (aid: string, input: { body?: string; fileName?: string; fileSize?: number; url?: string }) => void;
  saveDraft: (aid: string, body: string) => void;
  addSubmissionComment: (aid: string, ownerId: string, body: string) => void;

  startQuiz: (qid: string) => string;
  answerQuestion: (attemptId: string, questionId: string, answer: QuizAnswer) => void;
  toggleFlag: (attemptId: string, questionId: string) => void;
  submitQuiz: (attemptId: string) => void;

  toggleItemDone: (itemId: string) => void;
  setWhatIf: (id: string, score: number | undefined) => void;
  clearWhatIf: () => void;

  gradeSubmission: (aid: string, userId: string, score: number | undefined, comment?: string) => void;

  addModule: (courseId: string, name: string) => void;
  renameModule: (moduleId: string, name: string) => void;
  deleteModule: (moduleId: string) => void;
  moveModule: (moduleId: string, dir: -1 | 1) => void;
  toggleModulePublished: (moduleId: string) => void;
  addModuleItem: (moduleId: string, input: { type: ModuleItemType; title: string; refId?: string; url?: string }) => void;
  moveItem: (itemId: string, dir: -1 | 1) => void;
  toggleItemPublished: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  createAssignment: (input: Omit<Assignment, "id" | "published"> & { published?: boolean }) => string;

  postAnnouncement: (courseId: string, title: string, body: string) => void;
  markAnnouncementRead: (id: string) => void;
  createDiscussion: (courseId: string, title: string, body: string) => string;
  postReply: (discussionId: string, parentId: string | null, body: string) => void;
  toggleLike: (discussionId: string, replyId: string) => void;
  markDiscussionRead: (id: string) => void;

  sendMessage: (input: { subject: string; participantIds: string[]; courseId?: string; body: string }) => string;
  replyConversation: (id: string, body: string) => void;
  toggleStar: (id: string) => void;
  toggleArchive: (id: string) => void;
  markConversationRead: (id: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  setCourseColor: (courseId: string, color: string) => void;
  setNickname: (courseId: string, nickname: string) => void;
  toggleFavorite: (courseId: string) => void;
  updateProfile: (userId: string, patch: Partial<Pick<User, "name" | "pronouns" | "bio" | "title">>) => void;
}

const now = () => new Date().toISOString();

function mapReplies(replies: Reply[], fn: (r: Reply) => Reply): Reply[] {
  return replies.map((r) => fn({ ...r, replies: mapReplies(r.replies, fn) }));
}

function reorder<T extends { id: string; position: number }>(all: T[], siblings: T[], id: string, dir: -1 | 1): T[] {
  const sorted = [...siblings].sort((a, b) => a.position - b.position);
  const i = sorted.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return all;
  const a = sorted[i];
  const b = sorted[j];
  return all.map((x) => (x.id === a.id ? { ...x, position: b.position } : x.id === b.id ? { ...x, position: a.position } : x));
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patch = (fn: (d: Data) => Partial<Data>) => set((s) => ({ data: { ...s.data, ...fn(s.data) } }));
      const me = () => get().me ?? "";

      return {
        data: buildSeed(),
        me: null,
        whatIf: {},
        courseNavOpen: true,
        signIn: (userId) => set({ me: userId, whatIf: {} }),
        signOut: () => set({ me: null, whatIf: {} }),
        resetDemo: () => set((s) => ({ data: buildSeed(), whatIf: {}, me: s.me })),
        setCourseNavOpen: (open) => set({ courseNavOpen: open }),

        submitAssignment: (aid, input) =>
          patch((d) => {
            const existing = d.submissions.find((s) => s.assignmentId === aid && s.userId === me());
            const next: Submission = {
              id: existing?.id ?? uid("s"),
              assignmentId: aid,
              userId: me(),
              ...input,
              submittedAt: now(),
              score: undefined,
              gradedAt: undefined,
              rubricScores: undefined,
              comments: existing?.comments ?? [],
              attempt: (existing?.attempt ?? 0) + 1,
            };
            const drafts = { ...d.drafts };
            delete drafts[`${me()}:${aid}`];
            return { submissions: existing ? d.submissions.map((s) => (s.id === existing.id ? next : s)) : [...d.submissions, next], drafts };
          }),
        saveDraft: (aid, body) => patch((d) => ({ drafts: { ...d.drafts, [`${me()}:${aid}`]: body } })),
        addSubmissionComment: (aid, ownerId, body) =>
          patch((d) => {
            const comment = { id: uid("cm"), authorId: me(), body, at: now() };
            const existing = d.submissions.find((s) => s.assignmentId === aid && s.userId === ownerId);
            if (existing) return { submissions: d.submissions.map((s) => (s.id === existing.id ? { ...s, comments: [...s.comments, comment] } : s)) };
            return { submissions: [...d.submissions, { id: uid("s"), assignmentId: aid, userId: ownerId, comments: [comment], attempt: 0 }] };
          }),

        startQuiz: (qid) => {
          const open = get().data.attempts.find((a) => a.quizId === qid && a.userId === me() && !a.submittedAt);
          if (open) return open.id;
          const id = uid("qa");
          patch((d) => ({ attempts: [...d.attempts, { id, quizId: qid, userId: me(), answers: {}, flagged: [], startedAt: now() }] }));
          return id;
        },
        answerQuestion: (attemptId, questionId, answer) =>
          patch((d) => ({ attempts: d.attempts.map((a) => (a.id === attemptId && !a.submittedAt ? { ...a, answers: { ...a.answers, [questionId]: answer } } : a)) })),
        toggleFlag: (attemptId, questionId) =>
          patch((d) => ({
            attempts: d.attempts.map((a) =>
              a.id === attemptId ? { ...a, flagged: a.flagged.includes(questionId) ? a.flagged.filter((x) => x !== questionId) : [...a.flagged, questionId] } : a,
            ),
          })),
        submitQuiz: (attemptId) =>
          patch((d) => {
            const at = d.attempts.find((a) => a.id === attemptId);
            const quiz = d.quizzes.find((q) => q.id === at?.quizId);
            if (!at || !quiz || at.submittedAt) return {};
            return { attempts: d.attempts.map((a) => (a.id === attemptId ? { ...a, submittedAt: now(), score: scoreAttempt(quiz, a.answers) } : a)) };
          }),

        toggleItemDone: (itemId) =>
          patch((d) => {
            const list = d.completedItems[me()] ?? [];
            return { completedItems: { ...d.completedItems, [me()]: list.includes(itemId) ? list.filter((x) => x !== itemId) : [...list, itemId] } };
          }),
        setWhatIf: (id, score) =>
          set((s) => {
            const next = { ...s.whatIf };
            if (score === undefined || Number.isNaN(score)) delete next[id];
            else next[id] = score;
            return { whatIf: next };
          }),
        clearWhatIf: () => set({ whatIf: {} }),

        gradeSubmission: (aid, userId, score, comment) =>
          patch((d) => {
            const existing = d.submissions.find((s) => s.assignmentId === aid && s.userId === userId);
            const comments = comment ? [{ id: uid("cm"), authorId: me(), body: comment, at: now() }] : [];
            const notif = { id: uid("n"), userId, kind: "grade" as const, title: "Grade posted", body: d.assignments.find((a) => a.id === aid)?.title ?? "", href: `/courses/${d.assignments.find((a) => a.id === aid)?.courseId}/assignments/${aid}`, at: now(), read: false };
            const notifications = score !== undefined ? [notif, ...d.notifications] : d.notifications;
            if (existing) {
              return {
                submissions: d.submissions.map((s) => (s.id === existing.id ? { ...s, score, gradedAt: score !== undefined ? now() : undefined, comments: [...s.comments, ...comments] } : s)),
                notifications,
              };
            }
            return { submissions: [...d.submissions, { id: uid("s"), assignmentId: aid, userId, score, gradedAt: now(), comments, attempt: 0 }], notifications };
          }),

        addModule: (courseId, name) =>
          patch((d) => {
            const pos = Math.max(-1, ...d.modules.filter((m) => m.courseId === courseId).map((m) => m.position)) + 1;
            return { modules: [...d.modules, { id: uid("m"), courseId, name, position: pos, published: false, prerequisiteIds: [] }] };
          }),
        renameModule: (moduleId, name) => patch((d) => ({ modules: d.modules.map((m) => (m.id === moduleId ? { ...m, name } : m)) })),
        deleteModule: (moduleId) => patch((d) => ({ modules: d.modules.filter((m) => m.id !== moduleId), moduleItems: d.moduleItems.filter((i) => i.moduleId !== moduleId) })),
        moveModule: (moduleId, dir) =>
          patch((d) => {
            const m = d.modules.find((x) => x.id === moduleId);
            if (!m) return {};
            return { modules: reorder(d.modules, d.modules.filter((x) => x.courseId === m.courseId), moduleId, dir) };
          }),
        toggleModulePublished: (moduleId) => patch((d) => ({ modules: d.modules.map((m) => (m.id === moduleId ? { ...m, published: !m.published } : m)) })),
        addModuleItem: (moduleId, input) =>
          patch((d) => {
            const pos = Math.max(-1, ...d.moduleItems.filter((i) => i.moduleId === moduleId).map((i) => i.position)) + 1;
            return { moduleItems: [...d.moduleItems, { id: uid("mi"), moduleId, position: pos, published: false, ...input }] };
          }),
        moveItem: (itemId, dir) =>
          patch((d) => {
            const it = d.moduleItems.find((x) => x.id === itemId);
            if (!it) return {};
            return { moduleItems: reorder(d.moduleItems, d.moduleItems.filter((x) => x.moduleId === it.moduleId), itemId, dir) };
          }),
        toggleItemPublished: (itemId) => patch((d) => ({ moduleItems: d.moduleItems.map((i) => (i.id === itemId ? { ...i, published: !i.published } : i)) })),
        deleteItem: (itemId) => patch((d) => ({ moduleItems: d.moduleItems.filter((i) => i.id !== itemId) })),
        createAssignment: (input) => {
          const id = uid("a");
          patch((d) => ({ assignments: [...d.assignments, { published: true, ...input, id }] }));
          return id;
        },

        postAnnouncement: (courseId, title, body) =>
          patch((d) => {
            const id = uid("an");
            const students = d.enrollments.filter((e) => e.courseId === courseId && e.role === "student").map((e) => e.userId);
            const course = d.courses.find((c) => c.id === courseId);
            return {
              announcements: [{ id, courseId, title, body: textToHtml(body), authorId: me(), postedAt: now(), readBy: [me()] }, ...d.announcements],
              notifications: [...students.map((u) => ({ id: uid("n"), userId: u, kind: "announcement" as const, title, body: course?.code ?? "", href: `/courses/${courseId}/announcements`, at: now(), read: false })), ...d.notifications],
            };
          }),
        markAnnouncementRead: (id) =>
          patch((d) => ({ announcements: d.announcements.map((a) => (a.id === id && !a.readBy.includes(me()) ? { ...a, readBy: [...a.readBy, me()] } : a)) })),
        createDiscussion: (courseId, title, body) => {
          const id = uid("d");
          patch((d) => ({ discussions: [{ id, courseId, title, body: textToHtml(body), authorId: me(), postedAt: now(), pinned: false, replies: [], readBy: [me()] }, ...d.discussions] }));
          return id;
        },
        postReply: (discussionId, parentId, body) =>
          patch((d) => {
            const reply: Reply = { id: uid("r"), authorId: me(), body, at: now(), likes: [], replies: [] };
            return {
              discussions: d.discussions.map((x) => {
                if (x.id !== discussionId) return x;
                if (!parentId) return { ...x, replies: [...x.replies, reply] };
                return { ...x, replies: mapReplies(x.replies, (r) => (r.id === parentId ? { ...r, replies: [...r.replies, reply] } : r)) };
              }),
            };
          }),
        toggleLike: (discussionId, replyId) =>
          patch((d) => ({
            discussions: d.discussions.map((x) =>
              x.id !== discussionId
                ? x
                : { ...x, replies: mapReplies(x.replies, (r) => (r.id === replyId ? { ...r, likes: r.likes.includes(me()) ? r.likes.filter((l) => l !== me()) : [...r.likes, me()] } : r)) },
            ),
          })),
        markDiscussionRead: (id) => patch((d) => ({ discussions: d.discussions.map((x) => (x.id === id && !x.readBy.includes(me()) ? { ...x, readBy: [...x.readBy, me()] } : x)) })),

        sendMessage: ({ subject, participantIds, courseId, body }) => {
          const id = uid("cv");
          patch((d) => ({
            conversations: [
              { id, subject, participantIds: Array.from(new Set([me(), ...participantIds])), courseId, messages: [{ id: uid("msg"), authorId: me(), body, at: now() }], readBy: [me()], starred: [], archived: [] },
              ...d.conversations,
            ],
          }));
          return id;
        },
        replyConversation: (id, body) =>
          patch((d) => ({ conversations: d.conversations.map((c) => (c.id === id ? { ...c, messages: [...c.messages, { id: uid("msg"), authorId: me(), body, at: now() }], readBy: [me()], archived: [] } : c)) })),
        toggleStar: (id) =>
          patch((d) => ({ conversations: d.conversations.map((c) => (c.id === id ? { ...c, starred: c.starred.includes(me()) ? c.starred.filter((x) => x !== me()) : [...c.starred, me()] } : c)) })),
        toggleArchive: (id) =>
          patch((d) => ({ conversations: d.conversations.map((c) => (c.id === id ? { ...c, archived: c.archived.includes(me()) ? c.archived.filter((x) => x !== me()) : [...c.archived, me()] } : c)) })),
        markConversationRead: (id) => patch((d) => ({ conversations: d.conversations.map((c) => (c.id === id && !c.readBy.includes(me()) ? { ...c, readBy: [...c.readBy, me()] } : c)) })),

        markNotificationRead: (id) => patch((d) => ({ notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: () => patch((d) => ({ notifications: d.notifications.map((n) => (n.userId === me() ? { ...n, read: true } : n)) })),

        setCourseColor: (courseId, color) => patch((d) => ({ courses: d.courses.map((c) => (c.id === courseId ? { ...c, color } : c)) })),
        setNickname: (courseId, nickname) => patch((d) => ({ courses: d.courses.map((c) => (c.id === courseId ? { ...c, nickname: nickname.trim() || undefined } : c)) })),
        toggleFavorite: (courseId) => patch((d) => ({ courses: d.courses.map((c) => (c.id === courseId ? { ...c, favorite: !c.favorite } : c)) })),
        updateProfile: (userId, p) => patch((d) => ({ users: d.users.map((u) => (u.id === userId ? { ...u, ...p } : u)) })),
      };
    },
    {
      name: "muselearning",
      version: 2,
      migrate: () => ({ data: buildSeed(), me: null, courseNavOpen: true }) as unknown as State,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data, me: s.me, courseNavOpen: s.courseNavOpen }),
    },
  ),
);

export function useMe() {
  const me = useStore((s) => s.me);
  const users = useStore((s) => s.data.users);
  return users.find((u) => u.id === me);
}

export function useData() {
  return useStore((s) => s.data);
}
