import { getCourses } from "./actions";
import CourseCard from "@/components/course/CourseCard";
import styles from "./courses.module.css";

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>전체 강좌</h1>
        <p>KREDU의 다양한 강좌를 만나보세요.</p>
      </header>
      
      <div className={styles.grid}>
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <p className={styles.empty}>등록된 강좌가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
