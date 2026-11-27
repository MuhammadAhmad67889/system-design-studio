/*
 * Fully-written lessons — filled in by the curriculum completion work.
 * Each lesson follows the exact shape of the four original full lessons
 * in data/lessons-full.ts: intro, objectives, 4+ steps (each with a
 * diagram, metrics, what-changed, good-to-know and takeaway), summary.
 *
 * Part G — the Whole Systems capstones: l37 Design a URL Shortener,
 * l38 Design a Notification System, l39 Design a Chat Application,
 * l40 Design a Video Streaming Platform.
 *
 * All metric values are illustrative — see ILLUSTRATIVE in
 * data/lesson-helpers.ts. Never present an illustrative number as a
 * measurement from a real system.
 */

import type { Lesson } from '@/lib/types';
import { ILLUSTRATIVE, edge, metric, node, step } from '@/data/lesson-helpers';

export const lessonsPartG: Record<string, Lesson> = {
  l37: {
    id: 'l37',
    chapterId: 'whole-systems',
    number: 37,
    title: 'Design a URL Shortener',
    durationMin: 15,
    difficulty: 'Intermediate',
    intro: 'Tiny URLs, big lessons: hashing, storage, and scale.',
    objectives: [
      'State the functional and non-functional requirements of a URL shortener',
      'Estimate read and write rates and storage from daily traffic',
      'Compare counter-based and hash-based short-code generation',
      'Design the data model and API for shortening, redirecting, and stats',
      'Explain how caching, replication, and a queue keep redirects fast',
      'Name the bottlenecks: the counter, the cache, and invalidation',
    ],
    formulas: [
      {
        name: 'Short-code space (base62)',
        expression: '62^7 ≈ 3.5 trillion',
        note: 'With 62 characters — digits, lowercase, and uppercase letters — a 7-character code gives 62^7, or about 3.5 trillion possible values, far more than 5 million new URLs a day.',
      },
      {
        name: 'Storage over five years',
        expression: '5M × 500 B × 365 × 5 ≈ 4.5 TB',
        note: 'Five million new URLs a day at about 500 bytes each is 2.5 GB a day, or about 4.5 TB over five years.',
      },
    ],
    steps: [
      step(
        's1',
        'Pin down the requirements',
        'Before drawing a single box, write down what the system must do. A user pastes a long URL and gets a short link back; anyone opening the short link is redirected to the original. Owners can pick a custom alias, see click statistics, and delete or expire a link. The non-functional side matters more: redirects must be fast, the service must stay up, and every short code must be unique. Reads will dwarf writes, so the design should be shaped around the redirect path, not the creation path.',
        [
          metric('New URLs', '5M', '/day'),
          metric('Redirects', '500M', '/day'),
          metric('Read : write', '100:1'),
        ],
        [
          'Functional needs listed: shorten, redirect, alias, stats, expiry',
          'Non-functional needs listed: fast, available, unique codes',
        ],
        'A short link that sometimes redirects to the wrong page is worse than a slow one — uniqueness is a correctness requirement, not a nice-to-have.',
        'Design for the redirect path first, because reads outnumber writes a hundred to one.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy' }),
            node('client', 'client', 'Browser', 220, 150, { status: 'healthy', sublabel: 'Pastes long URL' }),
            node('server', 'server', 'App Server', 420, 150, { status: 'healthy', sublabel: 'Returns short link' }),
          ],
          edges: [edge('user', 'client', 'Pastes long URL'), edge('client', 'server', 'POST /shorten')],
          activeNodeIds: ['user', 'client', 'server'],
          activeEdgeIds: ['user->client', 'client->server'],
          caption: 'A user pastes a long URL and the service returns a short link.',
        },
      ),
      step(
        's2',
        'Back-of-envelope estimates',
        'The case study assumes 5 million new short URLs a day and 500 million redirects a day, so reads outnumber writes by about 100 to 1. Dividing 500 million by 86,400 seconds gives roughly 5,800 redirects a second on average, and peak traffic runs about twice that, near 11,600 a second. Each stored record is about 500 bytes, so 5 million a day is 2.5 gigabytes a day, or about 4.5 terabytes over five years. These numbers size every later choice: the read path must be cheap, and storage is large but not frightening.',
        [
          metric('Avg redirects', '5,800', '/s'),
          metric('Peak redirects', '11,600', '/s'),
          metric('Storage / 5 yr', '4.5', 'TB'),
        ],
        [
          'Read rate estimated at about 5,800 redirects a second on average',
          'Storage sized at about 4.5 TB over five years',
        ],
        'Estimates are for sizing, not for precision — being within a factor of two is enough to choose the right shape of system.',
        'Do the napkin math first; it tells you which parts of the system will hurt.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '500M redirects/day' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy', sublabel: '5,800 req/s avg' }),
            node('db', 'db', 'Database', 420, 150, { status: 'healthy', sublabel: '2.5 GB/day' }),
          ],
          edges: [
            edge('user', 'server', '500M redirects/day'),
            edge('server', 'db', '5M writes/day'),
          ],
          activeNodeIds: ['user', 'server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'Reads dominate: about 500 million redirects a day against 5 million new links.',
        },
      ),
      step(
        's3',
        'Generating short codes',
        'A short code has to be short, unique, and safe to put in a URL. Base62 — digits plus lowercase and uppercase letters — gives 62 characters, so a 7-character code has 62 to the power of 7, about 3.5 trillion possible values. Two ways to pick one: hash the long URL and take the first characters, or take a number from a global counter and encode it in base62. A counter never collides, but it needs one shared source of numbers. A hash needs no shared state, yet it can collide, so the design checks the database and retries with a different salt.',
        [
          metric('Code space', '3.5T', 'codes'),
          metric('Code length', '7', 'chars'),
          metric('Collisions', '0', undefined, 'good'),
        ],
        [
          'Two generation strategies compared: hash vs counter',
          'Counter chosen as the primary path because it never collides',
        ],
        'A hash of the same URL always produces the same code, which is why the design returns the existing code when a URL is shortened twice.',
        'A counter guarantees uniqueness; a hash trades that guarantee for statelessness.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'Shortener', 220, 150, { status: 'healthy', sublabel: 'Encodes base62' }),
            node('counter', 'service', 'Counter', 420, 40, { status: 'healthy', sublabel: 'Next number' }),
            node('db', 'db', 'Database', 420, 230, { status: 'healthy', sublabel: 'Stores code + URL' }),
          ],
          edges: [
            edge('client', 'server', 'POST /shorten'),
            edge('server', 'counter', 'Next number'),
            edge('server', 'db', 'Store code + URL'),
          ],
          activeNodeIds: ['server', 'counter', 'db'],
          activeEdgeIds: ['server->counter', 'server->db'],
          caption: 'A counter hands out unique numbers that are encoded in base62.',
        },
      ),
      step(
        's4',
        'Data model and API',
        'The data model is one row per short link: short code, original URL, owner id, creation time, expiry time, and a click count. The short code is the primary key, so a redirect is a single key lookup, never a scan. The API is small: POST /shorten takes a long URL and an optional custom alias and returns the short link, returning the existing code if the URL was already shortened. GET /{code} redirects with a 302, DELETE /urls/{code} retires a link, and GET /stats/{code} returns click statistics for the owner. Click events are written to a separate store, because counting in the link row would turn every redirect into a write on a hot row.',
        [
          metric('Lookup', '1', 'key fetch'),
          metric('Redirect', '302'),
          metric('Click writes', 'Async'),
        ],
        [
          'One row per link, keyed by short code',
          'Four endpoints defined: shorten, redirect, delete, stats',
        ],
        'A 301 tells browsers the redirect is permanent and lets them cache it, while a 302 keeps the service in control of the destination.',
        'The short code is the primary key, so a redirect is one lookup, never a scan.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy', sublabel: 'GET /{code}' }),
            node('db', 'db', 'Links Table', 420, 60, { status: 'healthy', sublabel: 'Keyed by code' }),
            node('queue', 'queue', 'Click Queue', 420, 240, { status: 'healthy', sublabel: 'Counts later' }),
          ],
          edges: [
            edge('client', 'server', 'GET /{code}'),
            edge('server', 'db', 'Key lookup'),
            edge('server', 'queue', 'Click event', 'async'),
          ],
          activeNodeIds: ['server', 'db', 'queue'],
          activeEdgeIds: ['server->db', 'server->queue'],
          caption: 'A redirect is one key lookup; the click is counted later through a queue.',
        },
      ),
      step(
        's5',
        'Architecture at scale',
        'Traffic arrives at a load balancer and spreads across stateless app servers, so any server can handle any request and servers can be added or removed freely. On the read path a cache sits in front of the database, holding the hottest short links in memory so most redirects never touch the database. The primary database stores every link and replicates to read replicas for stats and admin reads. Click events go to a message queue first and are counted asynchronously. New URLs are checked against a blocklist at creation time, never on the hot redirect path.',
        [
          metric('Cache hit rate', '~95', '%', 'good'),
          metric('Redirect latency', '~10', 'ms', 'good'),
          metric('Servers', 'Stateless'),
        ],
        [
          'Load balancer and stateless servers added',
          'Cache placed in front of the database on the read path',
          'Click counting moved to an asynchronous queue',
        ],
        'The blocklist check runs at creation time on purpose: the redirect path is too hot to spend on anything but the lookup.',
        'Cache the hot links, replicate for stats, and queue the counting.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy' }),
            node('lb', 'lb', 'Load Balancer', 190, 150, { status: 'healthy' }),
            node('server', 'server', 'App Servers', 360, 60, { status: 'healthy', sublabel: 'Stateless' }),
            node('cache', 'cache', 'Cache', 530, 60, { status: 'healthy', sublabel: 'Hot links' }),
            node('db', 'db', 'Database', 530, 240, { status: 'healthy', sublabel: 'All links' }),
          ],
          edges: [
            edge('client', 'lb', 'Redirect'),
            edge('lb', 'server', 'Spreads load'),
            edge('server', 'cache', 'Hot links'),
            edge('server', 'db', 'Cache miss'),
          ],
          activeNodeIds: ['lb', 'server', 'cache'],
          activeEdgeIds: ['client->lb', 'lb->server', 'server->cache'],
          caption: 'A cache in front of the database serves most redirects from memory.',
        },
      ),
      step(
        's6',
        'Bottlenecks and trade-offs',
        'Three things can break this design. First, the redirect read path: 500 million reads a day must be served mostly from cache, or the database becomes the bottleneck. Second, the counter service: every new URL needs a unique number, so it must be fast and highly available, or creation stalls. Third, cache invalidation: a deleted or expired link can linger in the cache, so expiry and deletion need explicit invalidation. The honest trade-offs are a 301 versus a 302 — browsers cache a 301, but a cached redirect is hard to revoke — and queued click counting, which keeps redirects fast while statistics lag a few seconds behind.',
        [
          metric('Bottleneck 1', 'Cache'),
          metric('Bottleneck 2', 'Counter'),
          metric('Stats lag', 'Seconds'),
        ],
        [
          'Bottlenecks named: read path, counter, invalidation',
          'Trade-offs weighed: 301 vs 302, queued vs synchronous counting',
        ],
        'A cache stampede on one viral link is the classic failure here: if the hottest entry expires, thousands of requests hit the database at once.',
        'Every shortcut in this design has a named price, and the prices are small.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('cache', 'cache', 'Cache', 190, 150, { status: 'degraded', sublabel: 'Stale on delete' }),
            node('counter', 'service', 'Counter', 360, 40, { status: 'busy', sublabel: 'Every new URL' }),
            node('db', 'db', 'Database', 360, 240, { status: 'healthy', sublabel: 'Fallback read' }),
          ],
          edges: [
            edge('server', 'cache', 'Lookup'),
            edge('server', 'counter', 'New code'),
            edge('server', 'db', 'Fallback read'),
          ],
          activeNodeIds: ['cache', 'counter'],
          activeEdgeIds: ['server->cache', 'server->counter'],
          caption: 'The cache, the counter, and invalidation are the three places this design can break.',
        },
      ),
    ],
    summary:
      'A URL shortener is mostly a read problem: 500 million redirects a day against 5 million new links, served by a cache in front of a database keyed by short code. Base62 codes come from a counter or a hash with a collision check, clicks are counted through a queue so redirects stay fast, and the blocklist runs at creation time. The bottlenecks are the cache, the counter, and invalidation on delete. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['caching-patterns', 'database-scaling'],
    relatedCaseStudies: ['url-shortener'],
  },
  l38: {
    id: 'l38',
    chapterId: 'whole-systems',
    number: 38,
    title: 'Design a Notification System',
    durationMin: 15,
    difficulty: 'Advanced',
    intro: 'Millions of notifications, delivered once, on time.',
    objectives: [
      'State the functional and non-functional requirements of a notification system',
      'Estimate delivery rates, peak load, and storage from daily volume',
      'Design the data model: deliveries, preferences, and templates',
      'Explain the queue-and-worker architecture and per-channel fan-out',
      'Apply idempotency, retries, and circuit breakers to delivery',
      'Name the bottlenecks: bursts, provider throttling, and fatigue',
    ],
    formulas: [
      {
        name: 'Peak delivery rate',
        expression: '100M ÷ 86,400 × 3 ≈ 3,500/sec',
        note: 'One hundred million notifications a day is about 1,160 a second on average; evening peaks run about three times the average, near 3,500 a second.',
      },
      {
        name: 'History storage',
        expression: '100M × 500 B × 90 ≈ 4.5 TB',
        note: 'At about 500 bytes per stored notification, one day is 50 GB and 90 days of retention is about 4.5 TB.',
      },
    ],
    steps: [
      step(
        's1',
        'Pin down the requirements',
        'One event can mean a million notifications: a popular account posts, and every follower gets a push, an email, or a text. The system must accept a notification request, work out who should receive it, deliver it on the right channel, and record what happened. The non-functional bar is high: delivery must be timely, each user should get each notification once, users control their preferences, and a flood of notifications must never take the rest of the product down. A notification that arrives twice is a bug users notice immediately.',
        [
          metric('Notifications', '100M', '/day'),
          metric('Channels', '3'),
          metric('Delivery goal', 'Once'),
        ],
        [
          'Functional needs listed: fan-out, multi-channel delivery, delivery records',
          'Non-functional needs listed: timely, once, preference-aware, isolated',
        ],
        'Notifications are a side effect of the product, never the product itself — a notification outage must never block the action that caused it.',
        'One event, many deliveries, each exactly once, on the channel the user chose.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Triggers event' }),
            node('server', 'server', 'API', 220, 150, { status: 'healthy', sublabel: 'Accepts request' }),
            node('channels', 'service', 'Channels', 420, 150, { status: 'healthy', sublabel: 'Push · Email · SMS' }),
          ],
          edges: [
            edge('user', 'server', 'Triggers event'),
            edge('server', 'channels', 'Deliver'),
          ],
          activeNodeIds: ['user', 'server', 'channels'],
          activeEdgeIds: ['user->server', 'server->channels'],
          caption: 'One event becomes a notification on the right channel for each user.',
        },
      ),
      step(
        's2',
        'Back-of-envelope estimates',
        'The working assumption is 100 million notifications a day. Dividing by 86,400 seconds gives about 1,160 deliveries a second on average, and evening peaks run about three times that, near 3,500 a second. Each stored notification record is about 500 bytes, so a day of history is 50 gigabytes, and 90 days of retention is about 4.5 terabytes. The sharp edge is fan-out: one post by an account with a million followers becomes a million deliveries from a single trigger, so the system must expand one event into many without blocking the writer.',
        [
          metric('Avg rate', '1,160', '/s'),
          metric('Peak rate', '3,500', '/s'),
          metric('History / 90 d', '4.5', 'TB'),
        ],
        [
          'Delivery rate estimated at about 1,160 a second on average',
          'Fan-out identified as the sharp edge: one event, a million deliveries',
        ],
        'Averages hide the problem here — fan-out bursts matter more than the daily average, so design for the burst, not the mean.',
        'Size for the peak and the fan-out, not just the daily total.',
        {
          nodes: [
            node('server', 'server', 'API', 20, 150, { status: 'healthy', sublabel: '1 event in' }),
            node('queue', 'queue', 'Queue', 220, 150, { status: 'busy', sublabel: '1M jobs out' }),
            node('workers', 'service', 'Workers', 420, 150, { status: 'healthy', sublabel: '3,500/s peak' }),
          ],
          edges: [
            edge('server', 'queue', '100M jobs/day'),
            edge('queue', 'workers', 'Fan-out'),
          ],
          activeNodeIds: ['queue', 'workers'],
          activeEdgeIds: ['server->queue', 'queue->workers'],
          caption: 'A hundred million notifications a day flow through the queue to the workers.',
        },
      ),
      step(
        's3',
        'Data model and API',
        'Three tables carry the design. A notifications table stores one row per delivery: recipient, channel, content reference, status, and timestamps. A preferences table records what each user wants — which events, which channels, and quiet hours. A templates table holds the message text per event type and language, so content is never built by hand in code. The API is small: POST /notifications accepts an event and its recipients, and GET /notifications/{userId} lists what a user received. Delivery status is updated as each provider reports back, so the record always shows where a notification stands.',
        [
          metric('Tables', '3'),
          metric('API calls', '2'),
          metric('Status updates', 'Per delivery'),
        ],
        [
          'Three tables defined: deliveries, preferences, templates',
          'Two endpoints defined: send and list',
        ],
        'Preferences are read on the delivery path, so they must be fast to fetch — a slow preference lookup delays every notification.',
        'Store the delivery, the preference, and the template separately.',
        {
          nodes: [
            node('client', 'client', 'API', 20, 150, { status: 'healthy' }),
            node('notifs', 'db', 'Notifications', 220, 60, { status: 'healthy', sublabel: 'One row per delivery' }),
            node('prefs', 'db', 'Preferences', 220, 240, { status: 'healthy', sublabel: 'Per user' }),
            node('templates', 'service', 'Templates', 420, 150, { status: 'healthy', sublabel: 'Renders text' }),
          ],
          edges: [
            edge('client', 'notifs', 'Store delivery'),
            edge('client', 'prefs', 'Check prefs'),
            edge('client', 'templates', 'Render template'),
          ],
          activeNodeIds: ['notifs', 'prefs', 'templates'],
          activeEdgeIds: ['client->notifs', 'client->prefs', 'client->templates'],
          caption: 'Deliveries, preferences, and templates are stored separately.',
        },
      ),
      step(
        's4',
        'Queue and workers',
        'The write path ends at a queue. The API validates the request, expands the recipient list, and writes one job per delivery into a message queue — then replies immediately, so the caller never waits for a million sends. Worker services pull jobs from the queue, one pool per channel: push, email, and SMS. Each worker checks preferences, renders the template, and calls its provider. Because workers scale independently, a surge in email never starves push delivery, and a slow provider only backs up its own queue.',
        [
          metric('Worker pools', '3'),
          metric('Queue depth', 'Grows at peak', undefined, 'warn'),
          metric('API reply', 'Immediate'),
        ],
        [
          'Write path ends at a queue; the API replies immediately',
          'One worker pool per channel, scaling independently',
        ],
        'Expanding a million recipients into a million queue jobs is itself work — fan-out is usually chunked, a few thousand recipients at a time, so one giant event cannot block the queue.',
        'Enqueue fast, deliver in parallel, and keep channels independent.',
        {
          nodes: [
            node('server', 'server', 'API', 20, 150, { status: 'healthy' }),
            node('queue', 'queue', 'Queue', 190, 150, { status: 'busy', sublabel: 'One job per delivery' }),
            node('push', 'service', 'Push Workers', 360, 60, { status: 'healthy' }),
            node('email', 'service', 'Email Workers', 360, 240, { status: 'healthy' }),
            node('sms', 'service', 'SMS Workers', 530, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('server', 'queue', 'Enqueue jobs'),
            edge('queue', 'push', 'Push jobs'),
            edge('queue', 'email', 'Email jobs'),
            edge('queue', 'sms', 'SMS jobs'),
          ],
          activeNodeIds: ['queue', 'push', 'email', 'sms'],
          activeEdgeIds: ['server->queue', 'queue->push', 'queue->email', 'queue->sms'],
          caption: 'One queue feeds separate worker pools for push, email, and SMS.',
        },
      ),
      step(
        's5',
        'Delivery guarantees',
        'Providers fail, networks drop, and queues redeliver — so exactly-once delivery is a promise no one can keep literally. The honest design is at-least-once delivery plus deduplication: every notification carries an idempotency key, and the worker checks a store of recently delivered keys before sending. Retries use exponential backoff so a struggling provider is not hammered, and a circuit breaker stops calling a provider that is clearly down. Ordering is kept per user, not globally: a user’s notifications travel through one partitioned queue, so they arrive in the order they were created.',
        [
          metric('Delivery', 'At-least-once'),
          metric('Duplicates', 'Deduped', undefined, 'good'),
          metric('Retry', 'Backoff'),
        ],
        [
          'Exactly-once replaced by at-least-once plus deduplication',
          'Retries use backoff; a circuit breaker stops calls to a dead provider',
        ],
        'Idempotency keys must live longer than the longest retry window, or a late redelivery slips past the check and sends twice.',
        'Promise at-least-once, then deduplicate so it feels like exactly once.',
        {
          nodes: [
            node('worker', 'service', 'Worker', 20, 150, { status: 'healthy' }),
            node('keys', 'db', 'Delivered Keys', 220, 150, { status: 'healthy', sublabel: 'Idempotency store' }),
            node('provider', 'service', 'Push Provider', 420, 150, { status: 'degraded', sublabel: 'Flaky today' }),
          ],
          edges: [
            edge('worker', 'keys', 'Check key'),
            edge('worker', 'provider', 'Send once'),
            edge('provider', 'worker', 'Retry later', 'response'),
          ],
          activeNodeIds: ['worker', 'keys', 'provider'],
          activeEdgeIds: ['worker->keys', 'worker->provider'],
          caption: 'Idempotency keys stop a retried notification from being sent twice.',
        },
      ),
      step(
        's6',
        'Bottlenecks and trade-offs',
        'The bottlenecks are bursts and bad neighbours. A celebrity post creates a million jobs in seconds, so fan-out must be chunked and rate-limited, or the queue drowns the workers. Providers throttle too: a push provider that accepts only so many sends a second forces the system to smooth its own output. And there is a human bottleneck — notification fatigue. Batching quiet updates into a digest, respecting quiet hours, and honouring opt-outs keeps the system trusted. Failed deliveries that exhaust their retries land in a dead-letter queue for inspection, never silently dropped.',
        [
          metric('Fan-out burst', '1M', 'jobs'),
          metric('Provider limit', 'Throttled', undefined, 'warn'),
          metric('Failed sends', 'Dead-letter'),
        ],
        [
          'Bottlenecks named: fan-out bursts, provider throttling, fatigue',
          'Failed deliveries routed to a dead-letter queue, never dropped',
        ],
        'A digest trades immediacy for quiet: users get one summary instead of twenty pings, and the system sends twenty times less.',
        'Rate-limit yourself before the provider does it for you.',
        {
          nodes: [
            node('queue', 'queue', 'Queue', 20, 150, { status: 'busy', sublabel: 'Burst of jobs' }),
            node('workers', 'service', 'Workers', 220, 150, { status: 'healthy' }),
            node('provider', 'service', 'Provider', 420, 150, { status: 'degraded', sublabel: 'Throttled' }),
            node('dlq', 'queue', 'Dead-Letter Q', 220, 240, { status: 'idle', sublabel: 'Failed sends' }),
          ],
          edges: [
            edge('queue', 'workers', 'Burst of jobs'),
            edge('workers', 'provider', 'Throttled sends'),
            edge('workers', 'dlq', 'Exhausted retries', 'async'),
          ],
          activeNodeIds: ['queue', 'provider', 'dlq'],
          activeEdgeIds: ['queue->workers', 'workers->provider', 'workers->dlq'],
          caption: 'Bursts and throttled providers back up the queue; exhausted retries go to a dead-letter queue.',
        },
      ),
    ],
    summary:
      'A notification system turns one event into many deliveries: the API validates and enqueues, workers per channel send, and idempotency keys plus retries make delivery effectively once. Fan-out is chunked and rate-limited, ordering is kept per user, and preferences and quiet hours keep the system welcome. The bottlenecks are bursts, provider throttling, and the trust lost by sending too much. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['reliability-patterns'],
  },
  l39: {
    id: 'l39',
    chapterId: 'whole-systems',
    number: 39,
    title: 'Design a Chat Application',
    durationMin: 16,
    difficulty: 'Advanced',
    intro: 'Real-time messages, presence, and history that never loses a word.',
    objectives: [
      'State the functional and non-functional requirements of a chat app',
      'Estimate message rates, storage, and concurrent connections',
      'Design a message store partitioned by conversation with sequence numbers',
      'Explain the WebSocket gateway, queue, and consistent-hashing routing',
      'Describe store-then-forward delivery, presence, and read receipts',
      'Name the bottlenecks: group fan-out, presence writes, and gateway failure',
    ],
    formulas: [
      {
        name: 'Message history storage',
        expression: '100M × 250 B × 365 ≈ 9 TB/year',
        note: 'One hundred million messages a day at about 250 bytes each is 25 GB a day, or about 9 TB over a year of history.',
      },
    ],
    steps: [
      step(
        's1',
        'Pin down the requirements',
        'A chat app has to feel instant: a message sent from one phone should appear on another in well under a second. It must support one-to-one and group chats, show who is online, keep a full history, and deliver messages to people who are offline when they return. Read receipts and typing indicators are expected, not extras. The hard requirements are ordering — messages in a conversation must appear in the order they were sent — and never losing a message, even when a phone drops off the network mid-send.',
        [
          metric('Delivery target', '< 1', 's', 'good'),
          metric('Chats', '1:1 + groups'),
          metric('Lost messages', '0', undefined, 'good'),
        ],
        [
          'Functional needs listed: instant messages, groups, presence, history, offline delivery',
          'Hard needs listed: ordering and never losing a message',
        ],
        'Chat is the one product where users feel latency in their bones — a two-second delay reads as the other person ignoring them.',
        'Instant, ordered, and lossless: those three words shape the whole design.',
        {
          nodes: [
            node('alice', 'user', 'Alice', 20, 150, { status: 'healthy', sublabel: 'Sends' }),
            node('server', 'server', 'Chat Service', 220, 150, { status: 'healthy' }),
            node('bob', 'user', 'Bob', 420, 150, { status: 'healthy', sublabel: 'Receives' }),
          ],
          edges: [
            edge('alice', 'server', 'Sends message'),
            edge('server', 'bob', 'Delivered < 1 s'),
          ],
          activeNodeIds: ['alice', 'server', 'bob'],
          activeEdgeIds: ['alice->server', 'server->bob'],
          caption: 'A message travels from one phone to another in well under a second.',
        },
      ),
      step(
        's2',
        'Back-of-envelope estimates',
        'The working assumption is 100 million messages a day across 5 million daily users. That is about 1,160 messages a second on average, with evening peaks near 3,500 a second. Each stored message is about 250 bytes, so a day of history is 25 gigabytes and a year is about 9 terabytes. The other number that shapes the design is concurrency: around a million users connected at once, each holding an open connection, so the system must track a million live sockets, not just answer a million requests.',
        [
          metric('Messages', '100M', '/day'),
          metric('Avg rate', '1,160', '/s'),
          metric('Concurrent users', '1M'),
        ],
        [
          'Message rate estimated at about 1,160 a second on average',
          'Concurrency sized at around a million open connections at once',
        ],
        'A million open connections is a different problem from a million requests: connections are held, not answered and forgotten, so memory per connection is the budget that matters.',
        'Count the connections, not just the requests — chat is a stateful problem.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '5M daily' }),
            node('gateway', 'gateway', 'Gateway', 220, 150, { status: 'healthy', sublabel: '1M sockets' }),
            node('db', 'db', 'Messages', 420, 150, { status: 'healthy', sublabel: '25 GB/day' }),
          ],
          edges: [
            edge('user', 'gateway', '100M msgs/day'),
            edge('gateway', 'db', '25 GB/day'),
          ],
          activeNodeIds: ['user', 'gateway', 'db'],
          activeEdgeIds: ['user->gateway', 'gateway->db'],
          caption: 'A hundred million messages a day flow through gateways into message storage.',
        },
      ),
      step(
        's3',
        'Data model and API',
        'Messages live in a table partitioned by conversation, so one conversation’s history sits together and can be read in order. Each row carries a conversation id, a sequence number, the sender, the text, and a timestamp. The sequence number is the ordering truth: clients sort by it, not by timestamps, which can disagree across phones. The API has two faces: REST for history — GET /conversations/{id}/messages pages through the past — and a persistent WebSocket for live traffic, where send frames travel over the open connection and the server answers with the stored sequence number.',
        [
          metric('History / day', '25', 'GB'),
          metric('History / year', '9', 'TB'),
          metric('Ordering key', 'Sequence #'),
        ],
        [
          'Messages partitioned by conversation, ordered by sequence number',
          'Two API faces: REST for history, WebSocket for live traffic',
        ],
        'Timestamps lie in chat: two phones can disagree about the time by seconds, so a timestamp can never be the ordering key.',
        'Order by sequence number, never by the sender’s clock.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'API / Gateway', 220, 150, { status: 'healthy' }),
            node('db', 'db', 'Messages', 420, 60, { status: 'healthy', sublabel: 'By conversation' }),
            node('presence', 'service', 'Presence', 420, 240, { status: 'healthy', sublabel: 'Who is online' }),
          ],
          edges: [
            edge('client', 'server', 'Send / fetch'),
            edge('server', 'db', 'Store + read'),
            edge('server', 'presence', 'Who is online'),
          ],
          activeNodeIds: ['server', 'db', 'presence'],
          activeEdgeIds: ['client->server', 'server->db', 'server->presence'],
          caption: 'Messages are stored by conversation; presence answers who is online.',
        },
      ),
      step(
        's4',
        'Real-time architecture',
        'Each user holds one long-lived WebSocket connection to a gateway server, which keeps a table of who is connected where. When a message arrives, the gateway publishes it to a message queue, and the services that own the recipients’ connections pick it up and push it down their sockets. Consistent hashing decides which gateway owns each user, so a message for one user always lands on the same gateway and reconnects find the same place. Presence is a separate service: gateways report heartbeats, and a user counts as online only while their gateway keeps reporting.',
        [
          metric('Connections', '1M', 'sockets'),
          metric('Routing', 'Consistent hash'),
          metric('Presence', 'Heartbeats'),
        ],
        [
          'Gateways hold one WebSocket per user',
          'Consistent hashing routes each user to one gateway',
          'Presence split out as its own heartbeat-based service',
        ],
        'Without consistent hashing, a message for a user could land on any gateway, and every gateway would have to ask every other gateway who holds that user’s socket.',
        'The gateway owns the socket; the queue carries the message between gateways.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy' }),
            node('gw1', 'gateway', 'Gateway A', 190, 150, { status: 'healthy', sublabel: 'Holds sockets' }),
            node('queue', 'queue', 'Message Queue', 360, 60, { status: 'healthy' }),
            node('gw2', 'gateway', 'Gateway B', 360, 240, { status: 'healthy', sublabel: 'Pushes to recipient' }),
          ],
          edges: [
            edge('user', 'gw1', 'WebSocket'),
            edge('gw1', 'queue', 'Publish'),
            edge('queue', 'gw2', 'Push to recipient'),
          ],
          activeNodeIds: ['gw1', 'queue', 'gw2'],
          activeEdgeIds: ['user->gw1', 'gw1->queue', 'queue->gw2'],
          caption: 'Gateways hold WebSocket connections; a queue carries messages between them.',
        },
      ),
      step(
        's5',
        'History, ordering, and offline delivery',
        'A message is stored before it is delivered — store-then-forward. If the recipient is offline, the message waits in their inbox queue and is pushed when they reconnect, then the client pages back through history by sequence number. Because every message in a conversation has a sequence number from one writer, ordering survives retries and reconnects: a duplicate arrives with the same number and is ignored. Read receipts are separate lightweight events, not messages, so marking a chat read never disturbs the ordering of the conversation itself.',
        [
          metric('Store first', 'Always', undefined, 'good'),
          metric('Offline wait', 'Inbox queue'),
          metric('Duplicates', 'Ignored'),
        ],
        [
          'Store-then-forward adopted: no message is delivered before it is stored',
          'Offline messages wait in an inbox queue for reconnect',
        ],
        'One writer per conversation hands out sequence numbers, which is what makes ordering simple — two writers would need to agree on the order first.',
        'Store first, deliver second, and a duplicate is just a number already seen.',
        {
          nodes: [
            node('gateway', 'gateway', 'Gateway', 20, 150, { status: 'healthy' }),
            node('db', 'db', 'Messages', 220, 150, { status: 'healthy', sublabel: 'Store first' }),
            node('inbox', 'queue', 'Inbox Queue', 420, 60, { status: 'healthy', sublabel: 'Waits for reconnect' }),
            node('offline', 'user', 'Offline User', 420, 240, { status: 'idle', sublabel: 'Returns later' }),
          ],
          edges: [
            edge('gateway', 'db', 'Store first'),
            edge('gateway', 'inbox', 'Wait for reconnect'),
            edge('inbox', 'offline', 'Deliver on return', 'async'),
          ],
          activeNodeIds: ['db', 'inbox', 'offline'],
          activeEdgeIds: ['gateway->db', 'gateway->inbox', 'inbox->offline'],
          caption: 'Messages are stored first, then delivered when the recipient reconnects.',
        },
      ),
      step(
        's6',
        'Bottlenecks and trade-offs',
        'The bottlenecks are fan-out and hot conversations. A message to a group of 100,000 members must be delivered 100,000 times, so large groups are fanned out in chunks by worker services, not by the sender’s gateway. Presence is the second pressure point: a million heartbeats every 30 seconds is a steady drumbeat of writes, so presence is kept in memory and allowed to be slightly stale. Media is never stored in the message table — photos and files go to object storage, and the message carries only a reference. And when a gateway fails, its users reconnect elsewhere, which is why connection state lives in a shared store, not in gateway memory alone.',
        [
          metric('Group fan-out', '100,000', 'members'),
          metric('Heartbeat interval', '30', 's'),
          metric('Media storage', 'Object store'),
        ],
        [
          'Large groups fanned out in chunks by workers, not the sender’s gateway',
          'Presence kept in memory and allowed to be slightly stale',
          'Media moved to object storage; messages carry only a reference',
        ],
        'Presence is the feature users check most and trust least — showing someone online a minute after they left is a small lie everyone accepts, and exact presence would cost far more than it is worth.',
        'Chunk the fan-out, soften the presence, and share the connection state.',
        {
          nodes: [
            node('gateway', 'gateway', 'Gateway', 20, 150, { status: 'healthy' }),
            node('workers', 'service', 'Fan-out Workers', 220, 150, { status: 'busy', sublabel: 'Chunked delivery' }),
            node('storage', 'db', 'Object Storage', 420, 60, { status: 'healthy', sublabel: 'Photos + files' }),
            node('presence', 'service', 'Presence', 420, 240, { status: 'degraded', sublabel: 'Slightly stale' }),
          ],
          edges: [
            edge('gateway', 'workers', 'Group of 100,000'),
            edge('workers', 'storage', 'Media reference'),
            edge('gateway', 'presence', 'Heartbeats'),
          ],
          activeNodeIds: ['workers', 'presence'],
          activeEdgeIds: ['gateway->workers', 'gateway->presence'],
          caption: 'Large groups fan out in chunks; media lives in object storage and presence stays in memory.',
        },
      ),
    ],
    summary:
      'A chat app is a real-time system built on durable storage: messages are stored with a per-conversation sequence number, then pushed over WebSockets held by gateway servers. Consistent hashing routes each user to one gateway, presence runs on heartbeats, and offline users catch up from their inbox queue. The bottlenecks are group fan-out, presence writes, and gateway failure — all handled by chunking work and keeping connection state shared. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals', 'database-scaling'],
  },
  l40: {
    id: 'l40',
    chapterId: 'whole-systems',
    number: 40,
    title: 'Design a Video Streaming Platform',
    durationMin: 16,
    difficulty: 'Advanced',
    intro: 'Upload once, watch anywhere: encoding, CDN, and playback at scale.',
    objectives: [
      'State the functional and non-functional requirements of a video platform',
      'Estimate ingest, storage growth, and peak playback bandwidth',
      'Design the metadata model and the upload and playback APIs',
      'Explain the chunked upload and transcoding pipeline',
      'Describe adaptive bitrate playback through a CDN',
      'Name the bottlenecks: transcoding compute, storage growth, and the long tail',
    ],
    formulas: [
      {
        name: 'Peak playback bandwidth',
        expression: '2M viewers × 5 Mbps ≈ 10 Tbps',
        note: 'Fifty million views a day at 30 minutes each averages about a million concurrent viewers; at twice-average peak, two million viewers at 5 Mbps each need about 10 Tbps of egress.',
      },
      {
        name: 'Storage growth',
        expression: '50,000 × 1 GB × 365 ≈ 18 PB/year',
        note: 'Fifty thousand uploads a day, stored as about a gigabyte of versions per video, add 50 TB a day, or roughly 18 PB over a year.',
      },
    ],
    steps: [
      step(
        's1',
        'Pin down the requirements',
        'Upload once, watch anywhere. A creator uploads a video from a phone or a laptop, and any viewer on any device should be able to press play and watch without buffering. The system must store the video, prepare versions for different screen sizes and connection speeds, and serve them fast all over the world. Viewers expect search, recommendations, and progress that resumes where they stopped. The non-functional bar is brutal: playback must start in about a second, streams must adapt when a connection weakens, and a popular video must survive a million simultaneous viewers.',
        [
          metric('Playback start', '~1', 's', 'good'),
          metric('Devices', 'Any'),
          metric('Viewers at peak', '2M'),
        ],
        [
          'Functional needs listed: upload, transcode, store, stream, search, resume',
          'Non-functional needs listed: fast start, adaptive playback, global scale',
        ],
        'Recommendations are a whole system of their own — this design names them as out of scope rather than pretending a search box covers them.',
        'One upload, many versions, playback that never waits on a weak connection.',
        {
          nodes: [
            node('creator', 'user', 'Creator', 20, 150, { status: 'healthy', sublabel: 'Uploads video' }),
            node('server', 'server', 'Platform', 220, 150, { status: 'healthy' }),
            node('viewer', 'user', 'Viewer', 420, 150, { status: 'healthy', sublabel: 'Plays anywhere' }),
          ],
          edges: [
            edge('creator', 'server', 'Uploads video'),
            edge('server', 'viewer', 'Plays anywhere'),
          ],
          activeNodeIds: ['creator', 'server', 'viewer'],
          activeEdgeIds: ['creator->server', 'server->viewer'],
          caption: 'A creator uploads once and viewers watch on any device.',
        },
      ),
      step(
        's2',
        'Back-of-envelope estimates',
        'The working assumption is 50,000 uploads a day at an average of 300 megabytes each, which is 15 terabytes of new video every day. Each video is transcoded into about five versions for different resolutions, totalling around a gigabyte stored per video, so storage grows by about 50 terabytes a day, or roughly 18 petabytes over a year. On the watch side, 50 million views a day at 30 minutes each means about a million people watching at any moment on average, and twice that at peak — two million viewers at 5 megabits a second is 10 terabits a second leaving the system.',
        [
          metric('Uploads', '50,000', '/day'),
          metric('Ingest', '15', 'TB/day'),
          metric('Peak egress', '10', 'Tbps'),
        ],
        [
          'Ingest sized at 15 TB a day from 50,000 uploads',
          'Storage growth sized at about 50 TB a day, 18 PB a year',
          'Peak playback sized at about 10 Tbps of egress',
        ],
        'Egress is the number that shocks people: storage is bought once, but every view pays the bandwidth bill again.',
        'Ingest is terabytes a day; playback is terabits a second.',
        {
          nodes: [
            node('uploads', 'server', 'Uploads', 20, 150, { status: 'healthy', sublabel: '15 TB/day in' }),
            node('storage', 'db', 'Object Storage', 220, 150, { status: 'healthy', sublabel: '50 TB/day stored' }),
            node('cdn', 'cdn', 'CDN Edge', 420, 150, { status: 'healthy', sublabel: '10 Tbps out' }),
          ],
          edges: [
            edge('uploads', 'storage', '15 TB/day in'),
            edge('storage', 'cdn', 'Segments'),
          ],
          activeNodeIds: ['uploads', 'storage', 'cdn'],
          activeEdgeIds: ['uploads->storage', 'storage->cdn'],
          caption: 'Fifteen terabytes arrive a day; ten terabits a second leave at peak.',
        },
      ),
      step(
        's3',
        'Data model and API',
        'Video metadata lives in a database: video id, owner, title, description, upload time, duration, and processing status. The video files themselves never sit in the database — they live in object storage, and the metadata row holds references to each version. The API reflects the two very different jobs: POST /videos starts an upload and returns a resumable upload session, GET /videos/{id} returns metadata and the playback manifest, and GET /videos/{id}/manifest lists the available resolutions. Search runs on a separate index built from titles and descriptions, because the metadata database is the wrong tool for full-text search.',
        [
          metric('Metadata fields', '7'),
          metric('Upload API', 'Resumable'),
          metric('Search', 'Separate index'),
        ],
        [
          'Metadata table defined; files live in object storage, not the database',
          'Three endpoints defined: start upload, fetch video, fetch manifest',
        ],
        'Processing status belongs in the metadata row so the app can show “processing” instead of serving a video that is not ready yet.',
        'Metadata in the database, bytes in object storage, words in a search index.',
        {
          nodes: [
            node('client', 'client', 'Creator', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'API', 220, 150, { status: 'healthy' }),
            node('meta', 'db', 'Video Metadata', 420, 60, { status: 'healthy', sublabel: 'Title, status' }),
            node('files', 'db', 'Object Storage', 420, 150, { status: 'healthy', sublabel: 'Video files' }),
            node('search', 'db', 'Search Index', 420, 240, { status: 'healthy', sublabel: 'Titles + text' }),
          ],
          edges: [
            edge('client', 'server', 'POST /videos'),
            edge('server', 'meta', 'Store metadata'),
            edge('server', 'files', 'Store files'),
            edge('server', 'search', 'Index title'),
          ],
          activeNodeIds: ['server', 'meta', 'files', 'search'],
          activeEdgeIds: ['client->server', 'server->meta', 'server->files', 'server->search'],
          caption: 'Metadata, files, and search live in three different stores.',
        },
      ),
      step(
        's4',
        'Upload and transcoding pipeline',
        'Uploads are chunked and resumable: a large file is sent in pieces, each piece acknowledged, so a dropped connection resumes instead of restarting. Finished uploads land in object storage and a job goes on a queue. Transcoder workers pull jobs, decode the original once, and produce the versions — high, medium, and low resolutions, plus thumbnails and a preview clip. Each version is itself stored as short segments, which is what makes adaptive playback possible later. Only when every version is ready does the metadata flip to published, so viewers never meet a half-built video.',
        [
          metric('Versions', '5', 'per video'),
          metric('Segments', 'Seconds each'),
          metric('Publish', 'When all ready'),
        ],
        [
          'Uploads made chunked and resumable',
          'Transcoding moved to a queue of worker jobs',
          'Publish gated on every version being ready',
        ],
        'Transcoding is the slowest step by far, so it is the one that gets a queue — uploads would otherwise wait on encoding that takes minutes.',
        'Chunk the upload, queue the encoding, publish only when complete.',
        {
          nodes: [
            node('uploader', 'client', 'Uploader', 20, 150, { status: 'healthy', sublabel: 'Sends chunks' }),
            node('storage', 'db', 'Object Storage', 190, 150, { status: 'healthy' }),
            node('queue', 'queue', 'Transcode Queue', 360, 60, { status: 'busy', sublabel: 'Jobs wait here' }),
            node('workers', 'server', 'Transcoders', 360, 240, { status: 'busy', sublabel: 'Encode versions' }),
          ],
          edges: [
            edge('uploader', 'storage', 'Chunks'),
            edge('storage', 'queue', 'Job'),
            edge('queue', 'workers', 'Pulls job'),
          ],
          activeNodeIds: ['storage', 'queue', 'workers'],
          activeEdgeIds: ['uploader->storage', 'storage->queue', 'queue->workers'],
          caption: 'Chunked uploads land in storage; transcoders pull jobs from a queue.',
        },
      ),
      step(
        's5',
        'Playback at scale',
        'Playback starts at the CDN, not at the origin. When a viewer presses play, the player fetches a manifest listing the available resolutions, then downloads short segments — a few seconds each — from the nearest CDN edge server. If the connection weakens, the player switches to a lower resolution for the next segment; if it improves, it steps back up. That is adaptive bitrate streaming, and it is why a video keeps playing on a train. Popular segments stay warm in edge caches, so the origin serves a segment once and the CDN serves it a million times.',
        [
          metric('Segment length', 'Few', 'seconds'),
          metric('Served from', 'CDN edge'),
          metric('Adaptation', 'Per segment'),
        ],
        [
          'Playback moved to the CDN edge, away from the origin',
          'Adaptive bitrate added: resolution changes per segment',
        ],
        'Segments are the trick that makes everything else work: short pieces can be cached, switched, and resumed independently.',
        'The CDN serves the segment; the player picks the resolution.',
        {
          nodes: [
            node('viewer', 'user', 'Viewer', 20, 150, { status: 'healthy', sublabel: 'Presses play' }),
            node('cdn', 'cdn', 'CDN Edge', 190, 150, { status: 'healthy', sublabel: 'Nearest server' }),
            node('origin', 'server', 'Origin', 360, 60, { status: 'healthy', sublabel: 'Fetches on miss' }),
            node('segments', 'db', 'Object Storage', 360, 240, { status: 'healthy', sublabel: 'Segments' }),
          ],
          edges: [
            edge('viewer', 'cdn', 'Requests segment'),
            edge('cdn', 'origin', 'Cache miss'),
            edge('origin', 'segments', 'Reads segment'),
          ],
          activeNodeIds: ['viewer', 'cdn', 'origin'],
          activeEdgeIds: ['viewer->cdn', 'cdn->origin', 'origin->segments'],
          caption: 'The player fetches short segments from the nearest CDN edge.',
        },
      ),
      step(
        's6',
        'Bottlenecks and trade-offs',
        'The bottlenecks are compute, storage, and the long tail. Transcoding is the most expensive step: every upload is decoded and encoded several times, so the transcoder pool and its queue set the pace of publishing. Storage grows relentlessly — 50 terabytes a day — so cold videos move to cheaper storage and unwatched versions are deleted first. The long tail matters too: a million rarely-watched videos still need their segments stored, while a handful of viral videos need their segments cached at every edge. Live streaming is a different problem entirely, with latency measured in seconds instead of minutes, and this design does not pretend to solve it.',
        [
          metric('Storage growth', '50', 'TB/day'),
          metric('Transcoding', 'Most expensive', undefined, 'warn'),
          metric('Live streaming', 'Out of scope'),
        ],
        [
          'Bottlenecks named: transcoding compute, storage growth, long tail',
          'Cold video tiered to cheaper storage; live streaming left out of scope',
        ],
        'Deleting an unwatched low-resolution version is free money: nobody misses a version nobody ever streamed, and the high-resolution original can recreate it.',
        'Transcoding sets the pace, storage sets the bill, and the tail sets the shape.',
        {
          nodes: [
            node('transcoders', 'service', 'Transcoders', 20, 150, { status: 'busy', sublabel: 'Most expensive' }),
            node('hot', 'db', 'Hot Storage', 220, 60, { status: 'healthy', sublabel: 'New + popular' }),
            node('cold', 'db', 'Cold Storage', 220, 240, { status: 'idle', sublabel: 'Aging video' }),
            node('cdn', 'cdn', 'CDN Edge', 420, 150, { status: 'healthy', sublabel: 'Viral segments' }),
          ],
          edges: [
            edge('transcoders', 'hot', 'New versions'),
            edge('hot', 'cold', 'Aging video'),
            edge('hot', 'cdn', 'Popular segments'),
          ],
          activeNodeIds: ['transcoders', 'hot', 'cold', 'cdn'],
          activeEdgeIds: ['transcoders->hot', 'hot->cold', 'hot->cdn'],
          caption: 'Transcoding, storage growth, and the long tail are the three costs to manage.',
        },
      ),
    ],
    summary:
      'A video platform is three systems joined together: a chunked, resumable upload pipeline that transcodes each video into several resolutions, object storage that grows by about 50 terabytes a day, and a CDN that serves short segments so players can adapt to any connection. The expensive parts are transcoding compute and storage, and the design keeps both in check by queuing work, tiering cold video, and caching hot segments at the edge. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['caching-patterns', 'networking-fundamentals'],
  },
};
