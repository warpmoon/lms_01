"use client";

import { useState, useEffect } from "react";
import { submitExam } from "./actions";
import styles from "./ExamPage.module.css";
import Link from "next/link";

interface Choice {
  id: string;
  content: string;
  questionId: string;
}

interface Question {
  id: string;
  content: string;
  score: number;
  choices: Choice[];
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  passingScore: number;
  courseId: string;
  questions: Question[];
}

interface ExamFormProps {
  exam: Exam;
  courseId: string;
}

export default function ExamForm({ exam, courseId }: ExamFormProps) {
  const [step, setStep] = useState<"START" | "RUNNING" | "RESULT">("START");
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60); // 초 단위
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 1. 타이머 카운트다운 로직
  useEffect(() => {
    if (step !== "RUNNING") return;

    if (timeLeft <= 0) {
      // 시간 초과 시 즉시 자동 제출
      alert("제한 시간이 초과되어 답안지가 자동 제출됩니다.");
      handleAutoSubmit();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 2. 답안 선택 제어
  const handleSelectChoice = (questionId: string, choiceId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  // 3. 시험 시작
  const handleStart = () => {
    setStep("RUNNING");
  };

  // 4. 시간 초과 자동 제출
  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitExam(exam.id, answers);
      setResult(res);
      setStep("RESULT");
    } catch (error) {
      console.error(error);
      alert("답안 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. 수동 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 풀지 않은 문항 체크
    const unansweredCount = exam.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirmSubmit = confirm(
        `아직 풀지 않은 문제가 ${unansweredCount}개 있습니다. 이대로 제출하시겠습니까?`
      );
      if (!confirmSubmit) return;
    } else {
      const confirmSubmit = confirm("시험을 종료하고 답안지를 제출하시겠습니까?");
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitExam(exam.id, answers);
      setResult(res);
      setStep("RESULT");
    } catch (error) {
      console.error(error);
      alert("답안 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI 분기 렌더링 ---

  // [1] 시험 대기/시작 화면
  if (step === "START") {
    const totalScore = exam.questions.reduce((acc, q) => acc + q.score, 0);

    return (
      <div className={styles.startScreen}>
        <h1>{exam.title}</h1>
        <p>{exam.description || "이 강좌의 최종 성취도를 평가하기 위한 온라인 시험입니다."}</p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>제한 시간</span>
            <span className={styles.infoValue}>{exam.duration}분</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>총 문항 수</span>
            <span className={styles.infoValue}>{exam.questions.length}문제</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>과락 기준</span>
            <span className={styles.infoValue}>{exam.passingScore}점 / {totalScore}점</span>
          </div>
        </div>

        <button onClick={handleStart} className={styles.startButton}>
          시험 시작하기
        </button>
      </div>
    );
  }

  // [2] 시험 응시 진행 중 화면
  if (step === "RUNNING") {
    const totalQuestions = exam.questions.length;
    const solvedQuestions = Object.keys(answers).length;
    const isWarning = timeLeft < 60; // 1분 미만 남았을 시 경고

    return (
      <form onSubmit={handleSubmit}>
        <div className={styles.examHeader}>
          <div>
            <h2>{exam.title}</h2>
            <span style={{ fontSize: "0.9rem", color: "#697386" }}>
              진행 상황: {solvedQuestions} / {totalQuestions} 문제 풀이 완료
            </span>
          </div>
          <div className={`${styles.timer} ${isWarning ? styles.timerWarning : ""}`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        <div className={styles.questionList}>
          {exam.questions.map((question, index) => (
            <div key={question.id} className={styles.questionCard}>
              <h3 className={styles.questionTitle}>
                <span className={styles.questionScore}>{question.score}점</span>
                <span>Q{index + 1}. {question.content}</span>
              </h3>

              <div className={styles.choices}>
                {question.choices.map((choice, cIndex) => {
                  const isSelected = answers[question.id] === choice.id;

                  return (
                    <label
                      key={choice.id}
                      className={`${styles.choiceLabel} ${isSelected ? styles.choiceSelected : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectChoice(question.id, choice.id)}
                      />
                      <span>({cIndex + 1}) {choice.content}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.submitSection}>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? "제출 중..." : "답안지 제출하기"}
          </button>
        </div>
      </form>
    );
  }

  // [3] 채점 결과 출력 화면
  if (step === "RESULT" && result) {
    return (
      <div className={styles.resultScreen}>
        {result.isPassed ? (
          <div>
            <span className={`${styles.resultBadge} ${styles.pass}`}>Pass (합격)</span>
            <div className={styles.scoreWrapper}>
              <span className={styles.scoreText}>{result.score}</span>
              <span className={styles.scoreTotal}> / {result.totalScore}점</span>
            </div>
            <p className={styles.resultDesc}>
              축하합니다! 합격 기준인 <strong>{result.passingScore}점</strong>을 넘어서 시험에 합격하셨습니다.<br />
              본 강좌의 수료 조건을 모두 만족하셨다면 마이페이지나 어드민 단에서 수료증 발급이 가능합니다.
            </p>
          </div>
        ) : (
          <div>
            <span className={`${styles.resultBadge} ${styles.fail}`}>Fail (불합격)</span>
            <div className={styles.scoreWrapper}>
              <span className={styles.scoreText}>{result.score}</span>
              <span className={styles.scoreTotal}> / {result.totalScore}점</span>
            </div>
            <p className={styles.resultDesc}>
              아쉽게도 합격 기준인 <strong>{result.passingScore}점</strong>에 도달하지 못해 불합격하셨습니다.<br />
              강의 내용을 복습하신 후 언제든지 재시험에 응시해 보세요.
            </p>
          </div>
        )}

        <Link href={`/classroom/${courseId}`} className={styles.exitButton}>
          강의실로 돌아가기
        </Link>
      </div>
    );
  }

  return null;
}
