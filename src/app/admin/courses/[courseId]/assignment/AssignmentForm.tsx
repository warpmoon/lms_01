"use client";

import { useState } from "react";
import Link from "next/link";
import { createOrUpdateAssignment, gradeAssignmentSubmission } from "./actions";
import styles from "./AdminAssignment.module.css";

interface Submission {
  id: string;
  fileUrl: string;
  fileName: string;
  score: number | null;
  feedback: string | null;
  submittedAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface Assignment {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  fileUrl: string | null;
  submissions: Submission[];
}

interface AssignmentFormProps {
  courseId: string;
  courseTitle: string;
  assignment: Assignment | null;
}

export default function AssignmentForm({ courseId, courseTitle, assignment }: AssignmentFormProps) {
  // 1. 과제 지시서 폼 상태
  const [setup, setSetup] = useState({
    title: assignment?.title || `${courseTitle} 과제 안내`,
    content: assignment?.content || "",
    imageUrl: assignment?.imageUrl || "",
    fileUrl: assignment?.fileUrl || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  // 2. 채점 모달 상태
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState(100);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  // 과제 지시서 등록/수정
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup.title.trim()) {
      alert("과제 제목을 입력해 주세요.");
      return;
    }
    if (!setup.content.trim()) {
      alert("과제 지시 내용을 상세히 기입해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await createOrUpdateAssignment(courseId, setup);
      alert("과제 지시서가 정상적으로 등록/수정되었습니다.");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "과제 저장 실패");
    } finally {
      setIsSaving(false);
    }
  };

  // 채점 팝업 열기
  const handleOpenGradeModal = (sub: Submission) => {
    setSelectedSub(sub);
    setGradeScore(sub.score !== null ? sub.score : 100);
    setGradeFeedback(sub.feedback || "");
  };

  // 채점 저장
  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    if (gradeScore < 0 || gradeScore > 100) {
      alert("점수는 0점에서 100점 사이로 기입해 주세요.");
      return;
    }

    setIsGrading(true);
    try {
      await gradeAssignmentSubmission(selectedSub.id, courseId, {
        score: gradeScore,
        feedback: gradeFeedback,
      });
      alert("과제 채점이 반영되었습니다.");
      setSelectedSub(null);
      
      // 화면 갱신
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "채점 실패");
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 상단바 */}
      <div className={styles.topBar}>
        <div className={styles.titleSection}>
          <h1>과제 개설 및 제출물 채점</h1>
          <p>[{courseTitle}] 강좌의 과제 지침을 배포하고 학생들이 업로드한 결과물을 검토합니다.</p>
        </div>
        <Link href="/admin/courses" className={styles.backBtn}>
          강좌 목록으로
        </Link>
      </div>

      {/* 1. 과제 지시서 개설 */}
      <form onSubmit={handleSaveSetup} className={styles.setupCard}>
        <h2>과제 지시서 작성</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup} style={{ gridColumn: "span 2" }}>
            <label>과제 제목</label>
            <input
              type="text"
              value={setup.title}
              onChange={(e) => setSetup({ ...setup, title: e.target.value })}
              placeholder="예: Next.js App Router 게시판 제작 제출 과제"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>설명용 이미지 주소 (선택 - CDN/절대주소)</label>
            <input
              type="text"
              value={setup.imageUrl}
              onChange={(e) => setSetup({ ...setup, imageUrl: e.target.value })}
              placeholder="예: /uploads/assignment-spec.png"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>템플릿/참고용 첨부파일 주소 (선택 - 절대주소)</label>
            <input
              type="text"
              value={setup.fileUrl}
              onChange={(e) => setSetup({ ...setup, fileUrl: e.target.value })}
              placeholder="예: /uploads/assignment-template.zip"
            />
          </div>
        </div>
        <div className={styles.inputGroup} style={{ marginBottom: "1.25rem" }}>
          <label>과제 상세 설명 및 요건</label>
          <textarea
            value={setup.content}
            onChange={(e) => setSetup({ ...setup, content: e.target.value })}
            rows={5}
            placeholder="학생이 과제방에 진입했을 때 수행할 작업과 업로드 요건에 대해 설명해 주세요."
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className={styles.saveBtn} disabled={isSaving}>
            {isSaving ? "저장 중..." : "과제 지시서 발행"}
          </button>
        </div>
      </form>

      {/* 2. 제출 결과물 채점 리스트 */}
      <div className={styles.submissionsSection}>
        <div className={styles.sectionHeader}>
          <h2>수강생 과제 제출 및 채점 현황 (총 {assignment?.submissions.length || 0}건 제출됨)</h2>
        </div>

        {!assignment ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#718096" }}>
            과제 지시서를 먼저 작성하여 발행하면 수강생 과제 제출 관리가 가능해집니다.
          </div>
        ) : assignment.submissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#718096" }}>
            아직 수강생이 제출한 과제물 결과물이 존재하지 않습니다.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>제출자</th>
                <th>이메일</th>
                <th>제출일시</th>
                <th>제출 파일 (결과물)</th>
                <th>점수 평가</th>
              </tr>
            </thead>
            <tbody>
              {assignment.submissions.map((sub) => {
                const dateStr = new Date(sub.submittedAt).toLocaleString("ko-KR");
                return (
                  <tr key={sub.id} className={styles.row}>
                    <td style={{ fontWeight: "700" }}>{sub.user.name || "미입력"}</td>
                    <td style={{ color: "#697386" }}>{sub.user.email}</td>
                    <td>{dateStr}</td>
                    <td>
                      <a href={sub.fileUrl} download={sub.fileName} className={styles.downloadLink}>
                        📁 {sub.fileName} (다운로드)
                      </a>
                    </td>
                    <td>
                      {sub.score !== null ? (
                        <span onClick={() => handleOpenGradeModal(sub)} className={styles.gradeBadge}>
                          {sub.score}점 (수정)
                        </span>
                      ) : (
                        <button onClick={() => handleOpenGradeModal(sub)} className={styles.gradeBtn}>
                          채점하기
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. 과제 채점 모달 팝업 */}
      {selectedSub && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSubmitGrade} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>[{selectedSub.user.name || selectedSub.user.email}] 과제 채점</h3>
              <button type="button" onClick={() => setSelectedSub(null)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>과제 획득 점수 (0 ~ 100점)</label>
                <input
                  type="number"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>
              <div className={styles.formGroup}>
                <label>평가 피드백 코멘트</label>
                <textarea
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="학생이 결과물을 확인할 수 있도록 상세한 피드백을 적어주세요."
                  rows={4}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setSelectedSub(null)} className={styles.cancelBtn}>
                취소
              </button>
              <button type="submit" className={styles.submitBtn} disabled={isGrading}>
                {isGrading ? "등록 중..." : "채점 완료"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
