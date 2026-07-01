"use client";

import { useState } from "react";
import { createLesson, updateLesson, deleteLesson } from "./actions";
import styles from "./AdminLessons.module.css";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
}

interface LessonFormProps {
  courseId: string;
  courseTitle: string;
  lessons: Lesson[];
}

export default function LessonForm({ courseId, courseTitle, lessons }: LessonFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // 강의 입력 상태 (영상 길이는 분/초로 나누어 입력받음)
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationMin, setDurationMin] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [order, setOrder] = useState(lessons.length + 1);

  // 1. 신규 등록 모달 열기
  const handleOpenCreate = () => {
    setEditingLesson(null);
    setTitle("");
    setVideoUrl("");
    setDurationMin(0);
    setDurationSec(0);
    setOrder(lessons.length + 1);
    setIsOpen(true);
  };

  // 2. 수정 모달 열기
  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setVideoUrl(lesson.videoUrl);
    setDurationMin(Math.floor(lesson.duration / 60));
    setDurationSec(lesson.duration % 60);
    setOrder(lesson.order);
    setIsOpen(true);
  };

  // 3. 레슨 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("강의 제목을 입력해 주세요.");
      return;
    }
    if (!videoUrl.trim()) {
      alert("동영상 스트리밍 주소를 입력해 주세요.");
      return;
    }

    const totalDurationSeconds = durationMin * 60 + durationSec;
    if (totalDurationSeconds <= 0) {
      alert("영상의 길이는 1초 이상이어야 합니다.");
      return;
    }

    const data = {
      title: title,
      videoUrl: videoUrl,
      duration: totalDurationSeconds,
      order: order,
    };

    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, courseId, data);
        alert("강의 정보가 성공적으로 수정되었습니다.");
      } else {
        await createLesson(courseId, data);
        alert("신규 강의가 성공적으로 등록되었습니다.");
      }
      setIsOpen(false);
    } catch (error: any) {
      alert(error.message || "강의 저장 실패");
    }
  };

  // 4. 레슨 삭제
  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = confirm(`'${name}' 강의를 삭제하시겠습니까? 해당 수강생들의 진도 데이터도 함께 지워집니다.`);
    if (!confirmDelete) return;

    try {
      await deleteLesson(id, courseId);
      alert("강의가 삭제되었습니다.");
    } catch (error: any) {
      alert(error.message || "강의 삭제 실패");
    }
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}분 ${sec}초`;
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 상단 컨트롤 바 */}
      <div className={styles.topBar}>
        <div className={styles.titleSection}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <Link href="/admin/courses" className={styles.secondaryBtn} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
              ← 강좌 목록으로
            </Link>
            <span style={{ fontSize: "0.9rem", color: "#0070f3", fontWeight: "700" }}>강의 관리 도구</span>
          </div>
          <h1>{courseTitle}</h1>
          <p>챕터별 강의 동영상 스트리밍 주소 및 시청 소요 시간을 관리합니다.</p>
        </div>
        <button onClick={handleOpenCreate} className={styles.primaryBtn}>
          + 신규 강의 추가
        </button>
      </div>

      {/* 강의 리스트 테이블 */}
      <div className={styles.lessonListCard}>
        {lessons.length === 0 ? (
          <div className={styles.emptyState}>
            이 강좌에 등록된 세부 강의가 없습니다. 우측 상단의 '+ 신규 강의 추가' 버튼을 눌러 강의를 추가해 보세요!
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>순서</th>
                <th>강의 제목</th>
                <th>영상 재생 길이</th>
                <th>동영상 스트리밍 주소 (videoUrl)</th>
                <th style={{ width: "150px" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className={styles.row}>
                  <td>
                    <span className={styles.orderBadge}>{lesson.order}강</span>
                  </td>
                  <td style={{ fontWeight: "700" }}>{lesson.title}</td>
                  <td style={{ fontWeight: "600", color: "#4f566b" }}>
                    {formatDuration(lesson.duration)}
                  </td>
                  <td className={styles.videoLink}>{lesson.videoUrl}</td>
                  <td className={styles.actionCell}>
                    <button onClick={() => handleOpenEdit(lesson)} className={styles.editBtn}>
                      수정
                    </button>
                    <button onClick={() => handleDelete(lesson.id, lesson.title)} className={styles.deleteBtn}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 강의 추가/수정 모달창 */}
      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingLesson ? "강의 상세 정보 수정" : "신규 강의 추가"}</h3>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>강의 제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 1장. Next.js App Router 기초 다지기"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>동영상 스트리밍 주소 (videoUrl)</label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>영상 재생 길이 (분)</label>
                    <input
                      type="number"
                      value={durationMin}
                      onChange={(e) => setDurationMin(parseInt(e.target.value) || 0)}
                      min={0}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>영상 재생 길이 (초)</label>
                    <input
                      type="number"
                      value={durationSec}
                      onChange={(e) => setDurationSec(parseInt(e.target.value) || 0)}
                      min={0}
                      max={59}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ maxWidth: "200px" }}>
                  <label>강의 노출 순서 (정수)</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setIsOpen(false)} className={styles.secondaryBtn}>
                  취소
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingLesson ? "수정 완료" : "강의 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
