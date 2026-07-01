import { getMyEnrollments, getMyOrders, getMyProgressReport } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./MyPage.module.css";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MyPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Next.js 15+ 규격에 맞추어 searchParams 비동기 처리
  const { tab = "courses" } = await searchParams;

  // 병렬 데이터 페칭을 통해 속도 최적화
  const [courses, orders, progressReport] = await Promise.all([
    getMyEnrollments(),
    getMyOrders(),
    getMyProgressReport(),
  ]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>마이페이지</h1>
        <p>환영합니다, <strong>{session.user?.name}</strong>님! 나의 학습 및 결제 현황을 조회합니다.</p>
      </header>

      {/* 탭 네비게이션 */}
      <div className={styles.tabBar}>
        <Link
          href="/mypage?tab=courses"
          className={`${styles.tabButton} ${tab === "courses" ? styles.activeTab : ""}`}
        >
          내 학습 강좌
        </Link>
        <Link
          href="/mypage?tab=progress"
          className={`${styles.tabButton} ${tab === "progress" ? styles.activeTab : ""}`}
        >
          진도율 리포트
        </Link>
        <Link
          href="/mypage?tab=orders"
          className={`${styles.tabButton} ${tab === "orders" ? styles.activeTab : ""}`}
        >
          결제 내역
        </Link>
      </div>

      <div className={styles.contentArea}>
        {/* 1. 내 학습 강좌 탭 */}
        {tab === "courses" && (
          <div>
            {courses.length === 0 ? (
              <div className={styles.emptyState}>
                <p>수강 중인 강좌가 없습니다. KREDU의 인기 강좌를 신청해 보세요!</p>
                <Link href="/courses" className={styles.emptyStateLink}>
                  강좌 둘러보기
                </Link>
              </div>
            ) : (
              <div className={styles.grid}>
                {courses.map((course) => {
                  // 강의실 입장을 위한 첫 레슨 ID 확인
                  const firstLessonId = course.lessons[0]?.id;
                  const classroomUrl = firstLessonId
                    ? `/classroom/${course.id}/${firstLessonId}`
                    : `/courses/${course.id}`;

                  return (
                    <div key={course.id} className={styles.courseCard}>
                      <div className={styles.thumbnailWrapper}>
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className={styles.thumbnail}
                          />
                        ) : (
                          <div className={styles.thumbnail} style={{ background: "#e2e8f0" }} />
                        )}
                      </div>
                      <div className={styles.cardBody}>
                        <span className={styles.category}>{course.category.name}</span>
                        <h2 className={styles.courseTitle}>{course.title}</h2>
                        <p className={styles.instructor}>{course.instructor.name || "강사"}</p>
                        <div className={styles.cardFooter}>
                          <Link href={classroomUrl} className={styles.studyButton}>
                            강의실 입장
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. 진도율 리포트 탭 */}
        {tab === "progress" && (
          <div>
            {progressReport.length === 0 ? (
              <div className={styles.emptyState}>
                <p>학습 진도 데이터가 존재하지 않습니다. 먼저 수강 신청을 해 주세요.</p>
              </div>
            ) : (
              <div className={styles.reportGrid}>
                {progressReport.map((report) => (
                  <div key={report.courseId} className={styles.reportCard}>
                    <div className={styles.thumbnailWrapper} style={{ width: "120px", height: "68px", flexShrink: 0, borderRadius: "6px", overflow: "hidden" }}>
                      {report.thumbnail ? (
                        <img src={report.thumbnail} alt={report.courseTitle} className={styles.thumbnail} />
                      ) : (
                        <div className={styles.thumbnail} style={{ background: "#e2e8f0" }} />
                      )}
                    </div>
                    <div className={styles.reportInfo}>
                      <h3>{report.courseTitle}</h3>
                      <p className={styles.reportMeta}>
                        {report.lastStudiedAt
                          ? `마지막 학습: ${new Date(report.lastStudiedAt).toLocaleString("ko-KR")}`
                          : "아직 시청한 강의가 없습니다."}
                      </p>
                    </div>
                    <div className={styles.progressSection}>
                      <div className={styles.progressText}>
                        <span>진도율</span>
                        <span>{report.percent}% ({report.completedCount}/{report.totalLessons}강)</span>
                      </div>
                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBar}
                          style={{ width: `${report.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. 결제 내역 탭 */}
        {tab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <p>결제 내역이 존재하지 않습니다.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>주문일자</th>
                      <th>주문번호</th>
                      <th>상품 정보</th>
                      <th>결제 금액</th>
                      <th>주문 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const dateStr = new Date(order.createdAt).toLocaleDateString("ko-KR");
                      const itemsStr = order.orderItems
                        .map((item) => item.course?.title || item.book?.title || "미확인 상품")
                        .join(", ");

                      const statusClass =
                        order.status === "COMPLETED"
                          ? styles.completed
                          : order.status === "PENDING"
                          ? styles.pending
                          : styles.cancelled;

                      const statusLabel =
                        order.status === "COMPLETED"
                          ? "결제 완료"
                          : order.status === "PENDING"
                          ? "결제 대기"
                          : "결제 취소";

                      return (
                        <tr key={order.id}>
                          <td>{dateStr}</td>
                          <td style={{ fontSize: "0.85rem", color: "#4f566b" }}>{order.id}</td>
                          <td>{itemsStr}</td>
                          <td style={{ fontWeight: "600" }}>{order.amount.toLocaleString()}원</td>
                          <td>
                            <span className={`${styles.badge} ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
