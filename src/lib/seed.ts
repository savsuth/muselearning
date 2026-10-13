import type {
  Announcement,
  Assignment,
  AssignmentGroup,
  CalendarEvent,
  Conversation,
  Course,
  CourseFile,
  Data,
  Discussion,
  Enrollment,
  Module,
  ModuleItem,
  Notification,
  Page,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  Reply,
  RubricCriterion,
  Submission,
  User,
} from "./types";

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function at(dayOffset: number, hour = 23, minute = 59) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function weekdayOffset(target: number, weekShift: number) {
  const today = new Date().getDay();
  return target - today + weekShift * 7;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const H = (s: string) => `<h2>${s}</h2>`;
const P = (s: string) => `<p>${s}</p>`;
const UL = (...items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const CODE = (src: string) => `<pre><code>${esc(src.trim())}</code></pre>`;
const TIP = (s: string) => `<blockquote>${s}</blockquote>`;

export const ME = "u-aasav";
export const INSTRUCTOR = "u-okafor";
export const TA = "u-jun";

const users: User[] = [
  { id: ME, name: "Aasav Suthar", pronouns: "he/him", email: "aasav@muse.local", title: "Student", bio: "Computer science major. Usually found near a whiteboard or a terminal.", hue: 352 },
  { id: INSTRUCTOR, name: "Mireille Okafor", pronouns: "she/her", email: "m.okafor@muse.local", title: "Associate Professor of Computer Science", bio: "Researches how people build trust with software. Former product designer and front-end engineer.", hue: 24 },
  { id: TA, name: "Jun Park", pronouns: "he/him", email: "jun.park@muse.local", title: "Teaching Assistant", bio: "Second-year MS in HCI. Office hours Tuesdays and Thursdays.", hue: 200 },
  { id: "u-tomasz", name: "Tomasz Wierzbicki", pronouns: "he/him", email: "t.wierzbicki@muse.local", title: "Professor of Computer Science", bio: "Works on graph algorithms and approximation. Believes every proof deserves a picture.", hue: 220 },
  { id: "u-priya", name: "Priya Raghunathan", pronouns: "she/her", email: "p.raghunathan@muse.local", title: "Assistant Professor of Data Science", bio: "Studies how public data is collected, cleaned and misread.", hue: 280 },
  { id: "u-kwame", name: "Kwame Asante", pronouns: "he/him", email: "k.asante@muse.local", title: "Associate Professor of Machine Learning", bio: "Applied ML for healthcare. Strong opinions about baselines.", hue: 150 },
  { id: "u-sofia", name: "Sofía Benítez", pronouns: "she/her", email: "sofia.b@muse.local", title: "Student", hue: 12 },
  { id: "u-rohan", name: "Rohan Mehta", pronouns: "he/him", email: "rohan.m@muse.local", title: "Student", hue: 40 },
  { id: "u-leilani", name: "Leilani Kahale", pronouns: "she/her", email: "leilani.k@muse.local", title: "Student", hue: 170 },
  { id: "u-theo", name: "Theo Marchetti", pronouns: "he/him", email: "theo.m@muse.local", title: "Student", hue: 60 },
  { id: "u-zara", name: "Zara Haddad", pronouns: "she/her", email: "zara.h@muse.local", title: "Student", hue: 300 },
  { id: "u-mateus", name: "Mateus Oliveira", pronouns: "he/him", email: "mateus.o@muse.local", title: "Student", hue: 120 },
  { id: "u-noor", name: "Noor Aziz", pronouns: "she/her", email: "noor.a@muse.local", title: "Student", hue: 260 },
  { id: "u-felix", name: "Felix Brandt", pronouns: "he/him", email: "felix.b@muse.local", title: "Student", hue: 190 },
  { id: "u-amara", name: "Amara Nwosu", pronouns: "she/her", email: "amara.n@muse.local", title: "Student", hue: 30 },
  { id: "u-kenji", name: "Kenji Watanabe", pronouns: "he/him", email: "kenji.w@muse.local", title: "Student", hue: 210 },
  { id: "u-clara", name: "Clara Dubois", pronouns: "she/her", email: "clara.d@muse.local", title: "Student", hue: 340 },
  { id: "u-yusuf", name: "Yusuf Demir", pronouns: "he/him", email: "yusuf.d@muse.local", title: "Student", hue: 90 },
  { id: "u-maya", name: "Maya Goldberg", pronouns: "she/her", email: "maya.g@muse.local", title: "Student", hue: 0 },
  { id: "u-ines", name: "Ines Varga", pronouns: "she/her", email: "ines.v@muse.local", title: "Student", hue: 230 },
  { id: "u-dev", name: "Dev Kapoor", pronouns: "he/him", email: "dev.k@muse.local", title: "Student", hue: 50 },
];

const classmates = users.filter((u) => u.title === "Student" && u.id !== ME).map((u) => u.id);

type SubType = "text" | "file" | "url";

interface UnitSpec {
  title: string;
  summary: string;
  lesson: string;
  reading: string;
  assignment: { title: string; points: number; brief: string; types?: SubType[]; group?: string };
  discussion?: string;
}

interface CourseSpec {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  color: string;
  teacher: string;
  ta?: string;
  meets: string;
  meetDays: number[];
  meetHour: [number, number, number];
  room: string;
  credits: number;
  officeHours: string;
  description: string;
  topics: string[];
  outcomes: string[];
  groups: { key: string; name: string; weight: number }[];
  units: UnitSpec[];
  quizBank: QuizQuestion[];
  quizTitles: [string, string];
  rubric: "code" | "proof" | "ml" | "design" | "analysis";
  announcements: { title: string; body: string; ago: number }[];
  discussionReplies: string[];
  teacherReply: string;
  resource: { name: string; kind: CourseFile["kind"] };
}

const scale4 = (labels: [string, string, string, string], pts: number) => [
  { label: labels[0], points: pts },
  { label: labels[1], points: Math.round(pts * 0.8) },
  { label: labels[2], points: Math.round(pts * 0.5) },
  { label: labels[3], points: 0 },
];

const rubrics: Record<CourseSpec["rubric"], Omit<RubricCriterion, "id">[]> = {
  code: [
    { description: "Functionality", longDescription: "Every required feature works, including empty and error states.", points: 40, ratings: scale4(["Complete", "Mostly", "Partial", "Missing"], 40) },
    { description: "Code quality", longDescription: "Readable names, small functions, no dead code, sensible structure.", points: 25, ratings: scale4(["Clean", "Readable", "Messy", "Missing"], 25) },
    { description: "Accessibility and UX", longDescription: "Semantic HTML, keyboard access, visible focus, sensible layout on a phone.", points: 20, ratings: scale4(["Strong", "Adequate", "Weak", "Missing"], 20) },
    { description: "README and deployment", longDescription: "Someone else can run it from your README in under five minutes.", points: 15, ratings: scale4(["Clear", "Usable", "Thin", "Missing"], 15) },
  ],
  proof: [
    { description: "Correctness", longDescription: "The algorithm is right and the proof covers every case.", points: 50, ratings: scale4(["Correct", "Minor gaps", "Major gaps", "Incorrect"], 50) },
    { description: "Running time analysis", longDescription: "A tight bound with a justified recurrence or counting argument.", points: 30, ratings: scale4(["Tight", "Loose", "Hand-waved", "Missing"], 30) },
    { description: "Presentation", points: 20, ratings: scale4(["Clear", "Readable", "Hard to follow", "Illegible"], 20) },
  ],
  ml: [
    { description: "Implementation", points: 40, ratings: scale4(["Works", "Mostly works", "Partial", "Missing"], 40) },
    { description: "Evaluation", longDescription: "Proper splits, a baseline and an honest metric.", points: 35, ratings: scale4(["Rigorous", "Adequate", "Weak", "Missing"], 35) },
    { description: "Write-up", points: 25, ratings: scale4(["Clear", "Adequate", "Thin", "Missing"], 25) },
  ],
  design: [
    { description: "Problem framing", longDescription: "States who the design is for and what problem it addresses, with evidence.", points: 25, ratings: scale4(["Exemplary", "Solid", "Developing", "Missing"], 25) },
    { description: "Process and iteration", longDescription: "Shows at least two rounds of iteration and what changed between them.", points: 30, ratings: scale4(["Exemplary", "Solid", "Developing", "Missing"], 30) },
    { description: "Craft", longDescription: "Visual hierarchy, typography, spacing and interaction details.", points: 30, ratings: scale4(["Exemplary", "Solid", "Developing", "Missing"], 30) },
    { description: "Critique and reflection", longDescription: "Names the weakest part of the work and what you would try next.", points: 15, ratings: scale4(["Exemplary", "Solid", "Developing", "Missing"], 15) },
  ],
  analysis: [
    { description: "Data handling", longDescription: "Cleaning steps are documented and reproducible.", points: 30, ratings: scale4(["Careful", "Adequate", "Sloppy", "Missing"], 30) },
    { description: "Analysis", longDescription: "Methods fit the question; assumptions are checked, not assumed.", points: 35, ratings: scale4(["Sound", "Mostly", "Shaky", "Missing"], 35) },
    { description: "Visualization", longDescription: "Every chart answers a question and is honest about scale.", points: 20, ratings: scale4(["Clear", "Adequate", "Misleading", "Missing"], 20) },
    { description: "Communication", points: 15, ratings: scale4(["Clear", "Adequate", "Unclear", "Missing"], 15) },
  ],
};

const courseSpecs: CourseSpec[] = [
  {
    id: "c-web",
    code: "WEB 3200",
    name: "Full-Stack Web Development",
    subtitle: "From semantic HTML to a deployed full-stack app",
    color: "#c4162f",
    teacher: INSTRUCTOR,
    ta: TA,
    meets: "Mon and Wed, 10:30 to 11:50",
    meetDays: [1, 3],
    meetHour: [10, 30, 80],
    room: "Lindell Hall 214",
    credits: 4,
    officeHours: "Wed 13:00 to 14:30, Lindell 3rd floor",
    description: "Build for the web the way professionals do: accessible markup, layout that survives a phone, interactive front ends, REST APIs and a database behind them, shipped to a real URL.",
    topics: ["HTML and CSS", "JavaScript", "React", "Node and Express", "SQL", "Accessibility"],
    outcomes: [
      "Write semantic, accessible HTML and responsive CSS without a framework.",
      "Build interactive interfaces in React with sensible state boundaries.",
      "Design and implement a REST API backed by a relational database.",
      "Deploy a full-stack application and explain its architecture to a reviewer.",
    ],
    groups: [
      { key: "proj", name: "Projects", weight: 40 },
      { key: "lab", name: "Labs", weight: 25 },
      { key: "quiz", name: "Quizzes", weight: 15 },
      { key: "final", name: "Capstone", weight: 20 },
    ],
    units: [
      {
        title: "How the web works",
        summary: "Requests, responses, URLs and the HTML that browsers turn into pages.",
        reading: "MDN, How the web works and HTML basics",
        lesson:
          H("A request, a response") +
          P("Every page load starts with a browser sending an HTTP request and a server answering with a status code, headers and a body. Open your browser's Network tab on any site and read the first request: the method, the URL, the <code>200</code> or <code>304</code> status and the <code>content-type</code> header tell you most of the story.") +
          UL("<strong>2xx</strong> worked, <strong>3xx</strong> look somewhere else, <strong>4xx</strong> you asked for something wrong, <strong>5xx</strong> the server broke.", "GET reads, POST creates, PUT and PATCH change, DELETE removes.", "Headers carry metadata: caching rules, cookies, content types.") +
          H("Markup with meaning") +
          P("HTML describes what content <em>is</em>, not how it looks. A <code>button</code> is focusable and announced as a button for free; a <code>div</code> with a click handler is neither.") +
          CODE(`<header>
  <nav aria-label="Primary">
    <a href="/" aria-current="page">Home</a>
    <a href="/projects">Projects</a>
  </nav>
</header>
<main>
  <article>
    <h1>Hello, web</h1>
    <p>Semantic elements give you accessibility for free.</p>
  </article>
</main>`) +
          TIP("Rule of thumb: if you reach for a div, ask whether header, nav, main, section, article or button already says what you mean."),
        assignment: { group: "lab", title: "Lab 1: Semantic profile page", points: 30, brief: "Build a one-page profile using only HTML. Use landmarks, a heading outline with no skipped levels, a form with labelled inputs, and an image with meaningful alt text. Validate it with the W3C checker and fix every error.", types: ["file", "url"] },
        discussion: "Find a site that gets HTML semantics right, or badly wrong",
      },
      {
        title: "CSS layout that adapts",
        summary: "The box model, flexbox, grid and designing for small screens first.",
        reading: "Every Layout, chapters on the stack and the sidebar",
        lesson:
          H("Every element is a box") +
          P("Width plus padding plus border is what you actually see. Set <code>box-sizing: border-box</code> once and widths start meaning what you expect.") +
          H("Flexbox for one direction, grid for two") +
          P("Use flexbox when items flow along a line and should share space. Use grid when you are placing things in rows <em>and</em> columns.") +
          CODE(`.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1.5rem;
}

@media (min-width: 64rem) {
  .layout { grid-template-columns: 16rem 1fr; }
}`) +
          P("<code>auto-fill</code> with <code>minmax</code> gives you a responsive card grid with zero media queries. Start with the phone layout and add breakpoints only when the content asks for them.") +
          TIP("If you are writing calc(33.33% - 1rem), you probably want grid."),
        assignment: { group: "lab", title: "Lab 2: Responsive grid layout", points: 30, brief: "Recreate the provided dashboard mockup with CSS grid and flexbox. It must work from 320px to 1440px wide with no horizontal scrolling, and use at most two media queries.", types: ["url"] },
      },
      {
        title: "JavaScript and the DOM",
        summary: "Events, the event loop, and fetching data without freezing the page.",
        reading: "Eloquent JavaScript, chapters 11 and 15",
        lesson:
          H("The page is a tree you can change") +
          P("The DOM is a live tree of objects. You find a node, listen for an event, and update the tree in response. Keep those three steps separate and your code stays readable.") +
          H("Async without the pain") +
          P("Network calls take time. <code>async</code> and <code>await</code> let you write them top to bottom while the browser keeps responding to the user.") +
          CODE(`async function loadCourses() {
  const status = document.querySelector("#status");
  status.textContent = "Loading…";
  try {
    const res = await fetch("/api/courses");
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const courses = await res.json();
    render(courses);
    status.textContent = "";
  } catch (err) {
    status.textContent = "Could not load courses. Try again.";
  }
}`) +
          TIP("Always design three states for anything that loads: loading, empty and error. The happy path is the easy one."),
        assignment: { group: "proj", title: "Project 1: Interactive study timer", points: 80, brief: "Build a study timer in vanilla JavaScript: start, pause and reset, a list of completed sessions saved to localStorage, and keyboard shortcuts for every action. No frameworks.", types: ["url"] },
      },
      {
        title: "React fundamentals",
        summary: "Components, props, state and deciding where state should live.",
        reading: "react.dev, Thinking in React and Managing State",
        lesson:
          H("UI as a function of state") +
          P("A React component takes props and returns what the screen should look like. When state changes, React re-renders and reconciles the difference for you.") +
          CODE(`function Counter({ step = 1 }) {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + step)}>
      Clicked {count} {count === 1 ? "time" : "times"}
    </button>
  );
}`) +
          H("Where should state live?") +
          UL("Keep state as close as possible to where it is used.", "Lift it up only when two siblings need the same value.", "Derive what you can instead of storing it twice.") +
          TIP("If you are syncing two pieces of state with an effect, one of them is probably derived."),
        assignment: { group: "lab", title: "Lab 3: Component library", points: 30, brief: "Build Button, Input, Modal and Tabs components with full keyboard support. Each needs at least two variants and a short usage example.", types: ["url", "file"] },
      },
      {
        title: "Building REST APIs",
        summary: "Node and Express, resource design, validation and status codes.",
        reading: "Express guide, Routing and Error handling",
        lesson:
          H("Resources, not actions") +
          P("A good REST API names nouns and lets HTTP verbs carry the action: <code>GET /books</code>, <code>POST /books</code>, <code>PATCH /books/42</code>.") +
          CODE(`app.post("/api/books", async (req, res) => {
  const { title, author } = req.body ?? {};
  if (!title || !author) {
    return res.status(400).json({ error: "title and author are required" });
  }
  const book = await db.books.create({ title, author });
  res.status(201).location(\`/api/books/\${book.id}\`).json(book);
});`) +
          P("Validate at the edge, return the right status code, and send errors the client can act on. A <code>500</code> with no body helps nobody.") +
          TIP("Treat every request body as hostile until you have validated it."),
        assignment: { group: "proj", title: "Project 2: Reading list API", points: 100, brief: "Implement a REST API for a personal reading list with full CRUD, validation, pagination and consistent error responses. Include a test file that exercises every route.", types: ["url"] },
        discussion: "PUT or PATCH: when does the difference actually matter?",
      },
      {
        title: "Data and persistence",
        summary: "Relational modeling, SQL joins, indexes and authentication basics.",
        reading: "Use The Index, Luke, chapter 1",
        lesson:
          H("Model the data before the screens") +
          P("Tables hold things; foreign keys hold relationships. A reading list is users, books and a join table that says who saved what.") +
          CODE(`SELECT b.title, b.author, s.saved_at
FROM saves s
JOIN books b ON b.id = s.book_id
WHERE s.user_id = $1
ORDER BY s.saved_at DESC
LIMIT 20;`) +
          P("Every column you filter or sort on is an index candidate. Use parameterized queries like <code>$1</code>, never string concatenation, to keep SQL injection out.") +
          TIP("Store password hashes from a slow algorithm like bcrypt or argon2. Never the password, never a fast hash."),
        assignment: { group: "lab", title: "Lab 4: Persist and query", points: 30, brief: "Move the reading list API onto Postgres. Write the schema, a migration, and three queries with an EXPLAIN plan for each.", types: ["file", "url"] },
      },
      {
        title: "Ship it",
        summary: "Performance, accessibility audits, deployment and the capstone.",
        reading: "web.dev, Core Web Vitals overview",
        lesson:
          H("Fast and usable for everyone") +
          UL("<strong>LCP</strong> under 2.5s: the main content shows up quickly.", "<strong>INP</strong> under 200ms: taps and clicks respond fast.", "<strong>CLS</strong> under 0.1: nothing jumps around while loading.") +
          P("Run Lighthouse and an axe accessibility scan, then test with only a keyboard and with a screen reader for five minutes. You will find things no tool catches.") +
          H("Deploy like you mean it") +
          P("Environment variables for secrets, a README that gets a stranger running in five minutes, and a health check route you can hit after every deploy.") +
          TIP("Your capstone is graded by someone who has never seen it. Write the README for them."),
        assignment: { group: "final", title: "Full-stack capstone", points: 150, brief: "Ship a full-stack app of your own design: React front end, REST API, database, authentication and a public URL. Include a design note and a two-minute walkthrough video.", types: ["url", "file"] },
      },
    ],
    quizBank: [
      { id: "q1", type: "single", prompt: "Which status code means the resource was created?", points: 1, options: ["200", "201", "204", "301"], correct: [1], explanation: "201 Created, ideally with a Location header pointing at the new resource." },
      { id: "q2", type: "truefalse", prompt: "A div with an onClick handler is keyboard accessible by default.", points: 1, options: ["True", "False"], correct: [1], explanation: "It is not focusable and has no role. Use a button." },
      { id: "q3", type: "multi", prompt: "Which are semantic landmark elements? Select all that apply.", points: 3, options: ["nav", "main", "span", "header"], correct: [0, 1, 3] },
      { id: "q4", type: "short", prompt: "Which CSS property makes width include padding and border? Give the property name.", points: 2, correct: ["box-sizing", "box-sizing: border-box"], explanation: "box-sizing: border-box." },
      { id: "q5", type: "single", prompt: "For a layout with both rows and columns, the better tool is usually:", points: 1, options: ["Flexbox", "Grid", "Floats", "Tables"], correct: [1] },
      { id: "q6", type: "single", prompt: "In React, the right place for state that two sibling components both need is:", points: 2, options: ["Each sibling keeps its own copy", "Their closest common parent", "A global variable", "localStorage"], correct: [1], explanation: "Lift state to the closest common parent and pass it down." },
      { id: "q7", type: "numeric", prompt: "What is the Core Web Vitals target for INP, in milliseconds?", points: 2, correct: 200, tolerance: 0 },
      { id: "q8", type: "truefalse", prompt: "Parameterized queries help prevent SQL injection.", points: 1, options: ["True", "False"], correct: [0] },
      { id: "q9", type: "single", prompt: "Which HTTP method is meant for partial updates?", points: 1, options: ["GET", "PUT", "PATCH", "POST"], correct: [2] },
      { id: "q10", type: "multi", prompt: "Which states should you design for anything that loads data?", points: 3, options: ["Loading", "Empty", "Error", "Hover only"], correct: [0, 1, 2] },
    ],
    quizTitles: ["Quiz 1: HTML, CSS and HTTP", "Quiz 2: React, APIs and shipping"],
    rubric: "code",
    announcements: [
      { title: "Project 2 starter repo is live", body: "<p>The starter for the reading list API is in Files under Resources. It includes a test runner and one passing test so you can see the pattern. Fork it, do not clone mine directly.</p>", ago: 1 },
      { title: "Guest talk: shipping accessible products", body: "<p>Ana Ruiz, accessibility lead on a transit app used by two million riders, joins us Wednesday. Bring one screen from your Project 1 you are not sure about.</p>", ago: 5 },
      { title: "Welcome to Full-Stack Web Development", body: "<p>Welcome. We build something every week and ship it. Read the syllabus, set up Node 20 and a code editor, and say hello in the Q&amp;A discussion.</p>", ago: 40 },
    ],
    discussionReplies: [
      "The GOV.UK site. Every page has one h1, real landmarks, and forms where every input has a visible label. Screen readers love it.",
      "Bad example: my bank's login uses divs for buttons. Tab skips the sign-in button entirely, so keyboard users cannot log in.",
      "A recipe site I use has the whole recipe inside one giant paragraph with br tags. No list semantics at all, so you cannot jump between steps.",
      "Wikipedia is surprisingly good: proper heading outline, skip link, and tables with real header cells.",
    ],
    teacherReply: "Great find. Notice how the accessible version also ends up easier to style and test. Semantics pay rent in more than one way.",
    resource: { name: "reading-list-api-starter.zip", kind: "zip" },
  },
  {
    id: "c-alg",
    code: "ALG 3100",
    name: "Algorithms and Data Structures",
    subtitle: "Design, prove and analyze the algorithms behind everything",
    color: "#1f5fa8",
    teacher: "u-tomasz",
    meets: "Tue and Thu, 13:35 to 15:15",
    meetDays: [2, 4],
    meetHour: [13, 35, 100],
    room: "Halvorsen 120",
    credits: 4,
    officeHours: "Thu 15:30 to 17:00, Halvorsen 302",
    description: "How to design algorithms, prove they are correct, and know how fast they are before you run them. Divide and conquer, graphs, greedy methods, dynamic programming and the limits of efficient computation.",
    topics: ["Asymptotics", "Divide and conquer", "Graphs", "Greedy", "Dynamic programming", "NP-completeness"],
    outcomes: [
      "Analyze running time with asymptotic notation and recurrences.",
      "Choose and adapt classic algorithms for sorting, searching and graphs.",
      "Prove correctness with invariants, induction and exchange arguments.",
      "Recognize problems that are unlikely to have efficient solutions.",
    ],
    groups: [
      { key: "hw", name: "Problem sets", weight: 30 },
      { key: "quiz", name: "Quizzes", weight: 15 },
      { key: "exam", name: "Exams", weight: 55 },
    ],
    units: [
      {
        title: "Asymptotic analysis",
        summary: "Big O, Omega and Theta, and why constants stop mattering.",
        reading: "CLRS, chapter 3",
        lesson:
          H("Count steps, not seconds") +
          P("We measure algorithms by how the number of basic steps grows with input size <em>n</em>. Hardware changes the constants; growth rate is what survives.") +
          CODE(`def binary_search(xs, target):
    lo, hi = 0, len(xs) - 1
    while lo <= hi:            # the range halves every iteration
        mid = (lo + hi) // 2
        if xs[mid] == target:
            return mid
        if xs[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1                  # O(log n) comparisons`) +
          UL("<strong>O</strong>: an upper bound on growth.", "<strong>Ω</strong>: a lower bound.", "<strong>Θ</strong>: both at once, a tight bound.") +
          TIP("log n grows so slowly that searching a billion sorted items takes about 30 comparisons."),
        assignment: { title: "Problem set 1: Growth rates", points: 40, brief: "Rank twelve functions by growth rate, prove three of the comparisons from the definition, and analyze four loops including one with a data-dependent bound." },
      },
      {
        title: "Divide and conquer",
        summary: "Split, solve, combine, and the master theorem for recurrences.",
        reading: "CLRS, chapter 4",
        lesson:
          H("Split, solve, combine") +
          P("Merge sort splits the array in half, sorts each half recursively and merges them in linear time. That gives the recurrence T(n) = 2T(n/2) + O(n).") +
          CODE(`def merge_sort(xs):
    if len(xs) <= 1:
        return xs
    mid = len(xs) // 2
    left, right = merge_sort(xs[:mid]), merge_sort(xs[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    return out + left[i:] + right[j:]`) +
          H("The master theorem") +
          P("For T(n) = aT(n/b) + f(n), compare f(n) with n<sup>log_b a</sup>. Merge sort has a = b = 2, so n<sup>1</sup> matches f(n) = n and the answer is Θ(n log n).") +
          TIP("Draw the recursion tree first. The master theorem is just a shortcut for summing it."),
        assignment: { title: "Problem set 2: Recurrences", points: 40, brief: "Solve six recurrences with the master theorem or a recursion tree, then design and analyze a divide and conquer algorithm for counting inversions." },
        discussion: "Explain recursion to someone who has never programmed",
      },
      {
        title: "Sorting and selection",
        summary: "Quicksort, the comparison lower bound and linear-time selection.",
        reading: "CLRS, chapters 7 to 9",
        lesson:
          H("Why n log n is the floor") +
          P("Any comparison sort can be drawn as a decision tree with at least n! leaves. A binary tree with that many leaves has height at least log(n!), which is Ω(n log n).") +
          H("Beating the bound") +
          P("Counting sort and radix sort avoid comparisons by using the values themselves, so they can run in linear time when keys are small integers.") +
          TIP("Randomized quicksort is O(n log n) in expectation for every input. The randomness is in the algorithm, not the data."),
        assignment: { title: "Midterm exam", points: 100, brief: "In-class exam covering units 1 to 3. One page of handwritten notes allowed." },
      },
      {
        title: "Graph traversal",
        summary: "BFS, DFS, topological order and connected components.",
        reading: "Kleinberg and Tardos, chapter 3",
        lesson:
          H("Two ways to explore") +
          P("Breadth-first search explores in layers and finds shortest paths in unweighted graphs. Depth-first search dives deep and is the backbone of cycle detection and topological sorting.") +
          CODE(`from collections import deque

def bfs(graph, start):
    dist = {start: 0}
    queue = deque([start])
    while queue:
        u = queue.popleft()
        for v in graph[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                queue.append(v)
    return dist                # O(V + E)`) +
          TIP("Course prerequisites are a directed acyclic graph. A topological order is a valid semester plan."),
        assignment: { title: "Problem set 3: Graph traversal", points: 40, brief: "Prove BFS computes shortest paths, find strongly connected components by hand on the given graph, and design an algorithm to detect whether a course plan is possible." },
      },
      {
        title: "Shortest paths and spanning trees",
        summary: "Dijkstra, Bellman-Ford, Prim and Kruskal.",
        reading: "CLRS, chapters 21 to 24",
        lesson:
          H("Greedy, with proof") +
          P("Dijkstra's algorithm repeatedly finalizes the closest unvisited vertex. It is correct because, with non-negative weights, no later path can come back and be shorter.") +
          CODE(`import heapq

def dijkstra(graph, s):
    dist = {s: 0}
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist.get(v, float("inf")):
                dist[v] = d + w
                heapq.heappush(pq, (dist[v], v))
    return dist                # O((V + E) log V)`) +
          TIP("One negative edge breaks Dijkstra. Bellman-Ford handles negatives and detects negative cycles, at O(VE)."),
        assignment: { title: "Problem set 4: Dijkstra and Kruskal", points: 40, brief: "Trace Dijkstra on the given network, prove the cut property for minimum spanning trees, and adapt Kruskal to find a maximum spanning tree." },
      },
      {
        title: "Dynamic programming",
        summary: "Overlapping subproblems, memoization and building tables bottom-up.",
        reading: "Kleinberg and Tardos, chapter 6",
        lesson:
          H("Remember what you already solved") +
          P("When a recursive solution solves the same subproblem many times, store the answers. Define the subproblem precisely, write the recurrence, then fill a table in the right order.") +
          CODE(`def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1,       # delete
                           dp[i][j - 1] + 1,       # insert
                           dp[i - 1][j - 1] + cost) # replace
    return dp[m][n]            # O(mn)`) +
          TIP("Most DP bugs are in the subproblem definition, not the code. Write it in one English sentence first."),
        assignment: { title: "Problem set 5: Dynamic programming", points: 40, brief: "Solve weighted interval scheduling, longest increasing subsequence and a knapsack variant. For each, state the subproblem, the recurrence and the fill order." },
        discussion: "Which dynamic programming problem finally made it click for you?",
      },
      {
        title: "Intractability",
        summary: "P, NP, reductions and what to do when no fast algorithm exists.",
        reading: "Kleinberg and Tardos, chapter 8",
        lesson:
          H("Reductions") +
          P("To show a problem B is hard, reduce a known hard problem A to it: if you could solve B quickly, you could solve A quickly. Thousands of problems, from scheduling to Sudoku, are equivalent in this sense.") +
          UL("<strong>P</strong>: solvable in polynomial time.", "<strong>NP</strong>: a proposed answer can be checked in polynomial time.", "<strong>NP-complete</strong>: in NP, and every NP problem reduces to it.") +
          TIP("Hard in general does not mean hopeless in practice. Approximation, heuristics and small inputs all help."),
        assignment: { title: "Final exam", points: 150, brief: "Cumulative final. Two pages of handwritten notes allowed." },
      },
    ],
    quizBank: [
      { id: "q1", type: "single", prompt: "Binary search on a sorted array of n items takes:", points: 1, options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correct: [1] },
      { id: "q2", type: "single", prompt: "By the master theorem, T(n) = 2T(n/2) + n solves to:", points: 2, options: ["Θ(n)", "Θ(n log n)", "Θ(n²)", "Θ(log n)"], correct: [1] },
      { id: "q3", type: "truefalse", prompt: "Any comparison-based sort needs Ω(n log n) comparisons in the worst case.", points: 1, options: ["True", "False"], correct: [0], explanation: "The decision tree argument: log(n!) is Θ(n log n)." },
      { id: "q4", type: "numeric", prompt: "About how many comparisons does binary search need for one billion sorted items? Round to the nearest whole number.", points: 2, correct: 30, tolerance: 1, explanation: "log₂(10⁹) is about 29.9." },
      { id: "q5", type: "multi", prompt: "Which algorithms run in O(V + E)? Select all that apply.", points: 3, options: ["Breadth-first search", "Depth-first search", "Bellman-Ford", "Topological sort"], correct: [0, 1, 3], explanation: "Bellman-Ford is O(VE)." },
      { id: "q6", type: "truefalse", prompt: "Dijkstra's algorithm is correct even with negative edge weights.", points: 1, options: ["True", "False"], correct: [1] },
      { id: "q7", type: "single", prompt: "The edit distance DP between strings of length m and n runs in:", points: 2, options: ["O(m + n)", "O(mn)", "O(2ⁿ)", "O(n log m)"], correct: [1] },
      { id: "q8", type: "short", prompt: "Storing results of subproblems so a recursive function does not recompute them is called ____.", points: 1, correct: ["memoization", "memoisation", "memoizing"] },
      { id: "q9", type: "single", prompt: "To prove problem B is NP-hard, you reduce:", points: 2, options: ["B to a known NP-hard problem", "A known NP-hard problem to B", "B to a problem in P", "Nothing; you run experiments"], correct: [1] },
      { id: "q10", type: "truefalse", prompt: "Every problem in P is also in NP.", points: 1, options: ["True", "False"], correct: [0] },
    ],
    quizTitles: ["Quiz 1: Analysis and divide and conquer", "Quiz 2: Graphs and dynamic programming"],
    rubric: "proof",
    announcements: [
      { title: "Problem set 5 hint", body: "<p>For the knapsack variant, your subproblem needs two indices, not one. Write the English sentence for dp[i][w] before writing any code.</p>", ago: 2 },
      { title: "Midterm grades released", body: "<p>Midterms are graded. The median was 81. Regrade requests close one week from today and must be written on paper.</p>", ago: 9 },
      { title: "Welcome to Algorithms", body: "<p>Welcome. Bring paper to every lecture; we prove things by hand. Problem sets are due Thursdays and should be typeset, LaTeX or Markdown with math both work.</p>", ago: 40 },
    ],
    discussionReplies: [
      "It is like a set of nesting dolls. To open the big one you open the next one, until you hit the smallest doll that does not open. Then you work your way back out.",
      "I explained it as looking up a word in a dictionary, where the definition uses another word you also have to look up, until you reach one you already know.",
      "Nesting dolls is nice, but I think the key part people miss is the base case. Without the smallest doll you never stop opening.",
      "Edit distance made it click for me once I drew the grid and filled it in by hand for 'kitten' and 'sitting'.",
    ],
    teacherReply: "Lovely. Notice everyone's analogy has a base case. That is the part students forget on exams, so underline it.",
    resource: { name: "problem-set-template.tex", kind: "code" },
  },
  {
    id: "c-ml",
    code: "AIML 4100",
    name: "Machine Learning",
    subtitle: "Models that generalize, and the evidence that they do",
    color: "#0f7a63",
    teacher: "u-kwame",
    meets: "Mon and Thu, 16:00 to 17:20",
    meetDays: [1, 4],
    meetHour: [16, 0, 80],
    room: "Kessler Lab B",
    credits: 4,
    officeHours: "Mon 14:00 to 15:30, Kessler 410",
    description: "Supervised learning in practice: data splits, baselines, linear models, trees, neural networks and the evaluation habits that keep you honest. Every lab ends with a model you would be willing to defend.",
    topics: ["Baselines", "Regularization", "Classification", "Ensembles", "Evaluation", "Neural networks"],
    outcomes: [
      "Set up honest train, validation and test splits without leakage.",
      "Fit, tune and interpret linear, tree-based and neural models.",
      "Choose metrics that match the real cost of mistakes.",
      "Write up results so a skeptical reader can reproduce them.",
    ],
    groups: [
      { key: "lab", name: "Labs", weight: 30 },
      { key: "proj", name: "Project", weight: 40 },
      { key: "quiz", name: "Quizzes", weight: 30 },
    ],
    units: [
      {
        title: "Baselines first",
        summary: "Train and test splits, leakage, and why a dumb baseline is your best friend.",
        reading: "Course notes 1",
        lesson:
          H("Beat something simple first") +
          P("Before any model, predict the mean (regression) or the most common class (classification). If your model cannot beat that, nothing else in your report matters.") +
          CODE(`from sklearn.model_selection import train_test_split
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_squared_error

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
baseline = DummyRegressor(strategy="mean").fit(X_train, y_train)
rmse = mean_squared_error(y_test, baseline.predict(X_test)) ** 0.5
print(f"Baseline RMSE: {rmse:.2f}")`) +
          TIP("Leakage is any information about the test set sneaking into training. Fit every scaler and encoder on training data only."),
        assignment: { group: "lab", title: "Lab 1: Beat the baseline", points: 30, brief: "Given the housing dataset, build a mean predictor and a linear model. Report RMSE on a held-out set and explain any leakage you found.", types: ["file", "url"] },
      },
      {
        title: "Linear models and regularization",
        summary: "Least squares, ridge, lasso and reading coefficients carefully.",
        reading: "ISLR, chapters 3 and 6",
        lesson:
          H("Shrink to generalize") +
          P("Ridge adds a penalty on the squared size of the coefficients; lasso penalizes their absolute size and can set some to exactly zero. Both trade a little bias for a lot less variance.") +
          CODE(`from sklearn.linear_model import LassoCV
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

model = make_pipeline(StandardScaler(), LassoCV(cv=5)).fit(X_train, y_train)
print("chosen alpha:", model[-1].alpha_)`) +
          TIP("Scale features before regularizing. Otherwise the penalty punishes features for their units, not their usefulness."),
        assignment: { group: "lab", title: "Lab 2: Ridge and lasso", points: 30, brief: "Fit ridge and lasso across a range of alphas. Plot the coefficient paths and pick alpha with cross-validation.", types: ["file", "url"] },
        discussion: "Share the worst data leakage you have seen, or caused",
      },
      {
        title: "Classification",
        summary: "Logistic regression, decision boundaries and probability calibration.",
        reading: "ISLR, chapter 4",
        lesson:
          H("Probabilities, then decisions") +
          P("Logistic regression outputs a probability. The threshold you pick turns it into a decision, and that threshold should depend on what a false positive and a false negative actually cost.") +
          CODE(`import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def log_loss(y, p, eps=1e-12):
    p = np.clip(p, eps, 1 - eps)
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))`) +
          TIP("A model can rank well and still be badly calibrated. Check a reliability plot before trusting its probabilities."),
        assignment: { group: "lab", title: "Lab 3: Logistic regression from scratch", points: 30, brief: "Implement logistic regression with gradient descent in NumPy, compare it with scikit-learn, and choose a threshold for the given cost matrix.", types: ["file", "url"] },
      },
      {
        title: "Trees and ensembles",
        summary: "Decision trees, random forests and gradient boosting.",
        reading: "ISLR, chapter 8",
        lesson:
          H("Many weak learners") +
          P("A single deep tree overfits. Random forests average many trees trained on bootstrap samples; gradient boosting adds shallow trees one at a time, each fixing the last one's errors.") +
          CODE(`from sklearn.ensemble import HistGradientBoostingClassifier

clf = HistGradientBoostingClassifier(
    learning_rate=0.05, max_depth=4, early_stopping=True, random_state=0
).fit(X_train, y_train)`) +
          TIP("Lower learning rate plus early stopping beats a high learning rate with a fixed number of trees almost every time."),
        assignment: { group: "lab", title: "Lab 4: Gradient boosting", points: 30, brief: "Tune a gradient boosted model on the churn dataset. Compare it with your best linear model and explain the gap with an error analysis.", types: ["file", "url"] },
      },
      {
        title: "Evaluation that holds up",
        summary: "Metrics, cross-validation, imbalanced data and error analysis.",
        reading: "Course notes 5",
        lesson:
          H("Accuracy lies on imbalanced data") +
          P("With 1% positives, always predicting negative scores 99% accuracy and catches nothing. Use precision, recall and the precision-recall curve instead.") +
          UL("<strong>Precision</strong>: of the ones we flagged, how many were right.", "<strong>Recall</strong>: of the ones that mattered, how many we caught.", "<strong>F1</strong>: their harmonic mean, when you need one number.") +
          TIP("Read fifty of your model's mistakes by hand. It is the highest-value hour in any project."),
        assignment: { group: "proj", title: "Project proposal", points: 40, brief: "One page: the question, the data, the baseline, the metric and what would make the project a failure.", types: ["text", "file"] },
      },
      {
        title: "Neural networks",
        summary: "MLPs, backpropagation and when deep learning is worth it.",
        reading: "Goodfellow et al., chapter 6",
        lesson:
          H("Layers of learned features") +
          P("A multilayer perceptron stacks linear layers with non-linear activations. Backpropagation is the chain rule, applied efficiently from the loss back to every weight.") +
          CODE(`import torch.nn as nn

model = nn.Sequential(
    nn.Linear(20, 64), nn.ReLU(),
    nn.Linear(64, 32), nn.ReLU(),
    nn.Linear(32, 1),
)`) +
          TIP("On small tabular data, gradient boosting often beats a neural net. Try both and let the validation set decide."),
        assignment: { group: "lab", title: "Lab 5: An MLP in PyTorch", points: 30, brief: "Train an MLP on the provided tabular dataset, plot learning curves, and compare it fairly with your gradient boosting model from Lab 4.", types: ["file", "url"] },
      },
      {
        title: "Responsible ML and deployment",
        summary: "Monitoring, drift, fairness checks and the final project.",
        reading: "Course notes 7",
        lesson:
          H("A model is a product, not a notebook") +
          UL("Log inputs and predictions so you can audit later.", "Watch for drift: the world changes after you train.", "Check performance across groups, not only overall.") +
          TIP("Write the model card before you deploy: intended use, data, metrics, limitations."),
        assignment: { group: "proj", title: "Final project report", points: 150, brief: "A full report with code. Include an error analysis section with at least ten examined failures and a one-page model card.", types: ["file", "url"] },
      },
    ],
    quizBank: [
      { id: "q1", type: "single", prompt: "You standardize features using the full dataset before splitting. This is:", points: 2, options: ["Fine, it is just scaling", "Data leakage", "Regularization", "Required for trees"], correct: [1], explanation: "Test statistics leak into training. Fit the scaler on training data only." },
      { id: "q2", type: "truefalse", prompt: "Lasso can set coefficients exactly to zero.", points: 1, options: ["True", "False"], correct: [0] },
      { id: "q3", type: "numeric", prompt: "A classifier has 90 true positives and 10 false negatives. What is its recall, as a percentage?", points: 2, correct: 90, tolerance: 0.5 },
      { id: "q4", type: "multi", prompt: "Which help reduce overfitting in gradient boosting?", points: 3, options: ["Lower learning rate", "Unlimited tree depth", "Subsampling rows", "Early stopping"], correct: [0, 2, 3] },
      { id: "q5", type: "single", prompt: "On data with 1% positives, always predicting negative gives accuracy of:", points: 1, options: ["1%", "50%", "99%", "Undefined"], correct: [2] },
      { id: "q6", type: "short", prompt: "The harmonic mean of precision and recall is the F__ score. Fill in the number.", points: 1, correct: ["1", "one"] },
      { id: "q7", type: "truefalse", prompt: "Random forest trees are trained on bootstrap samples of the training data.", points: 1, options: ["True", "False"], correct: [0] },
      { id: "q8", type: "single", prompt: "Backpropagation is an efficient application of:", points: 1, options: ["Bayes' rule", "The chain rule", "Gradient boosting", "Cross-validation"], correct: [1] },
      { id: "q9", type: "single", prompt: "Why scale features before ridge regression?", points: 2, options: ["It is faster", "So the penalty does not depend on units", "Ridge needs integers", "To remove outliers"], correct: [1] },
      { id: "q10", type: "multi", prompt: "Which belong in a model card?", points: 3, options: ["Intended use", "Training data description", "Known limitations", "The team's favorite hyperparameters"], correct: [0, 1, 2] },
    ],
    quizTitles: ["Quiz 1: Baselines and linear models", "Quiz 2: Ensembles, evaluation and networks"],
    rubric: "ml",
    announcements: [
      { title: "GPU credits for final projects", body: "<p>Each team can request 40 GPU hours on the lab cluster. Do not burn them on sweeps you have not sanity-checked on CPU first.</p>", ago: 2 },
      { title: "Lab 4 dataset updated", body: "<p>We removed a duplicated customer ID column that leaked the label. If you downloaded before Tuesday, download again.</p>", ago: 8 },
    ],
    discussionReplies: [
      "We once shuffled time series data before splitting. Ninety-eight percent accuracy on a stock direction model. It was predicting yesterday.",
      "Patient IDs in a medical imaging set. The same patient's scans were in train and test, so the model learned the patient, not the disease.",
      "Target encoding computed on the full dataset before cross-validation. Felt clever until the leaderboard dropped twenty points.",
    ],
    teacherReply: "Classic. Notice that every one of these looked like a great result first. Suspiciously good numbers are a bug report.",
    resource: { name: "lab-starter-notebooks.zip", kind: "zip" },
  },
  {
    id: "c-hci",
    code: "HCI 3400",
    name: "Human-Computer Interaction",
    subtitle: "Research, prototype and test interfaces people can actually use",
    color: "#7a3fb0",
    teacher: INSTRUCTOR,
    ta: TA,
    meets: "Tue and Thu, 11:00 to 12:20",
    meetDays: [2, 4],
    meetHour: [11, 0, 80],
    room: "Lindell Hall 108",
    credits: 4,
    officeHours: "Tue 15:00 to 16:30 with Jun Park, Lindell 3rd floor",
    description: "A studio course on designing interactive systems around people: observation, interviews, prototyping, usability testing, accessibility and the craft of interface detail.",
    topics: ["User research", "Prototyping", "Usability testing", "Visual design", "Accessibility", "Critique"],
    outcomes: [
      "Plan and run interviews and observations that change design decisions.",
      "Prototype at the right fidelity and test with real people.",
      "Apply perception, hierarchy and accessibility principles to interface craft.",
      "Give and receive critique that improves the work.",
    ],
    groups: [
      { key: "proj", name: "Studio projects", weight: 50 },
      { key: "crit", name: "Critiques and reflections", weight: 20 },
      { key: "quiz", name: "Quizzes", weight: 15 },
      { key: "part", name: "Participation", weight: 15 },
    ],
    units: [
      {
        title: "Seeing like a designer",
        summary: "Observation, affordances, signifiers and the gulfs of execution and evaluation.",
        reading: "Norman, The Design of Everyday Things, chapter 1",
        lesson:
          H("Affordances and signifiers") +
          P("An affordance is what an object lets you do; a signifier tells you where and how. A flat plate on a door says push. A handle says pull. When the two disagree, people bump into glass.") +
          H("Two gulfs") +
          UL("<strong>Execution</strong>: can people figure out how to do what they want?", "<strong>Evaluation</strong>: can they tell whether it worked?") +
          TIP("This week, keep a log of every moment you hesitate in front of an interface. Each one is a design problem someone left for you."),
        assignment: { title: "Field study: a badly designed thing", points: 50, brief: "Find an object or interface on campus that people struggle with. Observe five people using it, photograph the moments of hesitation, and write up what it communicates versus what it should." },
        discussion: "What is the most confusing door you have ever met?",
      },
      {
        title: "Research that changes decisions",
        summary: "Interviews, affinity mapping and design principles.",
        reading: "Portigal, Interviewing Users, chapters 3 and 5",
        lesson:
          H("Ask about the past, not the future") +
          P("People are poor predictors of their own behavior. Ask them to walk you through the last time they did the thing, not whether they would use your idea.") +
          UL("Tell me about the last time you...", "What happened next?", "What was frustrating about that?") +
          TIP("If your synthesis would not change a single product decision, it is a summary, not research."),
        assignment: { group: "crit", title: "Interview synthesis board", points: 80, brief: "Run three interviews with people who plan meals for a household. Synthesize into an affinity board and derive three design principles that would change a product decision.", types: ["file", "url"] },
      },
      {
        title: "Paper to pixels",
        summary: "Sketching, storyboards and low-fidelity prototypes.",
        reading: "Buxton, Sketching User Experiences, selected pages",
        lesson:
          H("Cheap to make, cheap to throw away") +
          P("A sketch invites critique because it looks unfinished. Ten rough ideas teach you more than one polished one. Paper prototypes let you test flow before you have pixels to be precious about.") +
          TIP("Fidelity should match the question. Testing a flow? Paper. Testing motion or trust? Higher fidelity."),
        assignment: { title: "Paper prototype and test", points: 100, brief: "Build a paper prototype of the meal-planning concept from Unit 2. Test it with three people and document what broke.", types: ["file"] },
      },
      {
        title: "Usability testing",
        summary: "Task design, think-aloud protocol and severity ratings.",
        reading: "Krug, Rocket Surgery Made Easy, chapters 4 to 8",
        lesson:
          H("Watch, do not help") +
          P("Give a realistic task, ask the participant to think aloud, and stay quiet when they struggle. Their confusion is your data. Afterwards, ask what they expected to happen.") +
          UL("Five participants find most of the serious problems.", "Rate each issue by severity: frequency, impact and persistence.", "Fix the worst three, then test again.") +
          TIP("Never explain the prototype before the test. You will remove the very confusion you came to observe."),
        assignment: { group: "crit", title: "Usability test report", points: 60, brief: "Write three tasks, run five think-aloud sessions on your prototype, and report the top issues with severity ratings and quotes as evidence.", types: ["file", "url"] },
      },
      {
        title: "Hierarchy, type and space",
        summary: "Visual hierarchy, typographic scale and the grid.",
        reading: "Lupton, Thinking with Type, Grid chapter",
        lesson:
          H("What do people see first?") +
          P("Size, weight, color, position and space decide reading order. Change one variable at a time and you can steer attention precisely.") +
          P("A modular type scale with a ratio of 1.25 from 16px gives 16, 20, 25, 31 and 39px. Use fewer sizes, more consistently.") +
          TIP("Squint at your screen. Whatever still stands out is your real hierarchy."),
        assignment: { title: "Type and hierarchy studies", points: 60, brief: "Set the same content three ways: dense, editorial and playful. For each, write two sentences on what the hierarchy tells the reader first.", types: ["file"] },
      },
      {
        title: "Designing for everyone",
        summary: "Accessibility, WCAG, assistive technology and inclusive design.",
        reading: "W3C, WCAG 2.2 at a glance",
        lesson:
          H("Perceivable, operable, understandable, robust") +
          UL("Text contrast of at least 4.5:1 for body copy.", "Everything works with a keyboard, with visible focus.", "Labels and errors are clear and programmatically connected.", "Motion respects reduced-motion preferences.") +
          P("Accessibility is not an extra feature. Captions help in loud rooms, keyboard access helps power users, clear language helps everyone tired at midnight.") +
          TIP("Spend ten minutes using your prototype with only a keyboard and a screen reader. Write down every surprise."),
        assignment: { group: "crit", title: "Accessibility audit", points: 50, brief: "Audit your prototype against ten WCAG success criteria, test with a screen reader, and propose fixes ranked by impact.", types: ["text", "file"] },
      },
      {
        title: "Studio final",
        summary: "A high-fidelity prototype, the research trail and a final critique.",
        reading: "Course final brief",
        lesson:
          H("Tell the story of the decisions") +
          P("Your final critique is not a tour of screens. Show the problem, the evidence, the two or three decisions that mattered and what you would test next.") +
          TIP("The best final presentations spend more time on the decision that went wrong than the one that went right."),
        assignment: { title: "Final studio prototype", points: 200, brief: "Deliver the high-fidelity prototype, the research trail that led to it, and a recorded five-minute walkthrough.", types: ["file", "url"] },
      },
    ],
    quizBank: [
      { id: "q1", type: "single", prompt: "In Norman's terms, a door handle that suggests pulling is a:", points: 2, options: ["Constraint", "Signifier", "Mapping", "Feedback loop"], correct: [1], explanation: "A signifier communicates where and how to act." },
      { id: "q2", type: "truefalse", prompt: "Asking users which features they want is the most reliable way to decide what to build.", points: 1, options: ["True", "False"], correct: [1], explanation: "Stated preferences are weak evidence. Observed behavior is stronger." },
      { id: "q3", type: "multi", prompt: "Which are good practice in a usability test?", points: 3, options: ["Ask the participant to think aloud", "Explain how the prototype works first", "Stay quiet when they struggle, then ask what they expected", "Test with people outside your team"], correct: [0, 2, 3] },
      { id: "q4", type: "short", prompt: "The principle that controls should sit near the things they affect is natural ____.", points: 2, correct: ["mapping"] },
      { id: "q5", type: "single", prompt: "A modular type scale with ratio 1.25 starting at 16px gives a next step of:", points: 2, options: ["18px", "20px", "24px", "32px"], correct: [1], explanation: "16 × 1.25 = 20." },
      { id: "q6", type: "numeric", prompt: "What is the WCAG AA minimum contrast ratio for normal body text? Give the first number, for example 3 for 3:1.", points: 2, correct: 4.5, tolerance: 0 },
      { id: "q7", type: "truefalse", prompt: "Respecting prefers-reduced-motion means removing every transition.", points: 1, options: ["True", "False"], correct: [1] },
      { id: "q8", type: "single", prompt: "Which artifact best captures a whole experience over time, including emotions?", points: 2, options: ["Wireframe", "Journey map", "Style guide", "Site map"], correct: [1] },
      { id: "q9", type: "single", prompt: "About how many participants find most serious usability problems in one round?", points: 1, options: ["1", "5", "20", "100"], correct: [1] },
      { id: "q10", type: "multi", prompt: "Which are WCAG principles?", points: 3, options: ["Perceivable", "Operable", "Profitable", "Robust"], correct: [0, 1, 3] },
    ],
    quizTitles: ["Quiz 1: Affordances and research", "Quiz 2: Testing, type and accessibility"],
    rubric: "design",
    announcements: [
      { title: "Critique groups for Unit 5 are posted", body: "<p>Your critique groups for the type studies are on the People page. Each group gets twelve minutes on Thursday. Bring printed work.</p>", ago: 1 },
      { title: "Recruiting participants", body: "<p>The HCI lab has a participant pool you can use for usability tests. Book slots through Jun Park at least three days ahead.</p>", ago: 6 },
      { title: "Welcome to the studio", body: "<p>Welcome. This course runs like a studio: we make things every week and talk about them honestly. Start noticing the doors that confuse you.</p>", ago: 40 },
    ],
    discussionReplies: [
      "The doors in the north stairwell of the library. Push plates on both sides, but one side only pulls. I watched four people bounce off it in ten minutes.",
      "The parking garage pay station. It asks for your plate number before telling you that you need the ticket stub.",
      "Our dorm laundry app shows machines as available when they are mid-cycle. People walk down three floors for nothing.",
      "Glass doors with vertical bar handles on both sides. The bar says pull. Half of them push.",
    ],
    teacherReply: "Good example. The fix is cheap and the cost of not fixing it is spread across hundreds of people a day. That pattern will come back all term.",
    resource: { name: "usability-test-kit.pdf", kind: "pdf" },
  },
  {
    id: "c-ds",
    code: "DATA 2300",
    name: "Foundations of Data Science",
    subtitle: "Ask good questions of data, and answer them honestly",
    color: "#b4560f",
    teacher: "u-priya",
    meets: "Wed and Fri, 14:50 to 16:30",
    meetDays: [3, 5],
    meetHour: [14, 50, 100],
    room: "Ashworth 302",
    credits: 4,
    officeHours: "Fri 11:00 to 12:30, Ashworth 210",
    description: "The full data science loop with Python: framing questions, cleaning messy data, exploring it, visualizing honestly, quantifying uncertainty and communicating what you found to people who will act on it.",
    topics: ["pandas", "Exploratory analysis", "Visualization", "Probability", "Inference", "Regression"],
    outcomes: [
      "Load, clean and reshape real datasets with pandas.",
      "Explore data and build visualizations that are honest about scale and uncertainty.",
      "Use simulation and hypothesis tests to reason about samples.",
      "Fit and interpret simple regression models, and say what they cannot tell you.",
    ],
    groups: [
      { key: "hw", name: "Homework", weight: 35 },
      { key: "proj", name: "Project", weight: 35 },
      { key: "quiz", name: "Quizzes", weight: 30 },
    ],
    units: [
      {
        title: "Asking questions of data",
        summary: "Tidy data, pandas basics and turning curiosity into a question.",
        reading: "Wickham, Tidy Data",
        lesson:
          H("Tidy data") +
          P("Each variable is a column, each observation is a row, each type of observation is a table. Most cleaning work is getting data into this shape.") +
          CODE(`import pandas as pd

trips = pd.read_csv("bike_trips.csv", parse_dates=["started_at"])
trips = trips.dropna(subset=["duration_min"])
trips["hour"] = trips["started_at"].dt.hour

busiest = (trips.groupby("hour")["duration_min"]
                .agg(["count", "median"])
                .sort_values("count", ascending=False))
print(busiest.head())`) +
          TIP("Write your question before you open the data. Otherwise the data will happily answer a different one."),
        assignment: { title: "HW 1: Tidy a messy dataset", points: 30, brief: "Clean the provided city permits dataset: fix types, handle missing values deliberately, and reshape it to tidy form. Document every decision in markdown cells.", types: ["file"] },
      },
      {
        title: "Exploratory analysis",
        summary: "Distributions, outliers and summary statistics that do not lie.",
        reading: "Course notes 2",
        lesson:
          H("Look before you summarize") +
          P("Two datasets can share a mean, variance and correlation and look completely different. Plot the distribution first, then decide which summary describes it.") +
          UL("Skewed data: report the median, not the mean.", "Outliers: investigate before deleting. They are sometimes the story.", "Groups: compare distributions, not just averages.") +
          TIP("Anscombe's quartet is four datasets with identical statistics and wildly different shapes. Always plot."),
        assignment: { title: "HW 2: EDA of city bike trips", points: 30, brief: "Explore one month of bike share trips. Produce five findings, each backed by a chart and one sentence on why it matters.", types: ["file"] },
        discussion: "Share a misleading chart you have seen in the wild",
      },
      {
        title: "Visualization",
        summary: "Encoding data honestly: scales, color and choosing the chart.",
        reading: "Wilke, Fundamentals of Data Visualization, chapters 1 to 5",
        lesson:
          H("Position beats color") +
          P("People compare positions on a common scale most accurately, then lengths, then angles and areas, then color. Bar charts beat pie charts for a reason.") +
          CODE(`import matplotlib.pyplot as plt

ax = busiest["count"].sort_index().plot(kind="bar", color="#b4560f")
ax.set(xlabel="Hour of day", ylabel="Trips", title="Trips peak at 8am and 5pm")
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()`) +
          TIP("Put the finding in the title. A chart called 'Trips by hour' makes the reader do your job."),
        assignment: { title: "HW 3: Five charts, one story", points: 30, brief: "Tell one story about a dataset of your choice in exactly five charts. Each chart title must state a finding, not a topic.", types: ["file", "url"] },
      },
      {
        title: "Probability and sampling",
        summary: "Random variables, simulation and the sampling distribution.",
        reading: "Computational and Inferential Thinking, chapters 9 and 10",
        lesson:
          H("Simulate it") +
          P("If you are unsure how a statistic varies, simulate thousands of samples and look at the distribution. The sampling distribution of the mean narrows as the sample grows, by a factor of the square root of n.") +
          CODE(`import numpy as np

rng = np.random.default_rng(0)
means = [rng.choice(population, size=100).mean() for _ in range(10_000)]
print(np.percentile(means, [2.5, 97.5]))   # where 95% of sample means land`) +
          TIP("Four times the data halves the spread, not quarters it."),
        assignment: { title: "HW 4: Simulate the sampling distribution", points: 30, brief: "Simulate sampling distributions for the mean and median at three sample sizes, and explain what changes and why.", types: ["file"] },
      },
      {
        title: "Inference and A/B testing",
        summary: "Hypothesis tests, p-values, confidence intervals and their limits.",
        reading: "Computational and Inferential Thinking, chapters 11 and 12",
        lesson:
          H("Could this be chance?") +
          P("A permutation test shuffles the group labels many times to see how often a difference as large as yours appears by chance. That fraction is the p-value.") +
          UL("A p-value is not the probability the null hypothesis is true.", "Statistically significant is not the same as important. Report the effect size.", "Decide the test and the sample size before looking at results.") +
          TIP("If you run twenty tests at the 5% level, expect one false positive even when nothing is going on."),
        assignment: { group: "proj", title: "Project checkpoint: A/B test analysis", points: 60, brief: "Analyze the provided signup experiment: state hypotheses, run a permutation test, report a confidence interval for the lift, and recommend a decision.", types: ["file", "text"] },
      },
      {
        title: "Regression and correlation",
        summary: "Fitting lines, residuals, and why correlation is not causation.",
        reading: "Computational and Inferential Thinking, chapter 15",
        lesson:
          H("Fit, then check") +
          P("Least squares finds the line that minimizes squared residuals. Always plot the residuals: a pattern in them means the line is missing something.") +
          CODE(`import numpy as np

slope, intercept = np.polyfit(df["temp_c"], df["trips"], deg=1)
df["residual"] = df["trips"] - (slope * df["temp_c"] + intercept)`) +
          TIP("Ice cream sales and drownings are correlated. So is summer. Always ask what else changed."),
        assignment: { title: "HW 5: Fit, check, interpret", points: 30, brief: "Fit a regression of trips on temperature, diagnose it with residual plots, and write a paragraph on what the model cannot tell you.", types: ["file"] },
      },
      {
        title: "Communicating results",
        summary: "Writing for decision makers, uncertainty and reproducibility.",
        reading: "Course notes 7",
        lesson:
          H("Lead with the answer") +
          P("Decision makers read the first paragraph. Put the finding, the uncertainty and the recommendation there. Methods go after, for the people who want to check.") +
          TIP("Run your notebook top to bottom on a fresh kernel before you submit. If it fails, so does your reproducibility."),
        assignment: { group: "proj", title: "Final project: Data story", points: 100, brief: "A reproducible notebook and a two-page brief answering a question of your choice with public data, including uncertainty and limitations.", types: ["file", "url"] },
      },
    ],
    quizBank: [
      { id: "q1", type: "truefalse", prompt: "In tidy data, each variable is a column and each observation is a row.", points: 1, options: ["True", "False"], correct: [0] },
      { id: "q2", type: "single", prompt: "For heavily right-skewed income data, the better summary of a typical value is:", points: 1, options: ["Mean", "Median", "Maximum", "Standard deviation"], correct: [1] },
      { id: "q3", type: "single", prompt: "Which visual encoding do people compare most accurately?", points: 2, options: ["Color hue", "Area", "Position on a common scale", "Angle"], correct: [2] },
      { id: "q4", type: "numeric", prompt: "If you quadruple the sample size, the standard error of the mean is divided by what number?", points: 2, correct: 2, tolerance: 0, explanation: "It scales with 1 over the square root of n." },
      { id: "q5", type: "truefalse", prompt: "A p-value of 0.03 means there is a 3% chance the null hypothesis is true.", points: 2, options: ["True", "False"], correct: [1], explanation: "It is the chance of data at least this extreme if the null were true." },
      { id: "q6", type: "multi", prompt: "Which are good habits for an A/B test?", points: 3, options: ["Fix the sample size in advance", "Stop as soon as p < 0.05", "Report the effect size", "Check for a sample ratio mismatch"], correct: [0, 2, 3] },
      { id: "q7", type: "short", prompt: "In pandas, which method groups rows before aggregating? Give the method name.", points: 1, correct: ["groupby", "groupby()", ".groupby", "df.groupby"] },
      { id: "q8", type: "single", prompt: "A clear pattern in a residual plot suggests:", points: 2, options: ["The model fits perfectly", "The model is missing structure", "The data is tidy", "The p-value is small"], correct: [1] },
      { id: "q9", type: "truefalse", prompt: "Correlation between two variables proves that one causes the other.", points: 1, options: ["True", "False"], correct: [1] },
      { id: "q10", type: "single", prompt: "Running 20 independent tests at the 5% level with no real effects, how many false positives do you expect?", points: 2, options: ["0", "1", "5", "20"], correct: [1] },
    ],
    quizTitles: ["Quiz 1: Tidy data and exploration", "Quiz 2: Inference and regression"],
    rubric: "analysis",
    announcements: [
      { title: "Project datasets approved", body: "<p>I have approved every project dataset submitted so far. If yours is not on the list in Files, email me before Friday.</p>", ago: 3 },
      { title: "Notebook template updated", body: "<p>The homework template now includes a cell that prints package versions. Keep it; it makes your work reproducible.</p>", ago: 12 },
      { title: "Welcome to Data Science", body: "<p>Welcome. Install the course environment from Resources and run the hello notebook before our first lab.</p>", ago: 40 },
    ],
    discussionReplies: [
      "A news chart of unemployment where the y-axis started at 8.5%. A 0.3 point change looked like a cliff.",
      "A pie chart with eleven slices in nine shades of blue. I still do not know which slice was the biggest.",
      "A dual-axis chart lining up ice cream sales and shark sightings as if one caused the other.",
    ],
    teacherReply: "All three are classics. The y-axis one is the most common in the wild, and the fix is usually just starting bars at zero.",
    resource: { name: "course-environment.yml", kind: "code" },
  },
];

function unitDueOffset(i: number, n: number) {
  const current = Math.max(1, Math.floor(n * 0.55));
  return (i - current) * 7 + 3;
}

export function buildSeed(): Data {
  const r = rng(20261012);
  const courses: Course[] = [];
  const enrollments: Enrollment[] = [];
  const modules: Module[] = [];
  const moduleItems: ModuleItem[] = [];
  const groups: AssignmentGroup[] = [];
  const assignments: Assignment[] = [];
  const submissions: Submission[] = [];
  const quizzes: Quiz[] = [];
  const attempts: QuizAttempt[] = [];
  const discussions: Discussion[] = [];
  const announcements: Announcement[] = [];
  const pages: Page[] = [];
  const files: CourseFile[] = [];
  const events: CalendarEvent[] = [];
  const completedItems: Record<string, string[]> = { [ME]: [] };

  for (const [k, spec] of courseSpecs.entries()) {
    const cid = spec.id;
    const dayShift = [0, -1, 1, -2, 2][k] ?? 0;
    const teacher = users.find((u) => u.id === spec.teacher)!;
    const roster = [ME, ...classmates.filter(() => r() > 0.25)];

    courses.push({
      id: cid,
      code: spec.code,
      name: spec.name,
      subtitle: spec.subtitle,
      term: "Fall 2026",
      color: spec.color,
      favorite: true,
      description: spec.description,
      meets: spec.meets,
      room: spec.room,
      credits: spec.credits,
      topics: spec.topics,
      outcomes: spec.outcomes,
      officeHours: spec.officeHours,
      syllabus:
        H("About this course") +
        P(esc(spec.description)) +
        H("What you will be able to do") +
        UL(...spec.outcomes.map(esc)) +
        H("Meetings and office hours") +
        P(`${esc(spec.meets)} in ${esc(spec.room)}. Office hours: ${esc(spec.officeHours)}.`) +
        H("Instructor") +
        P(`${esc(teacher.name)}, ${esc(teacher.title ?? "")}. Message through the Inbox; replies within one working day.`) +
        H("Grading") +
        UL(...spec.groups.map((g) => `<strong>${esc(g.name)}</strong>: ${g.weight}% of the final grade`)) +
        H("Late work") +
        P("Work submitted late loses 10% per day, up to three days. After three days it is not accepted unless we have arranged it in advance.") +
        H("Collaboration and AI tools") +
        P("You may discuss ideas with classmates and use AI tools to explain concepts. The work you hand in must be your own, and you should be able to explain every line of it.") +
        H("Accessibility") +
        P("If you have accommodations, send them in the first two weeks so we can plan together."),
    });

    enrollments.push({ userId: spec.teacher, courseId: cid, role: "teacher" });
    if (spec.ta) enrollments.push({ userId: spec.ta, courseId: cid, role: "ta" });
    for (const uid of roster) enrollments.push({ userId: uid, courseId: cid, role: "student", section: r() > 0.5 ? "Section 01" : "Section 02" });

    const groupIds: Record<string, string> = {};
    spec.groups.forEach((g) => {
      const id = `${cid}-g-${g.key}`;
      groupIds[g.key] = id;
      groups.push({ id, courseId: cid, name: g.name, weight: g.weight });
    });
    const mainGroup = groupIds[spec.groups[0].key];
    const quizGroup = groupIds["quiz"];
    const rubric = rubrics[spec.rubric].map((c, i) => ({ ...c, id: `${cid}-rc-${i}` }));
    const rubricTotal = rubric.reduce((a, c) => a + c.points, 0);

    pages.push({
      id: `${cid}-p-home`,
      courseId: cid,
      slug: "welcome",
      title: `Welcome to ${spec.name}`,
      body:
        P(esc(spec.description)) +
        P("Start with the syllabus, then open the first module. Everything for the week lives in Modules, in order.") +
        H("How this course works") +
        UL("New material opens every Monday morning.", "Each unit has a lesson, a reading, and one piece of work.", "Questions about logistics go in the Q&amp;A discussion so everyone benefits from the answer."),
      updatedAt: at(-35, 9, 0),
      frontPage: true,
      published: true,
    });

    const n = spec.units.length;
    spec.units.forEach((u, i) => {
      const mid = `${cid}-m-${i}`;
      const due = unitDueOffset(i, n) + dayShift;
      const unlock = due - 10;
      modules.push({
        id: mid,
        courseId: cid,
        name: `Unit ${i + 1}: ${u.title}`,
        position: i,
        published: true,
        unlockAt: unlock > 0 ? at(unlock, 8, 0) : undefined,
        prerequisiteIds: i > 0 ? [`${cid}-m-${i - 1}`] : [],
      });
      let pos = 0;
      const pageId = `${cid}-p-u${i}`;
      pages.push({
        id: pageId,
        courseId: cid,
        slug: `lesson-${i + 1}`,
        title: `Lesson ${i + 1}: ${u.title}`,
        body: P(`<strong>${esc(u.summary)}</strong>`) + u.lesson + H("Reading") + P(esc(u.reading)),
        updatedAt: at(Math.min(unlock - 2, -1), 10, 0),
        published: true,
      });
      moduleItems.push({ id: `${mid}-i${pos}`, moduleId: mid, type: "page", refId: pageId, title: `Lesson ${i + 1}: ${u.title}`, position: pos++, published: true });

      const fileId = `${cid}-f-r${i}`;
      files.push({ id: fileId, courseId: cid, folder: "Readings", name: `${u.reading.split(",")[0].replace(/[^A-Za-z0-9 ]/g, "").trim().replace(/\s+/g, "-").toLowerCase()}-unit${i + 1}.pdf`, size: Math.round(400_000 + r() * 4_000_000), kind: "pdf", updatedAt: at(Math.min(unlock - 3, -2), 14, 0) });
      moduleItems.push({ id: `${mid}-i${pos}`, moduleId: mid, type: "file", refId: fileId, title: `Reading: ${u.reading}`, position: pos++, published: true });
      files.push({ id: `${cid}-f-s${i}`, courseId: cid, folder: "Slides", name: `unit-${i + 1}-${u.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}.pdf`, size: Math.round(1_500_000 + r() * 6_000_000), kind: "slides", updatedAt: at(Math.min(unlock, -1), 9, 0) });

      const aid = `${cid}-a-${i}`;
      const isExam = /exam/i.test(u.assignment.title);
      const types = u.assignment.types ?? ["text", "file"];
      assignments.push({
        id: aid,
        courseId: cid,
        groupId: u.assignment.group ? groupIds[u.assignment.group] : isExam ? (groupIds["exam"] ?? mainGroup) : mainGroup,
        title: u.assignment.title,
        description:
          P(esc(u.assignment.brief)) +
          (isExam
            ? H("Format") + P("Closed book apart from your notes. Bring a pencil and your student ID.")
            : H("What to hand in") + UL(...types.map((t) => (t === "text" ? "A written response in the submission box" : t === "file" ? "One file (PDF, notebook or a zipped project)" : "A link to your deployed work or repository"))) + H("How it is graded") + P("See the rubric below. Ask in the Q&amp;A discussion if anything is unclear.")),
        points: u.assignment.points,
        dueAt: at(due, 23, 59),
        availableFrom: unlock > 0 ? at(unlock, 8, 0) : undefined,
        submissionTypes: isExam ? [] : types,
        rubric: isExam ? undefined : rubric,
        published: true,
      });
      moduleItems.push({ id: `${mid}-i${pos}`, moduleId: mid, type: "assignment", refId: aid, title: u.assignment.title, position: pos++, published: true });

      if (u.discussion) {
        const did = `${cid}-d-${i}`;
        const others = roster.filter((x) => x !== ME);
        const replies: Reply[] = spec.discussionReplies.map((body, j) => ({
          id: `${did}-r${j}`,
          authorId: others[j % others.length],
          body,
          at: at(due - 8 + j, 10 + j, 12 * j),
          likes: roster.filter(() => r() > 0.7).slice(0, 4),
          replies: j === 0 ? [{ id: `${did}-r${j}-a`, authorId: spec.teacher, body: spec.teacherReply, at: at(due - 7, 15, 2), likes: [], replies: [] }] : [],
        }));
        discussions.push({ id: did, courseId: cid, title: u.discussion, body: P(`${esc(u.discussion)}. Post your answer, then reply to at least two classmates with a question, not just agreement.`), authorId: spec.teacher, postedAt: at(due - 9, 9, 0), pinned: false, replies, readBy: [spec.teacher] });
        moduleItems.push({ id: `${mid}-i${pos}`, moduleId: mid, type: "discussion", refId: did, title: `Discussion: ${u.discussion}`, position: pos++, published: true });
      }

      const pastUnit = due < 0;
      if (pastUnit) for (let p = 0; p < pos; p++) completedItems[ME].push(`${mid}-i${p}`);

      for (const uid of roster) {
        const isMe = uid === ME;
        if (isExam && due > 0) continue;
        const roll = r();
        let submittedAt: string | undefined;
        if (due < 0) {
          if (isMe && i === 1 && cid === "c-ds") submittedAt = undefined;
          else if (roll < 0.08 && !isMe) submittedAt = undefined;
          else if (roll < 0.16 || (isMe && i === 0 && cid === "c-alg")) submittedAt = new Date(new Date(at(due, 23, 59)).getTime() + 3_600_000 * (6 + r() * 20)).toISOString();
          else submittedAt = at(due - 1 - Math.floor(r() * 3), 14 + Math.floor(r() * 8), Math.floor(r() * 59));
        } else if (due < 6 && !isMe && roll < 0.35) {
          submittedAt = at(due - 2 - Math.floor(r() * 2), 12 + Math.floor(r() * 8), Math.floor(r() * 59));
        } else if (isMe && cid === "c-ml" && due > 0 && due < 6) {
          submittedAt = at(-1, 22, 41);
        }
        if (!submittedAt) continue;
        const base = isMe ? 0.86 + r() * 0.12 : 0.62 + r() * 0.37;
        const recentlyDue = due >= -7;
        const graded = due < 0 && !(recentlyDue && spec.teacher === INSTRUCTOR && (r() > 0.3 || isMe));
        const rubricScores = graded && !isExam ? Object.fromEntries(rubric.map((c) => [c.id, Math.round(c.points * Math.min(1, base + (r() - 0.5) * 0.1))])) : undefined;
        const score = !graded ? undefined : rubricScores ? (Object.values(rubricScores).reduce((a, b) => a + b, 0) * u.assignment.points) / rubricTotal : u.assignment.points * Math.min(1, base);
        const slug = u.assignment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32).replace(/-$/, "");
        submissions.push({
          id: `s-${aid}-${uid}`,
          assignmentId: aid,
          userId: uid,
          body: !isExam && types.includes("text") ? `My response for ${u.assignment.title}.\n\nI focused on the hardest part of the brief: ${u.summary.toLowerCase()} I tried two approaches before settling on this one, and I note what I would change below.` : undefined,
          fileName: !isExam && types.includes("file") ? `${uid.replace("u-", "")}-${slug}.${spec.rubric === "code" ? "zip" : spec.rubric === "analysis" || spec.rubric === "ml" ? "ipynb" : "pdf"}` : undefined,
          fileSize: Math.round(200_000 + r() * 3_000_000),
          url: !isExam && types.includes("url") && !types.includes("file") ? `https://github.com/${uid.replace("u-", "")}/${slug}` : undefined,
          submittedAt,
          score: score === undefined ? undefined : Math.round(score * 2) / 2,
          gradedAt: graded ? at(Math.min(-1, due + 5), 17, 30) : undefined,
          rubricScores,
          comments:
            graded && isMe
              ? [{ id: `cm-${aid}`, authorId: spec.teacher, body: i % 2 === 0 ? "Strong work. The second half is where your thinking really shows; lead with that next time instead of saving it for the end." : "Solid. Your reasoning in the middle section is careful. Tighten the opening so the reader knows your main point in the first two sentences.", at: at(Math.min(-1, due + 5), 17, 31) }]
              : [],
          attempt: 1,
        });
      }

      if (i === 1 || i === n - 3) {
        const qi = i === 1 ? 0 : 1;
        const qid = `${cid}-q-${qi}`;
        const qs = qi === 0 ? spec.quizBank.slice(0, 5) : spec.quizBank.slice(5);
        const qDue = due - 1;
        quizzes.push({
          id: qid,
          courseId: cid,
          groupId: quizGroup,
          title: spec.quizTitles[qi],
          description: P(`A short check on ${qi === 0 ? "the first two units" : "the material since the midpoint"}. Open notes, closed neighbours. You can flag questions and come back to them before submitting.`),
          timeLimitMin: qi === 0 ? 15 : 20,
          attemptsAllowed: qi === 0 ? 1 : 2,
          dueAt: at(qDue, 23, 59),
          availableFrom: at(qDue - 12, 8, 0),
          questions: qs.map((q) => ({ ...q, id: `${qid}-${q.id}` })),
          published: true,
        });
        moduleItems.push({ id: `${mid}-i${pos}`, moduleId: mid, type: "quiz", refId: qid, title: spec.quizTitles[qi], position: pos++, published: true });
        if (qDue < 0) {
          const total = qs.reduce((a, q) => a + q.points, 0);
          for (const uid of roster) {
            const pct = uid === ME ? 0.88 : 0.55 + r() * 0.45;
            attempts.push({ id: `qa-${qid}-${uid}`, quizId: qid, userId: uid, answers: {}, flagged: [], startedAt: at(qDue - 2, 19, 10), submittedAt: at(qDue - 2, 19, 24), score: Math.round(total * pct) });
          }
          if (pastUnit) completedItems[ME].push(`${mid}-i${pos - 1}`);
        }
      }
    });

    for (let w = -2; w <= 3; w++) {
      for (const day of spec.meetDays) {
        const off = weekdayOffset(day, w);
        const [h, m, len] = spec.meetHour;
        const s = new Date(at(off, h, m));
        events.push({ id: `${cid}-ev-${w}-${day}`, courseId: cid, title: `${spec.code} Lecture`, startAt: s.toISOString(), endAt: new Date(s.getTime() + len * 60000).toISOString(), location: spec.room, kind: "lecture" });
      }
    }

    spec.announcements.forEach((a, j) => {
      announcements.push({ id: `${cid}-an-${j}`, courseId: cid, title: a.title, body: a.body, authorId: spec.teacher, postedAt: at(-a.ago, 9 + j, 15), readBy: a.ago > 4 ? [ME, spec.teacher] : [spec.teacher] });
    });

    discussions.push({
      id: `${cid}-d-qa`,
      courseId: cid,
      title: "Course Q&A",
      body: P("Ask anything about logistics, deadlines or the material here. If you know the answer to someone else's question, jump in."),
      authorId: spec.teacher,
      postedAt: at(-38, 9, 0),
      pinned: true,
      replies: [
        { id: `${cid}-qa-1`, authorId: roster[1], body: "Is the reading for each unit required before the first lecture of the week, or by the end of the week?", at: at(-12, 20, 4), likes: [ME], replies: [{ id: `${cid}-qa-1a`, authorId: spec.teacher, body: "Before the first lecture. We build on it right away.", at: at(-12, 21, 30), likes: [roster[1]], replies: [] }] },
        { id: `${cid}-qa-2`, authorId: roster[2], body: "Are late days per assignment or a shared pool?", at: at(-6, 11, 47), likes: [], replies: [] },
      ],
      readBy: [ME, spec.teacher],
    });

    files.push(
      { id: `${cid}-f-syl`, courseId: cid, folder: "Course documents", name: "syllabus-fall-2026.pdf", size: 312_448, kind: "pdf", updatedAt: at(-40, 12, 0) },
      { id: `${cid}-f-sched`, courseId: cid, folder: "Course documents", name: "schedule.xlsx", size: 48_220, kind: "sheet", updatedAt: at(-20, 12, 0) },
      { id: `${cid}-f-res`, courseId: cid, folder: "Resources", name: spec.resource.name, size: 2_840_112, kind: spec.resource.kind, updatedAt: at(-18, 12, 0) },
    );
  }

  events.push(
    { id: "ev-oh-1", courseId: "c-hci", title: "Office hours with Jun Park", startAt: at(weekdayOffset(2, 0), 15, 0), endAt: at(weekdayOffset(2, 0), 16, 30), location: "Lindell Hall 3rd floor", kind: "office" },
    { id: "ev-oh-2", courseId: "c-hci", title: "Office hours with Jun Park", startAt: at(weekdayOffset(2, 1), 15, 0), endAt: at(weekdayOffset(2, 1), 16, 30), location: "Lindell Hall 3rd floor", kind: "office" },
    { id: "ev-oh-3", courseId: "c-alg", title: "Algorithms office hours", startAt: at(weekdayOffset(4, 0), 15, 30), endAt: at(weekdayOffset(4, 0), 17, 0), location: "Halvorsen 302", kind: "office" },
    { id: "ev-study", userId: ME, title: "Study group: dynamic programming", startAt: at(weekdayOffset(0, 1), 14, 0), endAt: at(weekdayOffset(0, 1), 16, 0), location: "Library room 4B", kind: "personal" },
    { id: "ev-exam", courseId: "c-alg", title: "Final exam review session", startAt: at(weekdayOffset(5, 2), 13, 0), endAt: at(weekdayOffset(5, 2), 15, 0), location: "Halvorsen 120", kind: "exam" },
    { id: "ev-demo", courseId: "c-web", title: "Project 2 demo day", startAt: at(weekdayOffset(3, 1), 10, 30), endAt: at(weekdayOffset(3, 1), 11, 50), location: "Lindell Hall 214", kind: "exam" },
  );

  const conversations: Conversation[] = [
    {
      id: "cv-1",
      subject: "Question about the paper prototype",
      participantIds: [ME, INSTRUCTOR],
      courseId: "c-hci",
      messages: [
        { id: "cv-1-1", authorId: ME, body: "Hi Professor Okafor, for the paper prototype test, is it fine if one of my three participants is a roommate? Recruiting has been slow.", at: at(-4, 21, 12) },
        { id: "cv-1-2", authorId: INSTRUCTOR, body: "One is fine, as long as you note it in the write-up and they have not seen your concept before. Ask them to narrate what they expect before each tap.", at: at(-3, 8, 40) },
      ],
      readBy: [ME, INSTRUCTOR],
      starred: [ME],
      archived: [],
    },
    {
      id: "cv-2",
      subject: "Study group Sunday?",
      participantIds: [ME, "u-sofia", "u-rohan", "u-leilani"],
      courseId: "c-alg",
      messages: [
        { id: "cv-2-1", authorId: "u-sofia", body: "Anyone want to work through problem set 5 together on Sunday? Library 4B is free from 2.", at: at(-1, 18, 5) },
        { id: "cv-2-2", authorId: "u-rohan", body: "I am in. I am stuck on the knapsack variant.", at: at(-1, 18, 31) },
        { id: "cv-2-3", authorId: "u-leilani", body: "Same. Bringing snacks.", at: at(0, 9, 2) },
      ],
      readBy: ["u-sofia", "u-rohan", "u-leilani"],
      starred: [],
      archived: [],
    },
    {
      id: "cv-3",
      subject: "Project team for the final",
      participantIds: [ME, "u-kenji", "u-amara"],
      courseId: "c-ml",
      messages: [
        { id: "cv-3-1", authorId: "u-kenji", body: "Want to team up for the final project? I have a dataset of bike-share trips that might work for demand forecasting.", at: at(-6, 13, 20) },
        { id: "cv-3-2", authorId: ME, body: "Yes. I can take the baseline and the evaluation section.", at: at(-6, 14, 2) },
        { id: "cv-3-3", authorId: "u-amara", body: "Count me in. I will set up the repo tonight and share it here.", at: at(-5, 10, 15) },
      ],
      readBy: [ME, "u-kenji", "u-amara"],
      starred: [],
      archived: [],
    },
    {
      id: "cv-4",
      subject: "Your EDA notebook",
      participantIds: [ME, "u-priya"],
      courseId: "c-ds",
      messages: [{ id: "cv-4-1", authorId: "u-priya", body: "Your bike trips EDA was one of the clearest in the class. Would you be willing to share it anonymously as an example next term?", at: at(-2, 16, 48) }],
      readBy: ["u-priya"],
      starred: [],
      archived: [],
    },
    {
      id: "cv-5",
      subject: "Project 2 code review",
      participantIds: [ME, TA],
      courseId: "c-web",
      messages: [{ id: "cv-5-1", authorId: TA, body: "Looked at your reading list API draft. Routes are clean. Your POST handler returns 200 instead of 201 and has no Location header, worth fixing before demo day.", at: at(-1, 11, 20) }],
      readBy: [TA],
      starred: [],
      archived: [],
    },
    {
      id: "cv-6",
      subject: "Critique groups",
      participantIds: [INSTRUCTOR, TA],
      courseId: "c-hci",
      messages: [
        { id: "cv-6-1", authorId: TA, body: "Groups for the type studies are drafted. I split up the two teams who always sit together.", at: at(-2, 10, 5) },
        { id: "cv-6-2", authorId: INSTRUCTOR, body: "Good call. Post them tomorrow morning.", at: at(-2, 12, 40) },
      ],
      readBy: [INSTRUCTOR, TA],
      starred: [],
      archived: [],
    },
  ];

  const notifications: Notification[] = [
    { id: "n-1", userId: ME, kind: "grade", title: "Grade posted", body: "Problem set 2: Recurrences", href: "/courses/c-alg/grades", at: at(-1, 17, 31), read: false },
    { id: "n-2", userId: ME, kind: "announcement", title: "Project 2 starter repo is live", body: "WEB 3200", href: "/courses/c-web/announcements", at: at(-1, 9, 15), read: false },
    { id: "n-3", userId: ME, kind: "message", title: "Jun Park sent a message", body: "Project 2 code review", href: "/inbox?c=cv-5", at: at(-1, 11, 20), read: false },
    { id: "n-4", userId: ME, kind: "reply", title: "New reply in Course Q&A", body: "ALG 3100", href: "/courses/c-alg/discussions/c-alg-d-qa", at: at(-6, 11, 47), read: true },
    { id: "n-5", userId: INSTRUCTOR, kind: "due", title: "Submissions waiting", body: "HCI 3400 and WEB 3200 have work to grade", href: "/courses/c-hci/gradebook", at: at(0, 8, 0), read: false },
  ];

  return { users, enrollments, courses, modules, moduleItems, groups, assignments, submissions, quizzes, attempts, discussions, announcements, pages, files, events, conversations, notifications, completedItems, drafts: {} };
}
