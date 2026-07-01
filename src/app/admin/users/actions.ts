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

// 1. 전체 가입 유저 목록 조회 (수강 중인 강좌 정보 포함)
export async function getAllUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      progresses: {
        select: {
          lesson: {
            select: {
              courseId: true,
              course: {
                select: { id: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 유저가 수강 중인 고유 강좌 정보 정돈하여 매핑
  return users.map((user) => {
    const courseMap = new Map();
    user.progresses.forEach((p) => {
      const course = p.lesson.course;
      if (course && !courseMap.has(course.id)) {
        courseMap.set(course.id, { id: course.id, title: course.title });
      }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      enrolledCourses: Array.from(courseMap.values()),
    };
  });
}

// 2. 권한 수동 부여 시 선택 가능한 전체 강좌 간략 목록 조회
export async function getAllCoursesList() {
  await requireAdmin();

  return await prisma.course.findMany({
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      title: "asc",
    },
  });
}

// 3. 유저 역할 수동 업데이트 (USER, INSTRUCTOR, ADMIN)
export async function updateUserRole(userId: string, newRole: "USER" | "INSTRUCTOR" | "ADMIN") {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin/users");
}

// 4. 수강 권한 수동 부여 (강좌 내 모든 강의에 대한 Progress 생성)
export async function grantCourseAccess(userId: string, courseId: string) {
  await requireAdmin();

  // 1. 해당 강좌의 모든 강의(Lesson) 조회
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true },
  });

  if (lessons.length === 0) {
    throw new Error("해당 강좌에 등록된 세부 강의(Lesson)가 없어 권한을 부여할 수 없습니다.");
  }

  // 2. 수강 진도(Progress) 일괄 생성
  await prisma.progress.createMany({
    data: lessons.map((lesson) => ({
      userId: userId,
      lessonId: lesson.id,
      isCompleted: false,
      lastPosition: 0,
    })),
    skipDuplicates: true, // 이미 수강 중인 경우 중복 에러 스킵
  });

  revalidatePath("/admin/users");
}

// 5. 수강 권한 수동 회수 (강좌 내 모든 강의에 대한 Progress 삭제)
export async function revokeCourseAccess(userId: string, courseId: string) {
  await requireAdmin();

  // 해당 강좌에 속한 강의들의 ID 목록 추출
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true },
  });

  const lessonIds = lessons.map((l) => l.id);

  // 수강생의 해당 강의 진도 데이터 일괄 삭제
  await prisma.progress.deleteMany({
    where: {
      userId: userId,
      lessonId: { in: lessonIds },
    },
  });

  revalidatePath("/admin/users");
}
