/*
 * Fully-written lessons — filled in by the curriculum completion work.
 * Each lesson follows the exact shape of the four original full lessons
 * in data/lessons-full.ts: intro, objectives, 4+ steps (each with a
 * diagram, metrics, what-changed, good-to-know and takeaway), summary.
 *
 * Lessons in this file: l16 Cache Stampedes, l17 Consistent Hashing,
 * l18 Object Storage, l19 Search and Indexing, l20 HTTP and REST,
 * l21 WebSockets and Real-Time Communication.
 *
 * All metric values are illustrative — see ILLUSTRATIVE in
 * data/lesson-helpers.ts. Never present an illustrative number as a
 * measurement from a real system.
 */

import type { Lesson } from '@/lib/types';
import { ILLUSTRATIVE, edge, metric, node, step } from '@/data/lesson-helpers';

export const lessonsPartC: Record<string, Lesson> = {
  l16: {
    id: 'l16',
    chapterId: 'data-storage',
    number: 16,
    title: 'Cache Stampedes',
    durationMin: 11,
    difficulty: 'Advanced',
    intro:
      'When a cache expires and a thousand requests hit the database at once.',
    objectives: [
      'Define a cache stampede and explain how it starts',
      'Explain why a popular key expiring is worse than a cold cache',
      'Describe how a thundering herd overloads a database',
      'Compare locking, jitter, and warming as mitigations',
      'Explain stale-while-revalidate and probabilistic early expiry',
    ],
    steps: [
      step(
        's1',
        'A hot key in the cache',
        'A popular page is cached, and the cache answers almost every request for it. The database sees only a handful of requests per second, because the cache absorbs the rest. Response time is fast, the database is calm, and everything looks healthy. This is the cache doing exactly what it was built to do: shielding the database from traffic it has already answered once.',
        [
          metric('Requests', '1,000', 'req/s'),
          metric('Cache hits', '990', 'req/s'),
          metric('Database load', '10', 'req/s'),
          metric('Response time', '8', 'ms', 'good'),
        ],
        [
          'A popular page is served from the cache',
          'The database sees only 10 of 1,000 requests per second',
        ],
        'A hot key is a single cached entry that a large share of traffic asks for — one popular page, one trending product, one homepage.',
        'A healthy cache makes the database look idle, because it answers most requests itself.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1,000 req/s' }),
            node('cache', 'cache', 'Cache', 260, 150, { status: 'healthy', sublabel: 'Hot key cached' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: '10 req/s' }),
          ],
          edges: [
            edge('user', 'cache', 'Requests'),
            edge('cache', 'db', '10 misses /s'),
          ],
          activeNodeIds: ['user', 'cache'],
          activeEdgeIds: ['user->cache'],
          caption: 'The cache answers nearly all requests for a popular page and the database stays calm.',
        },
      ),
      step(
        's2',
        'The key expires',
        'Every cached entry has a time to live, and this one reaches the end of its life. The cache drops the entry, and the next request finds nothing there. That request is a cache miss, so it goes to the database. On its own, one miss is harmless — the database answers it, and the fresh result is written back into the cache. The danger is not the first miss, but what arrives with it.',
        [
          metric('Cache entry', 'Expired'),
          metric('Cache hits', '0', 'req/s', 'warn'),
          metric('Database load', 'Rising'),
          metric('Response time', '8', 'ms'),
        ],
        [
          'The hot key reaches the end of its time to live',
          'The cache drops the entry and the next request misses',
        ],
        'Time to live, or TTL, is how long a cached entry is allowed to live before it is treated as stale and removed.',
        'One cache miss is harmless; the danger is how many requests arrive in the same moment.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1,000 req/s' }),
            node('cache', 'cache', 'Cache', 260, 150, { status: 'degraded', sublabel: 'Key expired' }),
            node('db', 'db', 'Database', 500, 150, { status: 'busy', sublabel: 'Load rising' }),
          ],
          edges: [
            edge('user', 'cache', 'Requests'),
            edge('cache', 'db', 'Misses begin'),
          ],
          activeNodeIds: ['cache', 'db'],
          activeEdgeIds: ['cache->db'],
          caption: 'The hot key expires and the first misses start reaching the database.',
        },
      ),
      step(
        's3',
        'A thousand requests stampede',
        'The cache is empty for this key, and nothing has refilled it yet. Every request that arrives in the next moment misses the cache and goes straight to the database — hundreds of identical queries at once, all asking for the same data. The database queues them, its CPU climbs toward full, and response time jumps from 8 ms to 900 ms. This is the stampede: a crowd of requests trampling the database because the cache stopped shielding it.',
        [
          metric('Requests', '1,000', 'req/s'),
          metric('Database load', '1,000', 'req/s', 'bad'),
          metric('Response time', '900', 'ms', 'bad'),
          metric('Database CPU', '98', '%', 'bad'),
        ],
        [
          'Every request misses the empty cache at once',
          'The database receives 1,000 identical queries per second',
        ],
        'A stampede is also called a thundering herd: many requests waking at once and rushing the same resource, each doing work the others are already doing.',
        'A stampede is not a traffic spike — it is the same traffic suddenly reaching the database.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1,000 req/s' }),
            node('cache', 'cache', 'Cache', 260, 150, { status: 'failed', sublabel: 'Empty for this key' }),
            node('db', 'db', 'Database', 500, 150, { status: 'busy', sublabel: '98% CPU' }),
          ],
          edges: [
            edge('user', 'cache', 'All miss'),
            edge('cache', 'db', '1,000 req/s'),
          ],
          activeNodeIds: ['cache', 'db'],
          activeEdgeIds: ['user->cache', 'cache->db'],
          caption: 'With the key gone, all one thousand requests per second hit the database at once.',
        },
      ),
      step(
        's4',
        'Locking: one request rebuilds',
        'The standard fix is request coalescing, often built with a lock. The first request to miss takes a short lock and goes to the database, while every other request waits for the result instead of making its own query. One query rebuilds the entry, the cache is refilled, and the waiting requests are answered from the fresh cache. Database load falls back to almost nothing, and response time recovers — the waiting requests are slower than a cache hit, but far faster than a stampede.',
        [
          metric('Database load', '1', 'req/s', 'good'),
          metric('Waiting requests', '999', 'requests'),
          metric('Response time', '60', 'ms'),
          metric('Database CPU', '12', '%', 'good'),
        ],
        [
          'The first miss takes a lock and queries the database',
          'The other 999 requests wait and share the one result',
        ],
        'The lock must have a short timeout: if the rebuilding request fails, the lock must release so another request can try instead of waiting forever.',
        'One query can rebuild an entry for a thousand waiting requests.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1,000 req/s' }),
            node('cache', 'cache', 'Cache', 260, 150, { status: 'busy', sublabel: 'Lock held · rebuilding' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: '1 req/s' }),
          ],
          edges: [
            edge('user', 'cache', '999 wait, 1 rebuilds'),
            edge('cache', 'db', '1 query'),
          ],
          activeNodeIds: ['cache', 'db'],
          activeEdgeIds: ['cache->db'],
          caption: 'One request rebuilds the entry under a lock while the others wait and share the result.',
        },
      ),
      step(
        's5',
        'Jitter, warming, and serving stale',
        'Locking fixes the stampede, but three more habits prevent it. First, add jitter: give each entry a slightly different TTL so popular keys do not all expire in the same second. Second, warm the cache: refresh hot entries in the background before they expire, so they never go empty. Third, serve stale while revalidating: answer from the old entry while one request quietly rebuilds it in the background. Together they mean the database never sees the crowd at all.',
        [
          metric('Database load', '10', 'req/s', 'good'),
          metric('Response time', '8', 'ms', 'good'),
          metric('TTL spread', '±10', '%'),
          metric('Stale serves', '0', 'requests'),
        ],
        [
          'TTL jitter spreads expiry times across entries',
          'Background warming and stale-while-revalidate keep hot keys filled',
        ],
        'Probabilistic early expiry is a related trick: a request refreshes an entry a little early, with a probability that grows as the entry ages.',
        'The best stampede fix is one the database never notices.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1,000 req/s' }),
            node('cache', 'cache', 'Cache', 260, 150, { status: 'healthy', sublabel: 'Warmed · jittered TTL' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: '10 req/s' }),
            node('server', 'server', 'Warmer', 380, 260, { status: 'healthy', sublabel: 'Refreshes early' }),
          ],
          edges: [
            edge('user', 'cache', 'Requests'),
            edge('server', 'cache', 'Refreshes before expiry', 'async'),
          ],
          activeNodeIds: ['cache', 'server'],
          activeEdgeIds: ['server->cache'],
          caption: 'A background warmer refreshes hot entries before they expire, so the cache never goes empty.',
        },
      ),
    ],
    summary:
      'A cache stampede happens when a hot key expires and every request misses at once, sending a thousand identical queries to a database that was happily handling ten. The database queues, CPU climbs, and response time jumps from milliseconds to nearly a second. Locking lets one request rebuild the entry while the rest wait and share the result; jitter spreads expiry times, warming refreshes entries early, and serving stale while revalidating keeps the cache filled. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['caching-patterns'],
  },
  l17: {
    id: 'l17',
    chapterId: 'data-storage',
    number: 17,
    title: 'Consistent Hashing',
    durationMin: 13,
    difficulty: 'Advanced',
    intro:
      'Adding a cache node without reshuffling every key.',
    objectives: [
      'Explain why hashing keys with modulo breaks when nodes change',
      'Describe how a hash ring maps keys to nodes',
      'Trace what happens to keys when a node is added or removed',
      'Explain how virtual nodes keep the load even',
      'Decide when consistent hashing is worth the added complexity',
    ],
    formulas: [
      {
        name: 'Hash ring position',
        expression: 'position = hash(key) mod 2^m',
        note: 'With a 32-bit hash space, a key whose hash is 1,900,000,000 sits at that point on the ring, and its owner is the first node clockwise from that point.',
      },
      {
        name: 'Keys per node with virtual nodes',
        expression: 'keys per node ≈ total keys / N',
        note: 'With 1,000,000 keys and 10 nodes, each node holds about 100,000 keys on average; giving each node 100 virtual nodes keeps the spread close to that average instead of lumpy.',
      },
    ],
    steps: [
      step(
        's1',
        'The naive way: hash modulo N',
        'The simplest way to spread keys across cache nodes is to hash each key and take the remainder when dividing by the number of nodes: node = hash(key) mod N. With four nodes, a key whose hash is 10 lands on node 2, because 10 mod 4 is 2. It is simple, fast, and perfectly even. The trouble starts the day the number of nodes changes, because N is inside the formula itself.',
        [
          metric('Cache nodes', '4'),
          metric('Keys stored', '1,000,000'),
          metric('Keys per node', '250,000'),
          metric('Hash function', 'hash(key) mod 4'),
        ],
        [
          'Keys are spread with hash(key) mod 4 across four nodes',
          'Each node holds about 250,000 keys',
        ],
        'Modulo hashing is fine when the node count never changes — a fixed set of shards, for example — but cache fleets grow and shrink.',
        'Modulo hashing works until the day you add a node.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: 'hash(key) mod 4' }),
            node('cache-a', 'cache', 'Node 0', 260, 30, { status: 'healthy', sublabel: '250,000 keys' }),
            node('cache-b', 'cache', 'Node 1', 260, 150, { status: 'healthy', sublabel: '250,000 keys' }),
            node('cache-c', 'cache', 'Node 2', 260, 240, { status: 'healthy', sublabel: '250,000 keys' }),
          ],
          edges: [
            edge('client', 'cache-a', 'Some keys'),
            edge('client', 'cache-b', 'Some keys'),
            edge('client', 'cache-c', 'Some keys'),
          ],
          activeNodeIds: ['client', 'cache-a', 'cache-b', 'cache-c'],
          activeEdgeIds: ['client->cache-a', 'client->cache-b', 'client->cache-c'],
          caption: 'Four cache nodes share one million keys evenly using hash modulo four.',
        },
      ),
      step(
        's2',
        'Adding a node reshuffles everything',
        'Traffic grows, so a fifth node joins. Now the formula is hash(key) mod 5, and almost every key lands somewhere different — a key that was on node 2 moves to node 0, another moves to node 4. About 800,000 of the million keys change owner, so nearly every request misses the cache at once and floods the database. Adding capacity to help has caused the very stampede the cache was there to prevent.',
        [
          metric('Cache nodes', '5'),
          metric('Keys moved', '800,000', 'keys', 'bad'),
          metric('Cache hit rate', '20', '%', 'bad'),
          metric('Database load', '800', 'req/s', 'bad'),
        ],
        [
          'A fifth node joins and the formula becomes hash(key) mod 5',
          'About 800,000 of 1,000,000 keys change owner',
        ],
        'With modulo hashing, changing N from 4 to 5 moves roughly (N − 1) / N of the keys — here about four fifths — because nearly every remainder changes.',
        'With modulo hashing, adding one node moves almost every key.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: 'hash(key) mod 5' }),
            node('cache-a', 'cache', 'Node 0', 260, 30, { status: 'degraded', sublabel: 'Keys moved in' }),
            node('cache-b', 'cache', 'Node 1', 260, 150, { status: 'degraded', sublabel: 'Keys moved out' }),
            node('db', 'db', 'Database', 500, 150, { status: 'busy', sublabel: '800 req/s' }),
          ],
          edges: [
            edge('client', 'cache-a', 'New owners'),
            edge('client', 'db', 'Misses flood in'),
          ],
          activeNodeIds: ['cache-a', 'cache-b', 'db'],
          activeEdgeIds: ['client->cache-a', 'client->db'],
          caption: 'Adding a fifth node reshuffles most keys, so misses flood the database.',
        },
      ),
      step(
        's3',
        'The hash ring',
        'Consistent hashing fixes this with a ring. Imagine the hash values arranged in a circle from 0 up to the largest hash. Each node is placed on the ring at the point given by hashing its own name, and each key is placed at the point given by hashing the key. A key belongs to the first node clockwise from its position. Nothing in this rule mentions how many nodes there are, so adding a node does not rewrite the rule.',
        [
          metric('Hash space', '0 to 2^32'),
          metric('Nodes on ring', '4'),
          metric('Rule', 'First node clockwise'),
          metric('Keys moved on add', 'Only neighbours'),
        ],
        [
          'Nodes and keys are both placed on a circular hash space',
          'Each key belongs to the first node clockwise from it',
        ],
        'The ring is usually drawn as a circle, but it is just the number line from 0 to the largest hash value, with the ends joined together.',
        'A key’s owner is decided by position on the ring, not by the node count.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: 'Keys hash to points' }),
            node('cache-a', 'cache', 'Node A', 260, 30, { status: 'healthy', sublabel: 'On the ring' }),
            node('cache-b', 'cache', 'Node B', 260, 150, { status: 'healthy', sublabel: 'On the ring' }),
            node('cache-c', 'cache', 'Node C', 260, 240, { status: 'healthy', sublabel: 'On the ring' }),
          ],
          edges: [
            edge('client', 'cache-a', 'Clockwise owner'),
            edge('client', 'cache-b', 'Clockwise owner'),
            edge('client', 'cache-c', 'Clockwise owner'),
          ],
          activeNodeIds: ['cache-a', 'cache-b', 'cache-c'],
          activeEdgeIds: ['client->cache-a', 'client->cache-b', 'client->cache-c'],
          caption: 'Nodes and keys sit on a hash ring, and each key belongs to the first node clockwise from it.',
        },
      ),
      step(
        's4',
        'Adding a node moves only its neighbours',
        'Now add a fifth node to the ring. It takes its place at one point on the circle, and it only becomes the clockwise owner for the keys that sit between it and the previous node. Every other key keeps its old owner, because the first node clockwise from those keys has not changed. Only about 200,000 of the million keys move — roughly one fifth, the new node’s fair share — instead of 800,000. The cache stays warm, and the database never notices the change.',
        [
          metric('Cache nodes', '5'),
          metric('Keys moved', '200,000', 'keys', 'good'),
          metric('Cache hit rate', '80', '%', 'good'),
          metric('Database load', '10', 'req/s', 'good'),
        ],
        [
          'A fifth node joins the ring at one point',
          'Only about 200,000 keys move — the new node’s fair share',
        ],
        'Adding a node to a ring of N nodes moves about 1 / (N + 1) of the keys on average, because the new node takes an equal slice of the circle.',
        'Adding a node moves only the keys that now sit behind it.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: 'Ring lookup' }),
            node('cache-new', 'cache', 'Node E · new', 260, 30, { status: 'healthy', sublabel: '200,000 keys' }),
            node('cache-b', 'cache', 'Node B', 260, 150, { status: 'healthy', sublabel: 'Kept most keys' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: '10 req/s' }),
          ],
          edges: [
            edge('client', 'cache-new', 'New owner for some'),
            edge('client', 'cache-b', 'Owners unchanged'),
          ],
          activeNodeIds: ['cache-new', 'cache-b'],
          activeEdgeIds: ['client->cache-new', 'client->cache-b'],
          caption: 'A new node on the ring takes only its own slice of keys, so the cache stays warm.',
        },
      ),
      step(
        's5',
        'Virtual nodes even out the load',
        'A plain ring has one flaw: nodes land at random points, so one node can own a long arc of the ring and hold far more keys than the others. Virtual nodes fix this. Each physical node is given many points on the ring — say 100 virtual nodes each — and a key belongs to whichever virtual node comes first clockwise. With hundreds of points per node, the arcs even out, and each physical node ends up holding close to its fair share. Removing a node works the same way in reverse: its virtual points vanish, and its keys spread evenly across the rest.',
        [
          metric('Virtual nodes', '100', 'per node'),
          metric('Keys per node', '~100,000'),
          metric('Load spread', 'Even'),
          metric('On node removal', 'Keys spread evenly'),
        ],
        [
          'Each physical node gets 100 virtual points on the ring',
          'Keys spread evenly instead of landing in lumpy arcs',
        ],
        'A virtual node is just a point on the ring labelled with its physical node’s name — node A might appear as A-1, A-2, all the way to A-100.',
        'Many small slices beat a few large ones when you want an even split.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: '100 vnodes each' }),
            node('cache-a', 'cache', 'Node A', 260, 30, { status: 'healthy', sublabel: '~100,000 keys' }),
            node('cache-b', 'cache', 'Node B', 260, 150, { status: 'healthy', sublabel: '~100,000 keys' }),
            node('cache-c', 'cache', 'Node C', 260, 240, { status: 'healthy', sublabel: '~100,000 keys' }),
          ],
          edges: [
            edge('client', 'cache-a', 'Virtual points'),
            edge('client', 'cache-b', 'Virtual points'),
            edge('client', 'cache-c', 'Virtual points'),
          ],
          activeNodeIds: ['cache-a', 'cache-b', 'cache-c'],
          activeEdgeIds: ['client->cache-a', 'client->cache-b', 'client->cache-c'],
          caption: 'With one hundred virtual nodes each, the physical nodes share keys almost evenly.',
        },
      ),
    ],
    summary:
      'Consistent hashing replaces hash(key) mod N with a ring: nodes and keys are placed on a circle of hash values, and each key belongs to the first node clockwise from it. Because the rule never mentions the node count, adding a node moves only the keys in its own slice — about one fifth of a million keys when a fifth node joins, instead of four fifths under modulo hashing. Virtual nodes, many ring points per physical node, keep the split even, and removing a node spreads its keys evenly across the rest. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['caching-patterns'],
  },
  l18: {
    id: 'l18',
    chapterId: 'data-storage',
    number: 18,
    title: 'Object Storage',
    durationMin: 10,
    difficulty: 'Beginner',
    intro:
      'Files, images and backups at a scale no filesystem was built for.',
    objectives: [
      'Explain what an object is: data, metadata, and a unique key',
      'Compare object, block, and file storage',
      'Describe how object storage survives disk and zone failures',
      'Name the workloads object storage suits and the ones it does not',
      'Explain versioning, lifecycle rules, and presigned URLs',
    ],
    steps: [
      step(
        's1',
        'Three kinds of storage',
        'Storage comes in three shapes. File storage keeps files in folders, like the folders on your own computer, and works well when people browse a shared tree. Block storage splits data into fixed-size blocks and hands them to one server, which is how a database disk behaves. Object storage is the third shape: each item is a self-contained object with its data, some metadata, and a unique key, stored in a flat bucket with no folders at all.',
        [
          metric('File storage', 'Folders and paths'),
          metric('Block storage', 'Fixed-size blocks'),
          metric('Object storage', 'Objects in a bucket'),
        ],
        [
          'File storage organizes data in a folder tree',
          'Block storage serves fixed-size blocks to one server',
          'Object storage stores self-contained objects in a flat bucket',
        ],
        'A bucket is just a named container for objects — like a top-level folder that holds millions of items without any nesting underneath.',
        'Object storage trades folders for keys, and that trade is what lets it scale.',
        {
          nodes: [
            node('client', 'client', 'App', 20, 150, { status: 'healthy', sublabel: 'Stores a file' }),
            node('server', 'server', 'Object Store', 260, 150, { status: 'healthy', sublabel: 'Bucket: uploads' }),
            node('db', 'db', 'Metadata', 500, 150, { status: 'healthy', sublabel: 'Key + size + type' }),
          ],
          edges: [
            edge('client', 'server', 'PUT photo.jpg'),
            edge('server', 'db', 'Records key'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server'],
          caption: 'An application stores a photo as an object in a bucket, identified by its key.',
        },
      ),
      step(
        's2',
        'An object is data plus metadata',
        'An object has three parts: the bytes themselves, a unique key such as uploads/2026/photo.jpg, and metadata — the content type, the size, the upload time, and any custom labels you add. The key is the address: to fetch the object you ask for the bucket and the key, and the store returns the bytes. There is no directory to walk and no path to resolve, which is why finding one object among billions is still a single lookup.',
        [
          metric('Object key', 'uploads/2026/photo.jpg'),
          metric('Object size', '2.4', 'MB'),
          metric('Lookup', '1', 'request'),
        ],
        [
          'An object is bytes, a unique key, and metadata',
          'Fetching an object is one lookup by bucket and key',
        ],
        'The slashes in a key look like folders, but they are only part of the name — the store keeps objects flat, and the slashes are a naming habit.',
        'An object’s key is its address, and metadata is the label on the box.',
        {
          nodes: [
            node('client', 'client', 'App', 20, 150, { status: 'healthy', sublabel: 'GET by key' }),
            node('server', 'server', 'Object Store', 260, 150, { status: 'healthy', sublabel: 'Finds the key' }),
            node('cdn', 'cdn', 'CDN', 500, 150, { status: 'idle', sublabel: 'Caches it later' }),
          ],
          edges: [
            edge('client', 'server', 'GET uploads/2026/photo.jpg'),
            edge('server', 'cdn', 'Bytes + metadata'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server'],
          caption: 'Fetching an object is a single lookup by its bucket and key.',
        },
      ),
      step(
        's3',
        'Durability through copies',
        'Object storage is built to survive failures that would destroy a single disk. Each object is copied to several disks, often in different buildings or availability zones, so losing one disk — or one whole building — does not lose the data. Some stores use erasure coding instead, splitting the object into pieces with enough redundancy to rebuild it from a subset. Either way, the promise is the same: your object should still be there years from now, even though disks fail all the time.',
        [
          metric('Copies per object', '3'),
          metric('Disk failure', 'Tolerated'),
          metric('Zone failure', 'Tolerated'),
        ],
        [
          'Each object is stored as several copies across disks and zones',
          'Erasure coding can replace copies with rebuildable pieces',
        ],
        'Durability is about not losing data; availability is about being able to reach it right now — object storage is designed to be strong on both.',
        'Your object survives because it never lives in only one place.',
        {
          nodes: [
            node('server', 'server', 'Object Store', 20, 150, { status: 'healthy', sublabel: 'Writes 3 copies' }),
            node('db', 'db', 'Copy 1', 260, 30, { status: 'healthy', sublabel: 'Zone A' }),
            node('db2', 'db', 'Copy 2', 260, 150, { status: 'healthy', sublabel: 'Zone B' }),
            node('db3', 'db', 'Copy 3', 260, 260, { status: 'failed', sublabel: 'Zone C · disk failed' }),
          ],
          edges: [
            edge('server', 'db', 'Copy'),
            edge('server', 'db2', 'Copy'),
            edge('server', 'db3', 'Copy'),
          ],
          activeNodeIds: ['server', 'db', 'db2'],
          activeEdgeIds: ['server->db', 'server->db2'],
          caption: 'Each object is copied across zones, so one failed disk loses nothing.',
        },
      ),
      step(
        's4',
        'What it is good for',
        'Object storage fits anything you write once and read many times: user photos and videos, static website files, backups and archives, logs, and data lakes for analytics. It also fits large files well — uploads can be split into parts and sent in parallel, then joined on the server. A common pattern is to keep only the key in your database and let the object store hold the bytes, so the database stays small and fast while the heavy files live where they belong.',
        [
          metric('Typical objects', 'Photos, video, backups'),
          metric('Multipart upload', 'Parts in parallel'),
          metric('Database stores', 'Only the key'),
        ],
        [
          'Object storage fits write-once, read-many data',
          'The database keeps the key; the object store keeps the bytes',
        ],
        'A presigned URL lets a user upload or download one specific object directly, without giving them access to the whole bucket.',
        'Keep the bytes in the object store and only the key in the database.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Uploads a video' }),
            node('server', 'server', 'App Server', 260, 150, { status: 'healthy', sublabel: 'Saves the key' }),
            node('db', 'db', 'Database', 500, 30, { status: 'healthy', sublabel: 'Key only' }),
            node('cdn', 'cdn', 'Object Store', 500, 240, { status: 'healthy', sublabel: 'Holds the bytes' }),
          ],
          edges: [
            edge('user', 'server', 'Upload'),
            edge('server', 'db', 'Stores key'),
            edge('server', 'cdn', 'Stores bytes'),
          ],
          activeNodeIds: ['server', 'db', 'cdn'],
          activeEdgeIds: ['server->db', 'server->cdn'],
          caption: 'The database stores only the object key while the object store holds the video bytes.',
        },
      ),
      step(
        's5',
        'What it is not for',
        'Object storage is not a database and not a filesystem. Reading one small piece of a file means fetching the whole object, or at least a range of it, so workloads that update tiny parts of a file many times a second — like a database writing rows — belong on block storage instead. Listing a bucket with millions of objects is also slow and paginated, and every request is a network call with latency a local disk does not have. Use object storage for blobs, and a database for data you query and update.',
        [
          metric('Small updates', 'Slow — whole object'),
          metric('Listing', 'Paginated'),
          metric('Latency', 'Network call'),
        ],
        [
          'Object storage is poor at tiny, frequent updates',
          'Databases and block storage serve those workloads better',
        ],
        'Versioning keeps old copies of an object when it is overwritten, and lifecycle rules can move old objects to cheaper, slower storage automatically.',
        'Object storage is for blobs; a database is for data you query and update.',
        {
          nodes: [
            node('client', 'client', 'App', 20, 150, { status: 'healthy', sublabel: 'Needs fast updates' }),
            node('db', 'db', 'Database', 260, 30, { status: 'healthy', sublabel: 'Right choice' }),
            node('server', 'server', 'Object Store', 260, 240, { status: 'idle', sublabel: 'Wrong choice here' }),
          ],
          edges: [
            edge('client', 'db', 'Frequent small writes'),
          ],
          activeNodeIds: ['client', 'db'],
          activeEdgeIds: ['client->db'],
          caption: 'Frequent small updates belong in a database, not in object storage.',
        },
      ),
    ],
    summary:
      'Object storage keeps each item as a self-contained object — bytes, a unique key, and metadata — in a flat bucket, with no folders underneath. It differs from file storage, which keeps a folder tree, and block storage, which serves fixed-size blocks to one server. Copies across disks and zones make it durable enough for photos, videos, backups, and data lakes, and the database usually stores only the key. It is the wrong tool for tiny frequent updates, which belong in a database. ' +
      ILLUSTRATIVE,
  },
  l19: {
    id: 'l19',
    chapterId: 'data-storage',
    number: 19,
    title: 'Search and Indexing',
    durationMin: 12,
    difficulty: 'Intermediate',
    intro:
      'From keyword search to inverted indexes and ranking.',
    objectives: [
      'Explain why a full table scan is too slow for search',
      'Describe how an inverted index maps words to documents',
      'Explain tokenization, stemming, and stop words',
      'Describe how ranking combines relevance with other signals',
      'Explain how search scales with sharding and replicas',
    ],
    steps: [
      step(
        's1',
        'Why scanning does not work',
        'A user searches for “wireless headphones”, and the naive approach reads every product row and checks whether its description contains those words. With a million products that scan takes seconds, and it gets slower with every product added. It also cannot rank results: a product that mentions the words once in a footnote scores the same as one whose title is exactly those words. Search needs its own structure, built ahead of time, not a scan at request time.',
        [
          metric('Products', '1,000,000'),
          metric('Full scan time', '2,400', 'ms', 'bad'),
          metric('Ranking', 'None'),
        ],
        [
          'A keyword search over a million rows scans every row',
          'A scan cannot rank results by relevance',
        ],
        'A database index on a text column helps with exact matches, but it still cannot answer “which documents mention these words most” quickly.',
        'Search needs a structure built ahead of time, not a scan at request time.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: '“wireless headphones”' }),
            node('server', 'server', 'App Server', 260, 150, { status: 'busy', sublabel: 'Scans every row' }),
            node('db', 'db', 'Database', 500, 150, { status: 'busy', sublabel: '1,000,000 rows' }),
          ],
          edges: [
            edge('user', 'server', 'Search query'),
            edge('server', 'db', 'Full scan'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['server->db'],
          caption: 'A naive search scans all one million product rows for every query.',
        },
      ),
      step(
        's2',
        'The inverted index',
        'An inverted index flips the problem around. Instead of listing documents and their words, it lists words and the documents that contain them: “wireless” points to documents 3, 17, and 42, and “headphones” points to 17, 42, and 90. Answering a query is then a lookup, not a scan — find the two word lists and intersect them, and documents 17 and 42 contain both words. The index is built once when documents are added, and every query after that is fast.',
        [
          metric('“wireless”', 'Docs 3, 17, 42'),
          metric('“headphones”', 'Docs 17, 42, 90'),
          metric('Both words', 'Docs 17, 42'),
          metric('Query time', '12', 'ms', 'good'),
        ],
        [
          'The index maps each word to the documents containing it',
          'A two-word query intersects two short lists',
        ],
        'It is called inverted because a book’s index maps topics to pages, while this one maps words to documents — the reverse of the document itself.',
        'An inverted index turns search into a lookup.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Two-word query' }),
            node('server', 'server', 'Search Index', 260, 150, { status: 'healthy', sublabel: 'Word → documents' }),
            node('db', 'db', 'Documents', 500, 150, { status: 'healthy', sublabel: 'Docs 17, 42' }),
          ],
          edges: [
            edge('user', 'server', '“wireless headphones”'),
            edge('server', 'db', 'Fetch docs 17, 42'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'The inverted index maps each word to its documents, so a query intersects two short lists.',
        },
      ),
      step(
        's3',
        'Preparing the words',
        'Before a word enters the index it is prepared. Tokenization splits text into words, lowercasing makes “Headphones” and “headphones” the same token, and stemming trims “running” and “runs” down to their shared root. Stop words such as “the” and “and” are dropped, because they appear almost everywhere and add nothing to a search. The same preparation is applied to the query, so a user typing “Running Headphones” still matches a document that says “run with headphones”.',
        [
          metric('“Running”', '→ run'),
          metric('“Headphones”', '→ headphone'),
          metric('Stop words', 'Dropped: the, and'),
          metric('Query time', '12', 'ms', 'good'),
        ],
        [
          'Text is tokenized, lowercased, and stemmed before indexing',
          'Stop words are dropped and the query is prepared the same way',
        ],
        'Stemming is a blunt tool: it can merge words that mean different things, so search engines tune it carefully for each language.',
        'Index and query must be prepared the same way, or they will never match.',
        {
          nodes: [
            node('client', 'client', 'Indexer', 20, 150, { status: 'healthy', sublabel: 'Tokenize · stem' }),
            node('server', 'server', 'Search Index', 260, 150, { status: 'healthy', sublabel: 'run → docs' }),
            node('user', 'user', 'User', 500, 150, { status: 'healthy', sublabel: '“Running Headphones”' }),
          ],
          edges: [
            edge('client', 'server', 'Prepared tokens'),
            edge('user', 'server', 'Same preparation'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server', 'user->server'],
          caption: 'Documents and queries are tokenized and stemmed the same way before they meet the index.',
        },
      ),
      step(
        's4',
        'Ranking the results',
        'Finding matches is only half the job; ordering them is the other half. A document whose title contains the query words usually outranks one that mentions them once in passing, and a rare word counts for more than a common one — a match on “headphones” tells you more than a match on “new”. That idea is the heart of TF-IDF: term frequency, how often the word appears in the document, balanced against inverse document frequency, how rare the word is overall. Real systems add more signals on top, such as freshness and popularity.',
        [
          metric('Title match', 'Scores higher'),
          metric('Rare word', 'Counts for more'),
          metric('Signals', 'Relevance + freshness'),
          metric('Results shown', '10', 'per page'),
        ],
        [
          'Title matches outrank passing mentions',
          'Rare words count for more than common ones',
        ],
        'TF-IDF stands for term frequency–inverse document frequency: frequent in this document, rare across all documents, means a strong signal.',
        'Search is not just finding matches — it is ordering them so the best answer comes first.',
        {
          nodes: [
            node('server', 'server', 'Search Index', 20, 150, { status: 'healthy', sublabel: 'Scores matches' }),
            node('db', 'db', 'Doc 17', 260, 30, { status: 'healthy', sublabel: 'Title match · rank 1' }),
            node('db2', 'db', 'Doc 42', 260, 150, { status: 'healthy', sublabel: 'Mention · rank 2' }),
            node('user', 'user', 'User', 500, 150, { status: 'healthy', sublabel: 'Sees top 10' }),
          ],
          edges: [
            edge('server', 'db', 'Rank 1'),
            edge('server', 'db2', 'Rank 2'),
            edge('server', 'user', 'Ranked results'),
          ],
          activeNodeIds: ['server', 'db', 'user'],
          activeEdgeIds: ['server->db', 'server->user'],
          caption: 'Matches are ranked by relevance, so the title match comes first and the passing mention second.',
        },
      ),
      step(
        's5',
        'Scaling search',
        'A search index grows with the documents, so large systems split it. Sharding divides the index by document — one shard holds documents 1 to 500,000, another holds the rest — and a query is sent to every shard, with the results merged and re-ranked. Replicas of each shard spread the read load and survive a failure. New documents are indexed continuously, so there is a short delay between publishing and becoming searchable, and the index itself needs the same care as any database: monitoring, backups, and room to grow.',
        [
          metric('Shards', '2'),
          metric('Replicas', '2', 'per shard'),
          metric('Query fan-out', 'All shards'),
          metric('Index delay', '~1', 's'),
        ],
        [
          'The index is sharded by document across machines',
          'Each shard is replicated for load and for failure',
        ],
        'A query must visit every shard, because the best match could live on any of them — so shard count affects every query, not just storage.',
        'Search scales by splitting the index and asking every part.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'One query' }),
            node('server', 'server', 'Search Service', 260, 150, { status: 'healthy', sublabel: 'Fans out + merges' }),
            node('db', 'db', 'Shard 1', 500, 30, { status: 'healthy', sublabel: 'Docs 1–500k' }),
            node('db2', 'db', 'Shard 2', 500, 240, { status: 'healthy', sublabel: 'Docs 500k+' }),
          ],
          edges: [
            edge('user', 'server', 'Query'),
            edge('server', 'db', 'Search shard 1'),
            edge('server', 'db2', 'Search shard 2'),
          ],
          activeNodeIds: ['server', 'db', 'db2'],
          activeEdgeIds: ['server->db', 'server->db2'],
          caption: 'A query fans out to every shard, and the service merges and re-ranks the results.',
        },
      ),
    ],
    summary:
      'Search is slow when it scans, because every query reads every row and cannot rank what it finds. An inverted index fixes this by mapping each word to the documents that contain it, so a query becomes a lookup and an intersection of short lists. Words are tokenized, lowercased, and stemmed, stop words are dropped, and results are ranked — title matches and rare words score higher, in the spirit of TF-IDF, with freshness and popularity added on top. Large indexes shard by document and replicate each shard. ' +
      ILLUSTRATIVE,
  },
  l20: {
    id: 'l20',
    chapterId: 'communication',
    number: 20,
    title: 'HTTP and REST',
    durationMin: 11,
    difficulty: 'Beginner',
    intro:
      'The verbs, status codes and resource shapes behind nearly every API.',
    objectives: [
      'Describe the parts of an HTTP request and response',
      'Choose the right verb — GET, POST, PUT, PATCH, DELETE — for an action',
      'Read a status code and know which class of answer it is',
      'Explain the REST constraints: resources, statelessness, uniform interface',
      'Design a resource-shaped URL and a consistent error response',
    ],
    steps: [
      step(
        's1',
        'A request and a response',
        'HTTP is a conversation in two halves. A request carries a method, a URL, headers, and sometimes a body: GET /users/42 asks for one user, and the headers say what format the client accepts. A response carries a status code, headers, and a body: 200 OK with the user as JSON. The method says what to do, the URL says what to do it to, and the body carries the data. Everything else — caching, authentication, content type — travels in headers.',
        [
          metric('Request', 'GET /users/42'),
          metric('Response', '200 OK'),
          metric('Body format', 'JSON'),
          metric('Round trip', '40', 'ms'),
        ],
        [
          'A request carries a method, a URL, headers, and a body',
          'A response carries a status code, headers, and a body',
        ],
        'HTTP is stateless: each request stands alone, so anything the server needs — like who the caller is — must arrive with the request, usually as a token header.',
        'Method says what to do, URL says what to do it to, body carries the data.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'GET /users/42' }),
            node('server', 'server', 'API Server', 260, 150, { status: 'healthy', sublabel: 'Reads the request' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: 'Returns user 42' }),
          ],
          edges: [
            edge('client', 'server', 'GET /users/42'),
            edge('server', 'db', 'Find user 42'),
            edge('db', 'server', 'User as JSON', 'response'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server', 'server->db'],
          caption: 'A client sends GET /users/42 and the server returns that user as JSON.',
        },
      ),
      step(
        's2',
        'The five verbs',
        'Five verbs cover most API work. GET reads a resource and changes nothing, so it is safe to repeat. POST creates a new resource, such as a new order. PUT replaces a resource entirely, PATCH changes part of it, and DELETE removes it. GET, PUT, and DELETE are idempotent: sending the same request twice has the same effect as sending it once, which makes them safe to retry. POST is not idempotent by default, so retrying a POST can create the same order twice unless the API guards against it.',
        [
          metric('GET', 'Read · safe to repeat'),
          metric('POST', 'Create'),
          metric('PUT / PATCH', 'Replace / update part'),
          metric('DELETE', 'Remove'),
        ],
        [
          'GET reads, POST creates, PUT replaces, PATCH updates part, DELETE removes',
          'GET, PUT, and DELETE are idempotent; POST is not by default',
        ],
        'An idempotency key is a client-supplied header that lets a server recognise a retried POST and return the original result instead of creating a duplicate.',
        'Pick the verb by what the action does, not by habit — GET must never change data.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'POST /orders' }),
            node('server', 'server', 'API Server', 260, 150, { status: 'healthy', sublabel: 'Creates order 101' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: 'Order 101 saved' }),
          ],
          edges: [
            edge('client', 'server', 'POST /orders'),
            edge('server', 'db', 'Insert order'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server', 'server->db'],
          caption: 'A POST to /orders creates a new order, while GET would only read one.',
        },
      ),
      step(
        's3',
        'Status codes in five families',
        'A status code is a three-digit answer, grouped by its first digit. 2xx means success: 200 OK for a read, 201 Created after a POST. 3xx means redirect: the resource moved, try this other URL. 4xx means the client made a mistake: 400 Bad Request for invalid data, 401 Unauthorized when no credentials were sent, 403 Forbidden when the caller lacks permission, and 404 Not Found. 5xx means the server failed: 500 for an unexpected error, 503 when the service is temporarily unavailable. Reading the first digit already tells you who should fix the problem.',
        [
          metric('2xx', 'Success'),
          metric('3xx', 'Redirect'),
          metric('4xx', 'Client error'),
          metric('5xx', 'Server error'),
        ],
        [
          'Status codes group into five families by first digit',
          '4xx blames the request; 5xx blames the server',
        ],
        '401 means “I do not know who you are” and 403 means “I know who you are, and you may not do this” — two different problems with two different fixes.',
        'The first digit of a status code tells you who should fix the problem.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'Reads the code' }),
            node('server', 'server', 'API Server', 260, 150, { status: 'healthy', sublabel: '200 · 404 · 500' }),
            node('user', 'user', 'User', 500, 150, { status: 'healthy', sublabel: 'Sees the result' }),
          ],
          edges: [
            edge('client', 'server', 'Request'),
            edge('server', 'client', '200 OK / 404 / 500', 'response'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server', 'server->client'],
          caption: 'The server answers with a status code whose first digit names the kind of outcome.',
        },
      ),
      step(
        's4',
        'REST: resources, not actions',
        'REST is a style for shaping APIs around resources — nouns, not verbs. A user is a resource at /users/42, an order at /orders/101, and a user’s orders at /users/42/orders. The same URL answers different verbs: GET reads it, PUT replaces it, DELETE removes it. Servers stay stateless, so each request carries its own credentials and context. Responses are cacheable where marked, and the interface stays uniform, so a client that can read one resource can read them all the same way.',
        [
          metric('Resource', '/users/42'),
          metric('Nested', '/users/42/orders'),
          metric('Stateless', 'Each request complete'),
          metric('Cacheable', 'Where marked'),
        ],
        [
          'URLs name resources as nouns, with verbs in the method',
          'The same URL answers GET, PUT, and DELETE differently',
        ],
        'REST stands for Representational State Transfer: the server transfers a representation of a resource — usually JSON — and the client holds the state.',
        'Name things with nouns in the URL and verbs in the method.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'GET /users/42/orders' }),
            node('gateway', 'gateway', 'API Gateway', 260, 150, { status: 'healthy', sublabel: 'Routes by resource' }),
            node('server', 'server', 'Orders Service', 500, 150, { status: 'healthy', sublabel: 'Returns the list' }),
          ],
          edges: [
            edge('client', 'gateway', 'GET /users/42/orders'),
            edge('gateway', 'server', 'Forwards'),
          ],
          activeNodeIds: ['client', 'gateway', 'server'],
          activeEdgeIds: ['client->gateway', 'gateway->server'],
          caption: 'A nested resource URL names a user’s orders, and the gateway routes it to the orders service.',
        },
      ),
      step(
        's5',
        'Designing an API that lasts',
        'Good APIs are predictable. Use plural nouns, keep URLs lowercase, and version them — /v1/users — so a breaking change does not break every client at once. Paginate lists with limit and offset or a cursor, so no response grows without bound. Return errors in a consistent shape, with a code, a human-readable message, and the field at fault. And remember that URLs are a contract: renaming a resource breaks clients, so choose names slowly and change them rarely.',
        [
          metric('Version', '/v1/users'),
          metric('Page size', '20', 'items'),
          metric('Error shape', 'code + message'),
          metric('Naming', 'Plural, lowercase'),
        ],
        [
          'URLs use plural nouns, lowercase, and a version prefix',
          'Lists are paginated and errors share one shape',
        ],
        'A cursor — an opaque token pointing at where the last page ended — paginates more reliably than an offset when rows are added while a client pages through.',
        'An API is a promise: predictable names, paginated lists, and one error shape.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'GET /v1/users?limit=20' }),
            node('server', 'server', 'API Server', 260, 150, { status: 'healthy', sublabel: 'Page 1 of users' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: '20 rows' }),
          ],
          edges: [
            edge('client', 'server', 'GET /v1/users?limit=20'),
            edge('server', 'db', 'First 20 rows'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server', 'server->db'],
          caption: 'A versioned, paginated request asks for the first twenty users and gets exactly that.',
        },
      ),
    ],
    summary:
      'HTTP is a request and a response: the method says what to do, the URL says what to do it to, headers carry the context, and the body carries the data. GET reads, POST creates, PUT replaces, PATCH updates part, and DELETE removes — and GET, PUT, and DELETE are idempotent, so they are safe to retry. Status codes group by first digit: 2xx success, 3xx redirect, 4xx client error, 5xx server error. REST shapes APIs around resources named as nouns, keeps servers stateless, and rewards predictable, versioned, paginated design. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals'],
  },
  l21: {
    id: 'l21',
    chapterId: 'communication',
    number: 21,
    title: 'WebSockets and Real-Time Communication',
    durationMin: 12,
    difficulty: 'Intermediate',
    intro:
      'When a request-response round trip is too slow for live updates.',
    objectives: [
      'Explain why polling wastes work for live updates',
      'Describe the WebSocket handshake and upgrade from HTTP',
      'Explain full-duplex messaging over one persistent connection',
      'Compare WebSockets with polling, long polling, and server-sent events',
      'Describe how real-time systems scale and recover from disconnects',
    ],
    steps: [
      step(
        's1',
        'Polling: asking again and again',
        'A chat app needs new messages the moment they arrive, but plain HTTP only answers when asked. So the client polls: it asks the server every two seconds whether anything is new. Most answers are “nothing yet”, so the server handles thousands of empty requests, each paying for a fresh connection, headers, and a database check. The delay is also built in — a message that arrives just after a poll waits almost two seconds before the next poll finds it. Polling works, but it is busy, wasteful, and always a little late.',
        [
          metric('Poll interval', '2', 's'),
          metric('Empty replies', '29', 'of 30'),
          metric('Delay', 'Up to 2', 's', 'warn'),
          metric('Requests', '30', 'per minute'),
        ],
        [
          'The client polls the server every 2 seconds',
          'Most replies are empty and a message can wait up to 2 seconds',
        ],
        'Polling is still the right choice when updates are rare and a few seconds of delay do not matter — it needs no special server support at all.',
        'Polling finds news by asking repeatedly, and most answers are “nothing yet”.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'busy', sublabel: 'Polls every 2 s' }),
            node('server', 'server', 'Server', 260, 150, { status: 'busy', sublabel: 'Answers “nothing”' }),
            node('db', 'db', 'Database', 500, 150, { status: 'busy', sublabel: 'Checked 30× / min' }),
          ],
          edges: [
            edge('client', 'server', 'Anything new?'),
            edge('server', 'client', 'Nothing yet', 'response'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server', 'server->client'],
          caption: 'A polling client asks every two seconds and usually hears that nothing is new.',
        },
      ),
      step(
        's2',
        'The handshake: upgrading from HTTP',
        'A WebSocket starts as an ordinary HTTP request with one extra ask: the Upgrade header, asking the server to switch this connection to the WebSocket protocol. If the server agrees, it answers 101 Switching Protocols, and from that moment the connection stops being HTTP. It becomes a single long-lived TCP connection that both sides can write to at any time. No new connection is opened for each message, and neither side has to ask permission to speak.',
        [
          metric('Handshake', '101 Switching Protocols'),
          metric('Header', 'Upgrade: websocket'),
          metric('Connections', '1', 'persistent'),
          metric('Setup cost', 'Once'),
        ],
        [
          'The client asks to upgrade an HTTP connection',
          'The server answers 101 and the connection becomes a WebSocket',
        ],
        'The handshake uses HTTP so that WebSockets pass through the same proxies, load balancers, and firewalls that already understand HTTP.',
        'A WebSocket is born as HTTP, then upgrades into something else.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'Upgrade: websocket' }),
            node('server', 'server', 'Server', 260, 150, { status: 'healthy', sublabel: '101 Switching Protocols' }),
            node('db', 'db', 'Database', 500, 150, { status: 'idle', sublabel: 'Not involved' }),
          ],
          edges: [
            edge('client', 'server', 'GET + Upgrade header'),
            edge('server', 'client', '101 Switching Protocols', 'response'),
          ],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server', 'server->client'],
          caption: 'The client asks to upgrade, the server answers 101, and the connection becomes a WebSocket.',
        },
      ),
      step(
        's3',
        'Full-duplex messages, both directions',
        'Once open, a WebSocket is full-duplex: either side can send a message whenever it has one, without waiting for a request. The client sends a chat message, and the server pushes a reply to everyone in the room the instant it arrives — no polling, no waiting for the next two-second tick. Messages are small frames with a tiny header, so the cost per message is far lower than a full HTTP request. The connection stays open, idle but ready, until either side closes it.',
        [
          metric('Delivery delay', '~5', 'ms', 'good'),
          metric('Direction', 'Both ways'),
          metric('Per-message cost', 'Small frame'),
          metric('Idle connection', 'Stays open'),
        ],
        [
          'Either side can send at any time over one open connection',
          'A new message is pushed to the room in about 5 ms',
        ],
        'A frame is the WebSocket unit of data: a small header plus a payload, with no HTTP headers repeated on every message.',
        'After the handshake, the connection belongs to both sides equally.',
        {
          nodes: [
            node('client', 'client', 'Client A', 20, 30, { status: 'healthy', sublabel: 'Sends a message' }),
            node('server', 'server', 'Chat Server', 260, 150, { status: 'healthy', sublabel: 'Pushes instantly' }),
            node('client2', 'client', 'Client B', 500, 30, { status: 'healthy', sublabel: 'Receives it' }),
            node('client3', 'client', 'Client C', 500, 240, { status: 'healthy', sublabel: 'Receives it' }),
          ],
          edges: [
            edge('client', 'server', '“Hello!”'),
            edge('server', 'client2', 'Push “Hello!”'),
            edge('server', 'client3', 'Push “Hello!”'),
          ],
          activeNodeIds: ['client', 'server', 'client2'],
          activeEdgeIds: ['client->server', 'server->client2'],
          caption: 'One client sends a message and the server pushes it to the rest of the room at once.',
        },
      ),
      step(
        's4',
        'When a WebSocket is the wrong tool',
        'WebSockets are not always the answer. If updates flow in one direction only — a server announcing prices, scores, or progress — server-sent events are simpler: a plain HTTP stream the browser reads, with automatic reconnection built in. If updates are rare, plain polling or a single request is simpler still and scales more easily. Long polling sits between them: the server holds the request open until news arrives, then the client immediately asks again. Choose by the shape of the traffic, not by what sounds most modern.',
        [
          metric('One-way updates', 'Use server-sent events'),
          metric('Rare updates', 'Use polling'),
          metric('Two-way live', 'Use WebSockets'),
          metric('Long polling', 'Hold, answer, ask again'),
        ],
        [
          'Server-sent events fit one-way server-to-client updates',
          'Polling fits rare updates; long polling sits in between',
        ],
        'Server-sent events run over ordinary HTTP, so they work through proxies and caches that may struggle with long-lived WebSocket connections.',
        'Pick the tool by the shape of the traffic, not by what sounds most modern.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'Needs live prices' }),
            node('server', 'server', 'Server', 260, 150, { status: 'healthy', sublabel: 'One-way stream' }),
            node('service', 'service', 'SSE Stream', 500, 150, { status: 'healthy', sublabel: 'Simpler than sockets' }),
          ],
          edges: [
            edge('client', 'server', 'Subscribe'),
            edge('server', 'service', 'Price updates flow'),
          ],
          activeNodeIds: ['server', 'service'],
          activeEdgeIds: ['server->service'],
          caption: 'For one-way price updates, a server-sent-events stream is simpler than a WebSocket.',
        },
      ),
      step(
        's5',
        'Scaling real-time: reconnects and rooms',
        'Real-time systems have two scaling problems. First, a connection is stateful: a server holds its clients’ open sockets, so a load balancer must send a reconnecting client back to the same server, or the servers must share messages through a publish-subscribe channel so any server can reach any client. Second, connections drop — phones lose signal, laptops sleep — so clients reconnect with backoff, resuming from the last message they saw, and servers send heartbeats to notice dead connections and free them. Presence, the “who is online” list, is just another piece of shared state to keep.',
        [
          metric('Reconnect', 'Backoff, then resume'),
          metric('Dead connections', 'Found by heartbeat'),
          metric('Cross-server', 'Pub-sub channel'),
          metric('Presence', 'Shared state'),
        ],
        [
          'Servers share messages through pub-sub so any server can reach any client',
          'Clients reconnect with backoff and servers use heartbeats to free dead sockets',
        ],
        'Exponential backoff means each failed reconnect waits longer than the last, so a thousand dropped clients do not all reconnect in the same second.',
        'Real-time at scale is a reconnect and routing problem, not just a socket problem.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'Reconnects' }),
            node('lb', 'lb', 'Load Balancer', 260, 150, { status: 'healthy', sublabel: 'Sticky routing' }),
            node('server', 'server', 'Chat Server', 500, 30, { status: 'healthy', sublabel: 'Holds the socket' }),
            node('queue', 'queue', 'Pub-Sub', 500, 240, { status: 'healthy', sublabel: 'Shares messages' }),
          ],
          edges: [
            edge('client', 'lb', 'Reconnects'),
            edge('lb', 'server', 'Same server'),
            edge('server', 'queue', 'Publishes', 'async'),
          ],
          activeNodeIds: ['client', 'lb', 'server'],
          activeEdgeIds: ['client->lb', 'lb->server', 'server->queue'],
          caption: 'A reconnecting client returns to its server, and servers share messages through pub-sub.',
        },
      ),
    ],
    summary:
      'Polling finds live updates by asking again and again, and most answers are empty while a new message can wait a whole poll interval. A WebSocket upgrades one HTTP connection — the client asks with the Upgrade header and the server answers 101 — into a persistent, full-duplex channel where either side can send a small framed message at any time. That fits two-way live traffic such as chat; one-way updates fit server-sent events better, and rare updates fit plain polling. At scale, sticky routing or a pub-sub channel connects clients to the right server, with backoff reconnects and heartbeats. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals'],
  },
};
