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
  return session.user.id;
}

// 1. 전체 게시판 글 상세 조회 (작성자 정보 및 강좌 정보 매핑 포함)
export async function getAllPosts() {
  await requireAdmin();

  return await prisma.post.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// 2. 어드민 공지사항(NOTICE) 신규 글 작성
export async function createNoticePost(data: {
  title: string;
  content: string;
  boardCategory: string;
}) {
  const adminId = await requireAdmin();

  if (!data.title.trim()) {
    throw new Error("공지사항 제목을 입력해 주세요.");
  }
  if (!data.content.trim()) {
    throw new Error("공지사항 본문 내용을 입력해 주세요.");
  }

  await prisma.post.create({
    data: {
      type: "NOTICE",
      boardCategory: data.boardCategory.trim() || "공지",
      title: data.title.trim(),
      content: data.content.trim(),
      userId: adminId,
      courseId: null, // 특정 강좌가 아닌 전체 대상 공지
    },
  });

  revalidatePath("/admin/posts");
}

// 3. 학생 질문글(Q&A)에 답변 달기/수정
export async function replyToPost(postId: string, replyText: string) {
  await requireAdmin();

  if (!replyText.trim()) {
    throw new Error("답변 내용을 기입해 주세요.");
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      reply: replyText.trim(),
      repliedAt: new Date(),
    },
  });

  revalidatePath("/admin/posts");
}

// 4. 불건전한 게시글 강제 삭제
export async function deletePost(postId: string) {
  await requireAdmin();

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath("/admin/posts");
}
