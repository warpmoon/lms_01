import styles from "./AdminPage.module.css";

export default function AdminDashboard() {
  const stats = [
    { label: "전체 회원", value: "1,240", color: "#007bff" },
    { label: "신규 강좌", value: "12", color: "#28a745" },
    { label: "오늘 매출", value: "₩450,000", color: "#ffc107" },
    { label: "미처리 문의", value: "5", color: "#dc3545" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard} style={{ borderTop: `4px solid ${stat.color}` }}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>{stat.value}</span>
          </div>
        ))}
      </div>
      
      <div className={styles.recentActivity}>
        <h3>최근 활동</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>시간</th>
              <th>활동</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10분 전</td>
              <td>새로운 회원이 가입했습니다.</td>
              <td><span className={styles.badge}>성공</span></td>
            </tr>
            <tr>
              <td>30분 전</td>
              <td>'Next.js 마스터' 강좌에 새로운 후기가 등록되었습니다.</td>
              <td><span className={styles.badge}>확인필요</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
