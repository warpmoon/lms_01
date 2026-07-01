import { getAllOrders } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrderListForm from "./OrderListForm";
import styles from "./AdminOrders.module.css";

export default async function AdminOrdersPage() {
  const session = await auth();

  // 어드민 세션 권한 검증 (TypeScript as any 캐스팅 준수)
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // 전체 거래 및 결제 내역 로드
  const ordersList = await getAllOrders();

  return (
    <div className={styles.container}>
      <OrderListForm orders={ordersList as any} />
    </div>
  );
}
