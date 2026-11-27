/*
 * Cheatsheet library: four concise references for the studio.
 * All content is original teaching material written for this app.
 */

import type { Cheatsheet } from '@/lib/types';

export const cheatsheets: Cheatsheet[] = [
  {
    id: 'networking-fundamentals',
    title: 'Networking Fundamentals',
    category: 'Foundations',
    summary:
      'The moving parts behind every request: DNS, TCP, TLS, and HTTP, and the latency each one adds.',
    difficulty: 'Beginner',
    readMin: 6,
    sections: [
      {
        heading: 'DNS: names to addresses',
        body: 'The browser knows a name like example.com, but the network routes by IP address. A DNS resolver translates the name, and the answer is cached at the browser, the operating system, and the resolver so repeat visits skip the lookup. A slow or distant resolver adds latency to every first visit.',
        bullets: [
          'A cached answer costs nothing; a full lookup costs a round trip.',
          'TTL (time to live) controls how long an answer stays cached.',
        ],
      },
      {
        heading: 'TCP: a reliable connection',
        body: 'TCP opens a connection with a three-way handshake, then guarantees that bytes arrive in order and without loss. That reliability costs round trips up front, and lost packets are retransmitted rather than skipped. Most of a request’s network time is spent in these round trips, not in moving bytes.',
        bullets: [
          'Handshake: SYN, SYN-ACK, ACK — one round trip before any data.',
          'Distance sets the floor: a round trip across an ocean is never fast.',
        ],
      },
      {
        heading: 'TLS: encryption before data',
        body: 'TLS negotiates encryption on top of TCP so that nobody in the middle can read or change the traffic. TLS 1.3 usually finishes its handshake in one round trip; older versions needed two. No application data is sent until the handshake completes, so TLS time is part of every new connection’s latency.',
        bullets: [
          'TLS 1.3: one round trip. TLS 1.2: two.',
          'Session resumption can skip the full handshake on repeat visits.',
        ],
      },
      {
        heading: 'HTTP: the request itself',
        body: 'HTTP defines the verbs and the shape of the exchange: GET to read, POST to create, PUT and PATCH to update, DELETE to remove. Status codes report the outcome — 2xx for success, 4xx when the client asked for something wrong, 5xx when the server failed. Keep-alive connections reuse one TCP connection for many requests, avoiding a fresh handshake each time.',
        bullets: [
          '2xx success, 3xx redirect, 4xx client error, 5xx server error.',
          'Reuse connections with keep-alive instead of opening one per request.',
        ],
      },
      {
        heading: 'Latency: where the time goes',
        body: 'A request’s latency is the sum of its hops: DNS lookup, TCP and TLS handshakes, server processing, and the response travelling back. Cutting round trips beats squeezing bytes — a nearby server or a CDN edge usually helps more than a smaller payload. Measure each hop separately before optimizing any one of them.',
        formula: 'Total latency ≈ DNS + TCP + TLS + server time + transfer time',
      },
      {
        heading: 'CDNs: move the content closer',
        body: 'A content delivery network caches static content on edge servers near users, so images, stylesheets, and scripts travel a short distance instead of crossing the world. Dynamic requests still reach the origin server, but the static majority of a page can be served from the edge. A CDN also absorbs traffic spikes before they reach your servers.',
        bullets: [
          'Static assets belong on the edge; dynamic data stays at the origin.',
          'Cache lifetimes on the CDN are set with the same TTL thinking as DNS.',
        ],
      },
    ],
    relatedLessons: ['l1', 'l2', 'l20'],
  },
  {
    id: 'caching-patterns',
    title: 'Caching Patterns',
    category: 'Data & Storage',
    summary:
      'Where to put a cache, how it fills, and how to keep it from lying to your users.',
    difficulty: 'Intermediate',
    readMin: 7,
    sections: [
      {
        heading: 'Why cache at all',
        body: 'The fastest database call is the one you never make. A cache stores a copy of a slow or expensive result — a database row, a rendered page, an API response — in fast memory close to where it is needed. Reads that hit the cache skip the database entirely, which lowers latency and protects the database from read load.',
        bullets: [
          'Cache what is read often and changes rarely.',
          'A cache hit is fast; a cache miss costs the lookup plus the work.',
        ],
      },
      {
        heading: 'Cache-aside (lazy loading)',
        body: 'The application checks the cache first. On a hit it returns the cached value; on a miss it reads the database, stores the result in the cache, and returns it. The cache only ever holds data somebody actually asked for, which keeps it small and relevant. The risk is a cold cache after a restart, when every request misses at once.',
        bullets: [
          'Application owns both the read and the fill.',
          'Stale data is possible until the entry expires or is removed.',
        ],
      },
      {
        heading: 'Write-through and write-behind',
        body: 'In write-through caching, every write goes to the cache and the database together, so the cache is never stale — but every write pays the cost of both. Write-behind writes to the cache first and flushes to the database later, which makes writes fast but risks losing data if the cache fails before the flush. Choose by how much a lost write would cost you.',
        bullets: [
          'Write-through: consistent, slower writes.',
          'Write-behind: fast writes, small risk of loss.',
        ],
      },
      {
        heading: 'TTL and eviction',
        body: 'Every cached entry needs a time to live (TTL): after it expires, the next read fetches a fresh copy. Short TTLs keep data fresh and increase database load; long TTLs do the opposite. When the cache fills up, eviction policies decide what goes — least-recently-used (LRU) is the usual default, keeping what is actually being read.',
        bullets: [
          'Short TTL: fresher data, more database load.',
          'LRU eviction keeps hot data and drops what nobody reads.',
        ],
      },
      {
        heading: 'Invalidation: the hard part',
        body: 'The classic options are expiry (wait for the TTL), explicit invalidation (delete the entry when the data changes), and versioned keys (write to a new key and let the old one expire). Explicit invalidation is precise but easy to forget in one code path; expiry is foolproof but slow to reflect changes. Most real systems combine both.',
        bullets: [
          'Delete on write for data that must be fresh.',
          'Versioned keys avoid delete races entirely.',
        ],
      },
      {
        heading: 'Stampedes and how to stop them',
        body: 'When a popular entry expires, many requests can miss at once and all hit the database together — a cache stampede. The usual defences are locking (only one request refills while the rest wait), early refresh (refill before expiry), and jittered TTLs so entries do not all expire at the same second.',
        formula: 'Stampede risk rises with (requests per second) × (refill cost)',
      },
    ],
    relatedLessons: ['l14', 'l15', 'l16', 'l17'],
  },
  {
    id: 'database-scaling',
    title: 'Database Scaling',
    category: 'Data & Storage',
    summary:
      'Replication, sharding, and partitioning: the three ways a database grows past one machine.',
    difficulty: 'Intermediate',
    readMin: 8,
    sections: [
      {
        heading: 'Start with the cheap wins',
        body: 'Before adding machines, make one machine work less: add indexes for the queries you actually run, cache hot reads, and move large blobs to object storage. Most databases that look overloaded are really just missing an index or answering the same read a thousand times a minute. Scaling out a bad query only spreads the damage.',
        bullets: [
          'Index the columns your WHERE and JOIN clauses use.',
          'Cache reads before you replicate for them.',
        ],
      },
      {
        heading: 'Replication: copies for reads',
        body: 'Replication keeps one primary that takes every write and one or more replicas that copy it and answer reads. It scales read throughput almost linearly with each replica, and a replica can be promoted if the primary fails. The cost is replication lag: replicas trail the primary, so reads can return slightly stale data.',
        bullets: [
          'Writes: primary only. Reads: any copy.',
          'Lag is the price of asynchronous copying.',
        ],
      },
      {
        heading: 'Sharding: splitting writes',
        body: 'When writes — not just reads — outgrow one machine, the data itself must be split. Sharding partitions rows across several databases by a shard key, such as a user id, so each machine holds a slice of the whole. Writes scale because they spread across shards, but queries that cross shards get harder and joins across shards may be impossible.',
        bullets: [
          'Pick a shard key that spreads load evenly and matches your queries.',
          'Hot shards — one key with most of the traffic — defeat the point.',
        ],
      },
      {
        heading: 'Partitioning strategies',
        body: 'Range partitioning splits by a value range, such as dates, which keeps recent data together but can overload the newest partition. Hash partitioning spreads rows evenly by hashing the key, at the cost of range queries that must touch every partition. List partitioning assigns explicit values to partitions, which suits data with natural categories. The strategy should follow the access pattern, not the other way round.',
        bullets: [
          'Range: good for time-ordered queries, risks a hot newest partition.',
          'Hash: even spread, poor for range scans.',
        ],
      },
      {
        heading: 'Consistency choices',
        body: 'Synchronous replication waits for a replica to confirm before answering a write, so the copy is never behind — but every write pays a network round trip. Asynchronous replication answers immediately and copies later, so writes stay fast and replicas lag. Most systems use asynchronous replication and send reads that must be fresh to the primary.',
        formula: 'Strong consistency costs write latency; eventual consistency costs freshness',
      },
      {
        heading: 'When to shard (and when not to)',
        body: 'Shard when a single primary cannot keep up with writes even after indexing and caching, or when the data no longer fits on one machine. Do not shard early: it adds operational cost, makes some queries slower, and is painful to undo. Replication plus caching carries most products much further than their teams expect.',
        bullets: [
          'Replicate first for reads; shard only when writes demand it.',
          'A shard key chosen badly is worse than no sharding at all.',
        ],
      },
    ],
    relatedLessons: ['l11', 'l12', 'l13'],
  },
  {
    id: 'reliability-patterns',
    title: 'Reliability Patterns',
    category: 'Reliability',
    summary:
      'Timeouts, retries, circuit breakers, and rate limits: the small disciplines that keep failures small.',
    difficulty: 'Intermediate',
    readMin: 7,
    sections: [
      {
        heading: 'Timeouts: decide how long to wait',
        body: 'Every call to another service needs a timeout, or one slow dependency can hold your threads hostage until your own callers give up. Set timeouts from measured latency — a little above the usual case, far below the worst — and use a shorter timeout for calls your user is waiting on than for background work. A timeout turns an unbounded wait into a fast, visible failure.',
        bullets: [
          'No timeout means one slow dependency can stall your whole service.',
          'Tune from real latency percentiles, not guesses.',
        ],
      },
      {
        heading: 'Retries: try again, carefully',
        body: 'Transient failures — a dropped packet, a brief restart — often succeed on a second try. Retry only idempotent operations, where repeating the call is harmless, and only a small number of times. A retry storm, where every client retries at once, can finish off a service that was only briefly struggling.',
        bullets: [
          'Retry idempotent calls only, and cap the attempts.',
          'Add jittered backoff so retries do not all land together.',
        ],
      },
      {
        heading: 'Circuit breakers: stop calling the dead',
        body: 'A circuit breaker watches a dependency’s failures. After a threshold it opens: calls fail immediately instead of waiting for a timeout, and the failing service gets room to recover. After a pause it lets one probe through; if the probe succeeds, the circuit closes and traffic resumes. Without one, a dead dependency is called thousands of times a second by clients that already know it is dead.',
        bullets: [
          'Closed: traffic flows. Open: fail fast. Half-open: one probe.',
          'Fail fast protects both sides of the call.',
        ],
      },
      {
        heading: 'Rate limiting: fair sharing',
        body: 'Rate limiting caps how much work any one caller can demand, so one abusive or buggy client cannot starve the rest. The token bucket is the usual shape: tokens refill at a steady rate and each request spends one, which allows short bursts while capping the average. Return a clear 429 status with a retry-after hint, and limit by something meaningful — a user, a key, or an IP — not by nothing at all.',
        formula: 'Token bucket: tokens refill at a fixed rate, each request spends one',
      },
      {
        heading: 'Redundancy: no single point of failure',
        body: 'Any component with no backup is a single point of failure, including the load balancer that was supposed to remove them. Run at least two of everything on the request path, across failure domains, and rehearse the failover — a backup nobody has tested is a hope, not a plan. Redundancy costs machines and complexity, so apply it where an outage costs more.',
        bullets: [
          'Two of everything on the critical path, in different failure domains.',
          'Test failover before you need it.',
        ],
      },
      {
        heading: 'Graceful degradation',
        body: 'When a dependency fails, a good system does less rather than nothing: show cached recommendations instead of personalized ones, accept the order and send the confirmation email later, hide the non-essential widget. Degradation is a design decision made in advance, not an accident discovered during an outage — decide in calm times what your system does when a part of it is down.',
        bullets: [
          'Serve stale data rather than an error page when you can.',
          'Decide the fallback before the outage, not during it.',
        ],
      },
    ],
    relatedLessons: ['l24', 'l25', 'l26', 'l27'],
  },
];
