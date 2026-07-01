"use client";

import { useState } from "react";
import { submitAssignmentFile } from "./actions";
import styles from "./StudentAssignment.module.css";

interface Assignment {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  fileUrl: string | null;
}

interface Submission {
  id: string;
  fileUrl: string;
  fileName: string;
  score: number | null;
  feedback: string | null;
  submittedAt: Date;
}

interface AssignmentFormProps {
  courseId: string;
  assignment: Assignment | null;
  mySubmission: Submission | null;
}

export default function AssignmentForm({ courseId, assignment, mySubmission }: AssignmentFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assignment) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>과제 학습방</h1>
          <p>이 강좌에 등록된 과제가 아직 개설되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  // 과제 파일 제출
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("제출할 문서 파일을 선택해 주세요.");
      return;
    }

    const confirmSubmit = confirm(
      mySubmission
        ? "이미 제출한 내역이 있습니다. 기존 제출 파일을 삭제하고 덮어쓰시겠습니까?"
        : "작성한 결과물 과제를 제출하시겠습니까?"
    );
    if (!confirmSubmit) return;

    const formData = new FormData();
    formData.append("assignmentId", assignment.id);
    formData.append("courseId", courseId);
    formData.append("file", selectedFile);

    setIsSubmitting(true);
    try {
      await submitAssignmentFile(formData);
      alert("과제가 성공적으로 제출되었습니다.");
      setSelectedFile(null);
      
      // 상태 갱신 리로드
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "과제 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 허용 확장자 필터
  const allowedExtensions = ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.hwp,.hwpx,.show,.cell";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>과제 제출 및 피드백</h1>
        <p>강좌의 핵심 미션을 수행하고 작성 완료한 문서 결과물을 업로드하여 평가를 진행합니다.</p>
      </div>

      {/* 과제 세부 지시 사양 카드 */}
      <div className={styles.card}>
        <h2>{assignment.title}</h2>
        <div className={styles.descContent}>{assignment.content}</div>

        {/* 이미지 사양서가 첨부된 경우 */}
        {assignment.imageUrl && (
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.5rem" }}>
              ▼ 과제 가이드 이미지
            </span>
            <img src={assignment.imageUrl} alt="과제 가이드" className={styles.specImage} />
          </div>
        )}

        {/* 다운로드 템플릿 제공 시 */}
        {assignment.fileUrl && (
          <div>
            <a href={assignment.fileUrl} download className={styles.downloadBox}>
              💾 참고용 과제 템플릿 파일 다운로드
            </a>
          </div>
        )}
      </div>

      {/* 과제 제출 폼 */}
      <form onSubmit={handleFormSubmit} className={styles.submitSection}>
        <h3>과제 제출 및 파일 업로드</h3>
        <p className={styles.allowedHint} style={{ marginBottom: "1rem" }}>
          ※ 업로드 가능 확장자: 워드, 엑셀, PPT, PDF, 한글(hwp/hwpx), 한쇼, 한셀 문서 파일만 제한 허용
        </p>

        <div>
          <label className={styles.fileInputLabel}>
            파일 선택하기
            <input
              type="file"
              accept={allowedExtensions}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
          {selectedFile && <div className={styles.selectedFileName}>선택된 파일: {selectedFile.name}</div>}
        </div>

        <button type="submit" className={styles.uploadButton} disabled={!selectedFile || isSubmitting}>
          {isSubmitting ? "제출 처리 중..." : mySubmission ? "과제 재제출하기" : "과제 최종제출"}
        </button>
      </form>

      {/* 본인의 최근 제출 이력 및 채점 평가 결과 */}
      {mySubmission && (
        <div className={styles.card} style={{ marginTop: "2rem", borderTop: "4px solid #3182ce" }}>
          <h3>나의 최근 과제 제출 정보</h3>
          <div style={{ fontSize: "0.9rem", color: "#4a5568", marginTop: "0.5rem" }}>
            <ul>
              <li>
                <strong>제출 파일:</strong>{" "}
                <a href={mySubmission.fileUrl} download={mySubmission.fileName} className={styles.downloadLink}>
                  {mySubmission.fileName}
                </a>
              </li>
              <li>
                <strong>제출 일시:</strong> {new Date(mySubmission.submittedAt).toLocaleString("ko-KR")}
              </li>
            </ul>
          </div>

          {/* 채점 결과 피드백 노출 */}
          {mySubmission.score !== null ? (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <strong>과제 평가 결과 점수</strong>
                <span className={styles.scoreValue}>{mySubmission.score} / 100점</span>
              </div>
              {mySubmission.feedback && (
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#22543d", marginBottom: "0.4rem" }}>
                    강사 피드백 코멘트:
                  </div>
                  <div className={styles.feedbackBox}>{mySubmission.feedback}</div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.pendingBadge}>
              ⏳ 제출이 완료되었습니다. 강사 채점 및 피드백 대기 중입니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
