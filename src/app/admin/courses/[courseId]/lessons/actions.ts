"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    throw new Error("Unauthorized: Admin privilege required");
  }
}

// 1. 강좌 기본 정보 및 레슨 목록 조회 (순서대로 정렬)
export async function getCourseAndLessons(courseId: string) {
  await requireAdmin();

  return await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });
}

// 2. 신규 강의(레슨) 추가
export async function createLesson(
  courseId: string,
  data: {
    title: string;
    videoUrl: string;
    duration: number; // 초 단위
    order: number;
  }
) {
  await requireAdmin();

  const lesson = await prisma.lesson.create({
    data: {
      title: data.title.trim(),
      videoUrl: data.videoUrl.trim(),
      duration: data.duration,
      order: data.order,
      courseId: courseId,
    },
  });

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses`);
  return lesson;
}

// 3. 강의 정보 수정
export async function updateLesson(
  lessonId: string,
  courseId: string,
  data: {
    title?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
  }
) {
  await requireAdmin();

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: data.title?.trim(),
      videoUrl: data.videoUrl?.trim(),
      duration: data.duration,
      order: data.order,
    },
  });

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses`);
  return lesson;
}

// 4. 강의 삭제
export async function deleteLesson(lessonId: string, courseId: string) {
  await requireAdmin();

  await prisma.lesson.delete({
    where: { id: lessonId },
  });

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses`);
}
