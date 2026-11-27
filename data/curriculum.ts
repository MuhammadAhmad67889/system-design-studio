/*
 * The curriculum catalog: 9 chapters, 40 lessons.
 *
 * Only four lessons carry full step-by-step content in this build
 * (lessons 1, 2, 5 and 11 — see data/lessons-full.ts). The other 36
 * have a title, duration, difficulty, intro and objectives, and are
 * marked comingSoon so the UI never presents a stub as finished.
 */

import type { Chapter, Lesson } from '@/lib/types';

function lesson(
  id: string,
  chapterId: string,
  number: number,
  title: string,
  durationMin: number,
  difficulty: Lesson['difficulty'],
  intro: string,
): Lesson {
  return {
    id,
    chapterId,
    number,
    title,
    durationMin,
    difficulty,
    intro,
    objectives: [],
    steps: [],
    summary: '',
    comingSoon: true,
  };
}

export const chapters: Chapter[] = [
  {
    id: 'foundations',
    number: 1,
    title: 'Foundations',
    tagline: 'How a request travels, and what fast even means.',
    color: 'leaf',
    lessons: [
      lesson('l1', 'foundations', 1, 'How a Request Travels', 12, 'Beginner',
        'Follow one click from a browser all the way to a database row and back.'),
      lesson('l2', 'foundations', 2, 'Latency & Throughput', 11, 'Beginner',
        'Why a server can be "fast" and still feel slow once a queue forms.'),
      lesson('l3', 'foundations', 3, 'Napkin Math', 10, 'Beginner',
        'Back-of-the-envelope estimates: powers of ten, and sizing a system before building it.'),
    ],
  },
  {
    id: 'scaling',
    number: 2,
    title: 'Scaling',
    tagline: 'From one server to many — and what breaks on the way.',
    color: 'amber',
    lessons: [
      lesson('l4', 'scaling', 4, 'The Hockey Stick', 9, 'Beginner',
        'Traffic does not grow in a straight line. Plan for the bend.'),
      lesson('l5', 'scaling', 5, 'Vertical vs Horizontal Scaling', 12, 'Beginner',
        'Bigger machine or more machines? The trade-off that shapes every architecture.'),
      lesson('l6', 'scaling', 6, 'Load Balancing', 13, 'Intermediate',
        'Round robin, least connections, IP hash — spreading work fairly.'),
      lesson('l7', 'scaling', 7, 'Stateless vs Stateful Services', 10, 'Intermediate',
        'Why stateless services scale and where state has to live instead.'),
      lesson('l8', 'scaling', 8, 'Auto Scaling', 11, 'Intermediate',
        'Adding servers when load rises — and removing them before the bill does.'),
    ],
  },
  {
    id: 'data-storage',
    number: 3,
    title: 'Data & Storage',
    tagline: 'Where data lives, how it is found, and how it survives.',
    color: 'lilac',
    lessons: [
      lesson('l9', 'data-storage', 9, 'SQL vs NoSQL', 12, 'Beginner',
        'Tables and joins versus documents and keys — pick by access pattern, not fashion.'),
      lesson('l10', 'data-storage', 10, 'Database Indexes', 11, 'Intermediate',
        'How an index turns a full scan into a lookup, and what it costs on writes.'),
      lesson('l11', 'data-storage', 11, 'Database Replication', 12, 'Intermediate',
        'One writer, many readers: copies, lag, and what "eventually" really means.'),
      lesson('l12', 'data-storage', 12, 'Database Sharding', 13, 'Advanced',
        'Splitting one table across many machines — and the queries that get harder.'),
      lesson('l13', 'data-storage', 13, 'Partitioning Strategies', 12, 'Advanced',
        'Range, hash, and list partitioning: choosing the key that keeps data even.'),
      lesson('l14', 'data-storage', 14, 'Caching Fundamentals', 11, 'Beginner',
        'The fastest database call is the one you never make.'),
      lesson('l15', 'data-storage', 15, 'Cache Invalidation', 12, 'Intermediate',
        'Naming things is hard; invalidating caches is harder.'),
      lesson('l16', 'data-storage', 16, 'Cache Stampedes', 11, 'Advanced',
        'When a cache expires and a thousand requests hit the database at once.'),
      lesson('l17', 'data-storage', 17, 'Consistent Hashing', 13, 'Advanced',
        'Adding a cache node without reshuffling every key.'),
      lesson('l18', 'data-storage', 18, 'Object Storage', 10, 'Beginner',
        'Files, images and backups at a scale no filesystem was built for.'),
      lesson('l19', 'data-storage', 19, 'Search and Indexing', 12, 'Intermediate',
        'From keyword search to inverted indexes and ranking.'),
    ],
  },
  {
    id: 'communication',
    number: 4,
    title: 'Communication',
    tagline: 'How services talk — and what happens when they stop.',
    color: 'sky',
    lessons: [
      lesson('l20', 'communication', 20, 'HTTP and REST', 11, 'Beginner',
        'The verbs, status codes and resource shapes behind nearly every API.'),
      lesson('l21', 'communication', 21, 'WebSockets and Real-Time Communication', 12, 'Intermediate',
        'When a request-response round trip is too slow for live updates.'),
      lesson('l22', 'communication', 22, 'Message Queues', 12, 'Intermediate',
        'Decoupling producers from consumers with a durable middle.'),
      lesson('l23', 'communication', 23, 'Event-Driven Architecture', 13, 'Advanced',
        'Systems that react to things that happened, instead of asking for them.'),
    ],
  },
  {
    id: 'reliability',
    number: 5,
    title: 'Reliability',
    tagline: 'Things will fail. Design so nobody notices.',
    color: 'amber',
    lessons: [
      lesson('l24', 'reliability', 24, 'Timeouts and Retries', 11, 'Intermediate',
        'How long to wait, when to try again, and when retrying makes everything worse.'),
      lesson('l25', 'reliability', 25, 'Circuit Breakers', 11, 'Intermediate',
        'Stop calling a service that is already down — fail fast, recover gracefully.'),
      lesson('l26', 'reliability', 26, 'Rate Limiting', 10, 'Intermediate',
        'Protecting a service from its own users, fairly.'),
      lesson('l27', 'reliability', 27, 'Fault Tolerance and Redundancy', 12, 'Advanced',
        'No single point of failure: the discipline behind "five nines".'),
    ],
  },
  {
    id: 'architecture',
    number: 6,
    title: 'Architecture',
    tagline: 'Putting the pieces together into systems that last.',
    color: 'leaf',
    lessons: [
      lesson('l28', 'architecture', 28, 'Monolith vs Microservices', 13, 'Intermediate',
        'One deployable or many? The honest trade-offs on both sides.'),
      lesson('l29', 'architecture', 29, 'API Gateway and Service Discovery', 12, 'Advanced',
        'One front door for many services, and how services find each other.'),
      lesson('l30', 'architecture', 30, 'Distributed Transactions and Sagas', 14, 'Advanced',
        'Keeping several services consistent without a single database transaction.'),
      lesson('l31', 'architecture', 31, 'Eventual Consistency', 12, 'Advanced',
        'When "eventually" is a promise you can keep — and when it is not.'),
    ],
  },
  {
    id: 'security',
    number: 7,
    title: 'Security',
    tagline: 'Who you are, what you may do, and what stays secret.',
    color: 'lilac',
    lessons: [
      lesson('l32', 'security', 32, 'Authentication and Authorization', 12, 'Intermediate',
        'Proving identity, then proving permission — two different jobs.'),
      lesson('l33', 'security', 33, 'Encryption and Secrets Management', 11, 'Intermediate',
        'At rest, in transit, and the keys that must never end up in a repo.'),
      lesson('l34', 'security', 34, 'Application and Infrastructure Security', 12, 'Advanced',
        'The boring checklist that stops the interesting breaches.'),
    ],
  },
  {
    id: 'shipping',
    number: 8,
    title: 'Shipping',
    tagline: 'From a laptop to production, and knowing it works.',
    color: 'sky',
    lessons: [
      lesson('l35', 'shipping', 35, 'CI/CD and Deployment', 11, 'Beginner',
        'Every commit tested, every release boring.'),
      lesson('l36', 'shipping', 36, 'Monitoring, Logging and Observability', 12, 'Intermediate',
        'Metrics tell you something is wrong; traces tell you where.'),
    ],
  },
  {
    id: 'whole-systems',
    number: 9,
    title: 'Whole Systems',
    tagline: 'Design complete systems, end to end.',
    color: 'leaf',
    lessons: [
      lesson('l37', 'whole-systems', 37, 'Design a URL Shortener', 15, 'Intermediate',
        'Tiny URLs, big lessons: hashing, storage, and scale.'),
      lesson('l38', 'whole-systems', 38, 'Design a Notification System', 15, 'Advanced',
        'Millions of notifications, delivered once, on time.'),
      lesson('l39', 'whole-systems', 39, 'Design a Chat Application', 16, 'Advanced',
        'Real-time messages, presence, and history that never loses a word.'),
      lesson('l40', 'whole-systems', 40, 'Design a Video Streaming Platform', 16, 'Advanced',
        'Upload once, watch anywhere: encoding, CDN, and playback at scale.'),
    ],
  },
];

/** Flat list of all 40 lessons, in curriculum order. */
export const allLessons: Lesson[] = chapters.flatMap((c) => c.lessons);

/** Total lesson count — the spec fixes this at 40. */
export const TOTAL_LESSONS = 40;
