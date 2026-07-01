"use client";

import { useState } from "react";
import { updateUserRole, grantCourseAccess, revokeCourseAccess } from "./actions";
import styles from "./AdminUsers.module.css";

interface Course {
  id: string;
  title: string;
}

interface EnrolledCourse {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "INSTRUCTOR" | "ADMIN";
  createdAt: Date;
  enrolledCourses: EnrolledCourse[];
}

interface UserManagementFormProps {
  users: User[];
  courses: Course[];
}

export default function UserManagementForm({ users, courses }: UserManagementFormProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetCourseId, setTargetCourseId] = useState(courses[0]?.id || "");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 1. 회원 등급(역할) 수정
  const handleRoleChange = async (userId: string, newRole: any) => {
    const confirmChange = confirm(`회원 역할을 '${newRole}'(으)로 변경하시겠습니까?`);
    if (!confirmChange) return;

    try {
      await updateUserRole(userId, newRole);
      alert("회원 역할이 변경되었습니다.");
    } catch (error: any) {
      alert(error.message || "역할 수정 실패");
    }
  };

  // 2. 수강 권한 강제 부여
  const handleGrantAccess = async () => {
    if (!selectedUser || !targetCourseId) return;

    // 이미 수강 중인지 체크
    const isAlreadyEnrolled = selectedUser.enrolledCourses.some((c) => c.id === targetCourseId);
    if (isAlreadyEnrolled) {
      alert("이미 수강 중인 강좌입니다.");
      return;
    }

    setIsActionLoading(true);
    try {
      await grantCourseAccess(selectedUser.id, targetCourseId);
      alert("수강 권한이 수동 부여되었습니다.");
      
      // 모달 상태 동적 갱신
      const targetCourse = courses.find((c) => c.id === targetCourseId);
      if (targetCourse) {
        const updatedUser = {
          ...selectedUser,
          enrolledCourses: [...selectedUser.enrolledCourses, targetCourse],
        };
        setSelectedUser(updatedUser);
      }
    } catch (error: any) {
      alert(error.message || "수강 권한 부여 실패");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. 수강 권한 수동 회수
  const handleRevokeAccess = async (courseId: string, courseTitle: string) => {
    if (!selectedUser) return;

    const confirmRevoke = confirm(`'${selectedUser.name || selectedUser.email}' 회원의 '${courseTitle}' 강좌 수강 권한을 회수하고 모든 학습 진도율을 제거하시겠습니까?`);
    if (!confirmRevoke) return;

    setIsActionLoading(true);
    try {
      await revokeCourseAccess(selectedUser.id, courseId);
      alert("수강 권한이 회수되었습니다.");
      
      // 모달 상태 동적 갱신
      const updatedUser = {
        ...selectedUser,
        enrolledCourses: selectedUser.enrolledCourses.filter((c) => c.id !== courseId),
      };
      setSelectedUser(updatedUser);
    } catch (error: any) {
      alert(error.message || "수강 권한 회수 실패");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 상단 타이틀 */}
      <div className={styles.topBar}>
        <h1>회원 상태 및 권한 설정</h1>
        <p>가입한 학습자들의 가입 현황을 조회하고 등급 역할 변경 및 수강 승인을 수동 제어합니다.</p>
      </div>

      {/* 전체 유저 테이블 목록 */}
      <div className={styles.tableCard}>
        {users.length === 0 ? (
          <div className={styles.emptyState}>가입된 회원 정보가 존재하지 않습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>가입일자</th>
                <th>이름</th>
                <th>이메일</th>
                <th>역할 등급</th>
                <th>수강 중인 강좌</th>
                <th style={{ width: "120px" }}>수강 관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const dateStr = new Date(user.createdAt).toLocaleDateString("ko-KR");

                return (
                  <tr key={user.id} className={styles.row}>
                    <td>{dateStr}</td>
                    <td style={{ fontWeight: "700" }}>{user.name || "미입력"}</td>
                    <td style={{ color: "#4f566b" }}>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={styles.roleSelect}
                      >
                        <option value="USER">일반 학생 (USER)</option>
                        <option value="INSTRUCTOR">강사 (INSTRUCTOR)</option>
                        <option value="ADMIN">관리자 (ADMIN)</option>
                      </select>
                    </td>
                    <td>
                      {user.enrolledCourses.length === 0 ? (
                        <span style={{ fontSize: "0.8rem", color: "#a0aec0" }}>없음</span>
                      ) : (
                        <div className={styles.courseBadgeList}>
                          {user.enrolledCourses.map((course) => (
                            <span key={course.id} className={styles.courseBadge}>
                              {course.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <button onClick={() => setSelectedUser(user)} className={styles.manageBtn}>
                        권한 관리
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 수강 권한 관리 모달 팝업 */}
      {selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>[{selectedUser.name || selectedUser.email}] 수강 권한 설정</h3>
              <button onClick={() => setSelectedUser(null)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* 현재 수강중인 목록 */}
              <h4 className={styles.sectionTitle}>현재 수강 중인 강좌 ({selectedUser.enrolledCourses.length})</h4>
              <div className={styles.modalCourseList}>
                {selectedUser.enrolledCourses.length === 0 ? (
                  <span style={{ fontSize: "0.85rem", color: "#718096", padding: "0.5rem" }}>
                    수동 부여되었거나 구매 완료한 강좌가 존재하지 않습니다.
                  </span>
                ) : (
                  selectedUser.enrolledCourses.map((course) => (
                    <div key={course.id} className={styles.modalCourseItem}>
                      <span className={styles.modalCourseTitle}>{course.title}</span>
                      <button
                        onClick={() => handleRevokeAccess(course.id, course.title)}
                        className={styles.revokeBtn}
                        disabled={isActionLoading}
                      >
                        수강 권한 회수
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 신규 수강 권한 수동 부여 폼 */}
              <h4 className={styles.sectionTitle}>수강 권한 강제 부여</h4>
              <div className={styles.grantForm}>
                <select
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  className={styles.select}
                  disabled={courses.length === 0}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGrantAccess}
                  className={styles.grantBtn}
                  disabled={courses.length === 0 || isActionLoading}
                >
                  {isActionLoading ? "부여 중..." : "권한 부여"}
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setSelectedUser(null)} className={styles.primaryBtn}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
