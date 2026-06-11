import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function updateProgress(lessonId: string, lastPosition: number, isCompleted: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  return await prisma.progress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      lastPosition,
      isCompleted,
    },
    create: {
      userId,
      lessonId,
      lastPosition,
      isCompleted,
    },
  });
}

export async function getLessonWithProgress(courseId: string, lessonId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!lesson) return null;

  let progress = null;
  if (userId) {
    progress = await prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });
  }

  return { lesson, progress };
}
