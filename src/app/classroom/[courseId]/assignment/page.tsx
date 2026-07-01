import { getStudentAssignmentData } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssignmentForm from "./AssignmentForm";

interface StudentAssignmentPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function StudentAssignmentPage({ params }: StudentAssignmentPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Next.js 15+ 규격의 비동기 params 처리
  const { courseId } = await params;

  // 학생용 과제 및 제출 상태 로드
  const { assignment, mySubmission } = await getStudentAssignmentData(courseId);

  return (
    <AssignmentForm
      courseId={courseId}
      assignment={assignment}
      mySubmission={mySubmission}
    />
  );
}
