/*
 * Fully-written lessons. Only four lessons carry complete content in
 * this build (l1 How a Request Travels, l2 Latency & Throughput,
 * l5 Vertical vs Horizontal Scaling, l11 Database Replication).
 * The other 36 lessons live in data/curriculum.ts as coming-soon entries.
 *
 * All metric values in these lessons are illustrative: small, plausible
 * numbers chosen to show a trend, not measurements from a real system.
 */

import type { DiagramEdge, DiagramNode, Lesson, LessonStep, NodeKind, SimMetric } from '@/lib/types';

function metric(label: string, value: string, unit?: string, tone?: SimMetric['tone']): SimMetric {
  return { label, value, unit, tone };
}

function node(
  id: string,
  kind: NodeKind,
  label: string,
  x: number,
  y: number,
  extra?: Partial<DiagramNode>,
): DiagramNode {
  return { id, kind, label, x, y, ...extra };
}

function edge(from: string, to: string, label?: string, kind?: DiagramEdge['kind']): DiagramEdge {
  return { from, to, label, kind };
}

function step(
  id: string,
  title: string,
  explanation: string,
  metrics: SimMetric[],
  changed: string[],
  goodToKnow: string,
  takeaway: string,
  diagram: LessonStep['diagram'],
): LessonStep {
  return { id, title, explanation, metrics, changed, goodToKnow, takeaway, diagram };
}

const ILLUSTRATIVE =
  'All metric values in this lesson are illustrative — small, plausible numbers chosen to show how a system behaves, not measurements from a real deployment.';

