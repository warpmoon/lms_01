import { getCategoriesAndCourses, getInstructors } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseForm from "./CourseForm";
import styles from "./AdminCourses.module.css";

export default async function AdminCoursesPage() {
  const session = await auth();
  
  // 어드민 사용자 권한 차단 검사
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // 어드민 대시보드 강좌 제어 데이터 병렬 조회
  const [categoriesWithCourses, instructors] = await Promise.all([
    getCategoriesAndCourses(),
    getInstructors(),
  ]);

  // 카테고리 셀렉트 컴포넌트를 위한 단순 리스트 매핑
  const categoriesList = categoriesWithCourses.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  return (
    <div className={styles.container}>
      <CourseForm
        categories={categoriesList}
        instructors={instructors as any}
        categoriesWithCourses={categoriesWithCourses}
      />
    </div>
  );
}
