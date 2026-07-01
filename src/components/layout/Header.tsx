import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Header() {
  const session = await auth();

  return (
    <header style={{ borderBottom: "1px solid #eee", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#0070f3" }}>KREDU</Link>
      </div>
      <nav style={{ display: "flex", gap: "2rem" }}>
        <Link href="/courses" style={{ textDecoration: "none", color: "#333" }}>강좌 목록</Link>
        <Link href="/classroom" style={{ textDecoration: "none", color: "#333" }}>내 강의실</Link>
      </nav>
      <div style={{ display: "flex", gap: "1rem" }}>
        {session ? (
          <>
            <span>{session.user?.name}님</span>
            <form action={async () => { "use server"; await signOut(); }}>
              <button style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>로그아웃</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" style={{ textDecoration: "none", color: "#333" }}>로그인</Link>
            <Link href="/join" style={{ textDecoration: "none", color: "#0070f3", fontWeight: "bold" }}>회원가입</Link>
          </>
        )}
      </div>
    </header>
  );
}