export const fullLessons: Record<string, Lesson> = {
  l1: {
    id: 'l1',
    chapterId: 'foundations',
    number: 1,
    title: 'How a Request Travels',
    durationMin: 12,
    difficulty: 'Beginner',
    intro:
      'Every system design question starts here: one click, one request, and a chain of small steps that each add time. Follow a request from a browser to a database and back, and you will see exactly where latency hides.',
    objectives: [
      'Trace a request from a browser to a database and back',
      'Explain what DNS, TCP, and TLS each contribute to a request',
      'Identify which hop adds the most latency in a slow request',
      'Describe how a browser turns a response into a page',
      'Name the parts of the journey a cache can shorten',
    ],
    steps: [
      step(
        's1',
        'It starts with a click',
        'A user types an address or taps a link, and the browser takes over before anything has left the device. The browser checks its own cache and whether it already knows the server\'s address, then builds an HTTP request. Nothing has crossed the network yet — this first step is entirely local.',
        [
          metric('DNS lookup', '20', 'ms'),
          metric('Request size', '1.2', 'KB'),
          metric('Total time so far', '20', 'ms'),
        ],
        [
          'A user action becomes a browser request',
          'Nothing has left the device yet',
        ],
        'If the browser visited this site recently, it may reuse a cached DNS answer and skip the next step entirely.',
        'Every request begins on the client, before any network is involved.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy' }),
            node('client', 'client', 'Browser', 220, 150, { status: 'healthy', sublabel: 'Builds the request' }),
            node('server', 'server', 'Server', 480, 150, { status: 'idle', sublabel: 'Not reached yet' }),
          ],
          edges: [edge('user', 'client', 'Clicks a link')],
          activeNodeIds: ['user', 'client'],
          activeEdgeIds: ['user->client'],
          caption: 'A user taps a link and the browser prepares a request.',
        },
      ),
      step(
        's2',
        'DNS turns a name into an address',
        'The browser knows the name example.com, but the network only understands IP addresses. It asks a DNS resolver, which answers with 203.0.113.10 — an address in a range reserved for documentation, used here as an example. The lookup takes about 20 ms on a first visit, and the answer is the key to everything that follows.',
        [
          metric('DNS lookup', '20', 'ms'),
          metric('Address returned', '203.0.113.10'),
          metric('Total time so far', '20', 'ms'),
        ],
        [
          'Browser asks a DNS resolver for the IP address',
          'The name example.com resolves to 203.0.113.10',
        ],
        'DNS answers are cached at several layers — the browser, the operating system, and the resolver — so repeat visits are usually faster.',
        'DNS is the phone book of the internet: names in, addresses out.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'idle' }),
            node('client', 'client', 'Browser', 220, 150, { status: 'healthy' }),
            node('dns', 'dns', 'DNS Resolver', 420, 40, { status: 'healthy', sublabel: 'Name → address' }),
            node('server', 'server', 'Server', 480, 220, { status: 'idle', sublabel: 'Not reached yet' }),
          ],
          edges: [
            edge('client', 'dns', 'What is example.com?'),
            edge('dns', 'client', '203.0.113.10', 'response'),
          ],
          activeNodeIds: ['client', 'dns'],
          activeEdgeIds: ['client->dns', 'dns->client'],
          caption: 'The browser asks DNS for the server’s IP address and gets an answer back.',
        },
      ),
      step(
        's3',
        'TCP and TLS open a secure channel',
        'With the address in hand, the browser opens a TCP connection to the server. It then runs a TLS handshake, which negotiates encryption so that everything after this point is unreadable to anyone in the middle. Only once the channel is both open and encrypted does the browser send the actual request.',
        [
          metric('Handshake time', '60', 'ms'),
          metric('TLS version', '1.3'),
          metric('Total time so far', '80', 'ms'),
        ],
        [
          'TCP connection established with the server',
          'TLS handshake negotiates encryption before any data is sent',
        ],
        'TLS 1.3 usually completes its handshake in one round trip; older versions needed two, which is why upgrading TLS can measurably speed up a site.',
        'No application data moves until the connection is both open and encrypted.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'Server', 300, 150, { status: 'healthy', sublabel: 'TLS 1.3' }),
            node('db', 'db', 'Database', 540, 150, { status: 'idle', sublabel: 'Not reached yet' }),
          ],
          edges: [edge('client', 'server', 'TCP + TLS handshake')],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server'],
          caption: 'The browser opens a TCP connection and negotiates TLS encryption with the server.',
        },
      ),
      step(
        's4',
        'The server does the work',
        'The server reads the request and gets to work: it checks permissions, runs one database query, and builds a response from the result. The database query itself takes about 12 ms; most of the 45 ms of server time is application logic around it. The database is one hop inside the server\'s work, not the whole job.',
        [
          metric('Server processing', '45', 'ms'),
          metric('Database query', '12', 'ms'),
          metric('Total time so far', '137', 'ms'),
        ],
        [
          'Server reads the request and runs one database query',
          'The database returns the row the page needs',
        ],
        'Most of the 45 ms is application logic — checking permissions, loading the right data, and building the response — not the database query itself.',
        'The database is usually one hop inside the server’s work, not the whole job.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'idle' }),
            node('server', 'server', 'Server', 280, 150, { status: 'healthy', sublabel: 'Builds the response' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'Returns 1 row' }),
          ],
          edges: [
            edge('server', 'db', 'SELECT …'),
            edge('db', 'server', '1 row', 'response'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['server->db', 'db->server'],
          caption: 'The server queries the database and receives the row it needs.',
        },
      ),
      step(
        's5',
        'The response travels back',
        'The finished response — about 48 KB of HTML — travels back over the same encrypted connection. The transfer takes roughly 25 ms, bringing the round trip to 162 ms so far. The return journey counts toward latency just as much as the journey out, which is why a fast server on a slow network still feels slow.',
        [
          metric('Response size', '48', 'KB'),
          metric('Transfer time', '25', 'ms'),
          metric('Total round trip', '162', 'ms'),
        ],
        [
          'Server sends a 48 KB response',
          'The response arrives 25 ms after it was sent',
        ],
        'A nearby CDN edge server can serve static parts of a response without the request ever reaching the origin server.',
        'The return journey is part of latency too — a fast server with a slow network still feels slow.',
        {
          nodes: [
            node('server', 'server', 'Server', 20, 150, { status: 'healthy' }),
            node('client', 'client', 'Browser', 300, 150, { status: 'healthy', sublabel: 'Receives response' }),
            node('user', 'user', 'User', 540, 150, { status: 'idle', sublabel: 'Waiting' }),
          ],
          edges: [edge('server', 'client', '48 KB response', 'response')],
          activeNodeIds: ['server', 'client'],
          activeEdgeIds: ['server->client'],
          caption: 'The server sends the finished response back to the browser.',
        },
      ),
      step(
        's6',
        'The browser renders the page',
        'The browser parses the HTML, applies the CSS, and runs the JavaScript, then paints the page. Rendering adds about 40 ms, so the page becomes interactive after 202 ms in total. Along the way the browser also fetches 14 extra resources — images, stylesheets, and scripts — each of which repeats parts of this same journey.',
        [
          metric('Render time', '40', 'ms'),
          metric('Time to interactive', '202', 'ms'),
          metric('Extra resources', '14', 'requests'),
        ],
        [
          'Browser parses HTML, CSS, and JavaScript',
          'The page becomes interactive after 202 ms in total',
        ],
        'Those 14 extra requests — images, stylesheets, scripts — each repeat parts of this journey, which is why pages fetch many resources in parallel.',
        'The journey ends when the user can see and use the page, not when the first byte arrives.',
        {
          nodes: [
            node('client', 'client', 'Browser', 160, 150, { status: 'healthy', sublabel: 'Renders the page' }),
            node('user', 'user', 'User', 440, 150, { status: 'healthy', sublabel: 'Sees the page' }),
          ],
          edges: [edge('client', 'user', 'Rendered page')],
          activeNodeIds: ['client', 'user'],
          activeEdgeIds: ['client->user'],
          caption: 'The browser renders the page and the user can interact with it.',
        },
      ),
    ],
    summary:
      'A single request crosses five hops — user, browser, DNS, server, and database — and each hop adds time: about 20 ms for DNS, 60 ms for the handshake, 45 ms of server work, and 25 ms for the response to travel back, plus 40 ms to render. The total of roughly 200 ms is dominated by work that happens before and after the database, which is why speeding up the database alone rarely fixes a slow page. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals'],
  },
  l2: {
    id: 'l2',
    chapterId: 'foundations',
    number: 2,
    title: 'Latency & Throughput',
    durationMin: 11,
    difficulty: 'Beginner',
    intro:
      'Latency is how long one request takes; throughput is how many requests finish per second. They sound independent, but once a queue forms they pull on each other — and one small formula, Little’s Law, predicts exactly how.',
    objectives: [
      'Define latency and throughput in plain terms',
      'Use Little’s Law (L = λW) to estimate requests in a system',
      'Calculate server utilization from arrival rate and service time',
      'Explain why latency explodes as utilization nears 100%',
      'Recognize when adding capacity is the only fix',
    ],
    formulas: [
      {
        name: 'Little’s Law',
        expression: 'L = λW',
        note: 'With an arrival rate λ of 8 requests per second and an average time in system W of 0.25 seconds, L = 8 × 0.25 = 2 requests in the system on average.',
      },
      {
        name: 'Utilization',
        expression: 'ρ = λ × S',
        note: 'With λ = 9 requests per second and service time S = 0.1 seconds, utilization ρ = 0.9, or 90%.',
      },
    ],
    steps: [
      step(
        's1',
        'Two numbers that describe speed',
        'Latency measures one request: how long it takes from arrival to answer. Throughput measures the whole server: how many requests it finishes per second. A server can answer each request quickly yet still have low throughput, because throughput is capped by service time — a server that needs 100 ms per request can never finish more than 10 per second.',
        [
          metric('Service time', '100', 'ms'),
          metric('Max throughput', '10', 'req/s'),
          metric('Queue length', '0', 'requests'),
        ],
        [
          'Latency and throughput defined as separate measures',
          'One server’s ceiling set by its 100 ms service time',
        ],
        'Throughput is capped by service time: a server that needs 100 ms per request can never finish more than 10 per second, no matter how fast the network is.',
        'Latency describes one request; throughput describes the server.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy' }),
            node('queue', 'queue', 'Queue', 280, 150, { status: 'idle', sublabel: 'Empty' }),
            node('server', 'server', 'Server', 520, 150, { status: 'healthy', sublabel: '100 ms per request' }),
          ],
          edges: [
            edge('client', 'queue', 'Requests arrive'),
            edge('queue', 'server', 'Served one at a time'),
          ],
          activeNodeIds: ['client', 'queue', 'server'],
          activeEdgeIds: ['client->queue', 'queue->server'],
          caption: 'Requests arrive at a queue and the server processes them one at a time.',
        },
      ),
      step(
        's2',
        'Light load: everything feels fast',
        'At 5 requests per second, the server is busy only half the time — utilization is 5 × 0.1 seconds, or 0.50. A new request almost always finds a free server, so the queue stays empty and latency stays near the 100 ms service time plus a little network time. This is the comfortable zone every system wants to live in.',
        [
          metric('Arrival rate λ', '5', 'req/s'),
          metric('Utilization ρ', '0.50'),
          metric('Average latency', '110', 'ms'),
        ],
        [
          'Arrival rate rises to 5 requests per second',
          'The server is busy half the time and the queue stays empty',
        ],
        'At 50% utilization a request almost always finds a free server, so latency stays close to the 100 ms service time plus a little network time.',
        'Below half capacity, latency barely moves.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: '5 req/s' }),
            node('queue', 'queue', 'Queue', 280, 150, { status: 'healthy', sublabel: 'Empty' }),
            node('server', 'server', 'Server', 520, 150, { status: 'healthy', sublabel: '50% busy' }),
          ],
          edges: [
            edge('client', 'queue', '5 req/s'),
            edge('queue', 'server', 'No waiting'),
          ],
          activeNodeIds: ['client', 'queue', 'server'],
          activeEdgeIds: ['client->queue', 'queue->server'],
          caption: 'At five requests per second the server keeps up and the queue stays empty.',
        },
      ),
      step(
        's3',
        'Little’s Law: count what is inside',
        'Little’s Law says the average number of requests inside a system equals the arrival rate times the average time each request spends inside: L = λW. Here 8 requests arrive per second and each spends 0.25 seconds inside, so on average 2 requests are in the system at any moment. The formula needs no detail about the server — only the rate in and the time spent — which is why it works for queues, databases, and whole services alike.',
        [
          metric('Arrival rate λ', '8', 'req/s'),
          metric('Time in system W', '0.25', 's'),
          metric('In system L', '2', 'requests'),
        ],
        [
          'Little’s Law introduced: L = λW',
          'Worked example: 8 × 0.25 = 2 requests in the system',
        ],
        'Little’s Law holds for any stable system — a single server, a whole data center, even a checkout line — as long as arrivals and departures balance over time.',
        'If you know the arrival rate and the time in system, you know how many requests are inside.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: 'λ = 8 req/s' }),
            node('queue', 'queue', 'Queue', 280, 150, { status: 'busy', sublabel: 'L = 2 requests' }),
            node('server', 'server', 'Server', 520, 150, { status: 'healthy', sublabel: 'W = 0.25 s' }),
          ],
          edges: [
            edge('client', 'queue', 'λ = 8 req/s'),
            edge('queue', 'server', 'W = 0.25 s'),
          ],
          activeNodeIds: ['queue', 'server'],
          activeEdgeIds: ['client->queue', 'queue->server'],
          caption: 'Eight requests arrive per second and each spends 0.25 seconds inside, so two are in the system on average.',
        },
      ),
      step(
        's4',
        'Near saturation: latency climbs fast',
        'At 9 requests per second, utilization reaches 9 × 0.1, or 0.90. The server is busy 90% of the time, so most arrivals find it occupied and wait. The queue holds about 4 requests and average latency quadruples to 400 ms — even though the arrival rate rose by only one request per second. Queueing delay grows steeply as utilization approaches 1.',
        [
          metric('Arrival rate λ', '9', 'req/s'),
          metric('Utilization ρ', '0.90', undefined, 'warn'),
          metric('Average latency', '400', 'ms', 'warn'),
          metric('Queue length', '4', 'requests'),
        ],
        [
          'Arrival rate rises to 9 requests per second',
          'Utilization hits 90% and latency quadruples',
        ],
        'Queueing delay grows steeply as utilization approaches 1: the last 10% of capacity costs far more latency than the first 90%.',
        'A server at 90% busy is not 10% slower — it is several times slower.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: '9 req/s' }),
            node('queue', 'queue', 'Queue', 280, 150, { status: 'busy', sublabel: '4 waiting' }),
            node('server', 'server', 'Server', 520, 150, { status: 'busy', sublabel: '90% busy' }),
          ],
          edges: [
            edge('client', 'queue', '9 req/s'),
            edge('queue', 'server', 'Waiting ~300 ms'),
          ],
          activeNodeIds: ['queue', 'server'],
          activeEdgeIds: ['client->queue', 'queue->server'],
          caption: 'At nine requests per second the queue holds four requests and latency reaches 400 milliseconds.',
        },
      ),
      step(
        's5',
        'Overload: the queue never drains',
        'At 12 requests per second, utilization is 12 × 0.1, or 1.20 — above 100%. The server finishes 10 per second while 12 arrive, so every second adds 2 requests to the queue. There is no steady state any more: latency passes 2,400 ms and keeps rising. The only fixes are shedding load, speeding up service, or adding capacity.',
        [
          metric('Arrival rate λ', '12', 'req/s'),
          metric('Utilization ρ', '1.20', undefined, 'bad'),
          metric('Average latency', '2,400', 'ms', 'bad'),
          metric('Queue length', 'Growing', undefined, 'bad'),
        ],
        [
          'Arrival rate exceeds the 10 requests-per-second ceiling',
          'The queue grows without bound and latency keeps rising',
        ],
        'Above 100% utilization there is no steady state: every second adds two requests to the queue, so the only fixes are shedding load, speeding up service, or adding capacity.',
        'Past full utilization, latency does not level off — it grows forever.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: '12 req/s' }),
            node('queue', 'queue', 'Queue', 280, 150, { status: 'degraded', sublabel: 'Growing' }),
            node('server', 'server', 'Server', 520, 150, { status: 'busy', sublabel: '100% busy' }),
          ],
          edges: [
            edge('client', 'queue', '12 req/s in'),
            edge('queue', 'server', '10 req/s out'),
          ],
          activeNodeIds: ['queue', 'server'],
          activeEdgeIds: ['client->queue', 'queue->server'],
          caption: 'At twelve requests per second the queue grows without bound and latency passes 2,400 milliseconds.',
        },
      ),
    ],
    summary:
      'Latency and throughput are linked by the queue between them. Little’s Law (L = λW) counts what is inside a system — with 8 requests arriving per second and 0.25 seconds spent inside, 2 requests are in the system on average — and utilization (λ × service time) tells you how close the server is to its ceiling. Latency stays flat below about 50% utilization, climbs steeply near 90%, and grows without bound past 100%. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals'],
  },
  l5: {
    id: 'l5',
    chapterId: 'scaling',
    number: 5,
    title: 'Vertical vs Horizontal Scaling',
    durationMin: 12,
    difficulty: 'Beginner',
    intro:
      'When one server is not enough, you have two moves: buy a bigger machine or add more machines. Vertical scaling is simple and has a hard ceiling; horizontal scaling has no ceiling but needs a load balancer and stateless services — this lesson walks the exact moment one stops working and the other starts.',
    objectives: [
      'Compare vertical and horizontal scaling',
      'Explain why a single server eventually becomes a bottleneck',
      'Describe how a load balancer spreads traffic across servers',
      'Decide when to add or remove servers as demand changes',
      'Name the costs and limits of each scaling approach',
      'Explain why horizontal scaling needs stateless services',
    ],
    steps: [
      step(
        's1',
        'One server, light load',
        'A single server handles the whole product: 100 requests per second at 35% CPU, answering in about 80 ms. Life is simple — one machine to deploy, one log to read, one thing to monitor. At this scale there is nothing to scale, and adding complexity would only slow the team down.',
        [
          metric('Servers', '1'),
          metric('Load', '100', 'req/s'),
          metric('Average latency', '80', 'ms', 'good'),
          metric('CPU', '35', '%', 'good'),
        ],
        [
          'One server handles all traffic comfortably',
          'Latency is low and CPU has plenty of headroom',
        ],
        'A single server is the right architecture for most new products: scaling problems are good problems, and they arrive later than people expect.',
        'Start with one server; scale when the numbers say so, not before.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '100 req/s' }),
            node('server', 'server', 'Server', 300, 150, { status: 'healthy', sublabel: '35% CPU' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('user', 'server', '100 req/s'),
            edge('server', 'db', 'Queries'),
          ],
          activeNodeIds: ['user', 'server'],
          activeEdgeIds: ['user->server'],
          caption: 'One server handles 100 requests per second with plenty of headroom.',
        },
      ),
      step(
        's2',
        'Traffic grows and one server overloads',
        'Traffic quadruples to 400 requests per second, but the server can only finish about 250 per second. CPU hits 98%, the queue grows, and average latency jumps to 900 ms. The server is not broken — it is simply being asked for more than it can do, and no amount of tuning changes the ceiling of one machine.',
        [
          metric('Servers', '1'),
          metric('Load', '400', 'req/s'),
          metric('Average latency', '900', 'ms', 'bad'),
          metric('CPU', '98', '%', 'bad'),
        ],
        [
          'Load rises from 100 to 400 requests per second',
          'The single server’s 250 requests-per-second capacity is exceeded',
        ],
        'CPU near 100% is the warning sign: the server spends its time switching between requests instead of finishing them.',
        'One server has a ceiling, and traffic does not ask permission before crossing it.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '400 req/s' }),
            node('server', 'server', 'Server', 300, 150, { status: 'busy', sublabel: '98% CPU — overloaded' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('user', 'server', '400 req/s in'),
            edge('server', 'db', 'Queries queue up'),
          ],
          activeNodeIds: ['server'],
          activeEdgeIds: ['user->server'],
          caption: 'One server faces 400 requests per second and becomes overloaded.',
        },
      ),
      step(
        's3',
        'Vertical scaling: a bigger machine',
        'The first fix is vertical scaling: replace the server with a larger machine — more CPU, more memory — that can handle 500 requests per second. Latency recovers to 120 ms and CPU drops to 80%. It works, and it works without changing a line of code. But the new machine is still one machine: there is a biggest size you can buy, and if it fails, everything fails.',
        [
          metric('Servers', '1 (larger)'),
          metric('Capacity', '500', 'req/s'),
          metric('Average latency', '120', 'ms'),
          metric('CPU', '80', '%'),
        ],
        [
          'The server is replaced with a larger machine',
          'Capacity rises to 500 requests per second and latency recovers',
        ],
        'Vertical scaling has a hard ceiling — there is a biggest machine you can buy — and the bigger machine is still a single point of failure.',
        'Bigger buys time, not a future.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '400 req/s' }),
            node('server', 'server', 'Bigger Server', 300, 150, { status: 'healthy', sublabel: '80% CPU · 2× RAM' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('user', 'server', '400 req/s'),
            edge('server', 'db', 'Queries'),
          ],
          activeNodeIds: ['server'],
          activeEdgeIds: ['user->server'],
          caption: 'A larger server handles the same 400 requests per second comfortably.',
        },
      ),
      step(
        's4',
        'Horizontal scaling: a load balancer and two servers',
        'The second fix is horizontal scaling: keep the ordinary machines and add more of them. A load balancer sits in front of two servers and splits the 400 requests per second evenly, 200 each. Latency is 110 ms, CPU is 55% per server, and if one server fails the other keeps answering. The price is new complexity: the load balancer itself, and services that must not keep user state on one machine.',
        [
          metric('Servers', '2'),
          metric('Load per server', '200', 'req/s'),
          metric('Average latency', '110', 'ms', 'good'),
          metric('CPU per server', '55', '%'),
        ],
        [
          'A load balancer is added in front of two servers',
          '400 requests per second split evenly, 200 per server',
        ],
        'The load balancer is the new front door: it needs its own redundancy, or it becomes the single point of failure it was meant to remove.',
        'Two ordinary servers beat one heroic server — and either one can fail.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '400 req/s' }),
            node('lb', 'lb', 'Load Balancer', 180, 150, { status: 'healthy', sublabel: 'Splits traffic' }),
            node('server-a', 'server', 'Server A', 380, 60, { status: 'healthy', sublabel: '200 req/s' }),
            node('server-b', 'server', 'Server B', 380, 240, { status: 'healthy', sublabel: '200 req/s' }),
          ],
          edges: [
            edge('user', 'lb', '400 req/s'),
            edge('lb', 'server-a', '200 req/s'),
            edge('lb', 'server-b', '200 req/s'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b'],
          activeEdgeIds: ['user->lb', 'lb->server-a', 'lb->server-b'],
          caption: 'A load balancer splits 400 requests per second across two servers.',
        },
      ),
      step(
        's5',
        'Traffic grows again: add a third server',
        'Traffic grows to 600 requests per second. Instead of buying a bigger machine, the team adds a third server behind the load balancer — no code changes, no downtime. Each server now handles 200 requests per second again and latency holds at 105 ms. This is the real advantage of horizontal scaling: capacity grows by adding machines, and there is no single biggest machine to run into.',
        [
          metric('Servers', '3'),
          metric('Load', '600', 'req/s'),
          metric('Load per server', '200', 'req/s'),
          metric('Average latency', '105', 'ms', 'good'),
        ],
        [
          'A third server is added behind the load balancer',
          '600 requests per second split three ways with no code changes',
        ],
        'Adding a server is a capacity decision, not a code deploy: the load balancer starts sending it traffic as soon as health checks pass.',
        'Horizontal scaling grows by adding machines, not by replacing them.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '600 req/s' }),
            node('lb', 'lb', 'Load Balancer', 180, 150, { status: 'healthy', sublabel: 'Splits traffic' }),
            node('server-a', 'server', 'Server A', 380, 20, { status: 'healthy', sublabel: '200 req/s' }),
            node('server-b', 'server', 'Server B', 380, 150, { status: 'healthy', sublabel: '200 req/s' }),
            node('server-c', 'server', 'Server C', 380, 280, { status: 'healthy', sublabel: '200 req/s · new' }),
          ],
          edges: [
            edge('user', 'lb', '600 req/s'),
            edge('lb', 'server-a', '200 req/s'),
            edge('lb', 'server-b', '200 req/s'),
            edge('lb', 'server-c', '200 req/s'),
          ],
          activeNodeIds: ['lb', 'server-c'],
          activeEdgeIds: ['user->lb', 'lb->server-a', 'lb->server-b', 'lb->server-c'],
          caption: 'A third server joins and 600 requests per second split three ways.',
        },
      ),
      step(
        's6',
        'Traffic falls: remove a server',
        'The spike passes and traffic falls back to 300 requests per second. The team removes the third server, and the remaining two absorb 150 requests each at 90 ms latency. Removing servers when demand falls matters as much as adding them: idle capacity is a bill, and auto scaling exists to make these add and remove decisions without a human watching a dashboard at 3 a.m.',
        [
          metric('Servers', '2'),
          metric('Load', '300', 'req/s'),
          metric('Load per server', '150', 'req/s'),
          metric('Average latency', '90', 'ms', 'good'),
        ],
        [
          'Traffic falls to 300 requests per second',
          'One server is removed and the remaining two absorb the load',
        ],
        'Removing servers when demand falls is as important as adding them: idle capacity is a bill, and auto scaling exists to do this without a human watching a dashboard at 3 a.m.',
        'Scale out when load rises, scale in when it falls — capacity should follow demand.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '300 req/s' }),
            node('lb', 'lb', 'Load Balancer', 180, 150, { status: 'healthy', sublabel: 'Splits traffic' }),
            node('server-a', 'server', 'Server A', 380, 60, { status: 'healthy', sublabel: '150 req/s' }),
            node('server-b', 'server', 'Server B', 380, 240, { status: 'healthy', sublabel: '150 req/s' }),
            node('server-c', 'server', 'Server C', 580, 150, { status: 'idle', sublabel: 'Removed' }),
          ],
          edges: [
            edge('user', 'lb', '300 req/s'),
            edge('lb', 'server-a', '150 req/s'),
            edge('lb', 'server-b', '150 req/s'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b'],
          activeEdgeIds: ['user->lb', 'lb->server-a', 'lb->server-b'],
          caption: 'Traffic falls, one server is removed, and two servers share the remaining load.',
        },
      ),
    ],
    summary:
      'Vertical scaling buys a bigger machine: simple, no code changes, but capped by the largest machine you can buy and still a single point of failure. Horizontal scaling adds machines behind a load balancer: no ceiling, and any one server can fail, but it needs stateless services and a redundant load balancer. The lesson’s numbers tell the story — one server overloads at 400 requests per second, a bigger machine recovers to 120 ms, and two servers split the same load at 110 ms, with a third added at 600 and removed again when traffic falls to 300. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals', 'reliability-patterns'],
  },
  l11: {
    id: 'l11',
    chapterId: 'data-storage',
    number: 11,
    title: 'Database Replication',
    durationMin: 12,
    difficulty: 'Intermediate',
    intro:
      'Reads usually outnumber writes by a wide margin, so one database ends up doing two jobs: taking every write and answering every read. Replication splits the jobs — one primary takes writes, replicas answer reads — but the copies are never perfectly in sync, and that gap is the whole lesson.',
    objectives: [
      'Explain why reads and writes are split across database copies',
      'Trace a write from the primary to a replica',
      'Trace a read and say which copy answers it',
      'Define replication lag and its effect on reads',
      'Describe what happens when the primary fails',
      'Weigh consistency against availability when choosing a replica strategy',
    ],
    steps: [
      step(
        's1',
        'One database does everything',
        'A single database takes all 80 writes per second and answers all 800 reads per second. At 85% CPU it is coping, but only just — every new feature adds reads to the same machine that must also never lose a write. The database is doing two jobs with very different needs, and that is the problem replication solves.',
        [
          metric('Reads', '800', 'req/s'),
          metric('Writes', '80', 'req/s'),
          metric('Read latency', '15', 'ms'),
          metric('Database CPU', '85', '%', 'warn'),
        ],
        [
          'One database handles every read and every write',
          'CPU reaches 85% with reads outnumbering writes 10 to 1',
        ],
        'A 10-to-1 read-to-write ratio is typical for content-heavy products: most users browse, few publish, so reads are the load worth spreading.',
        'One database doing two jobs is the starting point, not the destination.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '880 req/s total' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy' }),
            node('db', 'db', 'Database', 460, 150, { status: 'busy', sublabel: 'Primary · 85% CPU' }),
          ],
          edges: [
            edge('user', 'server', 'Reads + writes'),
            edge('server', 'db', '800 reads, 80 writes /s'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'A single database handles all 800 reads and 80 writes per second.',
        },
      ),
      step(
        's2',
        'A read replica joins',
        'A second database is added as a read replica: it holds a copy of the same data, kept up to date by copying the primary’s write log. The primary’s CPU drops to 60% because it no longer answers every read, and total read capacity roughly doubles. The replica trails the primary by about 40 ms — that trailing gap has a name, replication lag, and it matters.',
        [
          metric('Databases', '2'),
          metric('Primary CPU', '60', '%', 'good'),
          metric('Replica lag', '40', 'ms'),
          metric('Read capacity', '2×'),
        ],
        [
          'A read replica is added and starts copying the primary',
          'Primary CPU falls from 85% to 60% as reads move away',
        ],
        'A replica is a copy, not a backup: it protects against load and against a failed primary, but a deleted row replicates just as faithfully as a new one.',
        'A replica doubles read capacity and introduces lag in the same move.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'App Server', 180, 150, { status: 'healthy' }),
            node('primary', 'db', 'Primary DB', 380, 60, { status: 'healthy', sublabel: 'Writes · 60% CPU' }),
            node('replica', 'db', 'Read Replica', 380, 240, { status: 'healthy', sublabel: 'Reads · 40 ms behind' }),
          ],
          edges: [
            edge('server', 'primary', 'Writes'),
            edge('primary', 'replica', 'Copies write log', 'replication'),
          ],
          activeNodeIds: ['primary', 'replica'],
          activeEdgeIds: ['primary->replica'],
          caption: 'A read replica copies the primary and doubles the system’s read capacity.',
        },
      ),
      step(
        's3',
        'The write path: primary only',
        'Every write goes to the primary and nowhere else. The application sends the write, the primary records it and replies in about 18 ms, and then the replica copies it from the write log a moment later. Sending every write to one place keeps ordering simple: there is exactly one version of the truth, and every copy derives from it.',
        [
          metric('Write latency', '18', 'ms'),
          metric('Writes', '80', 'req/s'),
          metric('Replication lag', '40', 'ms'),
        ],
        [
          'Writes go to the primary and to nowhere else',
          'The primary records each write for the replica to copy',
        ],
        'Sending every write to one primary keeps ordering simple: there is exactly one version of the truth, and every copy derives from it.',
        'One writer means one order of events.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Writes' }),
            node('server', 'server', 'App Server', 180, 150, { status: 'healthy' }),
            node('primary', 'db', 'Primary DB', 380, 60, { status: 'healthy', sublabel: 'Accepts the write' }),
            node('replica', 'db', 'Read Replica', 380, 240, { status: 'healthy', sublabel: 'Copies it 40 ms later' }),
          ],
          edges: [
            edge('user', 'server', 'Write'),
            edge('server', 'primary', 'Write'),
            edge('primary', 'replica', 'Copies write log', 'replication'),
          ],
          activeNodeIds: ['server', 'primary'],
          activeEdgeIds: ['user->server', 'server->primary', 'primary->replica'],
          caption: 'A write goes to the primary only and is copied to the replica afterwards.',
        },
      ),
      step(
        's4',
        'The read path: spread the load',
        'Reads are a different story: they can be answered by either copy, so the application spreads them. Of 800 reads per second, about 600 now land on the replica and 200 stay on the primary, and average read latency improves to 12 ms. The replica finally earns its keep — by answering reads the primary never has to see.',
        [
          metric('Reads', '800', 'req/s'),
          metric('Reads on replica', '600', 'req/s'),
          metric('Read latency', '12', 'ms', 'good'),
        ],
        [
          'Reads are spread across the primary and the replica',
          '600 of 800 reads per second now land on the replica',
        ],
        'Reads that must see the very latest write — like reading your own post right after publishing — are still sent to the primary, a trick called read-your-writes.',
        'Replicas earn their keep by answering reads.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '800 reads/s' }),
            node('server', 'server', 'App Server', 180, 150, { status: 'healthy', sublabel: 'Spreads reads' }),
            node('primary', 'db', 'Primary DB', 380, 60, { status: 'healthy', sublabel: '200 reads/s' }),
            node('replica', 'db', 'Read Replica', 380, 240, { status: 'healthy', sublabel: '600 reads/s' }),
          ],
          edges: [
            edge('user', 'server', 'Reads'),
            edge('server', 'primary', '200 reads/s'),
            edge('server', 'replica', '600 reads/s'),
          ],
          activeNodeIds: ['server', 'primary', 'replica'],
          activeEdgeIds: ['server->primary', 'server->replica'],
          caption: 'Reads spread across both copies, with most landing on the replica.',
        },
      ),
      step(
        's5',
        'Replication lag: the copy is behind',
        'A traffic spike pushes replication lag from 40 ms to 250 ms. The replica is still correct — it just holds data from a quarter of a second ago. A user who edits a post and immediately reloads may see the old version, because the read landed on a replica that has not caught up yet. Lag is usually invisible, but it is always there, waiting for a bad day.',
        [
          metric('Replication lag', '250', 'ms', 'warn'),
          metric('Stale-read chance', 'Low'),
          metric('Read latency', '12', 'ms'),
        ],
        [
          'A traffic spike pushes replication lag from 40 ms to 250 ms',
          'A read in that window can return data from before the latest write',
        ],
        'Lag is usually milliseconds and invisible, but a slow replica or a burst of writes can stretch it to seconds — monitor it like any other health signal.',
        'A replica answers from the past; the question is how far in the past.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Sees old version' }),
            node('server', 'server', 'App Server', 180, 150, { status: 'healthy' }),
            node('primary', 'db', 'Primary DB', 380, 60, { status: 'healthy', sublabel: 'Has the new edit' }),
            node('replica', 'db', 'Read Replica', 380, 240, { status: 'degraded', sublabel: '250 ms behind' }),
          ],
          edges: [
            edge('server', 'replica', 'Read → stale copy'),
            edge('primary', 'replica', 'Still catching up', 'replication'),
          ],
          activeNodeIds: ['replica'],
          activeEdgeIds: ['server->replica', 'primary->replica'],
          caption: 'The replica lags 250 milliseconds behind, so a fresh read can return stale data.',
        },
      ),
      step(
        's6',
        'Failover and the consistency trade-off',
        'Then the primary fails. The replica is promoted to primary, writes pause for about 30 seconds, and service is restored — but the replica was 250 ms behind, so the last quarter-second of writes may be lost forever. Promoting a lagging replica trades consistency for availability: the system stays up, but a few very recent writes may never come back.',
        [
          metric('Failover time', '~30', 's'),
          metric('Data loss risk', 'Last ~250 ms of writes', undefined, 'warn'),
          metric('Availability', 'Restored', undefined, 'good'),
        ],
        [
          'The primary fails and the replica is promoted to primary',
          'Writes pause for about 30 seconds, and the last 250 ms of writes may be lost',
        ],
        'Promoting a lagging replica trades consistency for availability: the system stays up, but a few very recent writes may never come back.',
        'Failover keeps the system alive; it cannot rewind the lag.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'App Server', 180, 150, { status: 'healthy', sublabel: 'Writes resume' }),
            node('primary', 'db', 'Old Primary', 380, 60, { status: 'failed', sublabel: 'Down' }),
            node('replica', 'db', 'Replica → Primary', 380, 240, { status: 'healthy', sublabel: 'Promoted' }),
          ],
          edges: [
            edge('server', 'replica', 'Reads + writes'),
            edge('primary', 'replica', 'Replication stopped', 'replication'),
          ],
          activeNodeIds: ['primary', 'replica'],
          activeEdgeIds: ['server->replica'],
          caption: 'The primary fails and the replica is promoted to take over.',
        },
      ),
    ],
    summary:
      'Replication splits one database’s two jobs: the primary takes all writes, replicas answer most reads, and read capacity grows with every replica added. The price is replication lag — copies trail the primary by milliseconds, sometimes more — so a read can return stale data, and a failover can lose the most recent writes. Synchronous replication closes the lag but slows every write; asynchronous replication keeps writes fast and accepts the gap. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['database-scaling', 'reliability-patterns'],
    relatedCaseStudies: ['url-shortener'],
  },
};
