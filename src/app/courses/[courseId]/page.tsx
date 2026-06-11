import { getCourseDetail } from "../actions";
import { notFound } from "next/navigation";
import styles from "./CourseDetail.module.css";

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = await getCourseDetail(params.courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.info}>
          <span className={styles.category}>{course.category.name}</span>
          <h1 className={styles.title}>{course.title}</h1>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.meta}>
            <div className={styles.instructor}>
              {course.instructor.image && <img src={course.instructor.image} alt={course.instructor.name} />}
              <span>{course.instructor.name} 강사</span>
            </div>
          </div>
        </div>
        <div className={styles.sidebar}>
          <div className={styles.purchaseBox}>
            <div className={styles.price}>
              {course.price === 0 ? "무료" : `${course.price.toLocaleString()}원`}
            </div>
            <button className={styles.buyButton}>수강 신청하기</button>
            <button className={styles.cartButton}>장바구니 담기</button>
          </div>
        </div>
      </div>

      <section className={styles.curriculum}>
        <h2>커리큘럼</h2>
        <div className={styles.lessonList}>
          {course.lessons.map((lesson: any, index: number) => (
            <div key={lesson.id} className={styles.lessonItem}>
              <span className={styles.lessonIndex}>{index + 1}</span>
              <span className={styles.lessonTitle}>{lesson.title}</span>
              <span className={styles.lessonDuration}>
                {Math.floor(lesson.duration / 60)}분
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
