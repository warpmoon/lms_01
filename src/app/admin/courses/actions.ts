"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 어드민 권한 검증 헬퍼
async function requireAdmin() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  if (!session?.user?.id || userRole !== "ADMIN") {
    throw new Error("Unauthorized: Admin privilege required");
  }
}

// 1. 카테고리 및 각 카테고리별 강좌 목록 조회
export async function getCategoriesAndCourses() {
  await requireAdmin();

  return await prisma.category.findMany({
    include: {
      courses: {
        include: {
          instructor: {
            select: { id: true, name: true, email: true },
          },
          lessons: {
            select: { id: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

// 2. 강사로 지정 가능한 유저 목록 조회 (INSTRUCTOR 또는 ADMIN 롤 소유자)
export async function getInstructors() {
  await requireAdmin();

  return await prisma.user.findMany({
    where: {
      role: {
        in: ["INSTRUCTOR", "ADMIN"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

// 3. 신규 카테고리 생성
export async function createCategory(name: string) {
  await requireAdmin();
  if (!name.trim()) throw new Error("Category name is required");

  const category = await prisma.category.create({
    data: { name: name.trim() },
  });

  revalidatePath("/admin/courses");
  return category;
}

// 4. 카테고리 삭제
export async function deleteCategory(id: number) {
  await requireAdmin();

  // 자식 강좌가 있는지 체크
  const courseCount = await prisma.course.count({ where: { categoryId: id } });
  if (courseCount > 0) {
    throw new Error("카테고리에 소속된 강좌가 있어 삭제할 수 없습니다.");
  }

  await prisma.category.delete({
    where: { id },
  });

  revalidatePath("/admin/courses");
}

// 5. 신규 강좌 등록
export async function createCourse(data: {
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  categoryId: number;
  instructorId: string;
}) {
  await requireAdmin();

  const course = await prisma.course.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      thumbnail: data.thumbnail.trim() || null,
      price: data.price,
      categoryId: data.categoryId,
      instructorId: data.instructorId,
      isPublished: false, // 기본값은 비공개
    },
  });

  revalidatePath("/admin/courses");
  return course;
}

// 6. 강좌 정보 수정 (게시 상태 변경 포함)
export async function updateCourse(
  id: string,
  data: {
    title?: string;
    description?: string;
    thumbnail?: string;
    price?: number;
    categoryId?: number;
    instructorId?: string;
    isPublished?: boolean;
  }
) {
  await requireAdmin();

  const course = await prisma.course.update({
    where: { id },
    data: {
      title: data.title?.trim(),
      description: data.description?.trim(),
      thumbnail: data.thumbnail?.trim(),
      price: data.price,
      categoryId: data.categoryId,
      instructorId: data.instructorId,
      isPublished: data.isPublished,
    },
  });

  revalidatePath("/admin/courses");
  return course;
}

// 7. 강좌 삭제
export async function deleteCourse(id: string) {
  await requireAdmin();

  await prisma.course.delete({
    where: { id },
  });

  revalidatePath("/admin/courses");
}
