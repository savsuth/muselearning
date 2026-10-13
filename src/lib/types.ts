export type Role = "student" | "teacher" | "ta";

export interface User {
  id: string;
  name: string;
  pronouns?: string;
  email: string;
  title?: string;
  bio?: string;
  hue: number;
}

export interface Enrollment {
  userId: string;
  courseId: string;
  role: Role;
  section?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  color: string;
  nickname?: string;
  favorite: boolean;
  subtitle: string;
  description: string;
  syllabus: string;
  meets: string;
  room: string;
  credits: number;
  topics: string[];
  outcomes: string[];
  officeHours: string;
}

export interface Module {
  id: string;
  courseId: string;
  name: string;
  position: number;
  published: boolean;
  unlockAt?: string;
  prerequisiteIds: string[];
}

export type ModuleItemType = "assignment" | "quiz" | "page" | "file" | "link" | "header" | "discussion";

export interface ModuleItem {
  id: string;
  moduleId: string;
  type: ModuleItemType;
  refId?: string;
  title: string;
  url?: string;
  position: number;
  published: boolean;
}

export interface AssignmentGroup {
  id: string;
  courseId: string;
  name: string;
  weight: number;
}

export type SubmissionType = "text" | "file" | "url";

export interface RubricRating {
  label: string;
  points: number;
  description?: string;
}

export interface RubricCriterion {
  id: string;
  description: string;
  longDescription?: string;
  points: number;
  ratings: RubricRating[];
}

export interface Assignment {
  id: string;
  courseId: string;
  groupId: string;
  title: string;
  description: string;
  points: number;
  dueAt: string;
  availableFrom?: string;
  availableUntil?: string;
  submissionTypes: SubmissionType[];
  rubric?: RubricCriterion[];
  published: boolean;
}

export interface SubmissionComment {
  id: string;
  authorId: string;
  body: string;
  at: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  body?: string;
  fileName?: string;
  fileSize?: number;
  url?: string;
  submittedAt?: string;
  score?: number;
  gradedAt?: string;
  excused?: boolean;
  rubricScores?: Record<string, number>;
  comments: SubmissionComment[];
  attempt: number;
}

export type QuestionType = "single" | "multi" | "truefalse" | "short" | "numeric";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options?: string[];
  correct: number[] | string[] | number;
  tolerance?: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  groupId: string;
  title: string;
  description: string;
  timeLimitMin?: number;
  attemptsAllowed: number;
  dueAt: string;
  availableFrom?: string;
  questions: QuizQuestion[];
  published: boolean;
}

export type QuizAnswer = number | number[] | string | null;

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, QuizAnswer>;
  flagged: string[];
  startedAt: string;
  submittedAt?: string;
  score?: number;
}

export interface Reply {
  id: string;
  authorId: string;
  body: string;
  at: string;
  likes: string[];
  replies: Reply[];
}

export interface Discussion {
  id: string;
  courseId: string;
  title: string;
  body: string;
  authorId: string;
  postedAt: string;
  pinned: boolean;
  replies: Reply[];
  readBy: string[];
  gradedAssignmentId?: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  body: string;
  authorId: string;
  postedAt: string;
  readBy: string[];
}

export interface Page {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
  frontPage?: boolean;
  published: boolean;
}

export interface CourseFile {
  id: string;
  courseId: string;
  folder: string;
  name: string;
  size: number;
  kind: "pdf" | "doc" | "slides" | "image" | "zip" | "code" | "sheet" | "audio";
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  courseId?: string;
  userId?: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  kind: "lecture" | "lab" | "office" | "exam" | "personal";
}

export interface Message {
  id: string;
  authorId: string;
  body: string;
  at: string;
}

export interface Conversation {
  id: string;
  subject: string;
  participantIds: string[];
  courseId?: string;
  messages: Message[];
  readBy: string[];
  starred: string[];
  archived: string[];
}

export interface Notification {
  id: string;
  userId: string;
  kind: "grade" | "announcement" | "message" | "reply" | "due";
  title: string;
  body: string;
  href: string;
  at: string;
  read: boolean;
}

export type ItemKind = "assignment" | "quiz";

export type WorkStatus = "graded" | "submitted" | "late" | "missing" | "upcoming" | "locked" | "excused";

export interface WorkItem {
  kind: ItemKind;
  id: string;
  courseId: string;
  groupId: string;
  title: string;
  points: number;
  dueAt: string;
  status: WorkStatus;
  score?: number;
  href: string;
}

export interface Data {
  users: User[];
  enrollments: Enrollment[];
  courses: Course[];
  modules: Module[];
  moduleItems: ModuleItem[];
  groups: AssignmentGroup[];
  assignments: Assignment[];
  submissions: Submission[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  discussions: Discussion[];
  announcements: Announcement[];
  pages: Page[];
  files: CourseFile[];
  events: CalendarEvent[];
  conversations: Conversation[];
  notifications: Notification[];
  completedItems: Record<string, string[]>;
  drafts: Record<string, string>;
}
