import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function createOrder(courseId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 실제 운영 환경에서는 DB에서 강좌 가격을 다시 조회하여 amount를 검증해야 함
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.price !== amount) {
    throw new Error("Invalid course or price");
  }

  return await prisma.order.create({
    data: {
      userId: session.user.id,
      amount: amount,
      status: "PENDING",
      orderItems: {
        create: {
          price: amount,
          quantity: 1,
          courseId: courseId,
        },
      },
    },
  });
}

// 포트원 결제 취소 유틸 함수
async function cancelPayment(paymentId: string, reason: string) {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret || secret === "your-portone-api-secret-here") return;
  try {
    await fetch(`https://api.portone.io/payments/${paymentId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `PortOne ${secret}`,
      },
      body: JSON.stringify({ reason }),
    });
  } catch (error) {
    console.error("포트원 결제 취소 실패:", error);
  }
}

export async function verifyPayment(orderId: string, paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 1. DB에서 결제 대기 중인 주문 조회
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });

  if (!order) throw new Error("Order not found");

  const secret = process.env.PORTONE_API_SECRET;
  const isMockMode = !secret || secret === "your-portone-api-secret-here";

  if (isMockMode) {
    console.warn("⚠️ PORTONE_API_SECRET이 설정되지 않아 모킹 결제 검증을 실행합니다.");
  } else {
    try {
      // 2. 포트원 V2 결제 조회 API 호출
      const response = await fetch(`https://api.portone.io/payments/${paymentId}`, {
        headers: {
          "Authorization": `PortOne ${secret}`,
        },
      });

      if (!response.ok) {
        throw new Error("Portone payment search API failed");
      }

      const paymentData = await response.json();

      // 3. 결제 완료 상태(PAID) 및 금액 위변조 교차 검증
      const isPaid = paymentData.status === "PAID";
      const amountMatches = paymentData.amount?.total === order.amount;

      if (!isPaid || !amountMatches) {
        // 금액이 안 맞거나 결제 완료 상태가 아닐 시 자동 환불/취소 요청
        await cancelPayment(paymentId, "결제 금액 불일치 또는 미승인 상태 (위변조 의심)");
        throw new Error("Payment verification failed: Status mismatch or amount forgery detected");
      }
    } catch (error) {
      console.error("결제 검증 중 오류 발생:", error);
      throw error;
    }
  }

  // 4. 검증 성공 시 Prisma 트랜잭션을 통한 수강 승인 및 주문 상태 변경
  return await prisma.$transaction(async (tx) => {
    // [A] 주문 상태 완료로 변경
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        paymentId: paymentId,
      },
    });

    // [B] 주문한 강좌 ID 목록 추출
    const courseIds = order.orderItems
      .map((item) => item.courseId)
      .filter((id): id is string => !!id);

    if (courseIds.length > 0) {
      // [C] 해당 강좌들에 속한 모든 강의(Lesson) 조회
      const lessons = await tx.lesson.findMany({
        where: {
          courseId: { in: courseIds },
        },
        select: { id: true },
      });

      if (lessons.length > 0) {
        // [D] 각 강의별 진도율 트래킹 데이터(Progress) 생성 (수강 권한 활성화)
        await tx.progress.createMany({
          data: lessons.map((lesson) => ({
            userId: session.user!.id!,
            lessonId: lesson.id,
            isCompleted: false,
            lastPosition: 0,
          })),
          skipDuplicates: true, // 중복 수강 신청 방지
        });
      }
    }

    return updatedOrder;
  });
}
