# Recon map: Canvas LMS (web) -> muselearning

Scope: the student and instructor course experience: dashboard, course shell (home, modules, assignments, quizzes, discussions, announcements, grades, people, pages, files, syllabus), calendar, inbox, account.
For: personal project, local only. Not coursework, not deployed.
Date: 2026-10-12

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Kambaz syllabus (Canvas-inspired LMS spec) | https://kambaz.dev/syllabus | screen list: landing, account, dashboard, course home, modules, assignments, people, grades |
| 2 | Canvas guides (public help center) | https://community.canvaslms.com/t5/Canvas-Guides/ct-p/canvas_guides | feature list, settings, empty states |
| 3 | Canvas REST API docs (public) | https://canvas.instructure.com/doc/api/ | data model: courses, modules, module items, assignments, submissions, rubrics, discussion topics, conversations, calendar events |
| 4 | Product knowledge | n/a | general, widely documented Canvas UX patterns only; no screenshots, bundles or private APIs used |

## Core loop

A student opens the dashboard, sees what is due, opens a course, works through a module, submits an assignment or quiz, and gets a grade with feedback.

## Screens

| ID | screen | route | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Sign in | /login | pick a demo persona | persona cards | default |
| S02 | Dashboard | /dashboard | courses at a glance + what is due | course cards, to-do rail, recent feedback, card color/nickname | empty, filled |
| S03 | All courses | /courses | course list, favorites | table, star toggle | filled |
| S04 | Course home | /courses/[id] | course front page, status | course nav, hero, coming up, progress | filled |
| S05 | Modules | /courses/[id]/modules | ordered learning content | collapsible module, items, completion, prerequisites, publish toggles | empty, locked, complete |
| S06 | Assignments | /courses/[id]/assignments | assignment groups | groups with weights, search, status chips | empty, filled |
| S07 | Assignment detail | /courses/[id]/assignments/[aid] | read + submit | details, rubric, submission panel, comments | not submitted, submitted, graded, late, locked |
| S08 | Quizzes | /courses/[id]/quizzes | quiz list | list, attempts | empty, filled |
| S09 | Take quiz | /courses/[id]/quizzes/[qid] | answer questions | question nav, timer, flags, autosave, submit | in progress, submitted, results |
| S10 | Discussions | /courses/[id]/discussions | threads | list, unread counts, pinned | empty, filled |
| S11 | Discussion thread | /courses/[id]/discussions/[did] | read + reply | nested replies, likes, composer | filled |
| S12 | Announcements | /courses/[id]/announcements | instructor posts | list, read state | empty, filled |
| S13 | Grades | /courses/[id]/grades | student grades | grade table, weights, what-if scores, totals | ungraded, graded |
| S14 | People | /courses/[id]/people | roster | role filter, search, profile drawer | filled |
| S15 | Pages | /courses/[id]/pages + /[slug] | wiki pages | list, rich content | empty, filled |
| S16 | Files | /courses/[id]/files | course files | folder tree, file list, preview | empty, filled |
| S17 | Syllabus | /courses/[id]/syllabus | course summary | rich text, auto course summary table | filled |
| S18 | Calendar | /calendar | all events and due dates | month, week, agenda, course filters | filled |
| S19 | Inbox | /inbox | messaging | conversation list, thread, composer, filters | empty, filled |
| S20 | Account / profile | /account | profile, notifications, settings | form, toggles | default |
| S21 | Gradebook (instructor) | /courses/[id]/gradebook | grade all students | grid, inline editing, stats | filled |
| S22 | Global search (new) | Cmd+K anywhere | jump anywhere | command palette | empty, results |

## Flows

