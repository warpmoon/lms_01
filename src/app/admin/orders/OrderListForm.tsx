"use client";

import { useState } from "react";
import { cancelOrderAndRevokeAccess } from "./actions";
import styles from "./AdminOrders.module.css";

interface OrderItem {
  id: string;
  price: number;
  quantity: number;
  courseId: string | null;
  bookId: string | null;
  course: { id: string; title: string } | null;
  book: { id: string; title: string } | null;
}

interface Order {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  paymentMethod: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
  orderItems: OrderItem[];
}

interface OrderListFormProps {
  orders: Order[];
}

type FilterType = "ALL" | "COMPLETED" | "CANCELLED" | "PENDING";

export default function OrderListForm({ orders }: OrderListFormProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // 주문 취소 핸들러
  const handleCancelOrder = async (orderId: string) => {
    const confirmCancel = confirm(
      "이 주문 결제건을 환불/취소 처리하시겠습니까?\n취소 시 해당 주문에 포함되어 있던 강좌들의 수강 권한(진도율 정보)도 원자적으로 즉시 일괄 삭제되어 접근이 차단됩니다."
    );
    if (!confirmCancel) return;

    setIsLoading(orderId);
    try {
      await cancelOrderAndRevokeAccess(orderId);
      alert("결제 취소 및 수강 권한 회수 처리가 무사히 완료되었습니다.");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "결제 취소 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(null);
    }
  };

  // 필터링 적용 목록
  const filteredOrders = orders.filter((order) => {
    if (filter === "ALL") return true;
    return order.status === filter;
  });

  return (
    <div style={{ width: "100%" }}>
      {/* 상단 헤더 */}
      <div className={styles.topBar}>
        <h1>어드민 결제 및 주문 관리</h1>
        <p>사이트에서 발생한 수강권 및 교재 상품 주문 내역을 열람하고 환불 취소를 집행합니다.</p>
      </div>

      {/* 필터 탭 */}
      <div className={styles.filterTabs}>
        {(["ALL", "COMPLETED", "CANCELLED", "PENDING"] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`${styles.tabBtn} ${filter === type ? styles.activeTab : ""}`}
          >
            {type === "ALL"
              ? `전체 (${orders.length})`
              : type === "COMPLETED"
              ? `결제완료 (${orders.filter((o) => o.status === "COMPLETED").length})`
              : type === "CANCELLED"
              ? `결제취소 (${orders.filter((o) => o.status === "CANCELLED").length})`
              : `대기중 (${orders.filter((o) => o.status === "PENDING").length})`}
          </button>
        ))}
      </div>

      {/* 결제 내역 테이블 */}
      <div className={styles.tableCard}>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>해당하는 주문/결제 내역이 존재하지 않습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "130px" }}>결제 일자</th>
                <th style={{ width: "200px" }}>주문번호 / 이메일</th>
                <th>구매 품목 명세</th>
                <th style={{ width: "120px" }}>결제 금액</th>
                <th style={{ width: "100px" }}>결제 수단</th>
                <th style={{ width: "100px" }}>거래 상태</th>
                <th style={{ width: "120px" }}>관리 액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString("ko-KR");
                
                // 상태별 클래스 매핑
                const badgeClass =
                  order.status === "COMPLETED"
                    ? `${styles.badge} ${styles.completed}`
                    : order.status === "CANCELLED"
                    ? `${styles.badge} ${styles.cancelled}`
                    : `${styles.badge} ${styles.pending}`;

                const statusLabel =
                  order.status === "COMPLETED"
                    ? "결제완료"
                    : order.status === "CANCELLED"
                    ? "결제취소"
                    : "대기중";

                return (
                  <tr key={order.id} className={styles.row}>
                    <td>{dateStr}</td>
                    <td>
                      <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{order.id}</div>
                      <div style={{ fontSize: "0.8rem", color: "#697386", marginTop: "0.25rem" }}>
                        {order.user.name || "미입력"} ({order.user.email})
                      </div>
                    </td>
                    <td>
                      <div className={styles.itemsList}>
                        {order.orderItems.map((item) => (
                          <div key={item.id} className={styles.itemBadge}>
                            {item.courseId ? (
                              <>
                                <span className={styles.itemType} style={{ color: "#2b6cb0", background: "#ebf8ff", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>
                                  강좌
                                </span>
                                <strong>{item.course?.title}</strong>
                              </>
                            ) : (
                              <>
                                <span className={styles.itemType} style={{ color: "#b7791f", background: "#fefcbf", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>
                                  교재
                                </span>
                                <strong>{item.book?.title}</strong>
                              </>
                            )}
                            <span style={{ marginLeft: "0.5rem", color: "#718096" }}>
                              ({item.quantity}개 / {item.price.toLocaleString()}원)
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: "700", color: "#1a1f36" }}>
                      {order.amount.toLocaleString()}원
                    </td>
                    <td style={{ color: "#4f566b", fontSize: "0.85rem" }}>
                      {order.paymentMethod === "card" ? "신용카드" : order.paymentMethod}
                    </td>
                    <td>
                      <span className={badgeClass}>{statusLabel}</span>
                    </td>
                    <td>
                      {order.status === "COMPLETED" ? (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className={styles.cancelBtn}
                          disabled={isLoading !== null}
                        >
                          {isLoading === order.id ? "취소 중..." : "결제 취소"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#a0aec0" }}>액션 없음</span>
                      )}
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
