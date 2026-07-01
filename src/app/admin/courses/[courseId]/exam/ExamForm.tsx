"use client";

import { useState } from "react";
import Link from "next/link";
import { createOrUpdateExam, createQuestion, deleteQuestion } from "./actions";
import styles from "./AdminExam.module.css";

interface Choice {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: "OX" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "DESCRIPTIVE";
  content: string;
  score: number;
  correctAnswer: string | null;
  choices: Choice[];
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  passingScore: number;
  questions: Question[];
}

interface ExamFormProps {
  courseId: string;
  courseTitle: string;
  exam: Exam | null;
}

export default function ExamForm({ courseId, courseTitle, exam }: ExamFormProps) {
  // 1. 시험지 기본 설정 폼 상태
  const [examSetup, setExamSetup] = useState({
    title: exam?.title || `${courseTitle} 온라인 시험`,
    description: exam?.description || "본 강좌 수료를 위한 최종 평가 시험입니다.",
    duration: exam?.duration || 60,
    passingScore: exam?.passingScore || 60,
  });

  const [isSetupSaving, setIsSetupSaving] = useState(false);

  // 2. 문항 출제 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. 신규 문제 데이터 폼 상태
  const [qType, setQType] = useState<"OX" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "DESCRIPTIVE">("MULTIPLE_CHOICE");
  const [qContent, setQContent] = useState("");
  const [qScore, setQScore] = useState(10);
  const [qCorrectAnswer, setQCorrectAnswer] = useState(""); // 단답/서술형용

  // 객관식 선택지 상태 (기본 4지선다)
  const [multipleChoices, setMultipleChoices] = useState<
    { content: string; isCorrect: boolean }[]
  >([
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ]);

  // OX 정답 선택 상태 (true 이면 O가 정답, false 이면 X가 정답)
  const [oxAnswer, setOxAnswer] = useState<boolean | null>(null);

  // 시험지 기본 설정 저장
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examSetup.title.trim()) {
      alert("시험 제목을 입력해 주세요.");
      return;
    }
    if (examSetup.duration <= 0 || examSetup.passingScore < 0) {
      alert("시간 및 기준 점수를 올바르게 설정해 주세요.");
      return;
    }

    setIsSetupSaving(true);
    try {
      await createOrUpdateExam(courseId, examSetup);
      alert("시험지 설정 정보가 성공적으로 반영되었습니다.");
      window.location.reload(); // 최신 시험지 ID 바인딩을 위한 리로드
    } catch (error: any) {
      alert(error.message || "설정 저장 실패");
    } finally {
      setIsSetupSaving(false);
    }
  };

  // 문제 출제 모달 열기
  const handleOpenModal = () => {
    if (!exam) {
      alert("먼저 상단의 시험지 기본 설정을 저장하여 시험지를 생성해 주세요.");
      return;
    }
    setQType("MULTIPLE_CHOICE");
    setQContent("");
    setQScore(10);
    setQCorrectAnswer("");
    setMultipleChoices([
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ]);
    setOxAnswer(null);
    setIsModalOpen(true);
  };

  // 객관식 선택지 추가
  const handleAddChoiceOption = () => {
    setMultipleChoices([...multipleChoices, { content: "", isCorrect: false }]);
  };

  // 객관식 선택지 제거
  const handleRemoveChoiceOption = (index: number) => {
    if (multipleChoices.length <= 2) {
      alert("객관식 문제는 최소 2개 이상의 선택지가 필요합니다.");
      return;
    }
    setMultipleChoices(multipleChoices.filter((_, idx) => idx !== index));
  };

  // 객관식 특정 선택지 정답 마킹 처리
  const handleMarkCorrectChoice = (index: number) => {
    setMultipleChoices(
      multipleChoices.map((choice, idx) => ({
        ...choice,
        isCorrect: idx === index,
      }))
    );
  };

  // 문항 삭제
  const handleDeleteQuestion = async (questionId: string) => {
    const confirmDelete = confirm("이 문제를 시험지에서 완전히 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      await deleteQuestion(questionId, courseId);
      alert("문제가 삭제되었습니다.");
    } catch (error: any) {
      alert(error.message || "문제 삭제 실패");
    }
  };

  // 문항 저장 서밋
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qContent.trim()) {
      alert("문제 질문 내용을 입력해 주세요.");
      return;
    }
    if (qScore <= 0) {
      alert("배점은 1점 이상이어야 합니다.");
      return;
    }

    // 유형별 데이터 빌드 및 검증
    let payloadChoices: { content: string; isCorrect: boolean }[] = [];
    let payloadCorrectAnswer = "";

    if (qType === "OX") {
      if (oxAnswer === null) {
        alert("O 또는 X 중 어느 것이 정답인지 골라 주세요.");
        return;
      }
      payloadChoices = [
        { content: "O", isCorrect: oxAnswer === true },
        { content: "X", isCorrect: oxAnswer === false },
      ];
    } else if (qType === "MULTIPLE_CHOICE") {
      const anyEmpty = multipleChoices.some((c) => !c.content.trim());
      if (anyEmpty) {
        alert("모든 선택지 입력란을 작성해 주세요.");
        return;
      }
      const hasCorrect = multipleChoices.some((c) => c.isCorrect);
      if (!hasCorrect) {
        alert("선택지 중 최소 1개는 동그라미 라디오를 눌러 정답으로 체크해야 합니다.");
        return;
      }
      payloadChoices = multipleChoices;
    } else if (qType === "SHORT_ANSWER") {
      if (!qCorrectAnswer.trim()) {
        alert("단답형 주관식 정답을 입력해 주세요.");
        return;
      }
      payloadCorrectAnswer = qCorrectAnswer;
    } else if (qType === "DESCRIPTIVE") {
      // 서술형은 모범답안을 안 적어도 통과하되 가이드로 남김
      payloadCorrectAnswer = qCorrectAnswer;
    }

    setIsSubmitting(true);
    try {
      await createQuestion(exam!.id, courseId, {
        type: qType,
        content: qContent,
        score: qScore,
        correctAnswer: payloadCorrectAnswer,
        choices: payloadChoices,
      });
      alert("신규 문제가 성공적으로 출제되었습니다.");
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || "문제 등록 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 상단 네비 바 */}
      <div className={styles.topBar}>
        <div className={styles.titleSection}>
          <h1>온라인 시험 출제 매니저</h1>
          <p>[{courseTitle}] 강좌에 귀속된 최종 평가 시험지를 조율하고 문제를 배포합니다.</p>
        </div>
        <Link href="/admin/courses" className={styles.backBtn}>
          강좌 목록으로
        </Link>
      </div>

      {/* 1. 시험 설정 카드 */}
      <form onSubmit={handleSaveSetup} className={styles.setupCard}>
        <h2>시험지 기본 규격 및 타이머 설정</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label>시험지 제목</label>
            <input
              type="text"
              value={examSetup.title}
              onChange={(e) => setExamSetup({ ...examSetup, title: e.target.value })}
              placeholder="예: Next.js 마스터 최종 성취도 평가"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>시험 제한 시간 (분)</label>
            <input
              type="number"
              value={examSetup.duration}
              onChange={(e) => setExamSetup({ ...examSetup, duration: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>합격 기준 점수 (100점 만점 기준 등)</label>
            <input
              type="number"
              value={examSetup.passingScore}
              onChange={(e) => setExamSetup({ ...examSetup, passingScore: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className={styles.inputGroup} style={{ marginBottom: "1.25rem" }}>
          <label>시험 설명 및 주의사항</label>
          <textarea
            value={examSetup.description}
            onChange={(e) => setExamSetup({ ...examSetup, description: e.target.value })}
            rows={2}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className={styles.saveBtn} disabled={isSetupSaving}>
            {isSetupSaving ? "저장 중..." : "시험지 기본설정 저장"}
          </button>
        </div>
      </form>

      {/* 2. 출제 문제 리스트 영역 */}
      <div className={styles.questionsSection}>
        <div className={styles.sectionHeader}>
          <h2>
            출제된 시험 문제 목록 (총 {exam?.questions.length || 0}문항,{" "}
            {(exam?.questions || []).reduce((acc, cur) => acc + cur.score, 0)}점 배점)
          </h2>
          <button onClick={handleOpenModal} className={styles.addBtn}>
            + 신규 문항 출제
          </button>
        </div>

        {!exam ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#718096" }}>
            상단의 시험지 설정을 먼저 저장하여 시험지를 개설해 주세요.
          </div>
        ) : exam.questions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#718096" }}>
            아직 출제된 문제가 존재하지 않습니다. 우측 상단 '+ 신규 문항 출제' 단추를 눌러 문제를 등록해 주세요.
          </div>
        ) : (
          <div className={styles.questionList}>
            {exam.questions.map((q, qIdx) => (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.qHeader}>
                  <div className={styles.qTitle}>
                    <span>Q{qIdx + 1}.</span>
                    <span className={styles.typeBadge}>
                      {q.type === "OX"
                        ? "OX 문제"
                        : q.type === "MULTIPLE_CHOICE"
                        ? "객관식"
                        : q.type === "SHORT_ANSWER"
                        ? "주관식 단답"
                        : "서술형"}
                    </span>
                    <span className={styles.scoreBadge}>[{q.score}점]</span>
                    <span style={{ fontWeight: "600", marginLeft: "0.5rem" }}>{q.content}</span>
                  </div>
                  <button onClick={() => handleDeleteQuestion(q.id)} className={styles.deleteQBtn}>
                    문제 삭제
                  </button>
                </div>

                {/* 문제 유형별 렌더링 */}
                {(q.type === "OX" || q.type === "MULTIPLE_CHOICE") && (
                  <div className={styles.choicesList}>
                    {q.choices.map((choice, cIdx) => (
                      <div
                        key={choice.id}
                        className={`${styles.choiceItem} ${choice.isCorrect ? styles.correctChoice : ""}`}
                      >
                        {cIdx + 1}. {choice.content} {choice.isCorrect && " (정답)"}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "SHORT_ANSWER" && (
                  <div className={styles.shortAnswerView}>
                    🔑 <strong>단답형 정답:</strong>{" "}
                    <span style={{ color: "#2b6cb0", fontWeight: "700" }}>{q.correctAnswer}</span>
                  </div>
                )}

                {q.type === "DESCRIPTIVE" && (
                  <div className={styles.shortAnswerView}>
                    📝 <strong>서술형 채점 가이드 / 모범 답안:</strong>{" "}
                    <span style={{ color: "#4a5568" }}>{q.correctAnswer || "지정되지 않음"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. 신규 문항 출제 모달창 */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSubmitQuestion} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>신규 시험 문제 출제</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* 문제 유형 선택 */}
              <div className={styles.formGroup}>
                <label>문제 유형</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as any)}
                >
                  <option value="MULTIPLE_CHOICE">객관식 (N개 선택지)</option>
                  <option value="OX">OX 찬반 문제</option>
                  <option value="SHORT_ANSWER">주관식 단답형</option>
                  <option value="DESCRIPTIVE">주관식 서술형</option>
                </select>
              </div>

              {/* 질문 내용 입력 */}
              <div className={styles.formGroup}>
                <label>질문 내용</label>
                <textarea
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  placeholder="예: Next.js의 App Router에서 기본적으로 생성되는 모든 컴포넌트의 타입은 무엇인가요?"
                  rows={3}
                />
              </div>

              {/* 문제 배점 */}
              <div className={styles.formGroup}>
                <label>문제 배점 (점)</label>
                <input
                  type="number"
                  value={qScore}
                  onChange={(e) => setQScore(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* 유형별 상세 입력 렌더링 */}
              {qType === "OX" && (
                <div className={styles.formGroup}>
                  <label>정답 지정 (O 또는 X를 참 정답으로 선택)</label>
                  <div style={{ display: "flex", gap: "2rem", marginTop: "0.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="ox-correct"
                        checked={oxAnswer === true}
                        onChange={() => setOxAnswer(true)}
                      />
                      O (참)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="ox-correct"
                        checked={oxAnswer === false}
                        onChange={() => setOxAnswer(false)}
                      />
                      X (거짓)
                    </label>
                  </div>
                </div>
              )}

              {qType === "MULTIPLE_CHOICE" && (
                <div className={styles.formGroup}>
                  <label>선택지 목록 입력 및 정답 체크</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                    {multipleChoices.map((choice, index) => (
                      <div key={index} className={styles.choiceInputRow}>
                        <input
                          type="radio"
                          name="correct-choice-radio"
                          checked={choice.isCorrect}
                          onChange={() => handleMarkCorrectChoice(index)}
                          className={styles.choiceRadio}
                          title="이 선택지를 정답으로 지정"
                        />
                        <input
                          type="text"
                          value={choice.content}
                          onChange={(e) =>
                            setMultipleChoices(
                              multipleChoices.map((c, idx) =>
                                idx === index ? { ...c, content: e.target.value } : c
                              )
                            )
                          }
                          placeholder={`선지 ${index + 1}번 내용`}
                          className={styles.choiceText}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveChoiceOption(index)}
                          className={styles.removeChoiceBtn}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddChoiceOption}
                      className={styles.addChoiceOptionBtn}
                    >
                      + 선택지 추가
                    </button>
                  </div>
                </div>
              )}

              {qType === "SHORT_ANSWER" && (
                <div className={styles.formGroup}>
                  <label>단답형 정답 (공백 없는 텍스트 입력 권장)</label>
                  <input
                    type="text"
                    value={qCorrectAnswer}
                    onChange={(e) => setQCorrectAnswer(e.target.value)}
                    placeholder="예: 서버컴포넌트"
                  />
                </div>
              )}

              {qType === "DESCRIPTIVE" && (
                <div className={styles.formGroup}>
                  <label>서술형 채점 가이드 / 모범 답안 예시 (수동 채점 참고용)</label>
                  <textarea
                    value={qCorrectAnswer}
                    onChange={(e) => setQCorrectAnswer(e.target.value)}
                    placeholder="예: React Server Component(RSC)가 기본값이며, 서버 사이드 렌더링에 이점을 지닙니다..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.cancelBtn}
              >
                취소
              </button>
              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? "등록 중..." : "문제 출제완료"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
