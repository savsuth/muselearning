# Architecture: muselearning

Local-only by request: no hosting, no cloud database, no auth provider.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web app | Next.js 16 (App Router) + TypeScript + React 19 | file routes map one-to-one onto the recon screens |
| styling | Tailwind CSS 4, tokens in `src/app/globals.css` (`@theme`) | tokens from replica-design, dark mode via a class |
| state + persistence | Zustand 5 store with `persist` to localStorage | local-only means the browser is the database; instant UI, survives refresh, one "reset demo data" action |
| seed data | `src/lib/seed.ts`, fictional people and courses | every screen has realistic content on first run |
| motion | `motion` (Framer Motion successor) | layout and presence animations |
| icons | @phosphor-icons/react | consistent icon set |
| hosting | `npm run dev` on localhost | by request |

One store, no backend. If it ever needs to go multi-user, the store actions are the seam that becomes route handlers.

## Data model (TypeScript, `src/lib/types.ts`)

The recon entities become TS types. Rules carried over from the SQL checklist:

- every entity has a string `id`
- times are ISO strings in UTC, rendered in the viewer's time zone
- status fields are string unions, not free text
- ownership: submissions, attempts and messages carry `userId`; the store's selectors filter by the current persona
- authorisation: one check per action in the store (`canEdit(courseId)` for instructor actions)

Derived values are computed, never stored: submission status (missing / late / submitted / graded), grade totals, module completion, unread counts.

## Store actions (the "API")

| action | does | who | flow |
| --- | --- | --- | --- |
| `switchPersona(userId)` | sign in as a seed user | anyone | S01 |
| `submitAssignment(aid, body, file?)` | create or replace a submission | student | F01 |
| `saveDraft(aid, body)` | autosave draft | student | F01 |
| `startQuiz / answerQuestion / submitQuiz` | quiz attempt lifecycle, auto-graded | student | F02 |
| `markItemDone(itemId)` | module progress | student | F03 |
| `setWhatIf(aid, score)` / `clearWhatIf` | what-if grades (session only) | student | F04 |
| `gradeSubmission(aid, uid, score, comment)` | grade | teacher | F05 |
| `addModule / addModuleItem / moveModule / togglePublish` | build modules | teacher | F06 |
| `postAnnouncement` | announcement | teacher | S12 |
| `reply(discussionId, parentId, body)` / `toggleLike` | discussion | anyone enrolled | S11 |
| `sendMessage / replyToConversation / toggleStar / markRead` | inbox | anyone | F07 |
| `setCourseColor / setNickname / toggleFavorite` | card customisation | anyone | S02 |
| `resetDemo()` | restore seed | anyone | settings |

## Parts that bite

- Time zones: seed dates are generated relative to "now" so due dates are always upcoming; rendered with `Intl.DateTimeFormat` in local time.
- Hydration: persisted store only exists in the browser; pages render after hydration to avoid server/client mismatch.
- Quiz timer: store `startedAt`, derive remaining time, so a refresh does not reset the clock; auto-submit at zero.
- Grade math: weighted groups, drop ungraded from denominator, what-if overrides layered on top without mutating real scores.
- Files: local only, so a "file" is name + size metadata; no upload server.

## Build order

1. Vertical slice: shell + dashboard + course + assignment submit (S02, S04, S06, S07).
2. Must-haves: modules, quizzes, discussions, announcements, grades, people, calendar, inbox.
3. Should-haves: what-if, syllabus, pages, files, account, instructor view, gradebook, module editing, dark mode.
4. Could-haves: command palette, shortcuts, flagging, drafts, notification tray, focus timer.
