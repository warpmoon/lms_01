"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    throw new Error("Unauthorized: Admin privilege required");
  }
}

// 1. 실시간 대시보드 통계 지표 집계
export async function getAdminDashboardStats() {
  await requireAdmin();

  // 오늘 자정 시각 (KST 로컬 타임존 반영 기준 등 고려)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 병렬 쿼리 수행
  const [totalUsers, totalCourses, todaySalesSum, unansweredQna] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfToday,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.post.count({
      where: {
        type: "QNA",
      },
    }),
  ]);

  return {
    totalUsers,
    totalCourses,
    todaySales: todaySalesSum._sum.amount || 0,
    unansweredQna,
  };
}

// 최근 활동 이벤트 인터페이스 정의
export interface AdminActivity {
  id: string;
  time: Date;
  content: string;
  status: "SUCCESS" | "INFO" | "WARNING";
}

// 2. 최근 회원 활동 다각도 병합 타임라인 조회 (최대 10건)
export async function getAdminRecentActivities(): Promise<AdminActivity[]> {
  await requireAdmin();

  // 최근 데이터 병렬 fetch
  const [recentUsers, recentOrders, recentPosts] = await Promise.all([
    // [A] 최근 가입한 유저 5명
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    // [B] 최근 결제 성공한 주문 5건
    prisma.order.findMany({
      take: 5,
      where: { status: "COMPLETED" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // [C] 최근 작성된 Q&A/수강후기 글 5건
    prisma.post.findMany({
      take: 5,
      include: {
        user: {
          select: { name: true, email: true },
        },
        course: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activities: AdminActivity[] = [];

  // 가입 활동 매핑
  recentUsers.forEach((user) => {
    activities.push({
      id: `user-${user.id}`,
      time: user.createdAt,
      content: `새로운 회원 '${user.name || user.email}' 님이 가입했습니다.`,
      status: "SUCCESS",
    });
  });

  // 결제 완료 활동 매핑
  recentOrders.forEach((order) => {
    activities.push({
      id: `order-${order.id}`,
      time: order.createdAt,
      content: `'${order.user.name || order.user.email}' 님이 ${order.amount.toLocaleString()}원 결제를 완료했습니다.`,
      status: "INFO",
    });
  });

  // 게시글 작성 활동 매핑
  recentPosts.forEach((post) => {
    const isQna = post.type === "QNA";
    const isNotice = post.type === "NOTICE";
    const targetDesc = post.course ? `'${post.course.title}' 강좌에 ` : "";

    let content = "";
    if (isNotice) {
      content = `공지사항 [${post.boardCategory}] '${post.title}' 글이 등록되었습니다.`;
    } else {
      content = `'${post.user.name || post.user.email}' 님이 ${targetDesc}새 ${
        isQna ? "질문(Q&A)" : "수강 후기"
      }를 등록했습니다.`;
    }

    activities.push({
      id: `post-${post.id}`,
      time: post.createdAt,
      content,
      status: isNotice ? "SUCCESS" : (isQna ? "WARNING" : "SUCCESS"),
    });
  });

  // 최신 시간순(역순)으로 정렬하고 상위 8건만 반환
  return activities
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);
}
