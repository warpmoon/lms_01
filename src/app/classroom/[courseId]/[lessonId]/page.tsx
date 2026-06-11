import { getLessonWithProgress } from "./actions";
import { notFound, redirect } from "next/navigation";
import VideoPlayer from "@/components/player/VideoPlayer";
import Link from "next/link";
import styles from "./LessonPage.module.css";
import { auth } from "@/lib/auth";

export default async function LessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const data = await getLessonWithProgress(params.courseId, params.lessonId);

  if (!data || !data.lesson) {
    notFound();
  }

  const { lesson, progress } = data;
  const { course } = lesson;

  return (
    <div className={styles.container}>
      <div className={styles.playerSection}>
        <VideoPlayer
          lessonId={lesson.id}
          videoUrl={lesson.videoUrl}
          initialPosition={progress?.lastPosition || 0}
        />
        <div className={styles.lessonInfo}>
          <h1>{lesson.title}</h1>
          <p>{course.title}</p>
        </div>
      </div>

      <div className={styles.playlistSection}>
        <h3>강의 목록</h3>
        <div className={styles.lessonList}>
          {course.lessons.map((item) => (
            <Link
              key={item.id}
              href={`/classroom/${params.courseId}/${item.id}`}
              className={`${styles.lessonItem} ${item.id === lesson.id ? styles.active : ""}`}
            >
              <span className={styles.order}>{item.order}</span>
              <span className={styles.title}>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
