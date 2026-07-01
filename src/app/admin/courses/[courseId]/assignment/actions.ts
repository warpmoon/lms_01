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

// 1. 강좌별 과제 출제 정보 및 학생 결과물 제출 목록 전체 로드
export async function getAssignmentDetails(courseId: string) {
  await requireAdmin();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  if (!course) {
    throw new Error("강좌를 찾을 수 없습니다.");
  }

  // 과제 지시서 로드 (1강좌 1과제 혹은 다중 과제 가능하도록 하되, 여기서는 대표 1과제 체제로 처리)
  const assignment = await prisma.assignment.findFirst({
    where: { courseId },
    include: {
      submissions: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  return {
    courseTitle: course.title,
    assignment,
  };
}

// 2. 과제 출제 지시서 생성 혹은 수정 (텍스트 설명, 참고 이미지, 첨부파일 포함)
export async function createOrUpdateAssignment(
  courseId: string,
  data: {
    title: string;
    content: string;
    imageUrl?: string;
    fileUrl?: string;
  }
) {
  await requireAdmin();

  if (!data.title.trim()) {
    throw new Error("과제 제목을 입력해 주세요.");
  }
  if (!data.content.trim()) {
    throw new Error("과제 수행 내용을 설명해 주세요.");
  }

  const existing = await prisma.assignment.findFirst({
    where: { courseId },
  });

  const payload = {
    title: data.title.trim(),
    content: data.content.trim(),
    imageUrl: data.imageUrl?.trim() || null,
    fileUrl: data.fileUrl?.trim() || null,
  };

  if (existing) {
    await prisma.assignment.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.assignment.create({
      data: {
        courseId,
        ...payload,
      },
    });
  }

  revalidatePath(`/admin/courses/${courseId}/assignment`);
}

// 3. 학생 제출 결과물 수동 평가 채점 및 피드백 부여
export async function gradeAssignmentSubmission(
  submissionId: string,
  courseId: string,
  data: {
    score: number;
    feedback: string;
  }
) {
  await requireAdmin();

  if (data.score < 0 || data.score > 100) {
    throw new Error("과제 점수는 0점 이상 100점 이하여야 합니다.");
  }

  await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score: data.score,
      feedback: data.feedback.trim() || null,
    },
  });

  revalidatePath(`/admin/courses/${courseId}/assignment`);
}
