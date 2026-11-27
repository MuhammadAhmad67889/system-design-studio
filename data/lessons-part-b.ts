/*
 * Fully-written lessons — Part B: data-storage lessons l9, l10, l12,
 * l13, l14 and l15. Each lesson follows the exact shape of the four
 * original full lessons in data/lessons-full.ts: intro, objectives,
 * 4+ steps (each with a diagram, metrics, what-changed, good-to-know
 * and takeaway), summary.
 *
 * All metric values are illustrative — see ILLUSTRATIVE in
 * data/lesson-helpers.ts. Never present an illustrative number as a
 * measurement from a real system.
 */

import type { Lesson } from '@/lib/types';
import { ILLUSTRATIVE, edge, metric, node, step } from '@/data/lesson-helpers';

export const lessonsPartB: Record<string, Lesson> = {
  l9: {
    id: 'l9',
    chapterId: 'data-storage',
    number: 9,
    title: 'SQL vs NoSQL',
    durationMin: 12,
    difficulty: 'Beginner',
    intro:
      'Tables and joins versus documents and keys — pick by access pattern, not fashion.',
    objectives: [
      'Explain the difference between relational tables and NoSQL data models',
      'Describe when joins and transactions make SQL the right choice',
      'Describe when flexible documents or simple key lookups fit better',
      'Match a data model to an access pattern instead of a trend',
      'Explain why one system can use both SQL and NoSQL together',
    ],
    steps: [
      step(
        's1',
        'Two families, one question',
        'Every database question starts with the same question: how will you read and write the data? SQL databases store data in tables with fixed columns and relate rows with joins. NoSQL databases store data as documents, key-value pairs, wide columns, or graphs, with no single fixed shape. Neither family is better in general. The right choice follows the access pattern — the queries you will actually run.',
        [
          metric('Data models', '2', 'families'),
          metric('SQL shape', 'Tables'),
          metric('NoSQL shapes', '4', 'common'),
        ],
        [
          'Data is split into two families: SQL tables and NoSQL models',
          'The deciding question is the access pattern',
        ],
        'NoSQL is an umbrella term for several different models, not one database design.',
        'Pick by access pattern, not by fashion.',
        {
          nodes: [
            node('client', 'client', 'App', 20, 150, { status: 'healthy', sublabel: 'Needs to store data' }),
            node('sql', 'db', 'SQL Database', 280, 60, { status: 'healthy', sublabel: 'Tables + joins' }),
            node('nosql', 'db', 'NoSQL Database', 280, 240, { status: 'healthy', sublabel: 'Documents + keys' }),
          ],
          edges: [
            edge('client', 'sql', 'Structured queries'),
            edge('client', 'nosql', 'Flexible reads'),
          ],
          activeNodeIds: ['sql', 'nosql'],
          activeEdgeIds: ['client->sql', 'client->nosql'],
          caption: 'An application can store data in SQL tables or in a NoSQL model.',
        },
      ),
      step(
        's2',
        'SQL: tables, joins, and guarantees',
        'In a SQL database, an order lives in an orders table, its items in an order_items table, and a join brings them together. Every row follows the same schema, so a missing price is caught early instead of discovered later. Transactions keep related writes together: either the order and the payment both land, or neither does. That guarantee is why banks, bookings, and billing usually start with SQL.',
        [
          metric('Tables in example', '2'),
          metric('Join result', '1', 'order'),
          metric('Writes in transaction', '2', 'or none'),
        ],
        [
          'Orders and order items live in separate tables',
          'A join brings them together; a transaction keeps writes atomic',
        ],
        'A schema is a contract: it rejects bad data at write time instead of letting it spread.',
        'SQL shines when data is related and correctness matters.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('db', 'db', 'SQL Database', 280, 150, { status: 'healthy', sublabel: 'orders + order_items' }),
            node('user', 'user', 'Customer', 520, 150, { status: 'healthy', sublabel: 'Places an order' }),
          ],
          edges: [
            edge('server', 'db', 'JOIN orders + items'),
            edge('user', 'server', 'Checkout'),
          ],
          activeNodeIds: ['db'],
          activeEdgeIds: ['server->db'],
          caption: 'A SQL database joins the orders and order items tables for one checkout.',
        },
      ),
      step(
        's3',
        'NoSQL: documents and keys',
        'In a document database, one order can hold its items inside the document itself — no join needed to read it back. A key-value store is simpler still: give it a key, get back a value, in about a millisecond. The trade is flexibility against guarantees. Changing a field does not need a migration, but the database will not stop you storing two different shapes for the same thing.',
        [
          metric('Reads to load order', '1'),
          metric('Key lookup', '~1', 'ms'),
          metric('Joins needed', '0'),
        ],
        [
          'An order and its items live in one document',
          'A key-value lookup returns a value with no join',
        ],
        'Storing related data together makes reads fast and makes cross-document consistency your job.',
        'NoSQL trades guarantees for flexibility and speed on simple lookups.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('doc', 'db', 'Document DB', 280, 60, { status: 'healthy', sublabel: 'Order + items together' }),
            node('kv', 'db', 'Key-Value Store', 280, 240, { status: 'healthy', sublabel: 'Key → value' }),
          ],
          edges: [
            edge('server', 'doc', 'Read one document'),
            edge('server', 'kv', 'GET session:42'),
          ],
          activeNodeIds: ['doc', 'kv'],
          activeEdgeIds: ['server->doc', 'server->kv'],
          caption: 'A document holds an order whole, and a key-value store answers by key.',
        },
      ),
      step(
        's4',
        'The same app, two shapes',
        'Take a user profile with a name, settings, and a list of recent orders. In SQL, that is three tables and two joins. In a document store, it is one document fetched in a single read. But ask a different question — total revenue by product category last month — and SQL wins easily, because the data is already normalised and the database can aggregate it. The same app can favour both models for different questions.',
        [
          metric('Profile read (SQL)', '3', 'tables'),
          metric('Profile read (doc)', '1', 'document'),
          metric('Revenue report', 'SQL', undefined, 'good'),
        ],
        [
          'A profile is one document but three tables with joins',
          'A revenue report is easy in SQL and awkward in documents',
        ],
        'Normalised data is easy to aggregate; denormalised data is easy to fetch whole.',
        'The best model depends on the question, not the app.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Opens profile' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy' }),
            node('db', 'db', 'Database', 480, 150, { status: 'healthy', sublabel: 'Profile or report' }),
          ],
          edges: [
            edge('user', 'server', 'Show my profile'),
            edge('server', 'db', '1 doc or 3 tables?'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'The same profile is one document in NoSQL and three joined tables in SQL.',
        },
      ),
      step(
        's5',
        'Choosing, and mixing both',
        'Start with the queries, not the logo. If the data is related, the writes must be atomic, and the questions are ad hoc, choose SQL. If the access pattern is mostly lookups by key, the shape changes often, or the data is naturally one self-contained record, choose NoSQL. Many real systems mix both: SQL for orders and payments, a document store for catalogues, and a key-value store for sessions.',
        [
          metric('Related + atomic', 'SQL'),
          metric('Lookup by key', 'NoSQL'),
          metric('Real systems', 'Often both'),
        ],
        [
          'The decision rule is the query list, not the database brand',
          'One system can use SQL for money and NoSQL for sessions',
        ],
        'Using two databases is called polyglot persistence — and it means two things to operate, back up, and monitor.',
        'List the queries first; the database follows.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'Routes each query' }),
            node('sql', 'db', 'SQL Database', 280, 60, { status: 'healthy', sublabel: 'Orders + payments' }),
            node('kv', 'db', 'Key-Value Store', 280, 240, { status: 'healthy', sublabel: 'Sessions' }),
          ],
          edges: [
            edge('server', 'sql', 'Money writes'),
            edge('server', 'kv', 'Session lookups'),
          ],
          activeNodeIds: ['sql', 'kv'],
          activeEdgeIds: ['server->sql', 'server->kv'],
          caption: 'One system uses SQL for orders and a key-value store for sessions.',
        },
      ),
    ],
    summary:
      'SQL stores data in tables, joins related rows, and guarantees that related writes land together — the right fit when data is related and correctness matters. NoSQL stores documents, keys, or graphs, reads whole records in one lookup, and tolerates changing shapes — the right fit for key lookups and self-contained records. The choice follows the access pattern, and many systems honestly use both. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['database-scaling'],
  },
  l10: {
    id: 'l10',
    chapterId: 'data-storage',
    number: 10,
    title: 'Database Indexes',
    durationMin: 11,
    difficulty: 'Intermediate',
    intro:
      'How an index turns a full scan into a lookup, and what it costs on writes.',
    objectives: [
      'Explain why a query without an index scans every row',
      'Describe how a B-tree index finds a row without scanning',
      'Choose a column worth indexing from a real query',
      'Explain what an index costs on every write',
      'Recognise when an index does not help a query',
    ],
    steps: [
      step(
        's1',
        'Without an index: read everything',
        'A users table holds one million rows, and a query asks for the user with email ada@example.com. Without an index, the database has no shortcut: it reads every row, checks the email column, and throws away the 999,999 rows that do not match. The scan takes about 400 ms — not because the database is slow, but because it did a million small checks to find one row.',
        [
          metric('Rows in table', '1,000,000'),
          metric('Rows checked', '1,000,000'),
          metric('Query time', '400', 'ms', 'bad'),
        ],
        [
          'A lookup by email with no index reads every row',
          'One matching row is found after a million checks',
        ],
        'A full scan is not always bad — a report that genuinely needs every row has nothing better to do.',
        'No index means no shortcut: the database reads everything.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('db', 'db', 'Users Table', 280, 150, { status: 'busy', sublabel: '1,000,000 rows' }),
            node('user', 'user', 'User', 520, 150, { status: 'idle', sublabel: 'Waits 400 ms' }),
          ],
          edges: [
            edge('server', 'db', 'WHERE email = …'),
            edge('db', 'server', '1 row, after scan', 'response'),
          ],
          activeNodeIds: ['db'],
          activeEdgeIds: ['server->db', 'db->server'],
          caption: 'Without an index the database scans one million rows to find one user.',
        },
      ),
      step(
        's2',
        'An index is a sorted shortcut',
        'An index on email is a separate sorted structure — usually a B-tree — that maps each email to the row that holds it. The database walks the tree, following a handful of branches, and lands on the row in about 20 levels of decisions instead of a million checks. The query now takes about 2 ms. The table did not change; the database simply gained a way to find things.',
        [
          metric('Rows checked', '~20'),
          metric('Query time', '2', 'ms', 'good'),
          metric('Speedup', '200×'),
        ],
        [
          'An index on email maps each address to its row',
          'The same query drops from 400 ms to about 2 ms',
        ],
        'A B-tree stays balanced as rows are added, so lookups stay fast even as the table grows.',
        'An index turns a scan into a short walk down a sorted tree.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('index', 'db', 'Email Index', 280, 60, { status: 'healthy', sublabel: 'Sorted B-tree' }),
            node('db', 'db', 'Users Table', 280, 240, { status: 'healthy', sublabel: '1,000,000 rows' }),
          ],
          edges: [
            edge('server', 'index', 'Find ada@example.com'),
            edge('index', 'db', 'Row 482,110'),
          ],
          activeNodeIds: ['index', 'db'],
          activeEdgeIds: ['server->index', 'index->db'],
          caption: 'The email index points straight to the matching row.',
        },
      ),
      step(
        's3',
        'Index the column the query filters on',
        'An index only helps the queries that use its column. A query filtering on country gains nothing from an email index, and a query filtering on both email and status benefits most from a composite index on (email, status) — the database narrows by email first, then by status. The rule is simple: look at the WHERE clause, and index the columns it actually filters or sorts by.',
        [
          metric('Query filters', 'email + status'),
          metric('Best index', '(email, status)'),
          metric('Query time', '3', 'ms', 'good'),
        ],
        [
          'A composite index on (email, status) serves the real query',
          'An email-only index cannot help a country filter',
        ],
        'Column order in a composite index matters: put the most selective column first.',
        'Index what the WHERE clause filters on.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'WHERE email + status' }),
            node('index', 'db', 'Composite Index', 280, 150, { status: 'healthy', sublabel: '(email, status)' }),
            node('db', 'db', 'Users Table', 520, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('server', 'index', 'Filter by both'),
            edge('index', 'db', 'Matching rows'),
          ],
          activeNodeIds: ['index'],
          activeEdgeIds: ['server->index', 'index->db'],
          caption: 'A composite index on email and status serves the query that filters on both.',
        },
      ),
      step(
        's4',
        'Every index taxes every write',
        'Indexes are not free. Each insert must now update the table and every index on it, so a table with five indexes does six writes for one new row. An update that changes an indexed email must move the entry in the tree. If writes take 4 ms with no indexes and 12 ms with five, that is the price of fast reads — and on a write-heavy table, it can be too high.',
        [
          metric('Indexes on table', '5'),
          metric('Write time (no index)', '4', 'ms'),
          metric('Write time (5 indexes)', '12', 'ms', 'warn'),
        ],
        [
          'One insert now updates the table plus five indexes',
          'Write time rises from 4 ms to 12 ms',
        ],
        'Deleting a row must also remove its index entries, so deletes pay the same tax.',
        'Fast reads are paid for on every write.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'INSERT new user' }),
            node('db', 'db', 'Users Table', 280, 150, { status: 'busy', sublabel: 'Row + 5 indexes' }),
            node('index', 'db', 'Indexes', 520, 150, { status: 'busy', sublabel: 'All 5 updated' }),
          ],
          edges: [
            edge('server', 'db', 'INSERT'),
            edge('db', 'index', 'Update each index'),
          ],
          activeNodeIds: ['db', 'index'],
          activeEdgeIds: ['server->db', 'db->index'],
          caption: 'One insert updates the table and all five of its indexes.',
        },
      ),
      step(
        's5',
        'When an index does not help',
        'Some queries ignore indexes no matter how many you add. A filter on a low-cardinality column — say, a boolean is_active that is true for 95% of rows — still matches nearly everything, so the database scans anyway. A function on the column, like LOWER(email), cannot use a plain email index either. And a query returning half the table is faster as a scan than as a million index hops.',
        [
          metric('Rows matching filter', '95', '%'),
          metric('Index used', 'No'),
          metric('Query time', '380', 'ms'),
        ],
        [
          'A filter matching 95% of rows gets no benefit from an index',
          'A function on the column defeats the index',
        ],
        'Most databases can explain a query plan — read it before adding an index, and again after.',
        'An index only helps when it narrows the search a lot.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('db', 'db', 'Users Table', 280, 150, { status: 'busy', sublabel: 'Scans anyway' }),
            node('index', 'db', 'Index', 520, 150, { status: 'idle', sublabel: 'Not used' }),
          ],
          edges: [
            edge('server', 'db', 'WHERE is_active = true'),
          ],
          activeNodeIds: ['db'],
          activeEdgeIds: ['server->db'],
          caption: 'A filter matching 95 percent of rows scans the table despite the index.',
        },
      ),
    ],
    summary:
      'Without an index, a lookup scans every row — one million checks and about 400 ms to find one user. An index is a sorted B-tree that maps a value to its row, so the same lookup checks about twenty entries and takes about 2 ms. But every index taxes every write, and an index only helps when it narrows the search sharply. Index the columns the WHERE clause really filters on, and no more. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['database-scaling'],
  },
  l12: {
    id: 'l12',
    chapterId: 'data-storage',
    number: 12,
    title: 'Database Sharding',
    durationMin: 13,
    difficulty: 'Advanced',
    intro:
      'Splitting one table across many machines — and the queries that get harder.',
    objectives: [
      'Explain why one database server eventually runs out of room',
      'Describe how a shard key decides which shard holds a row',
      'Route a single-row query to the right shard',
      'Explain why cross-shard queries are slow and expensive',
      'Recognise a hot shard and what causes one',
      'Describe what resharding involves when shards fill up',
    ],
    formulas: [
      {
        name: 'Shard assignment',
        expression: 'shard = hash(shard key) mod N',
        note: 'With 4 shards, a user whose id hashes to 7 lands on shard 7 mod 4 = 3. The same key always lands on the same shard, so the application can find it without asking every shard.',
      },
    ],
    steps: [
      step(
        's1',
        'One database runs out of room',
        'A users table grows to 800 million rows and the database server holds 500 GB of data on a machine with 256 GB of memory. Most reads now hit disk instead of memory, and latency climbs from 5 ms to 90 ms. Vertical scaling helped once — a bigger machine — but there is no machine big enough for the next tenfold growth. The data has to be split across machines.',
        [
          metric('Rows', '800', 'million'),
          metric('Data size', '500', 'GB'),
          metric('Read latency', '90', 'ms', 'bad'),
        ],
        [
          'The table outgrows one machine’s memory',
          'Reads fall back to disk and latency climbs to 90 ms',
        ],
        'Replication copies the whole database, so it adds read capacity but never reduces the size of one copy.',
        'When one machine cannot hold the data, split the data.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('db', 'db', 'Database', 280, 150, { status: 'degraded', sublabel: '500 GB · 90 ms reads' }),
            node('user', 'user', 'Users', 520, 150, { status: 'idle', sublabel: 'Waiting' }),
          ],
          edges: [
            edge('server', 'db', 'Reads hit disk'),
          ],
          activeNodeIds: ['db'],
          activeEdgeIds: ['server->db'],
          caption: 'One database holds 500 gigabytes and reads slow to 90 milliseconds.',
        },
      ),
      step(
        's2',
        'Split by a shard key',
        'Sharding splits one logical table into shards — separate databases that each hold a slice of the rows. The shard key decides the slice: here user_id, hashed and taken modulo 4, so each of four shards holds roughly a quarter of the users. The same user always lands on the same shard, which is what makes a single-user lookup possible without asking all four.',
        [
          metric('Shards', '4'),
          metric('Rows per shard', '200', 'million'),
          metric('Shard key', 'user_id'),
        ],
        [
          'The users table is split into four shards by user_id',
          'Each shard holds about 200 million rows',
        ],
        'A good shard key spreads rows evenly and appears in most queries — user_id does both for a user-centred product.',
        'The shard key decides where every row lives.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'hash(user_id) mod 4' }),
            node('shard0', 'db', 'Shard 0', 280, 40, { status: 'healthy', sublabel: '200M rows' }),
            node('shard1', 'db', 'Shard 1', 280, 150, { status: 'healthy', sublabel: '200M rows' }),
            node('shard2', 'db', 'Shard 2', 280, 260, { status: 'healthy', sublabel: '200M rows' }),
          ],
          edges: [
            edge('server', 'shard0', 'Slice 0'),
            edge('server', 'shard1', 'Slice 1'),
            edge('server', 'shard2', 'Slice 2'),
          ],
          activeNodeIds: ['shard0', 'shard1', 'shard2'],
          activeEdgeIds: ['server->shard0', 'server->shard1', 'server->shard2'],
          caption: 'Hashing user_id across four shards gives each shard about a quarter of the users.',
        },
      ),
      step(
        's3',
        'A single-row query finds its shard',
        'A request for user 482,110 arrives. The application hashes the id, computes 482,110 mod 4 — in this worked example the hash lands on shard 2 — and sends the query to that shard only. The shard holds 200 million rows instead of 800 million, so the lookup takes about 6 ms. Routing by shard key is the whole payoff of sharding: one query, one machine.',
        [
          metric('Shards queried', '1', 'of 4'),
          metric('Rows searched', '200', 'million'),
          metric('Query time', '6', 'ms', 'good'),
        ],
        [
          'The query is routed to shard 2 only',
          'Latency recovers to about 6 ms on a smaller dataset',
        ],
        'The routing logic usually lives in the application or a proxy — the database itself does not know about the other shards.',
        'A query that carries the shard key touches one machine.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'User 482,110' }),
            node('server', 'server', 'App Server', 180, 150, { status: 'healthy', sublabel: 'Routes to shard 2' }),
            node('shard2', 'db', 'Shard 2', 380, 150, { status: 'healthy', sublabel: 'Has the row' }),
            node('shard0', 'db', 'Shard 0', 540, 150, { status: 'idle', sublabel: 'Not asked' }),
          ],
          edges: [
            edge('user', 'server', 'Load profile'),
            edge('server', 'shard2', 'Query shard 2 only'),
          ],
          activeNodeIds: ['server', 'shard2'],
          activeEdgeIds: ['user->server', 'server->shard2'],
          caption: 'The request for one user is routed to shard 2 and no other shard is asked.',
        },
      ),
      step(
        's4',
        'Cross-shard queries get expensive',
        'Now ask for all users in a city, or the total number of orders this month. City and date are not the shard key, so no single shard can answer: the query must run on all four shards and the results must be merged. That scatter-gather takes about 180 ms, four times the work, and a join across two sharded tables is worse — the database cannot join rows that live on different machines.',
        [
          metric('Shards queried', '4', 'of 4'),
          metric('Query time', '180', 'ms', 'warn'),
          metric('Cross-shard join', 'Not supported'),
        ],
        [
          'A query without the shard key must visit every shard',
          'Results are merged afterwards, at four times the work',
        ],
        'Teams often duplicate the needed data into each shard, or precompute aggregates, rather than run cross-shard queries live.',
        'Sharding speeds up keyed lookups and punishes everything else.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'Scatter-gather' }),
            node('shard0', 'db', 'Shard 0', 280, 40, { status: 'busy', sublabel: 'Partial result' }),
            node('shard1', 'db', 'Shard 1', 280, 150, { status: 'busy', sublabel: 'Partial result' }),
            node('shard2', 'db', 'Shard 2', 280, 260, { status: 'busy', sublabel: 'Partial result' }),
          ],
          edges: [
            edge('server', 'shard0', 'Query all'),
            edge('server', 'shard1', 'Query all'),
            edge('server', 'shard2', 'Query all'),
          ],
          activeNodeIds: ['shard0', 'shard1', 'shard2'],
          activeEdgeIds: ['server->shard0', 'server->shard1', 'server->shard2'],
          caption: 'A query without the shard key must visit every shard and merge the results.',
        },
      ),
      step(
        's5',
        'A hot shard breaks the balance',
        'Sharding assumes traffic spreads evenly, and a celebrity account breaks that assumption. One user_id receives 40% of all reads, so its shard runs at 95% CPU while the others sit at 30%. Adding more shards does not help — the hot key still lands on one machine. The fixes are to split the hot key further, cache its data, or choose a shard key that spreads the load.',
        [
          metric('Hot shard CPU', '95', '%', 'bad'),
          metric('Other shards CPU', '30', '%'),
          metric('Reads on hot key', '40', '%'),
        ],
        [
          'One popular user draws 40% of all reads to a single shard',
          'That shard hits 95% CPU while the others idle at 30%',
        ],
        'Hot keys are usually people, places, or events — anything the whole world looks at at once.',
        'Even shards mean nothing if the traffic is not even.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '40% read one key' }),
            node('server', 'server', 'App Server', 180, 150, { status: 'healthy' }),
            node('hot', 'db', 'Hot Shard', 380, 60, { status: 'degraded', sublabel: '95% CPU' }),
            node('cold', 'db', 'Other Shards', 380, 240, { status: 'healthy', sublabel: '30% CPU' }),
          ],
          edges: [
            edge('user', 'server', 'Reads'),
            edge('server', 'hot', 'Most traffic'),
            edge('server', 'cold', 'Little traffic'),
          ],
          activeNodeIds: ['hot'],
          activeEdgeIds: ['server->hot'],
          caption: 'One popular key sends 40 percent of reads to a single shard.',
        },
      ),
      step(
        's6',
        'Resharding: splitting again',
        'Eventually even the shards fill up, and the team splits four shards into eight. Every row must be re-hashed and moved, which takes hours and must happen without losing a write or serving a stale read. Many teams avoid the pain with consistent hashing or by doubling shard counts, but resharding is never free — it is the tax sharding charges for growing.',
        [
          metric('Shards', '4 → 8'),
          metric('Rows moved', '400', 'million'),
          metric('Downtime', '0', 'planned'),
        ],
        [
          'Four shards are split into eight',
          'About half the rows move, with no planned downtime',
        ],
        'Some systems shard by ranges instead of hashes, so a split only moves the rows in one range.',
        'Sharding is a commitment: growing means moving data.',
        {
          nodes: [
            node('shard0', 'db', 'Shard 0', 20, 60, { status: 'busy', sublabel: 'Splitting' }),
            node('shard1', 'db', 'Shard 1', 20, 240, { status: 'busy', sublabel: 'Splitting' }),
            node('new0', 'db', 'Shard 4', 280, 60, { status: 'healthy', sublabel: 'Receives rows' }),
            node('new1', 'db', 'Shard 5', 280, 240, { status: 'healthy', sublabel: 'Receives rows' }),
            node('server', 'server', 'App Server', 520, 150, { status: 'healthy', sublabel: 'Routes both' }),
          ],
          edges: [
            edge('shard0', 'new0', 'Move rows', 'async'),
            edge('shard1', 'new1', 'Move rows', 'async'),
          ],
          activeNodeIds: ['shard0', 'new0'],
          activeEdgeIds: ['shard0->new0', 'shard1->new1'],
          caption: 'Resharding moves rows from four shards into eight new ones.',
        },
      ),
    ],
    summary:
      'Sharding splits one table across many machines by a shard key, usually hash(key) mod N, so a query carrying the key touches one shard and answers in about 6 ms instead of 90. The price is steep: queries without the key must visit every shard, cross-shard joins are not practical, a hot key can overload one shard while others idle, and growing means resharding — moving rows without downtime. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['database-scaling'],
  },
  l13: {
    id: 'l13',
    chapterId: 'data-storage',
    number: 13,
    title: 'Partitioning Strategies',
    durationMin: 12,
    difficulty: 'Advanced',
    intro:
      'Range, hash, and list partitioning: choosing the key that keeps data even.',
    objectives: [
      'Explain what a partition is and how it differs from a shard',
      'Describe range partitioning and when it fits time-ordered data',
      'Describe hash partitioning and when even spread matters most',
      'Describe list partitioning for a small set of known values',
      'Choose a partition key from a query pattern',
      'Explain partition pruning and hot partitions',
    ],
    formulas: [
      {
        name: 'Hash partition',
        expression: 'partition = hash(key) mod N',
        note: 'With 4 partitions, an order whose customer id hashes to 9 lands in partition 9 mod 4 = 1. Hashing spreads rows evenly, but a query that does not carry the key must check every partition.',
      },
    ],
    steps: [
      step(
        's1',
        'One table, many partitions',
        'Partitioning divides one table into smaller pieces called partitions, each holding a slice of the rows — by date, by region, or by a hash. The table still looks like one table to the application: the database decides which partition a row belongs to. Partitions can live on one machine or many, which is the difference from sharding: sharding always spreads across machines, partitioning is about organising the data.',
        [
          metric('Partitions', '4'),
          metric('Rows per partition', '250', 'million'),
          metric('Tables seen by app', '1'),
        ],
        [
          'One logical table is divided into four partitions',
          'The application still queries a single table',
        ],
        'A partition can be dropped, archived, or backed up on its own — deleting old data becomes a fast operation instead of a slow delete.',
        'Partitioning organises a table; sharding distributes it.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('db', 'db', 'Orders Table', 280, 150, { status: 'healthy', sublabel: '1 logical table' }),
            node('part', 'db', 'Partitions', 520, 150, { status: 'healthy', sublabel: '4 slices' }),
          ],
          edges: [
            edge('server', 'db', 'Query orders'),
            edge('db', 'part', 'Routes to slice'),
          ],
          activeNodeIds: ['db', 'part'],
          activeEdgeIds: ['server->db', 'db->part'],
          caption: 'One orders table is divided into four partitions behind a single table name.',
        },
      ),
      step(
        's2',
        'Range partitioning: slices by value',
        'Range partitioning slices by a value range — orders from January in one partition, February in the next, and so on. A query for March reads only the March partition, about 80 million rows instead of a billion, and finishes in about 8 ms. Range partitioning fits time-ordered data beautifully, and old partitions can be archived or dropped whole when they age out.',
        [
          metric('Partitions', '12', 'months'),
          metric('Rows read (March)', '80', 'million'),
          metric('Query time', '8', 'ms', 'good'),
        ],
        [
          'Orders are sliced by month into twelve partitions',
          'A March query reads only the March partition',
        ],
        'Ranges do not have to be months: they can be years, price bands, or any ordered value.',
        'Range fits data that is ordered and queried by that order.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'March orders?' }),
            node('jan', 'db', 'Jan Partition', 280, 40, { status: 'idle', sublabel: 'Skipped' }),
            node('mar', 'db', 'Mar Partition', 280, 150, { status: 'healthy', sublabel: '80M rows read' }),
            node('dec', 'db', 'Dec Partition', 280, 260, { status: 'idle', sublabel: 'Skipped' }),
          ],
          edges: [
            edge('server', 'mar', 'Read March only'),
          ],
          activeNodeIds: ['mar'],
          activeEdgeIds: ['server->mar'],
          caption: 'A March query reads only the March partition and skips the rest.',
        },
      ),
      step(
        's3',
        'Hash partitioning: even spread',
        'Hash partitioning runs the partition key through a hash and takes the remainder modulo the partition count, so rows spread evenly with no thought about ranges. With four partitions, each holds about a quarter of a billion rows. The spread is the strength and the weakness: a query for one customer id lands on exactly one partition, but a query by date must check all four, because the hash destroyed the ordering.',
        [
          metric('Partitions', '4'),
          metric('Rows per partition', '250', 'million'),
          metric('Single-key query', '1', 'partition'),
        ],
        [
          'Rows are spread evenly by hash(customer_id) mod 4',
          'A single-customer query touches one partition; a date query touches all four',
        ],
        'Hash partitioning is the usual choice when no range is queried often and even spread matters most.',
        'Hashing spreads evenly and forgets order.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'hash(id) mod 4' }),
            node('p0', 'db', 'Partition 0', 280, 40, { status: 'healthy', sublabel: '250M rows' }),
            node('p1', 'db', 'Partition 1', 280, 150, { status: 'healthy', sublabel: '250M rows' }),
            node('p2', 'db', 'Partition 2', 280, 260, { status: 'healthy', sublabel: '250M rows' }),
          ],
          edges: [
            edge('server', 'p0', 'Even slice'),
            edge('server', 'p1', 'Even slice'),
            edge('server', 'p2', 'Even slice'),
          ],
          activeNodeIds: ['p0', 'p1', 'p2'],
          activeEdgeIds: ['server->p0', 'server->p1', 'server->p2'],
          caption: 'Hashing the customer id spreads rows evenly across four partitions.',
        },
      ),
      step(
        's4',
        'List partitioning: named buckets',
        'List partitioning assigns rows to named buckets: orders from Europe in one partition, Asia in another, the Americas in a third. A query for European orders reads one partition, and a new region is added by creating a partition, not by rebuilding the table. The risk is a bucket that outgrows the others — if Europe holds 60% of orders, its partition carries 60% of the load.',
        [
          metric('Partitions', '3', 'regions'),
          metric('Europe share', '60', '%', 'warn'),
          metric('Regional query', '1', 'partition'),
        ],
        [
          'Orders are bucketed by region into three partitions',
          'Europe holds 60% of orders, so its partition is the biggest',
        ],
        'List partitioning suits a small, stable set of values — regions, plan tiers, or categories.',
        'Named buckets are simple until one bucket outgrows the rest.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'European orders?' }),
            node('eu', 'db', 'Europe', 280, 60, { status: 'busy', sublabel: '60% of rows' }),
            node('asia', 'db', 'Asia', 280, 180, { status: 'healthy', sublabel: '25% of rows' }),
            node('amer', 'db', 'Americas', 520, 150, { status: 'healthy', sublabel: '15% of rows' }),
          ],
          edges: [
            edge('server', 'eu', 'Read Europe only'),
          ],
          activeNodeIds: ['eu'],
          activeEdgeIds: ['server->eu'],
          caption: 'A European query reads only the Europe partition, which holds 60 percent of orders.',
        },
      ),
      step(
        's5',
        'Pruning, hot partitions, and choosing',
        'The win of partitioning is pruning: the database skips partitions the query cannot need, so a March query never touches January. The failure mode is a hot partition — this month’s range, or one giant region — taking most of the traffic while the rest idle. Choose the key from the queries: range for time, hash for even spread by id, list for a few known values. And check the key appears in the queries that matter, or pruning never happens.',
        [
          metric('Partitions skipped', '11', 'of 12'),
          metric('Hot partition load', '70', '%', 'warn'),
          metric('Rule', 'Key in query'),
        ],
        [
          'Pruning lets a query skip partitions it cannot need',
          'A hot partition takes 70% of traffic while others idle',
        ],
        'A partition key that never appears in queries is decoration: the database must check every partition, every time.',
        'Partition by what you query, and watch for the hot slice.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'This month?' }),
            node('hot', 'db', 'This Month', 280, 60, { status: 'degraded', sublabel: '70% of traffic' }),
            node('old', 'db', 'Older Months', 280, 240, { status: 'idle', sublabel: 'Skipped by pruning' }),
            node('user', 'user', 'Users', 520, 150, { status: 'healthy', sublabel: 'Mostly recent data' }),
          ],
          edges: [
            edge('server', 'hot', 'Most queries land here'),
          ],
          activeNodeIds: ['hot'],
          activeEdgeIds: ['server->hot'],
          caption: 'Pruning skips old partitions, but this month’s partition takes 70 percent of traffic.',
        },
      ),
    ],
    summary:
      'Partitioning divides one table into slices the database routes for you. Range partitioning slices by an ordered value like month, so a March query reads only March; hash partitioning spreads rows evenly by hash(key) mod N, so one key lands on one partition but ordering is lost; list partitioning uses named buckets like regions. The win is pruning — skipping partitions a query cannot need — and the failure is a hot partition carrying most of the load. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['database-scaling'],
  },
  l14: {
    id: 'l14',
    chapterId: 'data-storage',
    number: 14,
    title: 'Caching Fundamentals',
    durationMin: 11,
    difficulty: 'Beginner',
    intro:
      'The fastest database call is the one you never make.',
    objectives: [
      'Explain what a cache is and why it sits in front of slower storage',
      'Trace a cache hit and a cache miss',
      'Describe cache-aside, the most common caching pattern',
      'Explain what a TTL is and why every entry needs one',
      'Name where caches live: browser, CDN, application, and database',
    ],
    steps: [
      step(
        's1',
        'The same question, asked a thousand times',
        'A product page is requested 1,000 times per minute, and every request runs the same database query: the same product, the same price, the same description. The database answers in 40 ms each time, doing identical work for an identical answer. The data barely changes — the price moves once a day — yet the system pays the full database cost on every single request.',
        [
          metric('Requests', '1,000', 'per min'),
          metric('Database time', '40', 'ms'),
          metric('Data changes', '1×', 'per day'),
        ],
        [
          'The same product page is requested 1,000 times a minute',
          'Every request repeats an identical 40 ms database query',
        ],
        'Repeated reads of slowly changing data are the clearest sign a cache will help.',
        'Repeating identical work is the problem caching exists to solve.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1,000 req/min' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy' }),
            node('db', 'db', 'Database', 480, 150, { status: 'busy', sublabel: 'Same query, 40 ms' }),
          ],
          edges: [
            edge('user', 'server', 'Product page'),
            edge('server', 'db', 'Same query every time'),
          ],
          activeNodeIds: ['db'],
          activeEdgeIds: ['server->db'],
          caption: 'One thousand requests a minute each run the same 40-millisecond database query.',
        },
      ),
      step(
        's2',
        'A cache hit: the fast path',
        'A cache is a small, fast store — usually in memory — that keeps copies of recent answers. The first request still hits the database, but its answer is saved under a key like product:42. The next 999 requests find that key in the cache and get the answer in about 2 ms, without touching the database at all. That is a cache hit, and it is the whole point.',
        [
          metric('Cache hit time', '2', 'ms', 'good'),
          metric('Database time', '40', 'ms'),
          metric('Requests hitting DB', '1', 'in 1,000'),
        ],
        [
          'The first answer is saved in the cache under product:42',
          'The next 999 requests are answered from the cache in 2 ms',
        ],
        'Caches are usually in-memory stores, which is why they are fast — and why they hold far less than a database.',
        'A hit answers from memory; the database never hears about it.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1,000 req/min' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy' }),
            node('cache', 'cache', 'Cache', 480, 60, { status: 'healthy', sublabel: 'product:42 · 2 ms' }),
            node('db', 'db', 'Database', 480, 240, { status: 'idle', sublabel: 'Not asked' }),
          ],
          edges: [
            edge('server', 'cache', 'GET product:42'),
            edge('cache', 'server', 'Answer in 2 ms', 'response'),
          ],
          activeNodeIds: ['cache'],
          activeEdgeIds: ['server->cache', 'cache->server'],
          caption: 'A cache hit returns the product page in 2 milliseconds without touching the database.',
        },
      ),
      step(
        's3',
        'A cache miss: pay once, save the answer',
        'When the key is not in the cache, that is a miss. The application falls through to the database, waits the usual 40 ms, and then — this is the important part — writes the answer into the cache before replying. The next request for the same key will hit. This read-then-fill pattern is called cache-aside, and it is the most common caching pattern in real systems.',
        [
          metric('Cache miss time', '40', 'ms'),
          metric('Cache fill', 'After', '1st read'),
          metric('Next request', '2', 'ms', 'good'),
        ],
        [
          'A miss falls through to the database and takes 40 ms',
          'The answer is written into the cache before replying',
        ],
        'Cache-aside puts the application in charge: it decides what to cache, under which key, and for how long.',
        'A miss costs one database read and buys every later hit.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'Cache-aside' }),
            node('cache', 'cache', 'Cache', 280, 60, { status: 'healthy', sublabel: 'Miss → then filled' }),
            node('db', 'db', 'Database', 280, 240, { status: 'healthy', sublabel: '40 ms read' }),
          ],
          edges: [
            edge('server', 'cache', 'GET product:42 → miss'),
            edge('server', 'db', 'Read from database'),
            edge('server', 'cache', 'SET product:42', 'async'),
          ],
          activeNodeIds: ['cache', 'db'],
          activeEdgeIds: ['server->cache', 'server->db'],
          caption: 'On a miss the application reads the database and fills the cache.',
        },
      ),
      step(
        's4',
        'Every entry needs an expiry',
        'Cached answers go stale: the price changes, but the cache still holds yesterday’s price. The simplest guard is a TTL — time to live — after which the entry expires and the next request refills it from the database. A 5-minute TTL means the worst staleness is five minutes, and the database sees at most one refill per key every five minutes. Short TTLs are fresher; long TTLs protect the database more.',
        [
          metric('TTL', '5', 'min'),
          metric('Worst staleness', '5', 'min'),
          metric('Refills per key', '12', 'per hour'),
        ],
        [
          'A 5-minute TTL caps staleness at five minutes',
          'Each key refills from the database at most every five minutes',
        ],
        'Pick the TTL from the data: prices can tolerate minutes, a user’s own balance usually cannot.',
        'A TTL is a promise about how stale an answer may be.',
        {
          nodes: [
            node('cache', 'cache', 'Cache', 20, 150, { status: 'healthy', sublabel: 'TTL 5 min' }),
            node('server', 'server', 'App Server', 280, 150, { status: 'healthy' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'New price' }),
          ],
          edges: [
            edge('cache', 'server', 'Entry expires'),
            edge('server', 'db', 'Refill with new price'),
          ],
          activeNodeIds: ['cache', 'db'],
          activeEdgeIds: ['cache->server', 'server->db'],
          caption: 'After five minutes the cached price expires and the next request refills it.',
        },
      ),
      step(
        's5',
        'Caches live at every layer',
        'Caching is not one box: it is a habit at every layer. The browser caches a logo for a day, a CDN caches product images near the user, the application caches database answers for minutes, and the database itself caches hot rows in memory. A request that hits the browser cache never reaches the network; one that hits the CDN never reaches the origin. Each layer answers faster than the one behind it.',
        [
          metric('Browser cache', '~0', 'ms'),
          metric('CDN cache', '~10', 'ms'),
          metric('App cache', '2', 'ms'),
        ],
        [
          'The browser, CDN, application, and database each cache',
          'Each layer answers faster than the one behind it',
        ],
        'Layers stack: a CDN miss still has the application cache behind it, and an application miss still has the database.',
        'Cache at the layer closest to the user first.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Browser cache' }),
            node('cdn', 'cdn', 'CDN', 220, 150, { status: 'healthy', sublabel: 'Images near user' }),
            node('server', 'server', 'App Server', 420, 150, { status: 'healthy', sublabel: 'App cache' }),
            node('db', 'db', 'Database', 560, 260, { status: 'idle', sublabel: 'Last resort' }),
          ],
          edges: [
            edge('user', 'cdn', 'Static assets'),
            edge('cdn', 'server', 'Miss → origin'),
            edge('server', 'db', 'Miss → database'),
          ],
          activeNodeIds: ['cdn', 'server'],
          activeEdgeIds: ['user->cdn', 'cdn->server'],
          caption: 'Browser, CDN, application, and database caches form layers in front of the data.',
        },
      ),
      step(
        's6',
        'What a cache cannot do',
        'A cache only helps reads, and only repeated ones: a query run once gains nothing, and a write still has to reach the database. Memory is finite, so the cache evicts the least recently used entries when it fills — the classic LRU policy. And a cache is a copy, so it can be stale, lost on restart, or empty after a deploy. None of that makes caching useless; it makes the database the source of truth, always.',
        [
          metric('Helps', 'Repeated reads'),
          metric('Eviction', 'LRU'),
          metric('Source of truth', 'Database'),
        ],
        [
          'A cache helps repeated reads, not writes or one-off queries',
          'A full cache evicts least recently used entries',
        ],
        'A cache that is empty after a restart is called a cold cache — expect a burst of database reads until it warms up.',
        'The database is the truth; the cache is a shortcut to it.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('cache', 'cache', 'Cache', 280, 150, { status: 'healthy', sublabel: 'Full → evicts LRU' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'Source of truth' }),
          ],
          edges: [
            edge('server', 'cache', 'Read or evict'),
            edge('server', 'db', 'Writes go here'),
          ],
          activeNodeIds: ['cache', 'db'],
          activeEdgeIds: ['server->cache', 'server->db'],
          caption: 'The cache speeds up repeated reads while writes still go to the database.',
        },
      ),
    ],
    summary:
      'A cache keeps copies of recent answers in fast memory so repeated reads never reach the database: a hit takes about 2 ms instead of 40. On a miss, cache-aside reads the database once and fills the cache for the next request. Every entry needs a TTL, which caps how stale an answer can be, and caches stack in layers — browser, CDN, application, database — each faster than the one behind it. The database stays the source of truth. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['caching-patterns'],
  },
  l15: {
    id: 'l15',
    chapterId: 'data-storage',
    number: 15,
    title: 'Cache Invalidation',
    durationMin: 12,
    difficulty: 'Intermediate',
    intro:
      'Naming things is hard; invalidating caches is harder.',
    objectives: [
      'Explain why a cached copy goes stale after a write',
      'Describe TTL expiry and its staleness window',
      'Compare write-through and write-invalidate strategies',
      'Use versioned keys to retire old cached data safely',
      'Choose an invalidation strategy from a freshness requirement',
    ],
    steps: [
      step(
        's1',
        'The price changes, the cache does not know',
        'A product costs 49, and the cache holds that answer for thousands of readers. Then the price changes to 59 in the database — but the cache still serves 49, because nobody told it. Every reader sees the old price until the entry expires or is removed. This is the invalidation problem in one sentence: the cache is a copy, and copies do not update themselves.',
        [
          metric('Old cached price', '49'),
          metric('New database price', '59'),
          metric('Readers seeing old price', '1,000', 'per min'),
        ],
        [
          'The price changes in the database to 59',
          'The cache keeps serving 49 until it is told otherwise',
        ],
        'Stale reads are not a bug in the cache — they are the price of keeping a copy at all.',
        'A cache never learns about a write on its own.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'Writes price 59' }),
            node('db', 'db', 'Database', 280, 60, { status: 'healthy', sublabel: 'Price is 59' }),
            node('cache', 'cache', 'Cache', 280, 240, { status: 'degraded', sublabel: 'Still serves 49' }),
          ],
          edges: [
            edge('server', 'db', 'UPDATE price = 59'),
          ],
          activeNodeIds: ['cache'],
          activeEdgeIds: ['server->db'],
          caption: 'The database price changes to 59 while the cache still serves 49.',
        },
      ),
      step(
        's2',
        'TTL: let it expire and accept the window',
        'The simplest fix is a TTL: the entry expires after 5 minutes, and the next request refills it with the new price. The cost is a staleness window — for up to five minutes, readers see the old price — and a small burst of database reads when popular entries expire together. For a product price, five minutes of staleness is usually acceptable. For a bank balance, it is not.',
        [
          metric('TTL', '5', 'min'),
          metric('Staleness window', '≤5', 'min'),
          metric('Refill after expiry', '1', 'database read'),
        ],
        [
          'A 5-minute TTL bounds staleness to five minutes',
          'The next request after expiry refills with the new price',
        ],
        'Shortening the TTL shrinks the window but sends more traffic to the database — freshness and load trade directly.',
        'TTL trades a known staleness window for simplicity.',
        {
          nodes: [
            node('cache', 'cache', 'Cache', 20, 150, { status: 'healthy', sublabel: 'Expires in 5 min' }),
            node('server', 'server', 'App Server', 280, 150, { status: 'healthy' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'Price 59' }),
          ],
          edges: [
            edge('cache', 'server', 'Entry expires'),
            edge('server', 'db', 'Refill → price 59'),
          ],
          activeNodeIds: ['cache', 'db'],
          activeEdgeIds: ['cache->server', 'server->db'],
          caption: 'The stale entry expires after five minutes and refills with the new price.',
        },
      ),
      step(
        's3',
        'Write-invalidate: delete on write',
        'When freshness matters, the application deletes the cached entry at the same time as it writes the database. The next read misses, refills from the database, and sees the new price immediately. The trade is a small risk: if the delete fails while the write succeeds, the stale entry survives until its TTL. So write-invalidate is usually paired with a TTL as a safety net, not used alone.',
        [
          metric('Staleness after write', '0', 'ms'),
          metric('Next read', 'Miss', 'then refill'),
          metric('Safety net', 'TTL'),
        ],
        [
          'The cached entry is deleted when the price is written',
          'The next read misses and refills with the new price',
        ],
        'Delete, do not update, the cached entry: the next read rebuilds it from the database, so a half-written value can never be served.',
        'Delete on write; let the next read rebuild.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'Write + delete' }),
            node('db', 'db', 'Database', 280, 60, { status: 'healthy', sublabel: 'Price 59' }),
            node('cache', 'cache', 'Cache', 280, 240, { status: 'healthy', sublabel: 'Entry deleted' }),
          ],
          edges: [
            edge('server', 'db', 'UPDATE price = 59'),
            edge('server', 'cache', 'DEL product:42'),
          ],
          activeNodeIds: ['db', 'cache'],
          activeEdgeIds: ['server->db', 'server->cache'],
          caption: 'The write updates the database and deletes the cached entry at the same time.',
        },
      ),
      step(
        's4',
        'Write-through: update the cache too',
        'Write-through takes the other path: the write updates the cache as well as the database, so the next read hits immediately with the new value. It keeps the cache warm and avoids the refill read, but every write now pays for a cache update, and a write to a key nobody will read again is wasted work. Write-through fits data that is read soon after it is written.',
        [
          metric('Next read', 'Hit', 'new value'),
          metric('Refill reads', '0'),
          metric('Write cost', 'DB + cache'),
        ],
        [
          'The write updates both the database and the cache',
          'The next read hits immediately with the new price',
        ],
        'If the cache is down during a write-through, the write must still succeed — the database is the truth, the cache is optional.',
        'Write-through keeps the cache warm at the cost of every write.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'Write-through' }),
            node('db', 'db', 'Database', 280, 60, { status: 'healthy', sublabel: 'Price 59' }),
            node('cache', 'cache', 'Cache', 280, 240, { status: 'healthy', sublabel: 'Price 59, ready' }),
          ],
          edges: [
            edge('server', 'db', 'UPDATE price = 59'),
            edge('server', 'cache', 'SET product:42 = 59'),
          ],
          activeNodeIds: ['db', 'cache'],
          activeEdgeIds: ['server->db', 'server->cache'],
          caption: 'A write-through updates the database and the cache together.',
        },
      ),
      step(
        's5',
        'Versioned keys and choosing a strategy',
        'A third trick avoids deleting anything: put a version in the key. Readers ask for product:42:v3, and a price change bumps the version to v4, so old entries simply stop being asked for and expire quietly. No delete can fail, and old and new versions can coexist during a rollout. The choice is a freshness decision: TTL alone for tolerant data, write-invalidate for data that must be fresh, write-through or versioned keys where reads follow writes closely.',
        [
          metric('Old key', 'product:42:v3'),
          metric('New key', 'product:42:v4'),
          metric('Deletes needed', '0'),
        ],
        [
          'A price change bumps the key version from v3 to v4',
          'Old entries expire quietly, never deleted',
        ],
        'Versioned keys are also how static assets are cache-busted: the filename changes, so no browser can serve the old file.',
        'Match the strategy to how fresh the data must be.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy', sublabel: 'Bumps version' }),
            node('cache', 'cache', 'Cache', 280, 60, { status: 'healthy', sublabel: 'v4 · current' }),
            node('cache-old', 'cache', 'Old Entry', 280, 240, { status: 'idle', sublabel: 'v3 · expires unused' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'Price 59' }),
          ],
          edges: [
            edge('server', 'cache', 'Reads v4'),
            edge('server', 'db', 'Source of truth'),
          ],
          activeNodeIds: ['cache'],
          activeEdgeIds: ['server->cache'],
          caption: 'Versioned keys retire the old entry without deleting it.',
        },
      ),
    ],
    summary:
      'A cache is a copy, and copies do not update themselves: after a price change, readers keep seeing the old value until the entry expires or is removed. A TTL bounds the staleness window but accepts it; write-invalidate deletes the entry on write so the next read refills fresh; write-through updates the cache with the write; versioned keys retire old entries by changing the key. Choose by how fresh the data must be, and keep a TTL as a safety net. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['caching-patterns'],
  },
};
