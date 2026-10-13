# muselearning

A Canvas-inspired learning management demo for exploring courses, completing assignments, taking quizzes, and tracking grades.

## Features

- Five sample courses with student, instructor, and teaching assistant views.
- Modules, assignments, timed quizzes, discussions, and a gradebook.
- What-if grades, a calendar, an inbox, and command palette search.
- Dark mode and browser-saved progress.

## Run locally

Requires Node.js 20.9 or newer and npm. From the project directory:

```bash
npm ci
npm run dev
```

Open http://localhost:3000 and choose a demo persona. Try the student view to explore courses, then switch to the instructor view to manage content and grade work.

## Built with

Next.js, React, TypeScript, Tailwind CSS, Zustand, Motion, and Phosphor icons.

## Demo limits

Uses fictional sample data. Progress stays in this browser's localStorage; there is no backend, real authentication, or cross-device sync. File submissions store names and sizes only.
