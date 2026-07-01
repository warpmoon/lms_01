"use client";

import { useState } from "react";
import { createNoticePost, replyToPost, deletePost } from "./actions";
import styles from "./AdminPosts.module.css";

interface Post {
  id: string;
  type: "QNA" | "REVIEW" | "NOTICE";
  boardCategory: string;
  title: string;
  content: string;
  rating: number | null;
  reply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
  course: {
    title: string;
  } | null;
}

interface PostListFormProps {
  posts: Post[];
}

type FilterType = "ALL" | "QNA" | "REVIEW" | "NOTICE";

export default function PostListForm({ posts }: PostListFormProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");

  // 모달 제어 상태
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // 공지사항 입력 폼 상태
  const [noticeData, setNoticeData] = useState({
    title: "",
    content: "",
    boardCategory: "공지사항",
  });
  const [isNoticeSubmitting, setIsNoticeSubmitting] = useState(false);

  // Q&A 답변 입력 폼 상태
  const [replyText, setReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);

  // 공지사항 신규 작성 서밋
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeData.title.trim() || !noticeData.content.trim()) {
      alert("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    setIsNoticeSubmitting(true);
    try {
      await createNoticePost(noticeData);
      alert("신규 공지사항이 성공적으로 등록되었습니다.");
      setIsNoticeModalOpen(false);
      setNoticeData({ title: "", content: "", boardCategory: "공지사항" });
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "공지사항 등록 실패");
    } finally {
      setIsNoticeSubmitting(false);
    }
  };

  // Q&A 답변 등록 서밋
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!replyText.trim()) {
      alert("답변 내용을 입력해 주세요.");
      return;
    }

    setIsReplySubmitting(true);
    try {
      await replyToPost(selectedPost.id, replyText);
      alert("답변이 등록되었습니다.");
      setSelectedPost(null);
      setReplyText("");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "답변 등록 실패");
    } finally {
      setIsReplySubmitting(false);
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId: string, title: string) => {
    const confirmDelete = confirm(`'${title}' 게시글을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      await deletePost(postId);
      alert("게시글이 삭제되었습니다.");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "게시글 삭제 실패");
    }
  };

  // 상세 모달 열기 핸들러
  const handleOpenDetailModal = (post: Post) => {
    setSelectedPost(post);
    setReplyText(post.reply || "");
  };

  // 필터링 목록
  const filteredPosts = posts.filter((post) => {
    if (filter === "ALL") return true;
    return post.type === filter;
  });

  return (
    <div style={{ width: "100%" }}>
      {/* 상단바 */}
      <div className={styles.topBar}>
        <div className={styles.titleSection}>
          <h1>어드민 게시판 및 후기 관리</h1>
          <p>공지사항을 전파하고, 수강생 Q&A 질문글에 공인 답변을 달며 수강 후기를 모니터링합니다.</p>
        </div>
        <button onClick={() => setIsNoticeModalOpen(true)} className={styles.writeBtn}>
          + 신규 공지 등록
        </button>
      </div>

      {/* 필터 탭 */}
      <div className={styles.filterTabs}>
        {(["ALL", "QNA", "REVIEW", "NOTICE"] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`${styles.tabBtn} ${filter === type ? styles.activeTab : ""}`}
          >
            {type === "ALL"
              ? `전체 (${posts.length})`
              : type === "QNA"
              ? `질문Q&A (${posts.filter((p) => p.type === "QNA").length})`
              : type === "REVIEW"
              ? `수강후기 (${posts.filter((p) => p.type === "REVIEW").length})`
              : `공지사항 (${posts.filter((p) => p.type === "NOTICE").length})`}
          </button>
        ))}
      </div>

      {/* 게시글 리스트 테이블 */}
      <div className={styles.tableCard}>
        {filteredPosts.length === 0 ? (
          <div className={styles.emptyState}>해당하는 게시판 글이 존재하지 않습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "120px" }}>작성일</th>
                <th style={{ width: "100px" }}>유형</th>
                <th style={{ width: "120px" }}>카테고리</th>
                <th>게시글 제목 (상세보기)</th>
                <th style={{ width: "140px" }}>작성자</th>
                <th style={{ width: "110px" }}>답변 상태</th>
                <th style={{ width: "80px" }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => {
                const dateStr = new Date(post.createdAt).toLocaleDateString("ko-KR");
                
                // 구분 배지 클래스
                const typeClass =
                  post.type === "QNA"
                    ? `${styles.badge} ${styles.qna}`
                    : post.type === "REVIEW"
                    ? `${styles.badge} ${styles.review}`
                    : `${styles.badge} ${styles.notice}`;

                const typeLabel =
                  post.type === "QNA"
                    ? "질문 Q&A"
                    : post.type === "REVIEW"
                    ? "수강 후기"
                    : "공지사항";

                return (
                  <tr key={post.id} className={styles.row}>
                    <td>{dateStr}</td>
                    <td>
                      <span className={typeClass}>{typeLabel}</span>
                    </td>
                    <td style={{ fontWeight: "600", color: "#4a5568" }}>{post.boardCategory}</td>
                    <td>
                      <button onClick={() => handleOpenDetailModal(post)} className={styles.viewLink}>
                        {post.title} {post.rating !== null && ` (${post.rating}점)`}
                      </button>
                      {post.course && (
                        <div style={{ fontSize: "0.75rem", color: "#718096", marginTop: "0.25rem" }}>
                          관련 강좌: {post.course.title}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: "600" }}>{post.user.name || "미기입"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#718096" }}>{post.user.email}</div>
                    </td>
                    <td>
                      {post.type === "QNA" ? (
                        post.reply ? (
                          <span className={`${styles.statusBadge} ${styles.answered}`}>답변완료</span>
                        ) : (
                          <span className={`${styles.statusBadge} ${styles.pending}`}>답변대기</span>
                        )
                      ) : (
                        <span style={{ color: "#a0aec0", fontSize: "0.8rem" }}>해당 없음</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeletePost(post.id, post.title)}
                        className={styles.deleteBtn}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 모달 1: 신규 공지사항 등록 */}
      {isNoticeModalOpen && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSaveNotice} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>신규 공지사항 등록</h3>
              <button type="button" onClick={() => setIsNoticeModalOpen(false)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>게시판 카테고리 지정</label>
                <input
                  type="text"
                  value={noticeData.boardCategory}
                  onChange={(e) => setNoticeData({ ...noticeData, boardCategory: e.target.value })}
                  placeholder="예: 공지사항, 필독, 시스템 안내"
                />
              </div>
              <div className={styles.formGroup}>
                <label>공지 제목</label>
                <input
                  type="text"
                  value={noticeData.title}
                  onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                  placeholder="공지사항의 핵심 요약을 적어주세요."
                />
              </div>
              <div className={styles.formGroup}>
                <label>공지 본문 내용</label>
                <textarea
                  value={noticeData.content}
                  onChange={(e) => setNoticeData({ ...noticeData, content: e.target.value })}
                  rows={6}
                  placeholder="수강생들에게 알릴 공지 상세 내용을 상세히 서술해 주세요."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setIsNoticeModalOpen(false)} className={styles.cancelBtn}>
                취소
              </button>
              <button type="submit" className={styles.submitBtn} disabled={isNoticeSubmitting}>
                {isNoticeSubmitting ? "등록 중..." : "공지사항 발행"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 모달 2: 게시글 상세 열람 및 Q&A 답변 등록 */}
      {selectedPost && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSaveReply} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>게시글 상세 정보 및 관리</h3>
              <button type="button" onClick={() => setSelectedPost(null)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* 원본 게시글 본문 */}
              <div style={{ marginBottom: "1rem" }}>
                <span className={styles.badge} style={{ background: "#edf2f7", color: "#4a5568", marginBottom: "0.5rem" }}>
                  {selectedPost.boardCategory}
                </span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.25rem" }}>
                  {selectedPost.title}
                </h4>
                <div style={{ fontSize: "0.8rem", color: "#718096", marginBottom: "1rem" }}>
                  작성자: {selectedPost.user.name || "미기입"} ({selectedPost.user.email}) | 작성일: {new Date(selectedPost.createdAt).toLocaleString("ko-KR")}
                </div>
                <div className={styles.postContentBox}>{selectedPost.content}</div>
              </div>

              {/* 답변 작성 영역 - 오직 Q&A 타입에만 렌더링 */}
              {selectedPost.type === "QNA" ? (
                <div className={styles.formGroup}>
                  <label>관리자 공식 답변 등록/수정</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="학생의 질문에 대해 친절한 답변 코멘트를 작성해 주세요."
                  />
                </div>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#a0aec0", padding: "0.5rem", borderTop: "1px solid #eee" }}>
                  ※ 공지사항 및 수강 후기는 공식 답변 대상이 아닙니다. 모니터링 후 부적절할 시 본 창을 닫고 '삭제' 버튼을 눌러주세요.
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setSelectedPost(null)} className={styles.cancelBtn}>
                닫기
              </button>
              {selectedPost.type === "QNA" && (
                <button type="submit" className={styles.submitBtn} disabled={isReplySubmitting}>
                  {isReplySubmitting ? "답변 등록 중..." : "답변 저장하기"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
