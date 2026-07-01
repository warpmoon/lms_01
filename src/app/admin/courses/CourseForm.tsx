"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createCategory,
  deleteCategory,
  createCourse,
  updateCourse,
  deleteCourse,
} from "./actions";
import styles from "./AdminCourses.module.css";

interface Instructor {
  id: string;
  name: string | null;
  email: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface CourseFormProps {
  categories: Category[];
  instructors: Instructor[];
  categoriesWithCourses: any[];
}

export default function CourseForm({ categories, instructors, categoriesWithCourses }: CourseFormProps) {
  // 모달 제어 상태
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // 강좌 입력 폼 상태
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    price: 0,
    categoryId: categories[0]?.id || 0,
    instructorId: instructors[0]?.id || "",
    isPublished: false,
  });

  // 카테고리 입력 폼 상태
  const [categoryName, setCategoryName] = useState("");

  // 1. 강좌 수정 모달 열기
  const handleOpenEdit = (course: any) => {
    setEditingCourse(course);
    setCourseData({
      title: course.title,
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      price: course.price,
      categoryId: course.categoryId,
      instructorId: course.instructorId,
      isPublished: course.isPublished,
    });
    setIsCourseOpen(true);
  };

  // 2. 신규 강좌 등록 모달 열기
  const handleOpenCreate = () => {
    if (categories.length === 0) {
      const createCat = confirm(
        "강좌를 개설하려면 먼저 카테고리 분류를 1개 이상 등록해야 합니다.\n카테고리 분류 추가 창을 여시겠습니까?"
      );
      if (createCat) {
        setIsCategoryOpen(true);
      }
      return;
    }
    setEditingCourse(null);
    setCourseData({
      title: "",
      description: "",
      thumbnail: "",
      price: 0,
      categoryId: categories[0]?.id || 0,
      instructorId: instructors[0]?.id || "",
      isPublished: false,
    });
    setIsCourseOpen(true);
  };

  // 3. 강좌 저장 핸들러
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseData.title.trim()) {
      alert("강좌 제목을 입력해 주세요.");
      return;
    }
    if (courseData.price < 0) {
      alert("가격은 0원 이상이어야 합니다.");
      return;
    }
    if (!courseData.categoryId) {
      alert("카테고리를 선택해 주세요.");
      return;
    }
    if (!courseData.instructorId) {
      alert("강사를 배정해 주세요.");
      return;
    }

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
        alert("강좌 정보가 성공적으로 수정되었습니다.");
      } else {
        await createCourse(courseData);
        alert("신규 강좌가 성공적으로 개설되었습니다.");
      }
      setIsCourseOpen(false);
    } catch (error: any) {
      alert(error.message || "강좌 저장 중 에러가 발생했습니다.");
    }
  };

  // 4. 강좌 삭제 핸들러
  const handleDeleteCourse = async (id: string, title: string) => {
    const confirmDelete = confirm(`'${title}' 강좌를 영구 삭제하시겠습니까? 관련 레슨 등 모든 데이터가 삭제됩니다.`);
    if (!confirmDelete) return;

    try {
      await deleteCourse(id);
      alert("강좌가 삭제되었습니다.");
    } catch (error: any) {
      alert(error.message || "강좌 삭제 실패");
    }
  };

  // 5. 카테고리 저장 핸들러
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      alert("카테고리 분류명을 입력해 주세요.");
      return;
    }

    try {
      await createCategory(categoryName);
      alert("신규 카테고리 분류가 등록되었습니다.");
      setCategoryName("");
      setIsCategoryOpen(false);
    } catch (error: any) {
      alert(error.message || "카테고리 저장 실패");
    }
  };

  // 6. 카테고리 삭제 핸들러
  const handleDeleteCategory = async (id: number, name: string) => {
    const confirmDelete = confirm(`'${name}' 카테고리를 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      await deleteCategory(id);
      alert("카테고리가 삭제되었습니다.");
    } catch (error: any) {
      alert(error.message || "카테고리 삭제 실패");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 어드민 동작 상단 컨트롤 바 */}
      <div className={styles.topBar}>
        <div className={styles.titleSection}>
          <h1>강좌 및 카테고리 분류 관리</h1>
          <p>LMS 강좌를 생성 및 수정하고, 분류를 설정하며 전담 강사를 배치합니다.</p>
        </div>
        <div className={styles.btnGroup}>
          <button onClick={() => setIsCategoryOpen(true)} className={styles.secondaryBtn}>
            + 분류 추가
          </button>
          <button onClick={handleOpenCreate} className={styles.primaryBtn}>
            + 신규 강좌 개설
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <div className={styles.emptyState}>
          등록된 카테고리 분류가 존재하지 않습니다. 우측 상단의 '+ 분류 추가' 버튼을 눌러 분류를 먼저 설정해 주세요.
        </div>
      )}

      {/* 강좌 및 카테고리 모달 뷰 포트 (부모 페이지에서 리스트는 처리하며, 여기서는 조작 버튼 맵핑만 돕거나 어드민 카드 형태로도 구성 가능. 
          어드민 복잡도를 위해, 이 폼 컴포넌트 하단에 리스트 렌더링에 필요한 컨트롤 버튼 액션만 맵핑해주고,
          실제 리스트 렌더링은 actions 데이터를 받아 여기서 다 렌더링할 수도 있습니다.
           actions를 직접 호출하도록 이 폼 컴포넌트가 UI List 렌더링까지 전담 처리하도록 설계하겠습니다). */}

      {/* 모달 1. 신규/수정 강좌 모달 */}
      {isCourseOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingCourse ? "강좌 정보 수정" : "신규 강좌 개설"}</h3>
              <button onClick={() => setIsCourseOpen(false)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>강좌 제목</label>
                  <input
                    type="text"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    placeholder="예: 초급 Next.js 16 마스터 클래스"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>강좌 설명</label>
                  <textarea
                    rows={4}
                    value={courseData.description}
                    onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                    placeholder="강좌의 주요 학습 목표 및 상세 소개를 적어주세요."
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>수강료 (원)</label>
                    <input
                      type="number"
                      value={courseData.price}
                      onChange={(e) => setCourseData({ ...courseData, price: parseInt(e.target.value) || 0 })}
                      min={0}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>카테고리 분류</label>
                    <select
                      value={courseData.categoryId}
                      onChange={(e) => setCourseData({ ...courseData, categoryId: parseInt(e.target.value) })}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>담당 강사 배정</label>
                    <select
                      value={courseData.instructorId}
                      onChange={(e) => setCourseData({ ...courseData, instructorId: e.target.value })}
                    >
                      {instructors.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>썸네일 이미지 주소</label>
                    <input
                      type="text"
                      value={courseData.thumbnail}
                      onChange={(e) => setCourseData({ ...courseData, thumbnail: e.target.value })}
                      placeholder="https://example.com/thumbnail.png"
                    />
                  </div>
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={courseData.isPublished}
                    onChange={(e) => setCourseData({ ...courseData, isPublished: e.target.checked })}
                  />
                  <span>학생들에게 강좌 공개 (배포 발행)</span>
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setIsCourseOpen(false)} className={styles.secondaryBtn}>
                  취소
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingCourse ? "저장" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달 2. 카테고리 추가 모달 */}
      {isCategoryOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "400px" }}>
            <div className={styles.modalHeader}>
              <h3>신규 카테고리 대분류 등록</h3>
              <button onClick={() => setIsCategoryOpen(false)} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>카테고리 이름</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="예: 웹 개발, 데이터 분석, 디자인"
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setIsCategoryOpen(false)} className={styles.secondaryBtn}>
                  취소
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카테고리별 강좌 리스트 테이블 */}
      <div style={{ marginTop: "2rem" }}>
        {categoriesWithCourses.map((category) => (
          <div key={category.id} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h2>{category.name}</h2>
                <span className={styles.courseCountBadge}>
                  {category.courses.length}개 강좌
                </span>
              </div>
              <button
                onClick={() => handleDeleteCategory(category.id, category.name)}
                className={styles.deleteCatBtn}
              >
                카테고리 삭제
              </button>
            </div>

            {category.courses.length === 0 ? (
              <div className={styles.emptyState} style={{ border: "none", borderRadius: 0 }}>
                이 분류에 소속된 강좌가 없습니다.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>강좌 정보</th>
                    <th>수강료</th>
                    <th>배정 강사</th>
                    <th>강의 수</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {category.courses.map((course: any) => (
                    <tr key={course.id} className={styles.courseRow}>
                      <td className={styles.courseTitleCell}>
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className={styles.miniThumbnail}
                          />
                        ) : (
                          <div className={styles.miniThumbnail} />
                        )}
                        <div>
                          <div style={{ fontWeight: "700" }}>{course.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "#697386" }}>ID: {course.id}</div>
                        </div>
                      </td>
                      <td style={{ fontWeight: "600" }}>
                        {course.price === 0 ? "무료" : `${course.price.toLocaleString()}원`}
                      </td>
                      <td>{course.instructor.name || "미지정"}</td>
                      <td>{course.lessons.length}강</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            course.isPublished ? styles.published : styles.draft
                          }`}
                        >
                          {course.isPublished ? "공개됨" : "비공개"}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <Link
                          href={`/admin/courses/${course.id}/lessons`}
                          style={{
                            color: "#0070f3",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            marginRight: "0.8rem",
                            textDecoration: "none",
                          }}
                        >
                          강의 관리
                        </Link>
                        <Link
                          href={`/admin/courses/${course.id}/exam`}
                          style={{
                            color: "#28a745",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            marginRight: "0.8rem",
                            textDecoration: "none",
                          }}
                        >
                          시험 출제
                        </Link>
                        <button onClick={() => handleOpenEdit(course)} className={styles.editBtn}>
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className={styles.deleteBtn}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
