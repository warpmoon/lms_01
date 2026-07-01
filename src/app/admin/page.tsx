import { getAdminDashboardStats, getAdminRecentActivities } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./AdminPage.module.css";

// 상대 시간 표시 포맷터 헬퍼
function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return "방금 전";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default async function AdminDashboard() {
  const session = await auth();
  
  // 어드민 권한 가드
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // 실시간 지표 및 병합 타임라인 병렬 페치
  const [statsData, recentActivities] = await Promise.all([
    getAdminDashboardStats(),
    getAdminRecentActivities(),
  ]);

  const stats = [
    { label: "전체 회원", value: `${statsData.totalUsers.toLocaleString()}명`, color: "#007bff" },
    { label: "전체 강좌 수", value: `${statsData.totalCourses.toLocaleString()}개`, color: "#28a745" },
    { label: "오늘 매출액", value: `₩${statsData.todaySales.toLocaleString()}`, color: "#ffc107" },
    { label: "전체 문의 수", value: `${statsData.unansweredQna.toLocaleString()}건`, color: "#dc3545" },
  ];

  return (
    <div className={styles.container}>
      {/* 4대 핵심 집계 위젯 */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={styles.statCard}
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>{stat.value}</span>
          </div>
        ))}
      </div>
      
      {/* 실시간 병합 액티비티 타임라인 */}
      <div className={styles.recentActivity}>
        <h3>실시간 사이트 활동 타임라인</h3>
        {recentActivities.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#697386" }}>
            아직 축적된 사이트 최근 활동 정보가 존재하지 않습니다.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "120px" }}>발생 시간</th>
                <th>활동 내역</th>
                <th style={{ width: "120px" }}>구분</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => {
                // 이력 심각도에 따른 배지 스타일 설정
                const badgeClass =
                  activity.status === "SUCCESS"
                    ? styles.badge
                    : activity.status === "INFO"
                    ? `${styles.badge} ${styles.infoBadge}`
                    : `${styles.badge} ${styles.warningBadge}`;

                const badgeLabel =
                  activity.status === "SUCCESS"
                    ? "가입/후기"
                    : activity.status === "INFO"
                    ? "결제완료"
                    : "Q&A등록";

                return (
                  <tr key={activity.id}>
                    <td style={{ color: "#697386", fontWeight: "500" }}>{timeAgo(activity.time)}</td>
                    <td style={{ fontWeight: "600" }}>{activity.content}</td>
                    <td>
                      <span className={badgeClass}>{badgeLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
