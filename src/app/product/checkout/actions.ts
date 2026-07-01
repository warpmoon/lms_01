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

export async function verifyPayment(orderId: string, paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 1. 포트원 API를 통해 결제 정보 조회 (실제 구현 시 axios 등으로 포트원 서버에 확인)
  // 여기서는 시뮬레이션을 위해 성공으로 가정하고 DB 업데이트
  
  // 2. DB 업데이트
  return await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
      paymentId: paymentId,
    },
  });
}
