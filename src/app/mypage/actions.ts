"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 1. 유저의 수강 강좌 목록 조회 (결제 완료된 강좌)
export async function getMyEnrollments() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // COMPLETED 상태인 주문 중에서 강좌가 포함된 OrderItem 조회
  const completedOrders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
    },
    include: {
      orderItems: {
        where: {
          courseId: { not: null },
        },
        include: {
          course: {
            include: {
              category: true,
              instructor: true,
              lessons: {
                select: { id: true },
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

  // 중복 강좌 제거를 위해 Map 사용
  const courseMap = new Map();
  completedOrders.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (item.course && !courseMap.has(item.course.id)) {
        courseMap.set(item.course.id, item.course);
      }
    });
  });

  return Array.from(courseMap.values());
}

// 2. 유저의 전체 주문/결제 내역 조회
export async function getMyOrders() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await prisma.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      orderItems: {
        include: {
          course: true,
          book: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// 3. 유저의 강좌별 학습 진도율 리포트 조회
export async function getMyProgressReport() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // 먼저 유저가 수강하는 모든 강좌 조회
  const courses = await getMyEnrollments();

  const progressReport = await Promise.all(
    courses.map(async (course) => {
      // 1. 해당 강좌의 총 레슨 수
      const totalLessons = course.lessons.length;

      // 2. 해당 강좌에서 유저가 완료한 레슨 수
      const completedCount = await prisma.progress.count({
        where: {
          userId: userId,
          isCompleted: true,
          lesson: {
            courseId: course.id,
          },
        },
      });

      // 3. 진도율 계산
      const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // 4. 마지막 학습 일시 조회
      const lastProgress = await prisma.progress.findFirst({
        where: {
          userId: userId,
          lesson: {
            courseId: course.id,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          updatedAt: true,
        },
      });

      return {
        courseId: course.id,
        courseTitle: course.title,
        thumbnail: course.thumbnail,
        totalLessons,
        completedCount,
        percent,
        lastStudiedAt: lastProgress?.updatedAt || null,
      };
    })
  );

  return progressReport;
}
