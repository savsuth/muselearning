"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { roleIn } from "@/lib/logic";

export function useCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.me)!;
  const course = data.courses.find((c) => c.id === courseId);
  const role = course ? roleIn(data, me, course.id) : undefined;
  return { courseId, course, data, me, role, staff: role === "teacher" || role === "ta", teacher: role === "teacher" };
}
