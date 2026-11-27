/*
 * Fully-written lessons — filled in by the curriculum completion work.
 * This file holds lessons l3 (Napkin Math), l4 (The Hockey Stick),
 * l6 (Load Balancing), l7 (Stateless vs Stateful Services) and
 * l8 (Auto Scaling). Each lesson follows the exact shape of the four
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

export const lessonsPartA: Record<string, Lesson> = {
  l3: {
    id: 'l3',
    chapterId: 'foundations',
    number: 3,
    title: 'Napkin Math',
    durationMin: 10,
    difficulty: 'Beginner',
    intro:
      'Back-of-the-envelope estimates: powers of ten, and sizing a system before building it.',
    objectives: [
      'Recall the powers of ten for data sizes and time that napkin math relies on',
      'Estimate requests per second from daily active users and usage per user',
      'Estimate storage growth from record size and records per day',
      'Estimate bandwidth from request size and traffic, including peaks',
      'Use the estimates to choose capacity before writing any code',
    ],
    formulas: [
      {
        name: 'Powers of ten',
        expression: '1 KB ≈ 10³ B, 1 MB ≈ 10⁶ B, 1 GB ≈ 10⁹ B, 1 TB ≈ 10¹² B',
        note: 'Napkin math rounds to the nearest power of ten. Being off by a factor of two or three is fine — the goal is the right order of magnitude, not the exact number.',
      },
      {
        name: 'Requests per second',
        expression: 'RPS = DAU × requests per user ÷ 86,400',
        note: 'With 1 million daily users making 10 requests each, that is 10 million requests a day ÷ 86,400 seconds ≈ 116 requests per second.',
      },
      {
        name: 'Storage per year',
        expression: 'Storage = records per day × bytes per record × 365',
        note: 'With 100,000 records a day at 1 KB each, one year of data is 100,000 × 1 KB × 365 ≈ 36.5 GB.',
      },
    ],
    steps: [
      step(
        's1',
        'Start with the powers of ten',
        'Napkin math starts with a small table you can hold in your head. A kilobyte is roughly a thousand bytes, a megabyte a million, a gigabyte a billion, and a terabyte a trillion. Time has its own powers of ten: a day holds about 86,400 seconds, which rounds to 10^5, and a year holds about 3 x 10^7 seconds. Rounding to the nearest power of ten keeps the arithmetic easy, and being off by a factor of two or three is fine — the goal is the right order of magnitude, not the exact number.',
        [
          metric('1 KB', '10³', 'bytes'),
          metric('1 MB', '10⁶', 'bytes'),
          metric('1 GB', '10⁹', 'bytes'),
          metric('1 day', '10⁵', 'seconds'),
        ],
        [
          'Data sizes and time rounded to powers of ten',
          'Estimates aim for the right order of magnitude, not exact numbers',
        ],
        'A year is about 3 x 10^7 seconds — that one number turns almost any per-day figure into a per-year figure.',
        'Round to the nearest power of ten and the arithmetic stays in your head.',
        {
          nodes: [
            node('kb', 'service', '1 KB', 20, 150, { status: 'healthy', sublabel: '10³ bytes' }),
            node('mb', 'service', '1 MB', 220, 150, { status: 'healthy', sublabel: '10⁶ bytes' }),
            node('gb', 'service', '1 GB', 420, 150, { status: 'healthy', sublabel: '10⁹ bytes' }),
          ],
          edges: [
            edge('kb', 'mb', '× 1,000'),
            edge('mb', 'gb', '× 1,000'),
          ],
          activeNodeIds: ['kb', 'mb', 'gb'],
          activeEdgeIds: ['kb->mb', 'mb->gb'],
          caption: 'Each step up the scale multiplies the size by roughly a thousand.',
        },
      ),
      step(
        's2',
        'How many requests per second?',
        'Start with people. Suppose a product has 1 million daily active users, and each one makes about 10 requests a day — loading a feed, opening a profile, sending a message. That is 10 million requests a day. A day has 86,400 seconds, so dividing gives about 116 requests per second on average. That single number, requests per second, is the load your servers must carry, and almost every other estimate in this lesson starts from it.',
        [
          metric('Daily users', '1', 'million'),
          metric('Requests per day', '10', 'million'),
          metric('Requests per second', '~116', 'req/s'),
        ],
        [
          'Daily users and usage per user turned into 10 million requests a day',
          'Dividing by 86,400 seconds gives about 116 requests per second',
        ],
        'Requests per second is the load your servers must carry — almost every other estimate starts from it.',
        'People times usage per person, divided by the seconds in a day, is your load.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1M daily' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy', sublabel: '10M req/day' }),
            node('db', 'db', 'Database', 420, 150, { status: 'healthy', sublabel: '~116 req/s' }),
          ],
          edges: [
            edge('user', 'server', '10 req each'),
            edge('server', 'db', '~116 req/s'),
          ],
          activeNodeIds: ['user', 'server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'One million daily users making ten requests each means about 116 requests per second.',
        },
      ),
      step(
        's3',
        'How much storage?',
        'Storage is the same trick with different numbers. Suppose the product stores 100,000 new records a day and each record is about 1 KB — a short post with a little metadata. That is 100 MB of new data every day. Multiply by 365 days and one year of data is about 36.5 GB. Five years is about 180 GB. A single modern disk holds far more than that, so this product does not need a sharded database — it needs one disk and a backup.',
        [
          metric('New records', '100,000', 'per day'),
          metric('New data', '100', 'MB/day'),
          metric('Storage per year', '36.5', 'GB'),
        ],
        [
          '100,000 records a day at 1 KB each is 100 MB of new data a day',
          'One year of data is about 36.5 GB; five years is about 180 GB',
        ],
        'A single modern disk holds far more than 180 GB — this product needs one disk and a backup, not a sharded database.',
        'Records per day times bytes per record times 365 is your yearly storage.',
        {
          nodes: [
            node('client', 'client', 'App', 20, 150, { status: 'healthy', sublabel: '100k records/day' }),
            node('db', 'db', 'Database', 220, 150, { status: 'healthy', sublabel: '+100 MB/day' }),
            node('backup', 'service', 'Backup', 420, 150, { status: 'healthy', sublabel: '36.5 GB/year' }),
          ],
          edges: [
            edge('client', 'db', 'New records'),
            edge('db', 'backup', 'Copied nightly', 'async'),
          ],
          activeNodeIds: ['client', 'db', 'backup'],
          activeEdgeIds: ['client->db', 'db->backup'],
          caption: 'One hundred thousand records a day at one kilobyte each adds about 36.5 gigabytes a year.',
        },
      ),
      step(
        's4',
        'How much bandwidth?',
        'Bandwidth asks how much data flows, not how much is stored. At 116 requests per second, if each response is about 50 KB, the server sends about 5.8 MB every second — roughly 46 megabits per second. But averages hide peaks: evening traffic can run three times the average, so plan for about 140 megabits per second. If the link you buy is only 100 megabits, the estimate has just told you it is too small, before a single user complained.',
        [
          metric('Response size', '50', 'KB'),
          metric('Average bandwidth', '46', 'Mbps'),
          metric('Peak bandwidth', '~140', 'Mbps', 'warn'),
        ],
        [
          '116 requests per second at 50 KB each is about 46 megabits per second',
          'Peak traffic at 3x the average needs about 140 megabits per second',
        ],
        'Averages hide peaks: evening traffic can run three times the average, so always size the link for the peak, not the average.',
        'Size the link for the peak, not the average — averages hide the rush hour.',
        {
          nodes: [
            node('server', 'server', 'Server', 20, 150, { status: 'healthy', sublabel: '116 req/s' }),
            node('link', 'service', 'Network Link', 220, 150, { status: 'healthy', sublabel: '46 Mbps avg' }),
            node('user', 'user', 'Users', 420, 150, { status: 'healthy', sublabel: 'Peak ~140 Mbps' }),
          ],
          edges: [
            edge('server', 'link', '5.8 MB/s'),
            edge('link', 'user', '50 KB each'),
          ],
          activeNodeIds: ['server', 'link', 'user'],
          activeEdgeIds: ['server->link', 'link->user'],
          caption: 'At 116 requests per second the server sends about 46 megabits per second on average, 140 at peak.',
        },
      ),
      step(
        's5',
        'From estimate to decision',
        'Now put the three numbers together and decide. About 116 requests per second is easy work for one server. About 36 GB of new data a year fits on one disk with room to spare. About 140 megabits per second at peak fits on one ordinary network link. So the honest design is one server, one database, and a backup — and a note to revisit the numbers when daily users grow tenfold. Napkin math does not give you the architecture; it tells you which architecture is overkill.',
        [
          metric('Servers needed', '1'),
          metric('Storage per year', '36.5', 'GB'),
          metric('Peak bandwidth', '~140', 'Mbps'),
          metric('Revisit when', '10×', 'users'),
        ],
        [
          'All three estimates point to one server, one database, and a backup',
          'The numbers say to revisit the design when daily users grow tenfold',
        ],
        'Napkin math does not give you the architecture; it tells you which architecture is overkill.',
        'One server, one database, one backup — until the numbers say otherwise.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '1M daily' }),
            node('server', 'server', '1 Server', 220, 150, { status: 'healthy', sublabel: '116 req/s' }),
            node('db', 'db', '1 Database', 420, 150, { status: 'healthy', sublabel: '36 GB/year' }),
          ],
          edges: [
            edge('user', 'server', '116 req/s'),
            edge('server', 'db', 'Stores 100 MB/day'),
          ],
          activeNodeIds: ['user', 'server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'The estimates point to one server, one database, and a backup.',
        },
      ),
    ],
    summary:
      'Napkin math turns a product idea into three numbers before any code is written: requests per second from daily users and usage per user, storage per year from records per day and record size, and bandwidth from response size and traffic — sized for the peak, not the average. With 1 million daily users the worked example lands at about 116 requests per second, 36.5 GB of new data a year, and 140 megabits per second at peak, which one server, one database, and a backup can handle comfortably. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals'],
  },
  l4: {
    id: 'l4',
    chapterId: 'scaling',
    number: 4,
    title: 'The Hockey Stick',
    durationMin: 9,
    difficulty: 'Beginner',
    intro:
      'Traffic does not grow in a straight line. Plan for the bend.',
    objectives: [
      'Explain why percentage growth compounds instead of adding up',
      'Use the rule of 70 to estimate when traffic will double',
      'Read a growth curve and spot the bend before it arrives',
      'Estimate when traffic will cross one server’s capacity',
      'Plan headroom so a doubling never becomes an emergency',
    ],
    formulas: [
      {
        name: 'Rule of 70',
        expression: 'Doubling time ≈ 70 ÷ growth rate (%)',
        note: 'At 10% growth a month, traffic doubles in about 70 ÷ 10 = 7 months.',
      },
    ],
    steps: [
      step(
        's1',
        'Linear growth feels safe',
        'A product grows by about 10% a month. It starts at 100 requests per second, then 110, then 121. Each month adds a little more than the last, but the numbers feel small and manageable. The team checks the dashboard, sees a gentle slope, and relaxes. Nothing in the first few months looks alarming, and that is exactly the trap: steady percentage growth is not steady growth at all — it compounds, and compounding has a bend in it.',
        [
          metric('Month 1', '100', 'req/s'),
          metric('Month 2', '110', 'req/s'),
          metric('Month 3', '121', 'req/s'),
          metric('Growth', '10', '%/month'),
        ],
        [
          'Traffic grows 10% a month: 100, then 110, then 121 requests per second',
          'The early numbers look small and the slope looks gentle',
        ],
        'Steady percentage growth is not steady growth — it compounds, and compounding has a bend in it.',
        'Early growth always looks harmless; the bend is already in the numbers.',
        {
          nodes: [
            node('m1', 'service', 'Month 1', 20, 150, { status: 'healthy', sublabel: '100 req/s' }),
            node('m2', 'service', 'Month 2', 220, 150, { status: 'healthy', sublabel: '110 req/s' }),
            node('m3', 'service', 'Month 3', 420, 150, { status: 'healthy', sublabel: '121 req/s' }),
          ],
          edges: [
            edge('m1', 'm2', '+10%'),
            edge('m2', 'm3', '+10%'),
          ],
          activeNodeIds: ['m1', 'm2', 'm3'],
          activeEdgeIds: ['m1->m2', 'm2->m3'],
          caption: 'At ten percent a month, traffic rises from 100 to 110 to 121 requests per second.',
        },
      ),
      step(
        's2',
        'The bend: doubling compounds',
        'Keep the same 10% a month and watch a year pass. After 12 months the load is not 220 requests per second — it is about 314, more than triple where it started. After two years it is close to 1,000. The curve that looked like a gentle slope is a hockey stick: flat for a long time, then suddenly steep. The rule of 70 says the doubling time is about 70 divided by the monthly growth rate, so 10% a month doubles traffic roughly every 7 months.',
        [
          metric('Month 0', '100', 'req/s'),
          metric('Month 12', '~314', 'req/s'),
          metric('Month 24', '~1,000', 'req/s', 'warn'),
          metric('Doubling time', '~7', 'months'),
        ],
        [
          'After 12 months traffic is about 314 requests per second, not 220',
          'After two years it is close to 1,000 — the gentle slope was a hockey stick',
        ],
        'The rule of 70 says the doubling time is about 70 divided by the monthly growth rate: 10% a month doubles traffic roughly every 7 months.',
        'Compounding turns a gentle slope into a hockey stick.',
        {
          nodes: [
            node('m0', 'service', 'Month 0', 20, 150, { status: 'healthy', sublabel: '100 req/s' }),
            node('m7', 'service', 'Month 7', 220, 150, { status: 'healthy', sublabel: '~200 req/s' }),
            node('m14', 'service', 'Month 14', 420, 150, { status: 'busy', sublabel: '~400 req/s' }),
          ],
          edges: [
            edge('m0', 'm7', 'Doubles in ~7 mo'),
            edge('m7', 'm14', 'Doubles again'),
          ],
          activeNodeIds: ['m0', 'm7', 'm14'],
          activeEdgeIds: ['m0->m7', 'm7->m14'],
          caption: 'At ten percent a month traffic doubles roughly every seven months.',
        },
      ),
      step(
        's3',
        'Capacity is a flat line',
        'Meanwhile the server has not changed. One server tops out at about 250 requests per second, and that ceiling is a flat line while traffic curves upward. The two lines cross in about month 10, when traffic passes 250. Before the crossing, everything works; after it, requests queue and latency climbs. The crossing is predictable months in advance — it is written in the growth rate — but only if someone draws both lines on the same chart.',
        [
          metric('Server capacity', '250', 'req/s'),
          metric('Traffic at month 10', '~259', 'req/s', 'warn'),
          metric('Crossing', 'Month ~10'),
        ],
        [
          'One server tops out at about 250 requests per second',
          'Traffic crosses that ceiling in about month 10',
        ],
        'The crossing is predictable months in advance — it is written in the growth rate — but only if someone draws both lines on the same chart.',
        'Capacity is a flat line; traffic is a curve. They will meet.',
        {
          nodes: [
            node('user', 'user', 'Traffic', 20, 150, { status: 'healthy', sublabel: 'Growing' }),
            node('server', 'server', 'Server', 220, 150, { status: 'busy', sublabel: 'Cap 250 req/s' }),
            node('queue', 'queue', 'Queue', 420, 150, { status: 'degraded', sublabel: 'Forms at month 10' }),
          ],
          edges: [
            edge('user', 'server', 'Passes 250 req/s'),
            edge('server', 'queue', 'Requests wait'),
          ],
          activeNodeIds: ['user', 'server', 'queue'],
          activeEdgeIds: ['user->server', 'server->queue'],
          caption: 'Traffic crosses the server’s 250 requests-per-second ceiling in about month ten.',
        },
      ),
      step(
        's4',
        'What breaks first',
        'When the lines cross, the first thing users notice is slowness, not an outage. Requests wait in a queue, latency climbs from 100 ms toward a second, and then requests start timing out. The database is often the first thing to break, because it sits behind every request and cannot be copied as easily as a stateless server. The failure looks sudden — a bad week, a launch, a mention somewhere — but the arithmetic had been pointing at it for months.',
        [
          metric('Latency before', '100', 'ms'),
          metric('Latency after', '~1,000', 'ms', 'bad'),
          metric('Server CPU', '100', '%', 'bad'),
        ],
        [
          'Latency climbs from 100 ms toward a second as the queue grows',
          'The database is often the first thing to break, sitting behind every request',
        ],
        'The failure looks sudden — a bad week, a launch, a mention somewhere — but the arithmetic had been pointing at it for months.',
        'The first symptom is slowness, not an outage.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Spike' }),
            node('server', 'server', 'Server', 220, 150, { status: 'busy', sublabel: '100% CPU' }),
            node('db', 'db', 'Database', 420, 150, { status: 'degraded', sublabel: 'Slowest link' }),
          ],
          edges: [
            edge('user', 'server', 'Too much traffic'),
            edge('server', 'db', 'Queries pile up'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'Past capacity the server saturates and the database becomes the slowest link.',
        },
      ),
      step(
        's5',
        'Plan for the bend',
        'The fix is planning, not panic. Keep at least twice the headroom you need today, so a doubling does not become an emergency. Watch the weekly growth rate, not just the current load, and recompute the crossing date every month. And have the next step ready before you need it — usually a load balancer and a second server — because adding capacity during an outage is the worst time to learn how. Traffic bends; your plan should bend first.',
        [
          metric('Headroom target', '2×', 'current load'),
          metric('Growth review', 'Weekly'),
          metric('Crossing review', 'Monthly'),
        ],
        [
          'Headroom target set at twice the current load',
          'Growth rate reviewed weekly and the crossing date recomputed monthly',
        ],
        'Adding capacity during an outage is the worst time to learn how — have the load balancer and second server ready before you need them.',
        'Traffic bends; your plan should bend first.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '2× headroom' }),
            node('lb', 'lb', 'Load Balancer', 220, 150, { status: 'healthy', sublabel: 'Plan ready' }),
            node('server', 'server', 'Servers', 420, 150, { status: 'healthy', sublabel: 'Scale before crossing' }),
          ],
          edges: [
            edge('user', 'lb', 'Growing traffic'),
            edge('lb', 'server', 'Add a server early'),
          ],
          activeNodeIds: ['user', 'lb', 'server'],
          activeEdgeIds: ['user->lb', 'lb->server'],
          caption: 'Keep twice the headroom you need and have the next server ready before the crossing.',
        },
      ),
    ],
    summary:
      'Traffic that grows by a fixed percentage each month compounds: at 10% a month it goes from 100 requests per second to about 314 in a year and close to 1,000 in two, doubling roughly every 7 months by the rule of 70. A single server’s capacity is a flat line — about 250 requests per second here — so the two lines cross in about month 10, and past that point latency climbs toward a second and requests time out. The defence is headroom of at least twice the current load, a weekly watch on the growth rate, and the next scaling step ready before the crossing arrives. ' +
      ILLUSTRATIVE,
  },
  l6: {
    id: 'l6',
    chapterId: 'scaling',
    number: 6,
    title: 'Load Balancing',
    durationMin: 13,
    difficulty: 'Intermediate',
    intro:
      'Round robin, least connections, IP hash — spreading work fairly.',
    objectives: [
      'Explain what a load balancer does and where it sits',
      'Compare round robin, least connections, and IP hash',
      'Explain health checks and why dead servers get no traffic',
      'Describe weighted distribution for servers of different sizes',
      'Choose an algorithm for a given workload',
      'Name the load balancer’s own failure modes',
    ],
    formulas: [
      {
        name: 'Round-robin share',
        expression: 'RPS per server = total RPS ÷ server count',
        note: '300 requests per second across 3 servers is 100 each; with weights of 2:1, the split becomes 200 and 100.',
      },
    ],
    steps: [
      step(
        's1',
        'One front door for many servers',
        'A load balancer is a single front door for a group of servers. Users talk to the load balancer, and it forwards each request to one of the servers behind it — Server A, B, or C — then returns the answer. The user never knows which server answered, and the servers never talk to users directly. With three servers sharing 300 requests per second, each one handles about 100, and no single server carries the whole product.',
        [
          metric('Servers', '3'),
          metric('Total load', '300', 'req/s'),
          metric('Load per server', '100', 'req/s'),
        ],
        [
          'A load balancer sits in front of three servers',
          '300 requests per second split three ways, about 100 each',
        ],
        'The user never knows which server answered, and the servers never talk to users directly.',
        'One front door, many servers behind it.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '300 req/s' }),
            node('lb', 'lb', 'Load Balancer', 180, 150, { status: 'healthy', sublabel: 'Forwards requests' }),
            node('server-a', 'server', 'Server A', 380, 20, { status: 'healthy', sublabel: '100 req/s' }),
            node('server-b', 'server', 'Server B', 380, 150, { status: 'healthy', sublabel: '100 req/s' }),
            node('server-c', 'server', 'Server C', 380, 280, { status: 'healthy', sublabel: '100 req/s' }),
          ],
          edges: [
            edge('user', 'lb', '300 req/s'),
            edge('lb', 'server-a', '100 req/s'),
            edge('lb', 'server-b', '100 req/s'),
            edge('lb', 'server-c', '100 req/s'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b', 'server-c'],
          activeEdgeIds: ['user->lb', 'lb->server-a', 'lb->server-b', 'lb->server-c'],
          caption: 'A load balancer forwards 300 requests per second across three servers.',
        },
      ),
      step(
        's2',
        'Round robin: take turns',
        'Round robin is the simplest algorithm: the load balancer hands requests out in turn — first to A, then B, then C, then back to A. It needs no information about the servers and costs almost nothing to run. It works well when the servers are identical and every request costs about the same. It fails quietly when they are not: a slow request on Server A does not stop the balancer from sending it the next request in turn.',
        [
          metric('Algorithm', 'Round robin'),
          metric('State kept', 'None'),
          metric('Best when', 'Equal servers, equal requests'),
        ],
        [
          'Requests handed out in turn: A, then B, then C, then back to A',
          'No information about the servers is needed',
        ],
        'Round robin fails quietly when requests are uneven: a slow request on Server A does not stop the balancer from sending it the next request in turn.',
        'Take turns — simple and fair when every server and request is alike.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Requests' }),
            node('lb', 'lb', 'Load Balancer', 220, 150, { status: 'healthy', sublabel: 'Round robin' }),
            node('server-a', 'server', 'Server A', 420, 20, { status: 'healthy', sublabel: 'Req 1, 4' }),
            node('server-b', 'server', 'Server B', 420, 150, { status: 'healthy', sublabel: 'Req 2, 5' }),
            node('server-c', 'server', 'Server C', 420, 280, { status: 'healthy', sublabel: 'Req 3, 6' }),
          ],
          edges: [
            edge('user', 'lb', 'Requests in order'),
            edge('lb', 'server-a', 'Req 1, 4'),
            edge('lb', 'server-b', 'Req 2, 5'),
            edge('lb', 'server-c', 'Req 3, 6'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b', 'server-c'],
          activeEdgeIds: ['lb->server-a', 'lb->server-b', 'lb->server-c'],
          caption: 'Round robin hands requests out in turn: A, then B, then C, then back to A.',
        },
      ),
      step(
        's3',
        'Least connections: send to the freest',
        'Least connections asks a smarter question: which server is least busy right now? The balancer tracks how many requests each server is still working on and sends the next request to the one with the fewest. When requests vary — a quick profile lookup versus a slow report — this keeps the fast servers from idling while a slow server drowns. It costs a little bookkeeping, and it is the default choice for most real systems.',
        [
          metric('Algorithm', 'Least connections'),
          metric('Server A active', '8', 'requests'),
          metric('Server B active', '2', 'requests'),
          metric('Next request goes to', 'Server B'),
        ],
        [
          'The balancer tracks how many requests each server is still working on',
          'The next request goes to the server with the fewest active connections',
        ],
        'Least connections is the default choice for most real systems, because real requests vary in cost.',
        'Send each request to the server with the least work in progress.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Next request' }),
            node('lb', 'lb', 'Load Balancer', 220, 150, { status: 'healthy', sublabel: 'Least connections' }),
            node('server-a', 'server', 'Server A', 420, 60, { status: 'busy', sublabel: '8 active' }),
            node('server-b', 'server', 'Server B', 420, 240, { status: 'healthy', sublabel: '2 active' }),
          ],
          edges: [
            edge('user', 'lb', 'New request'),
            edge('lb', 'server-a', 'Busy — skipped'),
            edge('lb', 'server-b', 'Freest — chosen'),
          ],
          activeNodeIds: ['lb', 'server-b'],
          activeEdgeIds: ['lb->server-b'],
          caption: 'Least connections sends the next request to the server with the fewest active requests.',
        },
      ),
      step(
        's4',
        'IP hash: same client, same server',
        'IP hash turns the client’s address into a number and uses it to pick a server, so the same client always lands on the same server. That matters when a server keeps something per client in memory — a shopping cart, a session — and the request must return to where it lives. The price is uneven splits: a few very busy clients can overload one server while others idle, and adding a server reshuffles who goes where.',
        [
          metric('Algorithm', 'IP hash'),
          metric('Client A goes to', 'Server A'),
          metric('Client B goes to', 'Server B'),
          metric('Risk', 'Uneven split'),
        ],
        [
          'The client’s address is hashed to pick a server',
          'The same client always lands on the same server',
        ],
        'Adding a server reshuffles who goes where, and a few very busy clients can overload one server while others idle.',
        'Hash the client’s address when a request must return to the same server.',
        {
          nodes: [
            node('user-a', 'user', 'Client A', 20, 60, { status: 'healthy', sublabel: 'IP 203.0.113.5' }),
            node('user-b', 'user', 'Client B', 20, 240, { status: 'healthy', sublabel: 'IP 198.51.100.9' }),
            node('lb', 'lb', 'Load Balancer', 220, 150, { status: 'healthy', sublabel: 'Hash of IP' }),
            node('server-a', 'server', 'Server A', 420, 60, { status: 'healthy', sublabel: 'Always Client A' }),
            node('server-b', 'server', 'Server B', 420, 240, { status: 'healthy', sublabel: 'Always Client B' }),
          ],
          edges: [
            edge('user-a', 'lb', 'Request'),
            edge('user-b', 'lb', 'Request'),
            edge('lb', 'server-a', 'Hash → A'),
            edge('lb', 'server-b', 'Hash → B'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b'],
          activeEdgeIds: ['user-a->lb', 'user-b->lb', 'lb->server-a', 'lb->server-b'],
          caption: 'IP hash sends each client to the same server every time.',
        },
      ),
      step(
        's5',
        'Health checks: stop feeding dead servers',
        'A load balancer also watches its servers. Every few seconds it sends a small health check — usually a request to a simple endpoint — and any server that stops answering is taken out of rotation within seconds. Traffic shifts to the survivors before users notice. When the server recovers and passes its checks again, it rejoins. Without health checks, a balancer would keep sending requests to a dead server exactly as fairly as to a live one.',
        [
          metric('Check interval', '5', 's'),
          metric('Server B status', 'Failed', undefined, 'bad'),
          metric('Traffic shift', 'Automatic'),
        ],
        [
          'The balancer sends a health check every few seconds',
          'Server B stops answering and is taken out of rotation',
        ],
        'When the server recovers and passes its checks again, it rejoins the rotation automatically.',
        'A balancer that cannot tell dead from live will feed the dead one fairly.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '300 req/s' }),
            node('lb', 'lb', 'Load Balancer', 220, 150, { status: 'healthy', sublabel: 'Health checks' }),
            node('server-a', 'server', 'Server A', 420, 60, { status: 'healthy', sublabel: 'Passing checks' }),
            node('server-b', 'server', 'Server B', 420, 240, { status: 'failed', sublabel: 'No answer' }),
          ],
          edges: [
            edge('user', 'lb', '300 req/s'),
            edge('lb', 'server-a', 'Gets all traffic'),
            edge('lb', 'server-b', 'Removed from rotation'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b'],
          activeEdgeIds: ['lb->server-a'],
          caption: 'Server B fails its health checks and the balancer stops sending it traffic.',
        },
      ),
      step(
        's6',
        'Weighted shares and the balancer itself',
        'Not all servers are equal: a new machine may be twice as fast as an old one, so weighted round robin gives it twice the share — two requests for every one the old server gets. And one question remains: what if the load balancer itself fails? The answer is a second balancer standing by, so the front door never becomes the single point of failure it was built to remove.',
        [
          metric('Server A weight', '2×'),
          metric('Server B weight', '1×'),
          metric('Server A share', '200', 'req/s'),
          metric('Server B share', '100', 'req/s'),
        ],
        [
          'Weighted round robin gives the faster server twice the share',
          'A second load balancer stands by so the front door is not a single point of failure',
        ],
        'The load balancer is the new front door: it needs its own redundancy, or it becomes the single point of failure it was meant to remove.',
        'Weight the fast servers more — and never leave the front door unguarded.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '300 req/s' }),
            node('lb', 'lb', 'Load Balancer 1', 220, 60, { status: 'healthy', sublabel: 'Active' }),
            node('lb2', 'lb', 'Load Balancer 2', 220, 240, { status: 'idle', sublabel: 'Standby' }),
            node('server-a', 'server', 'Server A', 420, 60, { status: 'healthy', sublabel: '200 req/s · 2×' }),
            node('server-b', 'server', 'Server B', 420, 240, { status: 'healthy', sublabel: '100 req/s · 1×' }),
          ],
          edges: [
            edge('user', 'lb', '300 req/s'),
            edge('lb', 'server-a', '200 req/s'),
            edge('lb', 'server-b', '100 req/s'),
          ],
          activeNodeIds: ['lb', 'lb2', 'server-a', 'server-b'],
          activeEdgeIds: ['user->lb', 'lb->server-a', 'lb->server-b'],
          caption: 'The faster server gets twice the share, and a second load balancer stands by.',
        },
      ),
    ],
    summary:
      'A load balancer is the single front door for a pool of servers, and the algorithm decides who gets each request: round robin takes turns and suits identical servers with similar requests, least connections sends work to the freest server and suits requests that vary in cost, and IP hash pins each client to one server when per-client state lives in server memory. Health checks pull dead servers out of rotation within seconds, weighted shares match uneven hardware, and a standby balancer keeps the front door itself from becoming a single point of failure. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals', 'reliability-patterns'],
  },
  l7: {
    id: 'l7',
    chapterId: 'scaling',
    number: 7,
    title: 'Stateless vs Stateful Services',
    durationMin: 10,
    difficulty: 'Intermediate',
    intro:
      'Why stateless services scale and where state has to live instead.',
    objectives: [
      'Define stateless and stateful services in plain terms',
      'Explain why any request can go to any stateless server',
      'Describe where state lives instead: cache, database, object storage',
      'Explain sticky sessions and why they are only a workaround',
      'Decide what belongs in a service and what belongs in shared storage',
    ],
    steps: [
      step(
        's1',
        'A server with a memory',
        'A stateful server remembers things between requests: a login session stored in its memory, a half-filled form, a shopping cart. That memory is convenient until the load balancer sends the user’s next request to a different server, which knows nothing about them. The user is suddenly logged out, or their cart is empty. The state lived on one machine, and the request went to another — that mismatch is the whole problem stateful services create.',
        [
          metric('Session stored on', 'Server A'),
          metric('Next request goes to', 'Server B'),
          metric('Result', 'Logged out', undefined, 'bad'),
        ],
        [
          'A login session lives in Server A’s memory',
          'The next request lands on Server B, which knows nothing about the user',
        ],
        'State that lives on one machine breaks the moment the load balancer sends a request somewhere else.',
        'State on one machine only works while every request returns to that machine.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Logged in' }),
            node('lb', 'lb', 'Load Balancer', 220, 150, { status: 'healthy', sublabel: 'Next request' }),
            node('server-a', 'server', 'Server A', 420, 60, { status: 'healthy', sublabel: 'Has the session' }),
            node('server-b', 'server', 'Server B', 420, 240, { status: 'healthy', sublabel: 'Knows nothing' }),
          ],
          edges: [
            edge('user', 'lb', 'First request'),
            edge('lb', 'server-a', 'Session created here'),
            edge('lb', 'server-b', 'Second request lands here'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b'],
          activeEdgeIds: ['lb->server-a', 'lb->server-b'],
          caption: 'The session lives on Server A, but the next request lands on Server B.',
        },
      ),
      step(
        's2',
        'Stateless: every request carries what it needs',
        'A stateless server remembers nothing between requests. Instead, every request carries what the server needs to answer it — usually a signed token in the header that says who the user is. Any server can handle any request, because no server holds anything the others lack. That is what makes stateless services easy to scale: add a server, and it is useful the moment it starts.',
        [
          metric('State kept on server', 'None'),
          metric('Identity travels as', 'Signed token'),
          metric('Any server can answer', 'Yes'),
        ],
        [
          'Servers stop remembering anything between requests',
          'Each request carries a signed token that says who the user is',
        ],
        'A signed token is checked, not trusted blindly: the server verifies the signature before acting on what the token claims.',
        'If every request carries what it needs, any server can answer it.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Sends token' }),
            node('server-a', 'server', 'Server A', 220, 60, { status: 'healthy', sublabel: 'Can answer' }),
            node('server-b', 'server', 'Server B', 220, 240, { status: 'healthy', sublabel: 'Can answer' }),
            node('db', 'db', 'Database', 420, 150, { status: 'healthy', sublabel: 'Shared truth' }),
          ],
          edges: [
            edge('user', 'server-a', 'Token in header'),
            edge('user', 'server-b', 'Token in header'),
            edge('server-a', 'db', 'Reads shared data'),
          ],
          activeNodeIds: ['user', 'server-a', 'server-b'],
          activeEdgeIds: ['user->server-a', 'user->server-b'],
          caption: 'With a token in every request, either server can answer the user.',
        },
      ),
      step(
        's3',
        'Where the state lives instead',
        'Stateless does not mean the system has no state — it means the state lives somewhere shared. Login sessions go in a cache or a database, uploaded files go in object storage, background work goes in a queue. The servers stay interchangeable, and the shared stores are built to be fast, durable, and reachable from every server. Moving state out of the server is the price of scaling; the shared stores are where that price is paid.',
        [
          metric('Sessions live in', 'Cache / database'),
          metric('Files live in', 'Object storage'),
          metric('Work lives in', 'Queue'),
        ],
        [
          'Sessions move to a shared cache or database',
          'Files move to object storage and background work to a queue',
        ],
        'The shared stores are built to be fast, durable, and reachable from every server — that is their whole job.',
        'Stateless servers still need state — it just lives in shared stores, not in server memory.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Any request' }),
            node('server', 'server', 'Server', 220, 150, { status: 'healthy', sublabel: 'Stateless' }),
            node('cache', 'cache', 'Session Cache', 420, 60, { status: 'healthy', sublabel: 'Sessions' }),
            node('db', 'db', 'Database', 420, 240, { status: 'healthy', sublabel: 'User data' }),
          ],
          edges: [
            edge('user', 'server', 'Request'),
            edge('server', 'cache', 'Reads session'),
            edge('server', 'db', 'Reads user data'),
          ],
          activeNodeIds: ['server', 'cache', 'db'],
          activeEdgeIds: ['server->cache', 'server->db'],
          caption: 'The stateless server reads sessions from a cache and user data from a database.',
        },
      ),
      step(
        's4',
        'Sticky sessions: the halfway fix',
        'There is a halfway fix called sticky sessions: the load balancer pins each client to one server, so the stateful server keeps seeing the same users. It works, until it does not. If that server fails, every pinned user loses their session at once. And traffic stops spreading evenly, because a few busy clients can pin a whole server down. Sticky sessions buy time while you move state out — they are not a design to keep.',
        [
          metric('Fix', 'Sticky sessions'),
          metric('Server A load', 'High', undefined, 'warn'),
          metric('Server B load', 'Low'),
          metric('If Server A fails', 'All pinned sessions lost', undefined, 'bad'),
        ],
        [
          'The load balancer pins each client to one server',
          'Traffic stops spreading evenly and a failed server takes every pinned session with it',
        ],
        'Sticky sessions buy time while you move state out — they are not a design to keep.',
        'Pinning users to servers trades away the very benefit load balancing exists for.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Pinned to A' }),
            node('lb', 'lb', 'Load Balancer', 220, 150, { status: 'healthy', sublabel: 'Sticky' }),
            node('server-a', 'server', 'Server A', 420, 60, { status: 'busy', sublabel: 'Pinned users' }),
            node('server-b', 'server', 'Server B', 420, 240, { status: 'idle', sublabel: 'Almost no traffic' }),
          ],
          edges: [
            edge('user', 'lb', 'Requests'),
            edge('lb', 'server-a', 'All pinned here'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b'],
          activeEdgeIds: ['lb->server-a'],
          caption: 'Sticky sessions pin every user to Server A while Server B sits idle.',
        },
      ),
      step(
        's5',
        'The payoff: scale and survive',
        'Once services are stateless, two things become easy. Scaling is just adding servers: a new machine joins the pool and starts answering requests with no warm-up and no data to copy. Surviving failure is just as easy: if a server dies, the load balancer stops sending it traffic and nobody notices, because no user data died with it. Statelessness is not a rule for its own sake — it is what lets a system grow and heal without asking users to wait.',
        [
          metric('New server useful', 'Immediately'),
          metric('Server failure impact', 'None', undefined, 'good'),
          metric('User data lost', 'None', undefined, 'good'),
        ],
        [
          'New servers join the pool useful immediately, with no data to copy',
          'A dead server takes no user data with it',
        ],
        'Statelessness is not a rule for its own sake — it is what lets a system grow and heal without asking users to wait.',
        'Stateless services grow by adding machines and heal by ignoring dead ones.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '300 req/s' }),
            node('lb', 'lb', 'Load Balancer', 180, 150, { status: 'healthy', sublabel: 'Spreads load' }),
            node('server-a', 'server', 'Server A', 380, 20, { status: 'healthy', sublabel: '150 req/s' }),
            node('server-b', 'server', 'Server B', 380, 150, { status: 'healthy', sublabel: '150 req/s' }),
            node('server-c', 'server', 'Server C', 380, 280, { status: 'failed', sublabel: 'Died — no data lost' }),
          ],
          edges: [
            edge('user', 'lb', '300 req/s'),
            edge('lb', 'server-a', '150 req/s'),
            edge('lb', 'server-b', '150 req/s'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b', 'server-c'],
          activeEdgeIds: ['user->lb', 'lb->server-a', 'lb->server-b'],
          caption: 'Server C dies and no user data is lost, because no state lived on it.',
        },
      ),
    ],
    summary:
      'A stateful server keeps user data in its own memory, so a request that lands on a different server finds nothing — the user is logged out or their cart is empty. A stateless server keeps nothing between requests; each request carries a signed token, and the state itself lives in shared stores: sessions in a cache or database, files in object storage, work in a queue. Sticky sessions only paper over the problem, pinning users to one server and losing them all when it fails. Once services are stateless, new servers are useful the moment they start and a dead server takes no user data with it. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['caching-patterns'],
  },
  l8: {
    id: 'l8',
    chapterId: 'scaling',
    number: 8,
    title: 'Auto Scaling',
    durationMin: 11,
    difficulty: 'Intermediate',
    intro:
      'Adding servers when load rises — and removing them before the bill does.',
    objectives: [
      'Explain what auto scaling watches and what it does',
      'Choose good scaling signals: CPU, request count, queue depth',
      'Explain scale-out thresholds and why they need a waiting period',
      'Explain cooldowns and how they stop flapping',
      'Describe safe scale-in: draining connections before stopping a server',
      'Name the limits: cold starts, minimums, maximums, and cost',
    ],
    formulas: [
      {
        name: 'Servers needed',
        expression: 'Servers = peak RPS ÷ RPS per server',
        note: 'At 600 requests per second with each server handling 200, the fleet needs 600 ÷ 200 = 3 servers.',
      },
    ],
    steps: [
      step(
        's1',
        'Watching the load',
        'Auto scaling starts with watching. The system measures a few signals every minute — CPU usage, requests per second, and how deep the work queue is. At 40% CPU and 150 requests per second, everything is calm and two servers are enough. Nothing happens yet; the autoscaler is only observing. Good auto scaling is boring most of the time, and that is the point: it should act only when the numbers say the current servers cannot keep up.',
        [
          metric('CPU', '40', '%', 'good'),
          metric('Load', '150', 'req/s'),
          metric('Servers', '2'),
          metric('Autoscaler', 'Watching'),
        ],
        [
          'CPU, requests per second, and queue depth are measured every minute',
          'At 40% CPU and 150 requests per second, two servers are enough',
        ],
        'Good auto scaling is boring most of the time: it should act only when the numbers say the current servers cannot keep up.',
        'Watch first, act only when the numbers say the servers cannot keep up.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '150 req/s' }),
            node('server-a', 'server', 'Server A', 220, 60, { status: 'healthy', sublabel: '40% CPU' }),
            node('server-b', 'server', 'Server B', 220, 240, { status: 'healthy', sublabel: '40% CPU' }),
            node('autoscaler', 'service', 'Autoscaler', 420, 150, { status: 'healthy', sublabel: 'Watching' }),
          ],
          edges: [
            edge('user', 'server-a', '75 req/s'),
            edge('user', 'server-b', '75 req/s'),
            edge('server-a', 'autoscaler', 'CPU 40%'),
            edge('server-b', 'autoscaler', 'CPU 40%'),
          ],
          activeNodeIds: ['server-a', 'server-b', 'autoscaler'],
          activeEdgeIds: ['server-a->autoscaler', 'server-b->autoscaler'],
          caption: 'The autoscaler watches CPU and request rate while two servers handle the load.',
        },
      ),
      step(
        's2',
        'Scale out: add servers when load rises',
        'Traffic climbs to 400 requests per second and CPU crosses 80% — the threshold the team chose. The autoscaler waits five minutes to be sure this is a real rise and not a blip, then starts two more servers. A few minutes later four servers share the load at about 55% CPU each, and latency falls back to normal. The rule is simple: when a signal stays above its threshold, add capacity.',
        [
          metric('Load', '400', 'req/s'),
          metric('CPU before', '80', '%', 'warn'),
          metric('Servers after', '4'),
          metric('CPU after', '55', '%', 'good'),
        ],
        [
          'CPU crosses the 80% threshold and stays there for five minutes',
          'Two servers are added and CPU per server falls to about 55%',
        ],
        'The five-minute wait matters: it makes sure the rise is real and not a blip.',
        'When a signal stays above its threshold, add capacity.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '400 req/s' }),
            node('autoscaler', 'service', 'Autoscaler', 180, 150, { status: 'healthy', sublabel: 'CPU 80% — 5 min' }),
            node('server-a', 'server', 'Server A', 380, 20, { status: 'healthy', sublabel: '55% CPU' }),
            node('server-b', 'server', 'Server B', 380, 150, { status: 'healthy', sublabel: '55% CPU' }),
            node('server-c', 'server', 'Server C', 380, 280, { status: 'healthy', sublabel: '55% CPU · new' }),
          ],
          edges: [
            edge('user', 'server-a', '100 req/s'),
            edge('user', 'server-b', '100 req/s'),
            edge('autoscaler', 'server-c', 'Adds 2 servers'),
          ],
          activeNodeIds: ['autoscaler', 'server-c'],
          activeEdgeIds: ['autoscaler->server-c'],
          caption: 'CPU stays above 80 percent for five minutes, so the autoscaler adds two servers.',
        },
      ),
      step(
        's3',
        'Cooldowns stop the flapping',
        'After adding servers, the autoscaler waits — usually five to ten minutes — before making another decision. This waiting period is called a cooldown, and it stops the system from flapping: adding servers, seeing CPU drop, removing them, seeing CPU spike, and adding them again in an endless loop. New servers also need a couple of minutes to start and pass health checks, so deciding again too soon would count servers that are not ready yet.',
        [
          metric('Cooldown', '5–10', 'min'),
          metric('New server start', '~2', 'min'),
          metric('Decisions during cooldown', 'None'),
        ],
        [
          'A cooldown of five to ten minutes follows every scaling decision',
          'New servers need about two minutes to start and pass health checks',
        ],
        'Deciding again too soon would count servers that are not ready yet.',
        'Wait after every scaling decision, or the system will flap.',
        {
          nodes: [
            node('autoscaler', 'service', 'Autoscaler', 20, 150, { status: 'healthy', sublabel: 'Cooldown: 8 min' }),
            node('server-a', 'server', 'Server A', 220, 60, { status: 'busy', sublabel: 'Starting' }),
            node('server-b', 'server', 'Server B', 220, 240, { status: 'healthy', sublabel: 'Ready' }),
            node('queue', 'queue', 'Queue', 420, 150, { status: 'healthy', sublabel: 'Stable' }),
          ],
          edges: [
            edge('autoscaler', 'server-a', 'Wait before deciding'),
            edge('server-b', 'queue', 'Serving requests'),
          ],
          activeNodeIds: ['autoscaler', 'server-a'],
          activeEdgeIds: ['autoscaler->server-a'],
          caption: 'During the cooldown the autoscaler waits while the new server starts.',
        },
      ),
      step(
        's4',
        'Scale in: remove servers carefully',
        'When the evening comes and traffic falls to 120 requests per second, CPU drops below 30% and stays there for fifteen minutes. The autoscaler removes one server — but carefully. It stops sending the server new requests, lets the ones in flight finish, and only then shuts it down. That draining step is what keeps a scale-in from dropping real users’ requests. Scale-in is deliberately slower than scale-out: adding capacity is urgent, removing it is not.',
        [
          metric('Load', '120', 'req/s'),
          metric('CPU', '30', '%'),
          metric('Below threshold for', '15', 'min'),
          metric('Servers after', '3'),
        ],
        [
          'CPU stays below 30% for fifteen minutes as traffic falls',
          'One server is drained — no new requests, in-flight ones finish — then stopped',
        ],
        'Scale-in is deliberately slower than scale-out: adding capacity is urgent, removing it is not.',
        'Drain before you stop, and scale in slower than you scale out.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '120 req/s' }),
            node('autoscaler', 'service', 'Autoscaler', 180, 150, { status: 'healthy', sublabel: 'CPU 30% — 15 min' }),
            node('server-a', 'server', 'Server A', 380, 60, { status: 'healthy', sublabel: 'Stays' }),
            node('server-b', 'server', 'Server B', 380, 240, { status: 'idle', sublabel: 'Draining, then removed' }),
          ],
          edges: [
            edge('user', 'server-a', '120 req/s'),
            edge('autoscaler', 'server-b', 'Drain, then stop'),
          ],
          activeNodeIds: ['autoscaler', 'server-b'],
          activeEdgeIds: ['autoscaler->server-b'],
          caption: 'Traffic falls, so the autoscaler drains one server and then removes it.',
        },
      ),
      step(
        's5',
        'The limits: cold starts and caps',
        'Auto scaling has limits worth knowing. A new server takes a couple of minutes to start, load its code, and pass health checks — that delay is a cold start, and a sudden spike can outrun it. So teams set a minimum that always runs, even at 3 a.m., and a maximum that caps the bill: no more than 10 servers, whatever happens. Auto scaling follows demand, but the caps decide how far it is allowed to follow.',
        [
          metric('Cold start', '~2', 'min'),
          metric('Minimum servers', '2'),
          metric('Maximum servers', '10'),
          metric('Cost', 'Follows demand'),
        ],
        [
          'A new server takes about two minutes to start and pass health checks',
          'A minimum of 2 servers always runs and a maximum of 10 caps the bill',
        ],
        'A sudden spike can outrun a cold start, which is why the minimum exists.',
        'Auto scaling follows demand — but the caps decide how far it may follow.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Sudden spike' }),
            node('server-a', 'server', 'Server A', 220, 60, { status: 'busy', sublabel: 'Starting · 2 min' }),
            node('server-b', 'server', 'Server B', 220, 240, { status: 'healthy', sublabel: 'Running' }),
            node('autoscaler', 'service', 'Autoscaler', 420, 150, { status: 'healthy', sublabel: 'Min 2 · Max 10' }),
          ],
          edges: [
            edge('user', 'server-a', 'Waits for start'),
            edge('user', 'server-b', 'Served now'),
            edge('server-a', 'autoscaler', 'Not ready yet'),
          ],
          activeNodeIds: ['server-a', 'autoscaler'],
          activeEdgeIds: ['user->server-a', 'server-a->autoscaler'],
          caption: 'A new server needs about two minutes to start, so a sudden spike can outrun it.',
        },
      ),
    ],
    summary:
      'Auto scaling watches signals — CPU, requests per second, queue depth — and adds servers when one stays above its threshold: here CPU crossing 80% for five minutes adds two servers and brings CPU back to about 55%. A cooldown of five to ten minutes after each decision stops the system from flapping, and scale-in is slower and gentler, draining connections before a server stops. The limits are cold starts of about two minutes, a minimum fleet that always runs, and a maximum that caps the bill. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['reliability-patterns'],
  },
};
