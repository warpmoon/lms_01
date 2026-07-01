"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCourseOverview(courseId: string) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!session?.user || !userId) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role as string | undefined;

  // 강좌 기본 정보 및 전체 레슨 목록 조회 (잘못된 ID 형식은 null 반환)
  let course;
  try {
    course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
        lessons: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, duration: true },
        },
        exams: {
          select: { id: true, title: true, timeLimit: true },
          take: 1,
        },
        assignments: {
          select: { id: true, title: true },
          take: 1,
        },
      },
    });
  } catch {
    // cuid 형식이 아닌 잘못된 ID 값으로 접근 시 PrismaClientValidationError 방어
    return null;
  }

  if (!course) return null;

  // ADMIN, INSTRUCTOR는 수강 권한 검사 없이 모든 강좌 접근 가능
  if (userRole !== "ADMIN" && userRole !== "INSTRUCTOR") {
    // 수강 권한 확인: 결제 완료된 주문에 해당 강좌가 포함되어 있는지 확인
    const enrollment = await prisma.orderItem.findFirst({
      where: {
        courseId,
        order: {
          userId,
          status: "COMPLETED",
        },
      },
    });

    if (!enrollment) {
      return { course, progressMap: {}, hasAccess: false };
    }
  }

  // 유저의 레슨별 진도 상태 일괄 조회
  const lessonIds = course.lessons.map((l) => l.id);
  const progressRecords = await prisma.progress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
    },
    select: {
      lessonId: true,
      isCompleted: true,
      lastPosition: true,
    },
  });

  // lessonId → progress 로 변환한 Map 생성
  const progressMap: Record<string, { isCompleted: boolean; lastPosition: number }> = {};
  progressRecords.forEach((p) => {
    progressMap[p.lessonId] = {
      isCompleted: p.isCompleted,
      lastPosition: p.lastPosition,
    };
  });

  // 전체 진도율 계산
  const totalLessons = course.lessons.length;
  const completedCount = progressRecords.filter((p) => p.isCompleted).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return {
    course,
    progressMap,
    hasAccess: true,
    totalLessons,
    completedCount,
    progressPercent,
  };
}
