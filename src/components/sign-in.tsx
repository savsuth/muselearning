"use client";

import { CourseCover } from "./course-cover";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChalkboardTeacher, GraduationCap, IconContext, Student } from "@phosphor-icons/react";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { INSTRUCTOR, ME, TA } from "@/lib/seed";
import { cn } from "@/lib/logic";
import { Avatar, MuseMark } from "./ui";

const roles = [
  { id: ME, role: "Student", blurb: "Five courses, work due this week, grades with feedback.", icon: Student },
  { id: INSTRUCTOR, role: "Instructor", blurb: "Teaches HCI and Web Development. Build modules, post, grade.", icon: ChalkboardTeacher },
  { id: TA, role: "Teaching assistant", blurb: "Assists in HCI and Web Development. Grading and office hours.", icon: GraduationCap },
];

export function SignIn() {
  const me = useStore((s) => s.me);
  const users = useStore((s) => s.data.users);
  const signIn = useStore((s) => s.signIn);
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (me) router.replace("/dashboard");
  }, [me, router]);

  const enter = (id: string) => {
    signIn(id);
    router.push("/dashboard");
  };

  const fade = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] as const } });

  return (
    <IconContext.Provider value={{ "aria-hidden": true }}>
    <div className="grid min-h-[100dvh] grid-cols-1 bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="flex items-center gap-2.5">
          <MuseMark size={34} />
          <span className="text-[17px] font-semibold tracking-[-0.02em]">muselearning</span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-12">
          <motion.h1 {...fade(0)} className="max-w-[14ch] text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-[56px]">
            Your semester, in one calm place.
          </motion.h1>
          <motion.p {...fade(1)} className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-muted">
            Courses, modules, assignments and grades, arranged so the next thing to do is always obvious.
          </motion.p>

          <motion.div {...fade(2)} className="mt-10 max-w-[520px]">
            <p className="mb-3 text-[13px] font-medium text-muted">Choose who to sign in as</p>
            <ul className="flex flex-col gap-2.5">
              {roles.map((r, i) => {
                const u = users.find((x) => x.id === r.id)!;
                const Icon = r.icon;
                return (
                  <motion.li key={r.id} {...fade(3 + i)}>
                    <button
                      onClick={() => enter(r.id)}
                      className="group flex w-full items-center gap-4 rounded-[14px] border border-line bg-surface p-4 text-left shadow-card transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:border-accent/50 hover:shadow-pop active:translate-y-0"
                    >
                      <span className="relative">
                        <Avatar user={u} size={44} />
                        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-surface text-accent ring-2 ring-surface">
                          <Icon size={14} weight="bold" />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="text-[15px] font-semibold">{u.name}</span>
                          <span className="text-xs text-muted">{r.role}</span>
                        </span>
                        <span className="mt-0.5 block text-sm text-muted">{r.blurb}</span>
                      </span>
                      <ArrowRight size={18} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        <p className="text-xs text-muted">Runs entirely in your browser. Sample data only.</p>
      </div>

      <CourseMosaic />
    </div>
    </IconContext.Provider>
  );
}

function CourseMosaic() {
  const courses = useStore((s) => s.data.courses);
  const reduce = useReducedMotion();
  const cols = [courses.filter((_, i) => i % 2 === 0), courses.filter((_, i) => i % 2 === 1)];
  return (
    <div className="relative hidden overflow-hidden bg-nav lg:block" aria-hidden>
      <div className="absolute inset-0 grid grid-cols-2 gap-5 px-10 xl:px-16">
        {cols.map((col, ci) => (
          <motion.div
            key={ci}
            className={cn("flex flex-col gap-5", ci === 1 ? "pt-40" : "-mt-16")}
            animate={reduce ? undefined : { y: ci === 0 ? [0, -40, 0] : [0, 40, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          >
            {[...col, ...col].map((c, i) => (
              <div key={`${c.id}-${i}`} className="relative h-[300px] shrink-0 overflow-hidden rounded-[14px]">
                <CourseCover course={c} />
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgb(8_8_12/0.6)] to-transparent" />
                <span className="absolute right-5 bottom-5 left-5 text-white">
                  <span className="block text-sm font-medium text-white/75">{c.code}</span>
                  <span className="block text-2xl leading-tight font-semibold tracking-[-0.02em]">{c.name}</span>
                </span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--nav),transparent_22%,transparent_78%,var(--nav))]" />
    </div>
  );
}
