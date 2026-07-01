"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 1. 시험 데이터 로드 (보안상 정답(isCorrect) 정보 제외)
export async function getExamData(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const exam = await prisma.exam.findFirst({
    where: { courseId },
    include: {
      questions: {
        include: {
          choices: {
            select: {
              id: true,
              content: true,
              questionId: true,
              // isCorrect는 일부러 가져오지 않음 (보안)
            },
          },
        },
      },
    },
  });

  return exam;
}

// 2. 시험 답안지 제출 및 서버 사이드 정밀 채점
export async function submitExam(examId: string, answers: { [questionId: string]: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // 1. 정답지가 포함된 시험 정보 조회
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        include: {
          choices: true,
        },
      },
    },
  });

  if (!exam) throw new Error("Exam not found");

  let userScore = 0;
  let totalScore = 0;

  // 2. 채점 로직 진행
  exam.questions.forEach((question) => {
    totalScore += question.score;
    const userAnswerId = answers[question.id];

    // 정답 선지 찾기
    const correctChoice = question.choices.find((c) => c.isCorrect);

    if (correctChoice && userAnswerId === correctChoice.id) {
      userScore += question.score;
    }
  });

  // 3. 합격 여부 결정
  const isPassed = userScore >= exam.passingScore;

  // 4. DB에 제출 이력 저장 (Submission 생성)
  const submission = await prisma.submission.create({
    data: {
      score: userScore,
      isPassed: isPassed,
      userId: userId,
      examId: examId,
    },
  });

  return {
    submissionId: submission.id,
    score: userScore,
    totalScore: totalScore,
    passingScore: exam.passingScore,
    isPassed: isPassed,
  };
}
