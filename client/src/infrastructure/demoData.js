// Seed content for the offline demo repository. Mirrors the backend DataSeeder.
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEMO_PASSWORD = 'Password123!';

export const seedUsers = [
  { id: 1, name: 'Amara Wanjiku', email: 'instructor@coursely.dev', role: 'INSTRUCTOR', headline: 'Product designer & educator' },
  { id: 2, name: 'Daniel Mwangi', email: 'daniel@coursely.dev', role: 'INSTRUCTOR', headline: 'Senior front-end engineer' },
  { id: 3, name: 'Grace Njeri', email: 'grace@coursely.dev', role: 'INSTRUCTOR', headline: 'Founder & business mentor' },
  { id: 10, name: 'Jordan Davis', email: 'student@coursely.dev', role: 'STUDENT', headline: 'Curious learner' },
  { id: 11, name: 'Mia Otieno', email: 'mia@example.com', role: 'STUDENT', headline: '' },
  { id: 12, name: 'Liam Kariuki', email: 'liam@example.com', role: 'STUDENT', headline: '' },
  { id: 13, name: 'Zawadi Achieng', email: 'zawadi@example.com', role: 'STUDENT', headline: '' },
  { id: 14, name: 'Noah Barasa', email: 'noah@example.com', role: 'STUDENT', headline: '' },
];

const curriculum = (titles) => titles.map(([title, lessons], mi) => ({
  id: 0, title,
  lessons: lessons.map(([t, type, min], li) => ({ id: 0, title: t, type, durationMinutes: min, content: type === 'VIDEO' ? '' : `Key ideas from "${t}": read through the notes, try the exercise, and write down one thing you would do differently.` })),
}));

const standard = (topic) => curriculum([
  [`Getting started with ${topic}`, [['Welcome and course roadmap', 'VIDEO', 6], ['What you will build', 'VIDEO', 9], ['Tools and setup checklist', 'READING', 8]]],
  ['Core techniques', [['The fundamentals, step by step', 'VIDEO', 24], ['Guided practice session', 'VIDEO', 31], ['Common mistakes to avoid', 'READING', 10], ['Techniques recap', 'VIDEO', 14]]],
  ['Putting it into practice', [['Project brief', 'READING', 7], ['Build along, part 1', 'VIDEO', 38], ['Build along, part 2', 'VIDEO', 42], ['Review, polish and share', 'VIDEO', 18]]],
]);

const base = [
  [1, 'Art Painting Essentials: Draw What You See', 'Art & Design', 'Beginner', 1, 32.99, 58.99, 'NEW', 5.0, 214, 'Develop a confident eye and steady hand. Learn composition, light and colour through short, practical studio sessions.', '1513364776144-60967b0f800f', 'Art Painting'],
  [2, 'Minimalism: How to Make Things Simpler', 'Communication', 'Beginner', 3, 40.99, 45.99, 'HOT', 4.8, 1320, 'Cut the noise from your work, your messages and your space. A calm, practical system for saying and doing more with less.', '1517842645767-c639042777db', 'Minimalism'],
  [3, 'How to Be a DJ? Make Electronic Music', 'Music', 'Intermediate', 2, 22.55, 49.99, 'FEATURED', 5.0, 876, 'From beat matching to your first original track. Build a complete set and learn the production workflow used by working DJs.', '1470225620780-dba8ba36b745', 'Electronic Music'],
  [4, 'Graphic Design Basics Masterclass', 'Art & Design', 'Beginner', 1, 24.99, null, null, 4.7, 1950, 'Typography, colour, layout and brand systems. Finish with a portfolio-ready identity project.', '1626785774573-4b799315345d', 'Graphic Design'],
  [5, 'Modern Web Development with React', 'Development', 'Intermediate', 2, 109.99, 129.99, 'HOT', 4.9, 3140, 'Build fast, accessible, production-ready interfaces with React, routing and clean architecture.', '1498050108023-c5249f4df085', 'React'],
  [6, 'Road Bike Manual: How to Be a Champion', 'Communication', 'Intermediate', 3, 12.99, 49.99, null, 4.6, 640, 'Training blocks, fuelling, bike handling and race craft, explained clearly by a coach who has been there.', '1485965120184-e220f721d03e', 'Road Cycling'],
  [7, 'Landscape Photography: Capture Beautiful Scenes', 'Photography', 'Beginner', 1, 14.99, 39.99, 'HOT', 4.9, 2210, 'Plan, shoot and edit landscapes that feel like the moment you remember. Light, composition and post-processing.', '1506905925346-21bda4d32df4', 'Landscape Photography'],
  [8, 'Digital Marketing Masterclass', 'Marketing', 'Beginner', 3, 9.9, 14.45, 'SPECIAL', 4.8, 1810, 'Create campaigns that connect with real audiences. SEO, content, email and paid channels in one practical programme.', '1460925895917-afdab827c52f', 'Digital Marketing'],
  [9, 'Fashion Photography with a Professional', 'Photography', 'Advanced', 1, 35, null, 'SPECIAL', 5.0, 420, 'Direct a shoot from concept to final retouch. Lighting setups, posing, working with models and delivering for clients.', '1516035069371-29a1b244cc32', 'Fashion Photography'],
];

export const seedCourses = base.map(([id, title, category, level, instructorId, price, originalPrice, badge, rating, students, description, img, topic], i) => {
  const modules = standard(topic);
  let mid = id * 100; let lid = id * 1000;
  modules.forEach((m) => { m.id = ++mid; m.lessons.forEach((l) => { l.id = ++lid; }); });
  return {
    id, title, category, level, instructorId, price, originalPrice, badge, rating, ratingCount: Math.round(students / 6), students,
    description, imageUrl: U(img), status: 'PUBLISHED', modules,
    createdAt: new Date(Date.UTC(2026, 10, 12 - i, 9)).toISOString(),
  };
});
// An unpublished draft so the instructor workspace shows more than one status.
seedCourses.push({
  id: 10, title: 'Brand Storytelling for Creators', category: 'Marketing', level: 'Intermediate', instructorId: 1, price: 29, originalPrice: null,
  badge: null, rating: 0, ratingCount: 0, students: 0, description: 'Shape a brand voice and tell stories that people remember and share.',
  imageUrl: U('1522202176988-66273c2fd55f'), status: 'DRAFT', createdAt: new Date(Date.UTC(2026, 10, 15, 9)).toISOString(),
  modules: [{ id: 1001, title: 'Finding your voice', lessons: [{ id: 10001, title: 'What makes a story stick', type: 'VIDEO', durationMinutes: 12, content: '' }] }],
});

/** Seed enrollments: userId, courseId, completed lesson ids (with days-ago). */
export const seedEnrollments = [
  { id: 1, userId: 10, courseId: 7, daysAgo: 20, done: [[7001, 6], [7002, 5], [7003, 4], [7004, 3], [7005, 2], [7006, 1]] },
  { id: 2, userId: 10, courseId: 5, daysAgo: 12, done: [[5001, 3], [5002, 2], [5003, 1]] },
  { id: 3, userId: 10, courseId: 3, daysAgo: 3, done: [[3001, 0]] },
  { id: 4, userId: 11, courseId: 7, daysAgo: 9, done: [[7001, 2]] },
  { id: 5, userId: 12, courseId: 7, daysAgo: 6, done: [] },
  { id: 6, userId: 13, courseId: 1, daysAgo: 4, done: [[1001, 1], [1002, 1]] },
  { id: 7, userId: 14, courseId: 4, daysAgo: 2, done: [] },
  { id: 8, userId: 11, courseId: 9, daysAgo: 1, done: [[9001, 0]] },
];
