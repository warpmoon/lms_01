import { getCourseExamDetails } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamForm from "./ExamForm";

interface AdminExamPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function AdminExamPage({ params }: AdminExamPageProps) {
  const session = await auth();
  
  // 어드민 세션 권한 검증 (TypeScript as any 캐스팅 준수)
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // Next.js 15+ 규격의 비동기 params 처리
  const { courseId } = await params;

  // 특정 강좌의 시험 및 출제 정보 조회
  const { courseTitle, exam } = await getCourseExamDetails(courseId);

  return (
    <ExamForm
      courseId={courseId}
      courseTitle={courseTitle}
      exam={exam as any}
    />
  );
}
