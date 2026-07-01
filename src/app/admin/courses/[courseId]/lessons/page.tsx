import { getCourseAndLessons } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LessonForm from "./LessonForm";
import styles from "./AdminLessons.module.css";
import Link from "next/link";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminLessonsPage({ params }: PageProps) {
  const session = await auth();
  
  // 어드민 사용자 권한 차단 검사
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // Next.js 15+ 규격에 따른 params 비동기 처리
  const { courseId } = await params;

  // 강좌 정보 및 하위 레슨 목록 병렬/직렬 조회
  const courseWithLessons = await getCourseAndLessons(courseId);

  if (!courseWithLessons) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h1>강좌를 찾을 수 없습니다</h1>
          <p style={{ margin: "1.5rem 0" }}>요청하신 강좌 ID({courseId})에 해당하는 강좌 정보가 존재하지 않습니다.</p>
          <Link href="/admin/courses" className={styles.secondaryBtn}>
            강좌 목록으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <LessonForm
        courseId={courseId}
        courseTitle={courseWithLessons.title}
        lessons={courseWithLessons.lessons}
      />
    </div>
  );
}
