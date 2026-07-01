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

// 1. 특정 강좌와 연계된 시험 상세(문제 풀 및 정답 여부 포함) 정보 로드
export async function getCourseExamDetails(courseId: string) {
  await requireAdmin();

  // 강좌 확인
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  if (!course) {
    throw new Error("강좌를 찾을 수 없습니다.");
  }

  // 시험지와 문제풀 로드 (어드민이므로 isCorrect 포함 로드)
  const exam = await prisma.exam.findFirst({
    where: { courseId },
    include: {
      questions: {
        include: {
          choices: {
            orderBy: {
              id: "asc",
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  return {
    courseTitle: course.title,
    exam,
  };
}

// 2. 시험지 기본 설정 생성 혹은 업데이트 (제한시간, 커트라인 등)
export async function createOrUpdateExam(
  courseId: string,
  data: {
    title: string;
    description: string;
    duration: number;
    passingScore: number;
  }
) {
  await requireAdmin();

  const existingExam = await prisma.exam.findFirst({
    where: { courseId },
  });

  if (existingExam) {
    // 기존 시험 설정 업데이트
    await prisma.exam.update({
      where: { id: existingExam.id },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        duration: data.duration,
        passingScore: data.passingScore,
      },
    });
  } else {
    // 신규 시험지 생성
    await prisma.exam.create({
      data: {
        courseId,
        title: data.title.trim(),
        description: data.description.trim(),
        duration: data.duration,
        passingScore: data.passingScore,
      },
    });
  }

  revalidatePath(`/admin/courses/${courseId}/exam`);
}

// 3. 문항 및 4대 유형별 선택지(OX, 객관식, 단답형, 서술형) 출제 등록
export async function createQuestion(
  examId: string,
  courseId: string,
  data: {
    type: "OX" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "DESCRIPTIVE";
    content: string;
    score: number;
    correctAnswer?: string;
    choices?: { content: string; isCorrect: boolean }[];
  }
) {
  await requireAdmin();

  if (!data.content.trim()) {
    throw new Error("문제 질문 내용을 입력해 주세요.");
  }

  // 트랜잭션으로 문제와 선택지를 묶어 저장
  await prisma.$transaction(async (tx) => {
    // 1. 문제 레코드 생성
    const question = await tx.question.create({
      data: {
        examId,
        type: data.type,
        content: data.content.trim(),
        score: data.score,
        correctAnswer:
          data.type === "SHORT_ANSWER" || data.type === "DESCRIPTIVE"
            ? data.correctAnswer?.trim() || null
            : null,
      },
    });

    // 2. 객관식 및 OX 선택지 일괄 등록
    if (data.type === "OX" || data.type === "MULTIPLE_CHOICE") {
      if (!data.choices || data.choices.length === 0) {
        throw new Error("객관식 및 OX 문제는 최소 1개 이상의 선택지를 추가해야 합니다.");
      }

      const hasCorrect = data.choices.some((c) => c.isCorrect);
      if (!hasCorrect) {
        throw new Error("선택지 중 최소 1개는 정답(isCorrect)으로 체크해야 합니다.");
      }

      await tx.choice.createMany({
        data: data.choices.map((choice) => ({
          questionId: question.id,
          content: choice.content.trim(),
          isCorrect: choice.isCorrect,
        })),
      });
    }
  });

  revalidatePath(`/admin/courses/${courseId}/exam`);
}

// 4. 출제된 문항 삭제
export async function deleteQuestion(questionId: string, courseId: string) {
  await requireAdmin();

  await prisma.question.delete({
    where: { id: questionId },
  });

  revalidatePath(`/admin/courses/${courseId}/exam`);
}
