import { getAllPosts } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PostListForm from "./PostListForm";
import styles from "./AdminPosts.module.css";

export default async function AdminPostsPage() {
  const session = await auth();

  // 어드민 세션 권한 검증 (TypeScript as any 캐스팅 준수)
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    redirect("/");
  }

  // 전체 게시판 및 후기 목록 조회
  const postsList = await getAllPosts();

  return (
    <div className={styles.container}>
      <PostListForm posts={postsList as any} />
    </div>
  );
}
