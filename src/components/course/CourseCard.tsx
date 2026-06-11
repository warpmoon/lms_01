import Link from "next/link";
import styles from "./CourseCard.module.css";

interface CourseCardProps {
  course: any;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`} className={styles.card}>
      <div className={styles.thumbnail}>
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} />
        ) : (
          <div className={styles.placeholder}>No Image</div>
        )}
      </div>
      <div className={styles.content}>
        <span className={styles.category}>{course.category.name}</span>
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.instructor}>{course.instructor.name} 강사</p>
        <div className={styles.footer}>
          <span className={styles.price}>
            {course.price === 0 ? "무료" : `${course.price.toLocaleString()}원`}
          </span>
        </div>
      </div>
    </Link>
  );
}