```
F01 Student submits an assignment
    S02 -> S04 -> S06 -> S07 (submit) -> S07 submitted state
    happy path clicks: Canvas ~5; target 3 (to-do rail links straight to S07)
    edge: past due (late), locked until date, resubmission

F02 Student takes a quiz
    S02 -> S08 -> S09 -> results
    edge: timer runs out, leaves mid-attempt (autosave), no attempts left

F03 Student works through a module
    S04 -> S05 -> item -> next item
    edge: prerequisite module not complete, unpublished items hidden

F04 Student checks grades, tries what-if
    S02 -> S13 -> edit a score -> total updates -> revert

F05 Instructor grades a submission
    S21 -> cell edit -> student sees grade + feedback on S07/S13

F06 Instructor builds a module
    S05 (instructor) -> add module -> add item -> reorder -> publish

F07 Message a classmate
    S19 -> compose -> pick course + person -> send -> thread
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Global nav rail | icon+label | active, hover, badge | all |
| Course nav | text list | active, hidden-to-students | course screens |
| Button | primary, secondary, ghost, danger | default, hover, focus, disabled, loading | all |
| Course card | color band, image | default, hover, favorite | S02, S03 |
| Status chip | due, late, missing, submitted, graded, excused | | S02, S06, S07, S13 |
| Module | collapsible | open, closed, locked, complete | S05 |
| Item row | assignment, quiz, page, file, link, header | published, unpublished, done | S05 |
| Tray / drawer | right | open, closed | to-do, profile, help |
| Modal | dialog | open | create, confirm |
| Toast | success, error, info | | all |
| Tabs / segmented | | | calendar, inbox |
| Command palette | | empty, results, no results | S22 |
| Rubric table | criteria x ratings | read, scored | S07 |
| Progress ring | | | S04, S02 |

## Inferred data model

```
User         id, name, pronouns, email, avatarColor, role(student|teacher|ta), bio
             evidence: API Users, S14, S20; confidence: high
Course       id, code, name, term, color, image, nickname, instructorId, syllabus, favorite
             evidence: API Courses, S02, S03; confidence: high
Enrollment   userId, courseId, role
             evidence: API Enrollments, S14; confidence: high
Module       id, courseId, name, position, published, unlockAt, prerequisiteIds
             evidence: API Modules; confidence: high
ModuleItem   id, moduleId, type(assignment|quiz|page|file|link|header), refId, title, position, published
             evidence: API Module Items; confidence: high
AssignmentGroup id, courseId, name, weight
             evidence: API Assignment Groups, S06; confidence: high
Assignment   id, courseId, groupId, title, description, points, dueAt, availableFrom, availableUntil,
             submissionTypes, rubricId, published
             evidence: API Assignments, S07; confidence: high
Submission   id, assignmentId, userId, body, fileName, submittedAt, score, grade, late, missing,
             excused, comments[]
             evidence: API Submissions, S07, S13; confidence: high
Rubric       id, criteria[{id, description, points, ratings[{label, points}]}]
             evidence: API Rubrics; confidence: high
Quiz         id, courseId, title, timeLimit, attemptsAllowed, dueAt, questions[]
             evidence: API Quizzes; confidence: high
QuizAttempt  id, quizId, userId, answers, startedAt, submittedAt, score
             evidence: API Quiz Submissions; confidence: high
Discussion   id, courseId, title, body, authorId, pinned, postedAt, replies[] (nested)
             evidence: API Discussion Topics; confidence: high
Announcement id, courseId, title, body, authorId, postedAt, readBy
             evidence: Canvas announcements are discussion topics; confidence: high
Page         id, courseId, slug, title, body, updatedAt, frontPage
             evidence: API Pages; confidence: high
File         id, courseId, folder, name, size, type, updatedAt
             evidence: API Files; confidence: high
CalendarEvent id, courseId?, title, startAt, endAt, location
             evidence: API Calendar Events; confidence: high
Conversation id, subject, participantIds, courseId, messages[{authorId, body, at}], readBy, starred
             evidence: API Conversations, S19; confidence: high
```

Relationships: Course 1-n Module 1-n ModuleItem; Course 1-n AssignmentGroup 1-n Assignment 1-n Submission; Assignment 0-1 Rubric; Course 1-n Quiz 1-n QuizAttempt; Course n-n User via Enrollment.

## Feature matrix

See `features.csv`. Must: 22, should: 14, could: 8, skip: 6.

## Out of scope

- Real institutions, SSO, LTI tools, the Instructure brand, logo, name and proprietary fonts
- Real student data (all seed data is fictional)
- Email/push notification delivery, video conferencing, plagiarism checks, SIS sync
- Hosting: local only by request

## Size

Screens 22, flows 7, entities 17. Hard parts: quiz engine with timer and autosave, weighted grade math with what-if, calendar layouts, keeping instructor and student views consistent over one local store. Size: M.
