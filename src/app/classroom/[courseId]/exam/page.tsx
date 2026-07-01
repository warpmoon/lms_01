import { getExamData } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamForm from "./ExamForm";
import styles from "./ExamPage.module.css";
import Link from "next/link";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Next.js 15+ 규격에 따른 params 비동기 처리
  const { courseId } = await params;

  // 서버 사이드에서 시험 데이터 안전하게 프리로드
  const exam = await getExamData(courseId);

  // 등록된 시험이 없을 경우 예외 처리
  if (!exam) {
    return (
      <div className={styles.container}>
        <div className={styles.startScreen}>
          <h1>온라인 시험 안내</h1>
          <p style={{ margin: "2rem 0", fontSize: "1.15rem" }}>
            현재 이 강좌에는 등록된 온라인 시험지가 존재하지 않습니다.<br />
            수강 학습을 계속 진행하거나 강사에게 문의해 주세요.
          </p>
          <Link href={`/classroom/${courseId}`} className={styles.exitButton}>
            강의실로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ExamForm exam={exam as any} courseId={courseId} />
    </div>
  );
}
