"use client";

import Link from "next/link";
import styles from "./CourseHome.module.css";

interface Lesson {
  id: string;
  title: string;
  order: number;
  duration: number;
}

interface Exam {
  id: string;
  title: string;
  timeLimit: number;
}

interface Assignment {
  id: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
  thumbnail: string | null;
  instructor: { name: string | null };
  category: { name: string } | null;
  lessons: Lesson[];
  exams: Exam[];
  assignments: Assignment[];
}

interface ProgressEntry {
  isCompleted: boolean;
  lastPosition: number;
}

interface CourseHomeProps {
  courseId: string;
  course: Course;
  progressMap: Record<string, ProgressEntry>;
  hasAccess: boolean;
  totalLessons: number;
  completedCount: number;
  progressPercent: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}초`;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

export default function CourseHome({
  courseId,
  course,
  progressMap,
  hasAccess,
  totalLessons,
  completedCount,
  progressPercent,
}: CourseHomeProps) {
  // 수강 권한 없음 처리
  if (!hasAccess) {
    return (
      <div style={{ padding: "2rem" }}>
        <div className={styles.noAccessCard}>
          <h2>🔒 수강 권한이 없습니다</h2>
          <p>
            이 강좌를 시청하려면 먼저 수강 신청을 완료해야 합니다.
            <br />
            강좌 상세 페이지로 이동해 수강 신청 후 학습을 시작하세요.
          </p>
          <Link href={`/courses/${courseId}`} className={styles.enrollBtn}>
            수강 신청 바로가기
          </Link>
        </div>
      </div>
    );
  }

  // 이어볼 레슨: 미완료 중 가장 첫 번째 / 전부 완료면 첫 레슨
  const nextLesson =
    course.lessons.find((l) => !progressMap[l.id]?.isCompleted) ||
    course.lessons[0] ||
    null;

  const hasExam = course.exams.length > 0;
  const hasAssignment = course.assignments.length > 0;

  return (
    <div className={styles.container}>
      {/* ── 상단 히어로 배너 ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <div className={styles.heroMeta}>
              {course.category?.name || "강좌"} · {course.instructor.name || "강사 미정"}
            </div>
            <h1 className={styles.heroTitle}>{course.title}</h1>
            <p className={styles.heroInstructor}>
              강사: {course.instructor.name || "미정"} · 전체 {totalLessons}강
            </p>
          </div>

          {/* 진도율 위젯 */}
          <div className={styles.progressWidget}>
            <div className={styles.progressLabel}>내 학습 진도율</div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className={styles.progressNumbers}>
              <span>{completedCount} / {totalLessons} 강의 완료</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 본문: 커리큘럼 + 사이드바 ── */}
      <div className={styles.body}>
        {/* 커리큘럼 목록 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>강의 커리큘럼</h2>
            <span className={styles.lessonCount}>총 {totalLessons}강</span>
          </div>

          {course.lessons.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              등록된 강의가 없습니다.
            </div>
          ) : (
            course.lessons.map((lesson) => {
              const prog = progressMap[lesson.id];
              const isCompleted = prog?.isCompleted ?? false;
              const isInProgress = !isCompleted && (prog?.lastPosition ?? 0) > 0;

              return (
                <Link
                  key={lesson.id}
                  href={`/classroom/${courseId}/${lesson.id}`}
                  className={styles.lessonItem}
                >
                  {/* 순번 원형 아이콘 – 완료 시 체크 이모지 */}
                  <div className={`${styles.lessonNumber} ${isCompleted ? styles.completed : ""}`}>
                    {isCompleted ? "✓" : lesson.order}
                  </div>

                  <div className={styles.lessonInfo}>
                    <div className={styles.lessonTitle}>{lesson.title}</div>
                    {lesson.duration > 0 && (
                      <div className={styles.lessonDuration}>
                        {formatDuration(lesson.duration)}
                      </div>
                    )}
                  </div>

                  {isCompleted && (
                    <span className={styles.completedBadge}>완료</span>
                  )}
                  {isInProgress && (
                    <span className={styles.inProgressBadge}>이어보기</span>
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* 사이드바 */}
        <div className={styles.sidebar}>
          {/* 이어보기 CTA 카드 */}
          {nextLesson && (
            <Link
              href={`/classroom/${courseId}/${nextLesson.id}`}
              className={styles.ctaCard}
            >
              <div className={styles.ctaLabel}>
                {progressPercent > 0 ? "이어서 학습하기" : "첫 강의 시작하기"}
              </div>
              <div className={styles.ctaTitle}>{nextLesson.title}</div>
              <div className={styles.ctaArrow}>▶</div>
            </Link>
          )}

          {/* 시험 응시 카드 */}
          {hasExam && (
            <Link href={`/classroom/${courseId}/exam`} className={styles.linkCard}>
              <div className={styles.linkCardLeft}>
                <span className={styles.linkCardIcon}>📝</span>
                <div className={styles.linkCardText}>
                  <strong>온라인 시험 응시</strong>
                  <span>{course.exams[0].title} · {course.exams[0].timeLimit}분</span>
                </div>
              </div>
              <span className={styles.linkCardChevron}>›</span>
            </Link>
          )}

          {/* 과제 제출 카드 */}
          {hasAssignment && (
            <Link href={`/classroom/${courseId}/assignment`} className={styles.linkCard}>
              <div className={styles.linkCardLeft}>
                <span className={styles.linkCardIcon}>📎</span>
                <div className={styles.linkCardText}>
                  <strong>과제 제출</strong>
                  <span>{course.assignments[0].title}</span>
                </div>
              </div>
              <span className={styles.linkCardChevron}>›</span>
            </Link>
          )}

          {/* 강좌 상세 정보 링크 */}
          <Link href={`/courses/${courseId}`} className={styles.linkCard}>
            <div className={styles.linkCardLeft}>
              <span className={styles.linkCardIcon}>ℹ️</span>
              <div className={styles.linkCardText}>
                <strong>강좌 소개 보기</strong>
                <span>강사 소개 및 커리큘럼 안내</span>
              </div>
            </div>
            <span className={styles.linkCardChevron}>›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
