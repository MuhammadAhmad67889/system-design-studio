/*
 * Practice quiz bank: 10 questions across the curriculum.
 * All content is original teaching material written for this app.
 */

import type { QuizQuestion } from '@/lib/types';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'Latency & Throughput',
    difficulty: 'Beginner',
    question:
      'A server takes 100 ms to handle each request. What is the highest throughput it can reach?',
    options: [
      '100 requests per second',
      '10 requests per second',
      '1,000 requests per second',
      'It has no limit if requests arrive slowly',
    ],
    answerIndex: 1,
    explanation:
      'Throughput is capped by service time: 1 second divided by 0.1 seconds per request gives 10 requests per second. The common wrong answer, 100 per second, confuses the 100 ms service time with a rate — 100 ms is a duration, not a count.',
    hint: 'Ask how many 100 ms slices fit into one second.',
    lessonId: 'l2',
  },
  {
    id: 'q2',
    topic: 'Latency & Throughput',
    difficulty: 'Intermediate',
    question:
      'Little’s Law says L = λW. If 20 requests arrive per second and each spends an average of 0.5 seconds in the system, how many requests are in the system on average?',
    options: ['10 requests', '40 requests', '20 requests', '0.5 requests'],
    answerIndex: 0,
    explanation:
      'L = λW = 20 × 0.5 = 10 requests in the system on average. The tempting wrong answer, 40, comes from dividing 20 by 0.5 instead of multiplying — but Little’s Law multiplies the arrival rate by the time spent.',
    hint: 'Multiply the arrival rate by the time each request spends inside.',
    lessonId: 'l2',
  },
  {
    id: 'q3',
    topic: 'Scaling',
    difficulty: 'Beginner',
    question:
      'Traffic to a single server has grown past what it can handle. Which statement best describes vertical scaling?',
    options: [
      'Adding more servers behind a load balancer',
      'Replacing the server with a bigger machine',
      'Adding a cache in front of the database',
      'Splitting the database into shards',
    ],
    answerIndex: 1,
    explanation:
      'Vertical scaling means scaling up: a bigger machine with more CPU and memory. Adding more servers is horizontal scaling, which is the common wrong answer here — it solves the same problem, but it is the other approach.',
    hint: 'Think “up” versus “out”: which one changes the size of the machine itself?',
    lessonId: 'l5',
  },
  {
    id: 'q4',
    topic: 'Load Balancing',
    difficulty: 'Intermediate',
    question:
      'A load balancer uses the least-connections algorithm. Which server receives the next request?',
    options: [
      'The server that answered the most requests so far',
      'The server with the fewest requests currently in progress',
      'The server with the lowest CPU usage last hour',
      'The server chosen at random',
    ],
    answerIndex: 1,
    explanation:
      'Least-connections sends each new request to the server with the fewest active connections right now, which adapts to uneven request costs. The common wrong answer — the server that answered the most requests so far — describes history, not current load, and would keep piling work onto the busiest server.',
    hint: 'The algorithm looks at what is happening right now, not at totals from the past.',
    lessonId: 'l6',
  },
  {
    id: 'q5',
    topic: 'Caching',
    difficulty: 'Intermediate',
    question:
      'In cache-aside (lazy loading), what happens on a cache miss?',
    options: [
      'The request fails and the client retries later',
      'The application reads the database, stores the result in the cache, and returns it',
      'The cache is cleared so the next request starts fresh',
      'The database writes the result to the cache before answering',
    ],
    answerIndex: 1,
    explanation:
      'On a miss, the application falls back to the database, then fills the cache with the result before returning it — that is what makes the pattern “lazy”. The common wrong answer, the database writing to the cache, describes write-through caching, where the database side owns the fill.',
    hint: 'The application owns both the read and the fill — what does it do when the cache has nothing?',
    lessonId: 'l14',
  },
  {
    id: 'q6',
    topic: 'Replication',
    difficulty: 'Intermediate',
    question:
      'A database has one primary and two read replicas with asynchronous replication. A user updates their profile and immediately reloads the page. What can happen?',
    options: [
      'The reload always shows the update, because replicas are instant copies',
      'The reload may show the old profile, because the replica can lag behind the primary',
      'The update is lost, because writes only go to the replicas',
      'The page fails to load until the replicas catch up',
    ],
    answerIndex: 1,
    explanation:
      'With asynchronous replication, replicas trail the primary by a small lag, so a read right after a write can land on a replica that has not received the update yet. The common wrong answer — that replicas are instant copies — ignores replication lag, which is the whole trade-off of asynchronous copying.',
    hint: 'Copies take time to catch up — what does a read see in that window?',
    lessonId: 'l11',
  },
  {
    id: 'q7',
    topic: 'Queues',
    difficulty: 'Intermediate',
    question:
      'Why put a message queue between a web server and an image-processing worker?',
    options: [
      'So the web server can reply immediately while the slow work happens later',
      'So images are stored in the queue instead of a database',
      'So the worker can skip images that are too large',
      'So the web server and the worker share one database connection',
    ],
    answerIndex: 0,
    explanation:
      'The queue decouples the two sides: the web server accepts the upload, enqueues a job, and replies at once, while the worker processes jobs at its own pace — even if it is temporarily down, the jobs wait safely. The common wrong answer, storing images in the queue, mistakes the queue for storage; a queue holds jobs, not files.',
    hint: 'Think about who waits: should the user wait for the slow work to finish?',
    lessonId: 'l22',
  },
  {
    id: 'q8',
    topic: 'Stateless Services',
    difficulty: 'Intermediate',
    question:
      'Why do horizontally scaled services need to be stateless?',
    options: [
      'So any server can handle any request, and servers can be added or removed freely',
      'So the servers use less memory than stateful ones',
      'So the load balancer can cache responses for them',
      'So the database no longer needs to store user data',
    ],
    answerIndex: 0,
    explanation:
      'If a server keeps user state in its own memory, a later request from the same user must return to that same server — which breaks load balancing and makes removing a server lose data. Stateless services keep shared state in a database or cache instead, so any server can serve any request. The common wrong answer, using less memory, is not the point: statelessness is about where state lives, not how much there is.',
    hint: 'What breaks if the next request lands on a different server than the last one?',
    lessonId: 'l7',
  },
  {
    id: 'q9',
    topic: 'Consistent Hashing',
    difficulty: 'Advanced',
    question:
      'A cache cluster uses consistent hashing with 4 nodes. A fifth node is added. What happens to the cached keys?',
    options: [
      'Every key is reshuffled across all 5 nodes',
      'Only the keys that now belong to the new node move; the rest stay put',
      'All keys move to the new node until it fills up',
      'Nothing moves, because the hash ring is fixed at 4 nodes',
    ],
    answerIndex: 1,
    explanation:
      'Consistent hashing places nodes on a ring, so adding a node only takes over the slice of the ring next to it — roughly one fifth of the keys move, and the rest stay where they are. The common wrong answer, that every key is reshuffled, describes plain modulo hashing, which is exactly the problem consistent hashing was invented to fix.',
    hint: 'The point of the ring is to limit the damage of adding a node — how much should move?',
    lessonId: 'l17',
  },
  {
    id: 'q10',
    topic: 'Latency & Throughput',
    difficulty: 'Beginner',
    question:
      'A server’s utilization is 1.2 (120%). What does that mean for the queue?',
    options: [
      'The queue stays empty because the server is fast enough',
      'The queue grows without bound, because more work arrives than the server can finish',
      'The queue shrinks, because utilization above 100% means extra capacity',
      'The queue stays the same size no matter what arrives',
    ],
    answerIndex: 1,
    explanation:
      'Utilization above 1 means arrivals outpace service: if 12 requests arrive per second and the server finishes 10, the queue gains 2 every second and never drains. The common wrong answer, that utilization above 100% means extra capacity, reads the number backwards — 100% is the ceiling, and anything above it is overload, not headroom.',
    hint: 'If more arrives each second than leaves, what happens to the pile in the middle?',
    lessonId: 'l2',
  },
];
