"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { createOrder, verifyPayment } from "./actions";
import styles from "./CheckoutPage.module.css";

declare global {
  interface Window {
    IMP: any;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      // 강좌 정보 조회 (실제로는 API나 더 나은 상태 관리 사용)
      fetch(`/api/courses/${courseId}`)
        .then((res) => res.json())
        .then((data) => {
          setCourse(data);
          setLoading(false);
        });
    }
  }, [courseId]);

  const handlePayment = async () => {
    if (!course) return;

    try {
      // 1. 서버에 주문 생성 (PENDING)
      const order = await createOrder(course.id, course.price);

      // 2. 포트원 결제창 호출
      const { IMP } = window;
      IMP.init("imp00000000"); // 가맹점 식별코드 (테스트용)

      IMP.request_pay(
        {
          pg: "kcp",
          pay_method: "card",
          merchant_uid: order.id,
          name: course.title,
          amount: course.price,
          buyer_email: "test@example.com",
          buyer_name: "홍길동",
        },
        async (rsp: any) => {
          if (rsp.success) {
            // 3. 결제 성공 시 서버에서 검증 및 완료 처리
            await verifyPayment(order.id, rsp.imp_uid);
            alert("결제가 완료되었습니다!");
            router.push("/mypage/orders");
          } else {
            alert(`결제 실패: ${rsp.error_msg}`);
          }
        }
      );
    } catch (error) {
      console.error(error);
      alert("주문 처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;

  return (
    <div className={styles.container}>
      <Script src="https://cdn.iamport.kr/v1/iamport.js" />
      
      <h1>주문/결제</h1>
      <div className={styles.content}>
        <div className={styles.courseInfo}>
          <h3>구매 강좌 정보</h3>
          <div className={styles.card}>
            <img src={course.thumbnail} alt={course.title} />
            <div>
              <h4>{course.title}</h4>
              <p>{course.price.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        <div className={styles.paymentInfo}>
          <h3>결제 상세</h3>
          <div className={styles.summary}>
            <div className={styles.row}>
              <span>상품 금액</span>
              <span>{course.price.toLocaleString()}원</span>
            </div>
            <div className={styles.row}>
              <span>할인 금액</span>
              <span>0원</span>
            </div>
            <div className={`${styles.row} ${styles.total}`}>
              <span>최종 결제 금액</span>
              <span>{course.price.toLocaleString()}원</span>
            </div>
          </div>
          <button onClick={handlePayment} className={styles.payButton}>
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>로딩 중...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
