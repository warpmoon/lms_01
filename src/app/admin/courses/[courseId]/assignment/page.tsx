import { getAssignmentDetails } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssignmentForm from "./AssignmentForm";

interface AdminAssignmentPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function AdminAssignmentPage({ params }: AdminAssignmentPageProps) {
  const session = await auth();

  // 어드민 세션 권한 검증 (TypeScript as any 캐스팅 준수)
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // Next.js 15+ 규격의 비동기 params 처리
  const { courseId } = await params;

  // 강좌 과제 세부 정보 조회
  const { courseTitle, assignment } = await getAssignmentDetails(courseId);

  return (
    <AssignmentForm
      courseId={courseId}
      courseTitle={courseTitle}
      assignment={assignment as any}
    />
  );
}
