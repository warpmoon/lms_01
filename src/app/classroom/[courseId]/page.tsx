import { getCourseOverview } from "./actions";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CourseHome from "./CourseHome";

interface ClassroomCoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function ClassroomCoursePage({ params }: ClassroomCoursePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Next.js 15+ 비동기 params 처리
  const { courseId } = await params;

  const data = await getCourseOverview(courseId);

  if (!data) {
    notFound();
  }

  const {
    course,
    progressMap,
    hasAccess,
    totalLessons = 0,
    completedCount = 0,
    progressPercent = 0,
  } = data;

  return (
    <CourseHome
      courseId={courseId}
      course={course as any}
      progressMap={progressMap}
      hasAccess={hasAccess}
      totalLessons={totalLessons}
      completedCount={completedCount}
      progressPercent={progressPercent}
    />
  );
}
