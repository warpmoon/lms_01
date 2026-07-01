"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// 1. 학생용 과제 지시서 및 본인의 제출 이력 조회
export async function getStudentAssignmentData(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;

  // 해당 강좌의 과제 지시서 조회
  const assignment = await prisma.assignment.findFirst({
    where: { courseId },
  });

  if (!assignment) {
    return {
      assignment: null,
      mySubmission: null,
    };
  }

  // 본인의 제출 이력 조회
  const mySubmission = await prisma.assignmentSubmission.findFirst({
    where: {
      assignmentId: assignment.id,
      userId,
    },
  });

  return {
    assignment,
    mySubmission,
  };
}

// 2. 학생 결과물 파일 업로드 및 과제 제출 (안전한 문서 확장자 검증 필터 장착)
export async function submitAssignmentFile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;

  const assignmentId = formData.get("assignmentId") as string;
  const courseId = formData.get("courseId") as string;
  const file = formData.get("file") as File;

  if (!assignmentId || !file) {
    throw new Error("전달받은 제출물 파일이 올바르지 않습니다.");
  }

  // 파일 정보 추출 및 확장자 보안 검사
  const originalName = file.name;
  const ext = originalName.split(".").pop()?.toLowerCase();
  
  const allowedExtensions = [
    "doc", "docx", // 워드
    "xls", "xlsx", // 엑셀
    "ppt", "pptx", // PPT
    "pdf",         // PDF
    "hwp", "hwpx", // 한글 한컴문서
    "show",        // 한쇼
    "cell"         // 한셀
  ];

  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error(
      "보안 정책에 따라 업로드 가능한 파일은 문서 파일(워드, 엑셀, PPT, PDF, 한글, 한쇼, 한셀)로 제한됩니다."
    );
  }

  // 로컬 업로드 폴더 준비
  const uploadDir = path.join(process.cwd(), "public", "uploads", "assignments");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 중복 파일 충돌 방지를 위해 CUID 혹은 타임스탬프를 더해 고유 파일명 생성
  const uniqueName = `${userId}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadDir, uniqueName);
  
  // 파일 버퍼 변환 및 로컬 디스크 저장
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/assignments/${uniqueName}`;

  // 기존 제출 이력 확인
  const existingSub = await prisma.assignmentSubmission.findFirst({
    where: {
      assignmentId,
      userId,
    },
  });

  if (existingSub) {
    // 덮어쓰기 (재제출) - 기존 로컬 파일 삭제 처리(선택적)
    try {
      const oldPath = path.join(process.cwd(), "public", existingSub.fileUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    } catch (e) {
      console.error("기존 파일 삭제 실패:", e);
    }

    await prisma.assignmentSubmission.update({
      where: { id: existingSub.id },
      data: {
        fileUrl,
        fileName: originalName,
        score: null, // 재제출 시 점수 초기화
        feedback: null, // 재제출 시 피드백 초기화
        submittedAt: new Date(),
      },
    });
  } else {
    // 신규 과제 제출 레코드 생성
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        fileUrl,
        fileName: originalName,
      },
    });
  }

  revalidatePath(`/classroom/${courseId}/assignment`);
}
