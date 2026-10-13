"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconContext,
  Bell,
  BookOpen,
  CalendarBlank,
  CheckCircle,
  ChatCircleText,
  Info,
  MagnifyingGlass,
  Moon,
  Question,
  SignOut,
  SquaresFour,
  Sun,
  Tray as TrayIcon,
  WarningCircle,
  ArrowCounterClockwise,
  UserCircle,
  Megaphone,
  Exam,
  ChatsCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useMe, useStore } from "@/lib/store";
import { useToasts } from "@/lib/toast";
import { cn, myCourses, relative, roleIn } from "@/lib/logic";
import { setTheme, themePreference, toggleTheme, useIsDark } from "@/lib/theme";
import { Avatar, Button, Kbd, MuseMark, Segmented } from "./ui";
import { CommandPalette } from "./command-palette";
import { INSTRUCTOR, ME, TA } from "@/lib/seed";
import { loadNotify, wants } from "@/lib/prefs";

type TrayKind = "account" | "courses" | "activity" | "help" | null;

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const [tray, setTray] = useState<TrayKind>(null);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    if (!me) router.replace("/");
  }, [me, router]);

  const [trayPath, setTrayPath] = useState(pathname);
  if (pathname !== trayPath) {
    setTrayPath(pathname);
    setTray(null);
  }

  useEffect(() => {
    let lastG = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.tagName === "SELECT";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") setTray(null);
      if (e.key === "/") {
        e.preventDefault();
        setPalette(true);
      }
      if (e.key === "?") setTray((x) => (x === "help" ? null : "help"));
      if (e.key === "g") {
        lastG = Date.now();
        return;
      }
      if (Date.now() - lastG < 900) {
        const map: Record<string, string> = { d: "/dashboard", c: "/calendar", i: "/inbox", a: "/account", l: "/courses" };
        if (map[e.key]) router.push(map[e.key]);
        lastG = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!me) return null;

  return (
    <IconContext.Provider value={{ "aria-hidden": true }}>
    <div className="min-h-[100dvh]">
      <a href="#main" className="sr-only z-[90] rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <GlobalNav tray={tray} setTray={setTray} openPalette={() => setPalette(true)} />
      <AnimatePresence>{tray && <TrayPanel kind={tray} close={() => setTray(null)} />}</AnimatePresence>
      <main id="main" tabIndex={-1} className="min-h-[100dvh] pb-24 outline-none md:pb-0 md:pl-[84px]">{children}</main>
      <MobileBar />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Toaster />
    </div>
    </IconContext.Provider>
  );
}

function useNotifyPrefs() {
  const [prefs, setPrefs] = useState(loadNotify);
  useEffect(() => {
    const on = () => setPrefs(loadNotify());
    window.addEventListener("muse-notify", on);
    return () => window.removeEventListener("muse-notify", on);
  }, []);
  return prefs;
}

function useUnread() {
  const me = useStore((s) => s.me);
  const conversations = useStore((s) => s.data.conversations);
  const notifications = useStore((s) => s.data.notifications);
  const prefs = useNotifyPrefs();
  return {
    inbox: conversations.filter((c) => c.participantIds.includes(me ?? "") && !c.readBy.includes(me ?? "") && !c.archived.includes(me ?? "")).length,
    activity: notifications.filter((n) => n.userId === me && !n.read && wants(prefs, n)).length,
  };
}

function GlobalNav({ tray, setTray, openPalette }: { tray: TrayKind; setTray: (t: TrayKind) => void; openPalette: () => void }) {
  const pathname = usePathname();
  const me = useMe();
  const unread = useUnread();
  const dark = useIsDark();
  const toggle = (k: Exclude<TrayKind, null>) => setTray(tray === k ? null : k);

  const active = tray ?? (pathname.startsWith("/dashboard") ? "dashboard" : pathname.startsWith("/courses") ? "courses" : pathname.startsWith("/calendar") ? "calendar" : pathname.startsWith("/inbox") ? "inbox" : pathname.startsWith("/account") ? "account" : "");

  return (
    <nav aria-label="Global" className="fixed inset-y-0 left-0 z-50 hidden w-[84px] flex-col items-stretch bg-nav pb-3 md:flex">
      <Link href="/dashboard" aria-label="muselearning home" className="flex h-[72px] items-center justify-center">
        <MuseMark size={36} />
      </Link>
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
        <RailItem id="account" active={active} label="Account" onClick={() => toggle("account")} icon={<Avatar user={me} size={28} className="ring-2 ring-white/15" />} />
        <RailItem id="dashboard" active={active} label="Dashboard" href="/dashboard" icon={<SquaresFour size={26} weight="duotone" />} />
        <RailItem id="courses" active={active} label="Courses" onClick={() => toggle("courses")} icon={<BookOpen size={26} weight="duotone" />} />
        <RailItem id="calendar" active={active} label="Calendar" href="/calendar" icon={<CalendarBlank size={26} weight="duotone" />} />
        <RailItem id="inbox" active={active} label="Inbox" href="/inbox" badge={unread.inbox} icon={<TrayIcon size={26} weight="duotone" />} />
        <RailItem id="activity" active={active} label="Activity" onClick={() => toggle("activity")} badge={unread.activity} icon={<Bell size={26} weight="duotone" />} />
        <RailItem id="search" active={active} label="Search" onClick={openPalette} icon={<MagnifyingGlass size={26} weight="duotone" />} />
        <RailItem id="help" active={active} label="Help" onClick={() => toggle("help")} icon={<Question size={26} weight="duotone" />} />
      </div>
      <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="mx-auto flex size-10 items-center justify-center rounded-full text-nav-text transition-colors hover:bg-white/8 hover:text-white">
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </nav>
  );
}

function RailItem({ id, active, label, icon, href, onClick, badge }: { id: string; active: string; label: string; icon: ReactNode; href?: string; onClick?: () => void; badge?: number }) {
  const isActive = active === id;
  const inner = (
    <>
      {isActive && <motion.span layoutId="rail-active" className="absolute inset-0 bg-white dark:bg-nav-2" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
      {isActive && <motion.span layoutId="rail-bar" className="absolute inset-y-0 left-0 w-[3px] bg-accent" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
      <span className={cn("relative transition-colors", isActive ? "text-[#c4162f] dark:text-accent" : "text-nav-text group-hover:text-white")}>{icon}</span>
      <span className={cn("relative text-[11px] font-medium tracking-tight transition-colors", isActive ? "text-[#c4162f] dark:text-accent" : "text-nav-text group-hover:text-white")}>{label}</span>
      {!!badge && <span className="absolute top-1.5 right-4 min-w-[18px] rounded-full bg-accent px-1 text-center text-[10px] leading-[18px] font-semibold text-on-accent ring-2 ring-nav">{badge}</span>}
    </>
  );
  const cls = "group relative flex h-[66px] w-full flex-col items-center justify-center gap-1";
  if (href)
    return (
      <Link href={href} className={cls} aria-label={badge ? `${label}, ${badge} unread` : label} aria-current={isActive ? "page" : undefined}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={badge ? `${label}, ${badge} unread` : label} aria-expanded={isActive}>
      {inner}
    </button>
  );
}

function MobileBar() {
  const pathname = usePathname();
  const unread = useUnread();
  const items = [
    { href: "/dashboard", label: "Home", icon: SquaresFour },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/calendar", label: "Calendar", icon: CalendarBlank },
    { href: "/inbox", label: "Inbox", icon: TrayIcon, badge: unread.inbox },
    { href: "/account", label: "Account", icon: UserCircle },
  ];
  return (
    <nav aria-label="Global" className="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/10 bg-nav pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map((it) => {
        const active = pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link key={it.href} href={it.href} className={cn("relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-medium", active ? "text-white" : "text-nav-text")}>
            <Icon size={24} weight={active ? "fill" : "regular"} className={active ? "text-accent" : ""} />
            {it.label}
            {!!it.badge && <span className="absolute top-2 left-1/2 ml-2 min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-on-accent">{it.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function TrayPanel({ kind, close }: { kind: Exclude<TrayKind, null>; close: () => void }) {
  const reduce = useReducedMotion();
  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-[rgb(10_10_14/0.32)] md:left-[84px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
      <motion.aside
        aria-label={kind}
        initial={reduce ? { opacity: 0 } : { x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { x: -24, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-[45] flex w-full max-w-[360px] flex-col overflow-y-auto overscroll-contain border-r border-line bg-surface shadow-pop scrollbar-thin md:left-[84px]"
      >
        {kind === "account" && <AccountTray close={close} />}
        {kind === "courses" && <CoursesTray />}
        {kind === "activity" && <ActivityTray close={close} />}
        {kind === "help" && <HelpTray />}
      </motion.aside>
    </>
  );
}

function TrayHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-line bg-surface/95 px-6 backdrop-blur">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export const PERSONAS = [
  { id: ME, label: "Student" },
  { id: INSTRUCTOR, label: "Instructor" },
  { id: TA, label: "Teaching assistant" },
];

function AccountTray({ close }: { close: () => void }) {
  const me = useMe()!;
  const users = useStore((s) => s.data.users);
  const signIn = useStore((s) => s.signIn);
  const signOut = useStore((s) => s.signOut);
  const resetDemo = useStore((s) => s.resetDemo);
  const router = useRouter();
  const [pref, setPref] = useState<"light" | "dark" | "system">(themePreference);
  const push = useToasts((s) => s.push);

  return (
    <div>
      <div className="flex flex-col items-center gap-3 border-b border-line px-6 pt-10 pb-7 text-center">
        <Avatar user={me} size={72} />
        <div>
          <p className="text-lg font-semibold tracking-tight">{me.name}</p>
          <p className="text-sm text-muted">{me.pronouns ? `${me.pronouns}, ` : ""}{me.title}</p>
        </div>
        <Button size="sm" onClick={() => { signOut(); router.replace("/"); }}>
          <SignOut size={16} /> Sign out
        </Button>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <TrayLink href="/account" icon={<UserCircle size={20} />} label="Profile and settings" />
        <TrayLink href="/inbox" icon={<TrayIcon size={20} />} label="Inbox" />
        <TrayLink href="/calendar" icon={<CalendarBlank size={20} />} label="Calendar" />
      </div>
      <div className="border-t border-line px-6 py-5">
        <p className="mb-3 text-[13px] font-medium">Appearance</p>
        <Segmented
          label="Theme"
          value={pref}
          onChange={(v) => { setPref(v); setTheme(v); }}
          options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]}
        />
      </div>
      <div className="border-t border-line px-6 py-5">
        <p className="text-[13px] font-medium">View muselearning as</p>
        <p className="mb-3 text-xs text-muted">Switch between demo people to see each role.</p>
        <div className="flex flex-col gap-1.5">
          {PERSONAS.map((p) => {
            const u = users.find((x) => x.id === p.id)!;
            const active = me.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  signIn(p.id);
                  close();
                  router.push("/dashboard");
                  push({ title: `Now viewing as ${u.name}`, body: p.label, tone: "info" });
                }}
                className={cn("flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors", active ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2")}
              >
                <Avatar user={u} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{u.name}</span>
                  <span className="block text-xs text-muted">{p.label}</span>
                </span>
                {active && <CheckCircle size={20} weight="fill" className="text-accent" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="border-t border-line px-6 py-5">
        <button
          onClick={() => {
            if (confirm("Reset all demo data? Your submissions, messages and edits will be replaced with the original sample data.")) {
              resetDemo();
              push({ title: "Demo data restored", tone: "info" });
            }
          }}
          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowCounterClockwise size={16} /> Reset demo data
        </button>
      </div>
    </div>
  );
}

function TrayLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2">
      <span className="text-muted">{icon}</span>
      {label}
    </Link>
  );
}

function CoursesTray() {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const courses = myCourses(data, me);
  return (
    <div>
      <TrayHeader title="Courses" action={<Link href="/courses" className="text-sm font-medium text-accent hover:underline">All courses</Link>} />
      <ul className="flex flex-col gap-1 p-3">
        {courses.map((c) => (
          <li key={c.id}>
            <Link href={`/courses/${c.id}`} className="group flex items-center gap-3 rounded-[10px] px-3 py-3 transition-colors hover:bg-surface-2">
              <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold group-hover:text-accent">{c.nickname ?? c.name}</span>
                <span className="block text-xs text-muted">
                  {c.code}, {c.term}
                  {roleIn(data, me, c.id) !== "student" ? `, ${roleIn(data, me, c.id) === "ta" ? "TA" : "Teaching"}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="px-6 pb-6 text-xs text-muted">Showing current enrollments for Fall 2026.</p>
    </div>
  );
}

const notifIcon = { grade: Exam, announcement: Megaphone, message: ChatCircleText, reply: ChatsCircle, due: WarningCircle };

function ActivityTray({ close }: { close: () => void }) {
  const me = useStore((s) => s.me);
  const notifications = useStore((s) => s.data.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const router = useRouter();
  const prefs = useNotifyPrefs();
  const mine = notifications.filter((n) => n.userId === me && wants(prefs, n)).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <TrayHeader title="Activity" action={mine.some((n) => !n.read) ? <button onClick={markAll} className="text-sm font-medium text-accent hover:underline">Mark all read</button> : undefined} />
      {mine.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-muted">Nothing new. Grades, announcements and replies will show up here.</div>
      ) : (
        <ul className="flex flex-col p-3">
          {mine.map((n) => {
            const Icon = notifIcon[n.kind];
            return (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markRead(n.id);
                    close();
                    router.push(n.href);
                  }}
                  className="flex w-full items-start gap-3 rounded-[10px] px-3 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", n.read ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent")}>
                    <Icon size={17} weight="bold" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", n.read ? "text-muted" : "font-semibold")}>{n.title}</span>
                    <span className="block truncate text-xs text-muted">{n.body}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-faint">{relative(n.at)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function HelpTray() {
  const rows: [string, ReactNode][] = [
    ["Search everything", <><Kbd>⌘</Kbd><Kbd>K</Kbd></>],
    ["Search (quick)", <Kbd key="s">/</Kbd>],
    ["Go to dashboard", <><Kbd>g</Kbd><Kbd>d</Kbd></>],
    ["Go to all courses", <><Kbd>g</Kbd><Kbd>l</Kbd></>],
    ["Go to calendar", <><Kbd>g</Kbd><Kbd>c</Kbd></>],
    ["Go to inbox", <><Kbd>g</Kbd><Kbd>i</Kbd></>],
    ["Go to account", <><Kbd>g</Kbd><Kbd>a</Kbd></>],
    ["Show this panel", <Kbd key="q">?</Kbd>],
    ["Close panels", <Kbd key="e">Esc</Kbd>],
  ];
  return (
    <div>
      <TrayHeader title="Help" />
      <div className="p-6">
        <p className="mb-3 text-[13px] font-medium">Keyboard shortcuts</p>
        <ul className="flex flex-col">
          {rows.map(([label, keys]) => (
            <li key={label} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted">{label}</span>
              <span className="flex gap-1">{keys}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex gap-3 rounded-[14px] bg-surface-2 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-muted" />
          <div className="text-sm">
            <p className="font-medium">Everything stays on this device</p>
            <p className="mt-1 text-muted">muselearning keeps courses, submissions and messages in your browser. Nothing is sent anywhere. Use Reset demo data in the Account panel to start over.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  const reduce = useReducedMotion();
  const icon = useCallback((tone: string) => (tone === "danger" ? <WarningCircle size={20} weight="fill" className="text-danger" /> : tone === "info" ? <Info size={20} weight="fill" className="text-info" /> : <CheckCircle size={20} weight="fill" className="text-success" />), []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-20 z-[80] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2 md:bottom-4">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-start gap-3 rounded-[14px] border border-line bg-surface p-4 shadow-pop"
            onClick={() => dismiss(t.id)}
          >
            {icon(t.tone)}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-sm text-muted">{t.body}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
