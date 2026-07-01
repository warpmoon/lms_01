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

// 1. 전체 주문(결제) 내역 상세 조회 (구매자 정보 및 중첩 구매 아이템 포함)
export async function getAllOrders() {
  await requireAdmin();

  return await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          course: {
            select: { id: true, title: true },
          },
          book: {
            select: { id: true, title: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// 2. 결제 주문 취소(환불) 처리 및 해당 유저의 강좌 수강 권한 일괄 즉각 회수
export async function cancelOrderAndRevokeAccess(orderId: string) {
  await requireAdmin();

  // 대상 주문 확인 및 포함된 강좌 목록/유저 ID 확보
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
    },
  });

  if (!order) {
    throw new Error("주문 내역을 찾을 수 없습니다.");
  }

  if (order.status === "CANCELLED") {
    throw new Error("이미 취소된 주문입니다.");
  }

  const userId = order.userId;
  
  // 주문 내역 중 강좌(Course) 상품들의 ID 추출
  const courseIds = order.orderItems
    .filter((item) => item.courseId !== null)
    .map((item) => item.courseId as string);

  // 원자적 트랜잭션 진행
  await prisma.$transaction(async (tx) => {
    // 1. 주문 상태를 CANCELLED로 변경
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    // 2. 주문에 강좌가 포함되어 있었던 경우, 해당 학생의 진도(Progress) 데이터 전부 삭제
    if (courseIds.length > 0) {
      // 해당 강좌들에 속한 모든 강의(Lesson)의 ID 조회
      const lessons = await tx.lesson.findMany({
        where: {
          courseId: { in: courseIds },
        },
        select: { id: true },
      });

      const lessonIds = lessons.map((l) => l.id);

      if (lessonIds.length > 0) {
        // 해당 학생의 진도 레코드 일괄 삭제 (수강 권한 박탈)
        await tx.progress.deleteMany({
          where: {
            userId: userId,
            lessonId: { in: lessonIds },
          },
        });
      }
    }
  });

  revalidatePath("/admin/orders");
}
