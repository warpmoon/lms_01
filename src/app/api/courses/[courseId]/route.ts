import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
