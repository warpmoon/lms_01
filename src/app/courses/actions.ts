import { prisma } from "@/lib/prisma";

export async function getCourses() {
  return await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      category: true,
      instructor: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseDetail(courseId: string) {
  return await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      instructor: {
        select: { name: true, image: true },
      },
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });
}
