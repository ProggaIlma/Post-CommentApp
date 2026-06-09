import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hash = (p: string) => bcrypt.hash(p, 10);

  // Create users
  const [admin, mod, user1, user2] = await Promise.all([
    prisma.user.create({
      data: { email: 'admin@test.com', password: await hash('password123'), role: 'SUPER_ADMIN' },
    }),
    prisma.user.create({
      data: { email: 'mod@test.com', password: await hash('password123'), role: 'MODERATOR' },
    }),
    prisma.user.create({
      data: { email: 'user1@test.com', password: await hash('password123'), role: 'REGULAR_USER' },
    }),
    prisma.user.create({
      data: { email: 'user2@test.com', password: await hash('password123'), role: 'REGULAR_USER' },
    }),
  ]);

  console.log('✅ Users created');

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: 'Getting Started with NestJS',
        content: 'NestJS is a progressive Node.js framework for building efficient and scalable server-side applications. It uses TypeScript by default and combines elements of OOP, FP, and FRP.',
        authorId: user1.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'React + TanStack Query: The Right Way',
        content: 'TanStack Query (formerly React Query) is a powerful data synchronization library. It handles caching, background updates, stale data, and much more out of the box without touching global state.',
        authorId: user1.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'PostgreSQL Performance Tips',
        content: 'Indexes are one of the most powerful tools for query optimization. Understanding when and how to use them can dramatically improve your database performance. Always analyze slow queries with EXPLAIN ANALYZE.',
        authorId: user2.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Understanding JWT Authentication',
        content: 'JSON Web Tokens are a compact, URL-safe means of representing claims between two parties. The token is signed using a secret or public/private key pair.',
        authorId: user2.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Prisma ORM: A Complete Guide',
        content: 'Prisma is a next-generation ORM that makes working with databases easy for application developers. It consists of Prisma Client, Prisma Migrate, and Prisma Studio.',
        authorId: mod.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Role-Based Access Control Patterns',
        content: 'RBAC is an approach to restricting system access to authorized users. It is a policy-neutral access-control mechanism defined around roles and privileges.',
        authorId: admin.id,
      },
    }),
  ]);

  console.log('✅ Posts created');

  // Create comments
  const commentData = [
    { content: 'Great article! Very helpful for beginners.', authorId: user2.id, postId: posts[0].id },
    { content: 'I have been using NestJS for 2 years, this is spot on.', authorId: mod.id, postId: posts[0].id },
    { content: 'Thanks for sharing! Could you cover dependency injection next?', authorId: admin.id, postId: posts[0].id },
    { content: 'TanStack Query changed how I think about server state completely.', authorId: user1.id, postId: posts[1].id },
    { content: 'Do you have a comparison with SWR? Would love to see that.', authorId: mod.id, postId: posts[1].id },
    { content: 'The cache invalidation patterns are the best part.', authorId: admin.id, postId: posts[1].id },
    { content: 'EXPLAIN ANALYZE is a lifesaver. Every developer should know this.', authorId: user1.id, postId: posts[2].id },
    { content: 'Don\'t forget about partial indexes! They can be very powerful.', authorId: admin.id, postId: posts[2].id },
    { content: 'What about connection pooling with PgBouncer?', authorId: mod.id, postId: posts[2].id },
    { content: 'Never store sensitive data in JWT payload!', authorId: user2.id, postId: posts[3].id },
    { content: 'Refresh token rotation is important for security.', authorId: mod.id, postId: posts[3].id },
    { content: 'Great overview. Using short expiry times is key.', authorId: admin.id, postId: posts[3].id },
    { content: 'Prisma Studio is underrated. Makes debugging so easy.', authorId: user1.id, postId: posts[4].id },
    { content: 'The migration workflow is much better than raw SQL files.', authorId: user2.id, postId: posts[4].id },
    { content: 'How does Prisma compare to TypeORM performance-wise?', authorId: admin.id, postId: posts[4].id },
    { content: 'RBAC vs ABAC is an interesting debate. Great post!', authorId: user1.id, postId: posts[5].id },
    { content: 'For complex systems, consider combining both approaches.', authorId: user2.id, postId: posts[5].id },
    { content: 'This is exactly how I implemented it in our production system.', authorId: mod.id, postId: posts[5].id },
  ];

  await prisma.comment.createMany({ data: commentData });

  console.log('✅ Comments created');
  console.log('\n🎉 Seed complete! Test accounts:');
  console.log('  SUPER_ADMIN  → admin@test.com / password123');
  console.log('  MODERATOR    → mod@test.com   / password123');
  console.log('  REGULAR_USER → user1@test.com / password123');
  console.log('  REGULAR_USER → user2@test.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
