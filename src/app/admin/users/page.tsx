import { getAllUsers, getAllCoursesList } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagementForm from "./UserManagementForm";
import styles from "./AdminUsers.module.css";

export default async function AdminUsersPage() {
  const session = await auth();
  
  // 어드민 사용자 권한 차단 검사 (TypeScript as any 캐스팅 준수)
  const userRole = (session?.user as any)?.role;
  console.log("=== DEBUG ADMIN USERS PAGE ===");
  console.log("Session:", JSON.stringify(session));
  console.log("User Role detected:", userRole);
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // 어드민 대시보드 회원 제어 데이터 병렬 조회
  const [usersList, coursesList] = await Promise.all([
    getAllUsers(),
    getAllCoursesList(),
  ]);

  return (
    <div className={styles.container}>
      <UserManagementForm
        users={usersList as any}
        courses={coursesList}
      />
    </div>
  );
}
