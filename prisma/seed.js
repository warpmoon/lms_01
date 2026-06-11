const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seed started...');

  // 1. 기존 데이터 삭제 (순서 주의: 관계성 때문)
  await prisma.userCoupon.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.progress.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. 사용자 생성 (비밀번호 암호화)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: '관리자',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const instructor = await prisma.user.create({
    data: {
      name: '김강사',
      email: 'instructor@example.com',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    },
  });

  const student = await prisma.user.create({
    data: {
      name: '이학생',
      email: 'student@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  console.log('Users created:', { admin: admin.email, instructor: instructor.email, student: student.email });

  // 3. 카테고리 생성
  const catProgramming = await prisma.category.create({ data: { name: '프로그래밍' } });
  const catDesign = await prisma.category.create({ data: { name: '디자인' } });
  const catBusiness = await prisma.category.create({ data: { name: '비즈니스' } });

  // 4. 강좌 생성
  const course1 = await prisma.course.create({
    data: {
      title: 'Next.js 15 완벽 마스터: 기초부터 실전까지',
      description: '최신 Next.js App Router를 사용하여 실제 프로젝트를 구축하는 방법을 배웁니다.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      price: 55000,
      isPublished: true,
      categoryId: catProgramming.id,
      instructorId: instructor.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Prisma & PostgreSQL 데이터베이스 마스터리',
      description: 'Prisma ORM을 사용하여 데이터베이스 스키마를 설계하고 효율적으로 쿼리하는 방법을 마스터하세요.',
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
      price: 49000,
      isPublished: true,
      categoryId: catProgramming.id,
      instructorId: instructor.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'UX/UI 디자인 실무 워크숍',
      description: '피그마(Figma)를 활용하여 사용자 중심의 웹/앱 인터페이스를 디자인합니다.',
      thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800&q=80',
      price: 0, // 무료 강좌
      isPublished: true,
      categoryId: catDesign.id,
      instructorId: instructor.id,
    },
  });

  console.log('Courses created:', [course1.title, course2.title, course3.title]);

  // 5. 강의(Lessons) 생성
  const lessons1 = [
    { title: 'Next.js 소개 및 환경 설정', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 300, order: 1, courseId: course1.id },
    { title: 'App Router와 Routing 이해하기', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 600, order: 2, courseId: course1.id },
    { title: 'Server Components와 Client Components', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 450, order: 3, courseId: course1.id },
  ];

  const lessons2 = [
    { title: 'Prisma 설치 및 기본 설정', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 240, order: 1, courseId: course2.id },
    { title: 'Schema 설계 및 Migration', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 520, order: 2, courseId: course2.id },
  ];

  for (const lesson of [...lessons1, ...lessons2]) {
    await prisma.lesson.create({ data: lesson });
  }

  console.log('Lessons created successfully.');
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
