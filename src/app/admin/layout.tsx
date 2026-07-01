import Link from "next/link";
import styles from "./AdminLayout.module.css";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 관리자 권한 체크 (실제 서비스에서는 주석 해제)
  // if (session?.user?.role !== "ADMIN") {
  //   redirect("/");
  // }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Link href="/admin">KREDU Admin</Link>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin/users">회원 관리</Link>
          <Link href="/admin/courses">강좌 관리</Link>
          <Link href="/admin/orders">결제 관리</Link>
          <Link href="/admin/posts">게시판 관리</Link>
          <Link href="/">사이트 바로가기</Link>
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <h2>관리자 대시보드</h2>
          <div className={styles.user}>
            {session?.user?.name} 관리자님
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
