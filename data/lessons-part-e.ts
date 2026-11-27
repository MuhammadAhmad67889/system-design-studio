/*
 * Fully-written lessons — Part E: architecture and security.
 * Lessons l28–l32: Monolith vs Microservices, API Gateway and Service
 * Discovery, Distributed Transactions and Sagas, Eventual Consistency,
 * and Authentication and Authorization.
 *
 * Each lesson follows the exact shape of the four original full lessons
 * in data/lessons-full.ts: intro, objectives, 4+ steps (each with a
 * diagram, metrics, what-changed, good-to-know and takeaway), summary.
 *
 * All metric values are illustrative — see ILLUSTRATIVE in
 * data/lesson-helpers.ts. Never present an illustrative number as a
 * measurement from a real system.
 */

import type { Lesson } from '@/lib/types';
import { ILLUSTRATIVE, edge, metric, node, step } from '@/data/lesson-helpers';

export const lessonsPartE: Record<string, Lesson> = {
  l28: {
    id: 'l28',
    chapterId: 'architecture',
    number: 28,
    title: 'Monolith vs Microservices',
    durationMin: 13,
    difficulty: 'Intermediate',
    intro: 'One deployable or many? The honest trade-offs on both sides.',
    objectives: [
      'Describe what a monolith and a microservice system each look like',
      'Explain when a monolith is the right choice for a product',
      'Explain what forces push a team toward microservices',
      'Name the costs microservices add: network calls, operations, and split data',
      'Describe the modular monolith as a middle path between the two',
    ],
    steps: [
      step(
        's1',
        'One codebase, one deploy',
        'A monolith is one application that holds everything: the web pages, the checkout logic, the emails, and the reports, all in one codebase and deployed as one unit. Its parts are modules that call each other directly in the same process, so a function call costs almost nothing and there is no network between them. Most products start this way, and most should. One deployable means one thing to test, one log to read, and one database to back up.',
        [
          metric('Deployables', '1'),
          metric('In-process call', '<1', 'ms'),
          metric('Teams', '1–2'),
        ],
        [
          'Everything lives in one codebase and deploys as one unit',
          'Modules call each other directly, with no network between them',
        ],
        'Most products start as a monolith, and most should: one deployable means one thing to test, one log to read, and one database to back up.',
        'A monolith is one deployable with in-process calls.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'Monolith', 280, 150, { status: 'healthy', sublabel: 'One deployable' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('user', 'server', 'Request'),
            edge('server', 'db', 'Query'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'A user talks to one monolith, which talks to one database.',
        },
      ),
      step(
        's2',
        'The monolith grows up',
        'Growth changes the maths. Four teams now share the same codebase, and every release needs all of them to agree, because one deploy ships everyone\'s changes together. A slow report query can starve the checkout of memory, since both run in the same process. Scaling means copying the whole application, even when only checkout is busy. The monolith is not broken — it has simply outgrown the team and traffic it was built for.',
        [
          metric('Teams sharing it', '4'),
          metric('Deploy time', '25', 'min'),
          metric('Checkout latency', '900', 'ms', 'warn'),
        ],
        [
          'Four teams share one codebase and one release train',
          'A slow report can starve checkout, since both run in one process',
        ],
        'Scaling a monolith means copying the whole application, even when only one part of it is busy.',
        'A monolith strains when teams and traffic outgrow one deployable.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: '4 teams’ users' }),
            node('server', 'server', 'Monolith', 280, 150, { status: 'busy', sublabel: 'Reports starve checkout' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('user', 'server', 'All traffic'),
            edge('server', 'db', 'Queries queue up'),
          ],
          activeNodeIds: ['server'],
          activeEdgeIds: ['user->server'],
          caption: 'Four teams share one monolith, and a slow report starves the checkout.',
        },
      ),
      step(
        's3',
        'Splitting into services',
        'Microservices split the application along business boundaries: one service owns orders, another owns payments, another owns inventory, and each keeps its own database. Each service deploys on its own, so the payments team can ship a fix without waiting for the orders team. Each service also scales on its own: a busy checkout gets more copies while quiet reporting stays small. The price is that a call that used to be a function call is now a network request.',
        [
          metric('Services', '4'),
          metric('Deployables', '4'),
          metric('Cross-service call', '8', 'ms'),
        ],
        [
          'The application splits along business boundaries',
          'Each service deploys and scales on its own, with its own database',
        ],
        'A service boundary should follow a business capability — orders, payments, inventory — not a layer like "the database service".',
        'Microservices trade in-process calls for independent deploys.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy' }),
            node('orders', 'service', 'Orders', 260, 40, { status: 'healthy', sublabel: 'Own database' }),
            node('payments', 'service', 'Payments', 260, 150, { status: 'healthy', sublabel: 'Own database' }),
            node('inventory', 'service', 'Inventory', 260, 260, { status: 'healthy', sublabel: 'Own database' }),
          ],
          edges: [
            edge('client', 'orders', 'Place order'),
            edge('client', 'payments', 'Pay'),
            edge('client', 'inventory', 'Check stock'),
          ],
          activeNodeIds: ['orders', 'payments', 'inventory'],
          activeEdgeIds: ['client->orders', 'client->payments', 'client->inventory'],
          caption: 'The client talks to three services, each with its own database.',
        },
      ),
      step(
        's4',
        'What microservices cost',
        'Once services talk over the network, new failures appear. A request that crossed one process now crosses three services, and any one of them can be slow or down. Debugging means following one request through several logs, and a slow payment service can hold up an order that is otherwise ready. Data is split too: there is no single database query that joins orders and inventory anymore. These are real costs, and they arrive on day one, while the benefits arrive gradually.',
        [
          metric('Services per request', '3'),
          metric('Failure points', '3'),
          metric('Logs to search', '3', 'places'),
        ],
        [
          'One request now crosses three services over the network',
          'A slow payment service can hold up an otherwise-ready order',
        ],
        'There is no single database query that joins orders and inventory anymore, because each service owns its own data.',
        'Every split adds a network hop and a new way to fail.',
        {
          nodes: [
            node('orders', 'service', 'Orders', 20, 150, { status: 'healthy', sublabel: 'Ready' }),
            node('payments', 'service', 'Payments', 260, 150, { status: 'degraded', sublabel: 'Slow · 800 ms' }),
            node('inventory', 'service', 'Inventory', 500, 150, { status: 'idle', sublabel: 'Waiting' }),
          ],
          edges: [
            edge('orders', 'payments', 'Network call'),
            edge('payments', 'inventory', 'Held up'),
          ],
          activeNodeIds: ['payments'],
          activeEdgeIds: ['orders->payments', 'payments->inventory'],
          caption: 'A slow payments service holds up the order and the inventory step behind it.',
        },
      ),
      step(
        's5',
        'The middle path: a modular monolith',
        'There is a middle path: the modular monolith. The code is split into strict modules with clear boundaries — orders cannot reach into payments\' tables — but everything still deploys as one unit. You get most of the discipline of services without the network, the separate databases, or the operations burden. If one module later needs to scale or ship alone, its boundary is already drawn, and extracting it is a real job instead of a rewrite.',
        [
          metric('Deployables', '1'),
          metric('Module boundaries', 'Strict'),
          metric('Split later', 'Possible'),
        ],
        [
          'Strict module boundaries inside one deployable',
          'No network hops, no separate databases, no extra operations burden',
        ],
        'A module boundary is only real if the code enforces it: orders reaching into payments\' tables breaks the whole idea.',
        'A modular monolith keeps one deploy and draws the split lines early.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'Modular Monolith', 260, 150, { status: 'healthy', sublabel: 'Strict modules' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: 'One, for now' }),
          ],
          edges: [
            edge('client', 'server', 'Request'),
            edge('server', 'db', 'Query'),
          ],
          activeNodeIds: ['server'],
          activeEdgeIds: ['client->server', 'server->db'],
          caption: 'Strict modules inside one deployable, ready to split later if needed.',
        },
      ),
    ],
    summary:
      'A monolith is one deployable with in-process calls: simple to build, test, and run, and the right choice for most new products. Microservices split the system by business capability so teams can deploy and scale independently — but every split adds network calls, failure modes, and operational work. The modular monolith sits between them: strict module boundaries inside one deployable, ready to split later. Choose by team size and scaling need, not by fashion. ' +
      ILLUSTRATIVE,
  },
  l29: {
    id: 'l29',
    chapterId: 'architecture',
    number: 29,
    title: 'API Gateway and Service Discovery',
    durationMin: 12,
    difficulty: 'Advanced',
    intro: 'One front door for many services, and how services find each other.',
    objectives: [
      'Explain what an API gateway does and why clients talk to it instead of services',
      'Describe routing: sending each request to the right service',
      'Name the cross-cutting jobs a gateway handles: auth, rate limiting, logging',
      'Explain how a service registry tracks which service instances are alive',
      'Describe how health checks keep dead instances out of traffic',
      'Explain why the gateway itself must run as several copies',
    ],
    steps: [
      step(
        's1',
        'Many services, no front door',
        'Imagine a shop built from twenty services: users, orders, payments, search, and more, each with its own address. Without a front door, every client must know every address, handle every failure, and repeat the same login check for each service. Adding a service means updating every client. The clients end up carrying knowledge about the system\'s insides, and that knowledge goes stale the moment a service moves or changes its address.',
        [
          metric('Services', '20'),
          metric('Addresses a client knows', '20'),
          metric('Login checks per request', '20'),
        ],
        [
          'Twenty services, each with its own address',
          'Every client must know every address and repeat the login check',
        ],
        'Clients end up carrying knowledge about the system\'s insides, and that knowledge goes stale the moment a service moves.',
        'Without a front door, every client knows too much about the system.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'Knows 20 addresses' }),
            node('users', 'service', 'Users', 260, 40, { status: 'healthy' }),
            node('orders', 'service', 'Orders', 260, 150, { status: 'healthy' }),
            node('payments', 'service', 'Payments', 260, 260, { status: 'healthy' }),
          ],
          edges: [
            edge('client', 'users', 'Direct call'),
            edge('client', 'orders', 'Direct call'),
            edge('client', 'payments', 'Direct call'),
          ],
          activeNodeIds: ['client'],
          activeEdgeIds: ['client->users', 'client->orders', 'client->payments'],
          caption: 'The client talks directly to every service and must know each address.',
        },
      ),
      step(
        's2',
        'The gateway arrives',
        'An API gateway is the single front door. Clients talk only to the gateway, and it routes each request to the right service: /orders goes to the orders service, /payments to payments. One place also handles the cross-cutting jobs — checking login, enforcing rate limits, logging, and translating between versions. Services behind it stay simple, because they no longer repeat those jobs, and clients stay simple, because they only ever learn one address.',
        [
          metric('Addresses a client knows', '1'),
          metric('Login checks per request', '1'),
          metric('Gateway latency added', '5', 'ms'),
        ],
        [
          'One gateway becomes the only address clients need',
          'Login, rate limiting, and logging move into the gateway',
        ],
        'The gateway is the single front door: clients talk only to it, and it routes each request to the right service.',
        'One front door simplifies every client and every service behind it.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'Knows 1 address' }),
            node('gateway', 'gateway', 'API Gateway', 220, 150, { status: 'healthy', sublabel: 'One front door' }),
            node('orders', 'service', 'Orders', 460, 60, { status: 'healthy' }),
            node('payments', 'service', 'Payments', 460, 240, { status: 'healthy' }),
          ],
          edges: [
            edge('client', 'gateway', 'All requests'),
            edge('gateway', 'orders', '/orders'),
            edge('gateway', 'payments', '/payments'),
          ],
          activeNodeIds: ['gateway'],
          activeEdgeIds: ['client->gateway', 'gateway->orders', 'gateway->payments'],
          caption: 'The client talks only to the gateway, which routes to the right service.',
        },
      ),
      step(
        's3',
        'Routing in action',
        'Routing is the gateway\'s core job, and it is usually based on the request path or host. A request for /orders/42 goes to the orders service, while /search?q=shoes goes to search. The gateway can also split traffic: send one in ten requests to a new version of a service to test it on real users, or route mobile clients to a lighter response. Routing rules live in one place, so changing them is a configuration change, not a release of every client.',
        [
          metric('Routing rules', '1', 'place'),
          metric('Traffic to new version', '10', '%'),
          metric('Client releases to change routing', '0'),
        ],
        [
          'Requests route by path: /orders to orders, /search to search',
          'One in ten requests goes to a new version for a live test',
        ],
        'Routing rules live in one place, so changing them is a configuration change, not a release of every client.',
        'Routing by path turns one address into many services.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy' }),
            node('gateway', 'gateway', 'API Gateway', 220, 150, { status: 'healthy', sublabel: 'Routes by path' }),
            node('search', 'service', 'Search', 460, 60, { status: 'healthy', sublabel: '/search' }),
            node('orders', 'service', 'Orders', 460, 240, { status: 'healthy', sublabel: '/orders' }),
          ],
          edges: [
            edge('client', 'gateway', '/search?q=shoes'),
            edge('gateway', 'search', 'Search request'),
            edge('gateway', 'orders', '/orders/42'),
          ],
          activeNodeIds: ['gateway', 'search', 'orders'],
          activeEdgeIds: ['client->gateway', 'gateway->search', 'gateway->orders'],
          caption: 'The gateway routes a search request to search and an order request to orders.',
        },
      ),
      step(
        's4',
        'Service discovery: finding the services',
        'Services come and go: they scale up, crash, and restart on new machines with new addresses. Service discovery keeps a registry — a live list of which instances of each service are running and where. Each service registers itself when it starts and sends regular heartbeats; the registry removes any instance whose heartbeat stops. The gateway asks the registry where the orders service lives right now, instead of trusting an address written down months ago.',
        [
          metric('Orders instances', '3'),
          metric('Heartbeat interval', '10', 's'),
          metric('Dead instance removed in', '~30', 's'),
        ],
        [
          'A registry holds a live list of running service instances',
          'Each service registers on start and sends regular heartbeats',
        ],
        'The registry removes any instance whose heartbeat stops, so the gateway never routes to a dead service.',
        'Discovery answers one question: where does this service live right now?',
        {
          nodes: [
            node('gateway', 'gateway', 'API Gateway', 20, 150, { status: 'healthy', sublabel: 'Asks the registry' }),
            node('registry', 'server', 'Service Registry', 260, 40, { status: 'healthy', sublabel: 'Live list' }),
            node('orders', 'service', 'Orders ×3', 480, 150, { status: 'healthy', sublabel: 'Heartbeats every 10 s' }),
          ],
          edges: [
            edge('gateway', 'registry', 'Where is orders?'),
            edge('registry', 'gateway', 'Instance list', 'response'),
            edge('orders', 'registry', 'Registers + heartbeat', 'async'),
          ],
          activeNodeIds: ['gateway', 'registry', 'orders'],
          activeEdgeIds: ['gateway->registry', 'registry->gateway', 'orders->registry'],
          caption: 'Services register with heartbeats, and the gateway asks the registry where they live.',
        },
      ),
      step(
        's5',
        'The gateway is a risk too',
        'The gateway is powerful, so it is also a risk. If it goes down, every service behind it becomes unreachable, so gateways run as several copies behind a load balancer, with no state of their own. The registry has the same rule: it must stay available, or nothing can be found. Keep the gateway thin, too — business logic belongs in the services, not in the front door, or the gateway quietly becomes the monolith you were trying to escape.',
        [
          metric('Gateway copies', '3'),
          metric('Gateway state', 'None'),
          metric('Business logic in gateway', '0'),
        ],
        [
          'The gateway runs as three copies behind a load balancer',
          'Business logic stays in the services, not in the front door',
        ],
        'If the gateway goes down, every service behind it becomes unreachable — so it runs as several stateless copies.',
        'A front door must not become a single point of failure.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy' }),
            node('gw1', 'gateway', 'Gateway 1', 220, 60, { status: 'healthy', sublabel: 'Stateless' }),
            node('gw2', 'gateway', 'Gateway 2', 220, 240, { status: 'healthy', sublabel: 'Stateless' }),
            node('orders', 'service', 'Orders', 480, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('client', 'gw1', 'Requests'),
            edge('client', 'gw2', 'Requests'),
            edge('gw1', 'orders', 'Routed'),
            edge('gw2', 'orders', 'Routed'),
          ],
          activeNodeIds: ['gw1', 'gw2'],
          activeEdgeIds: ['client->gw1', 'client->gw2', 'gw1->orders', 'gw2->orders'],
          caption: 'Two stateless gateway copies share traffic, so one can fail safely.',
        },
      ),
    ],
    summary:
      'A gateway gives many services one front door: clients learn a single address, and the gateway routes requests, checks login, and enforces rate limits in one place. Service discovery keeps a live registry of running instances, with heartbeats removing the dead, so the gateway always routes to a service that exists right now. The gateway and registry are themselves critical infrastructure: run several copies, keep them stateless, and keep business logic in the services. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['networking-fundamentals'],
  },
  l30: {
    id: 'l30',
    chapterId: 'architecture',
    number: 30,
    title: 'Distributed Transactions and Sagas',
    durationMin: 14,
    difficulty: 'Advanced',
    intro: 'Keeping several services consistent without a single database transaction.',
    objectives: [
      'Explain why one database transaction cannot span several services',
      'Describe two-phase commit and why it blocks when a coordinator fails',
      'Explain a saga: local transactions plus compensating actions',
      'Compare choreography and orchestration for running a saga',
      'Describe what happens when a saga step fails midway',
      'Explain why saga steps must be idempotent so retries are safe',
    ],
    steps: [
      step(
        's1',
        'One order, three services',
        'A customer places an order, and three services must agree: orders records it, payments charges the card, and inventory reserves the item. In a monolith one database transaction would do all three or none of them. Across services there is no shared transaction: each service owns its own database, and no single commit can span them. Either the system accepts partial outcomes and cleans them up, or it invents a new way to coordinate.',
        [
          metric('Services in one order', '3'),
          metric('Databases in one order', '3'),
          metric('Shared transactions', '0'),
        ],
        [
          'One order touches orders, payments, and inventory',
          'Each service owns its own database, so no single commit spans them',
        ],
        'In a monolith one database transaction would do all three steps or none of them — across services, that option does not exist.',
        'No shared database means no shared transaction.',
        {
          nodes: [
            node('client', 'client', 'Customer', 20, 150, { status: 'healthy', sublabel: 'Places an order' }),
            node('orders', 'service', 'Orders', 260, 40, { status: 'healthy', sublabel: 'Records the order' }),
            node('payments', 'service', 'Payments', 260, 150, { status: 'healthy', sublabel: 'Charges the card' }),
            node('inventory', 'service', 'Inventory', 260, 260, { status: 'healthy', sublabel: 'Reserves the item' }),
          ],
          edges: [
            edge('client', 'orders', 'Place order'),
            edge('orders', 'payments', 'Charge card'),
            edge('payments', 'inventory', 'Reserve item'),
          ],
          activeNodeIds: ['orders', 'payments', 'inventory'],
          activeEdgeIds: ['client->orders', 'orders->payments', 'payments->inventory'],
          caption: 'One order flows through three services, each with its own database.',
        },
      ),
      step(
        's2',
        'Two-phase commit: the textbook answer',
        'Two-phase commit is the textbook answer: a coordinator asks every service to prepare, and only if all say yes does it tell them to commit. It gives strong consistency, but it has a hard edge. While a service waits for the coordinator\'s decision, it holds locks on the rows involved, and if the coordinator crashes mid-way, those services are stuck waiting. That blocking, plus the need for every database to support the protocol, is why two-phase commit is rare between microservices.',
        [
          metric('Coordinator', '1'),
          metric('Phases', '2'),
          metric('If coordinator crashes', 'Services block'),
        ],
        [
          'A coordinator asks every service to prepare, then to commit',
          'Services hold locks while waiting for the coordinator\'s decision',
        ],
        'If the coordinator crashes mid-way, the services are stuck waiting — that blocking is why two-phase commit is rare between microservices.',
        'Two-phase commit buys consistency with blocking locks.',
        {
          nodes: [
            node('coordinator', 'server', 'Coordinator', 20, 150, { status: 'healthy', sublabel: 'Asks, then decides' }),
            node('orders', 'service', 'Orders', 260, 40, { status: 'busy', sublabel: 'Prepared · locked' }),
            node('payments', 'service', 'Payments', 260, 150, { status: 'busy', sublabel: 'Prepared · locked' }),
            node('inventory', 'service', 'Inventory', 260, 260, { status: 'busy', sublabel: 'Prepared · locked' }),
          ],
          edges: [
            edge('coordinator', 'orders', 'Prepare?'),
            edge('coordinator', 'payments', 'Prepare?'),
            edge('coordinator', 'inventory', 'Prepare?'),
          ],
          activeNodeIds: ['coordinator', 'orders', 'payments', 'inventory'],
          activeEdgeIds: ['coordinator->orders', 'coordinator->payments', 'coordinator->inventory'],
          caption: 'The coordinator asks every service to prepare, and all three wait holding locks.',
        },
      ),
      step(
        's3',
        'A saga: steps with a way back',
        'A saga breaks the work into a chain of small local transactions, one per service, each with a compensating action that undoes it. The order service creates the order, the payment service charges the card, and inventory reserves the item. If inventory fails, the saga runs the compensations in reverse: refund the payment, then cancel the order. The system is consistent in the end, but there is a window where the order exists and the payment has not yet been refunded.',
        [
          metric('Local transactions', '3'),
          metric('Compensating actions', '3'),
          metric('Window of partial state', 'Seconds'),
        ],
        [
          'The order breaks into three local transactions',
          'If inventory fails, compensations run in reverse: refund, then cancel',
        ],
        'A compensating action undoes a step that already committed — it is a new business action, like a refund, not a database rollback.',
        'A saga accepts a window of partial state in exchange for no blocking.',
        {
          nodes: [
            node('orders', 'service', 'Orders', 20, 150, { status: 'healthy', sublabel: 'Step 1 done' }),
            node('payments', 'service', 'Payments', 260, 150, { status: 'healthy', sublabel: 'Step 2 done' }),
            node('inventory', 'service', 'Inventory', 500, 150, { status: 'degraded', sublabel: 'Step 3 fails' }),
          ],
          edges: [
            edge('orders', 'payments', 'Step 2: charge'),
            edge('payments', 'inventory', 'Step 3: reserve'),
            edge('inventory', 'payments', 'Fails → refund', 'response'),
          ],
          activeNodeIds: ['inventory', 'payments'],
          activeEdgeIds: ['orders->payments', 'payments->inventory', 'inventory->payments'],
          caption: 'Inventory fails, so the saga compensates by refunding the payment.',
        },
      ),
      step(
        's4',
        'Choreography: no boss, just events',
        'In a choreographed saga there is no boss: services react to each other\'s events. The order service publishes OrderCreated, the payment service hears it and charges the card, then publishes PaymentTaken, and inventory hears that and reserves the item. If a step fails, it publishes a failure event and the services that already acted run their compensations. Choreography is simple to start and hard to follow: the flow lives in no single place, so understanding an order\'s journey means reading every service.',
        [
          metric('Coordinator', '0'),
          metric('Events per order', '3'),
          metric('Place the flow lives', 'Nowhere central'),
        ],
        [
          'Services react to each other\'s events, with no coordinator',
          'A failure event triggers compensations in the services that acted',
        ],
        'Choreography is simple to start and hard to follow: the flow lives in no single place, so understanding one order means reading every service.',
        'In choreography, events are the coordinator.',
        {
          nodes: [
            node('orders', 'service', 'Orders', 20, 150, { status: 'healthy', sublabel: 'Publishes event' }),
            node('queue', 'queue', 'Event Bus', 260, 150, { status: 'healthy', sublabel: 'OrderCreated' }),
            node('payments', 'service', 'Payments', 500, 40, { status: 'healthy', sublabel: 'Hears it, charges' }),
            node('inventory', 'service', 'Inventory', 500, 240, { status: 'healthy', sublabel: 'Hears it, reserves' }),
          ],
          edges: [
            edge('orders', 'queue', 'OrderCreated', 'async'),
            edge('queue', 'payments', 'Payment hears it'),
            edge('payments', 'queue', 'PaymentTaken', 'async'),
            edge('queue', 'inventory', 'Inventory hears it'),
          ],
          activeNodeIds: ['orders', 'queue', 'payments', 'inventory'],
          activeEdgeIds: ['orders->queue', 'queue->payments', 'payments->queue', 'queue->inventory'],
          caption: 'Services react to events on a bus, with no central coordinator.',
        },
      ),
      step(
        's5',
        'Orchestration: one coordinator in charge',
        'An orchestrated saga puts one coordinator in charge. The orchestrator calls the order service, then payments, then inventory, and it remembers exactly which step the saga has reached. When a step fails, the orchestrator runs the compensations in reverse order, and it can retry a step that failed for a passing reason, like a brief network blip. The flow is easy to read and debug, but the orchestrator itself must be reliable — if it crashes, sagas in flight need to resume from where they stopped.',
        [
          metric('Coordinator', '1'),
          metric('Steps tracked', '3'),
          metric('Retries a failed step', 'Yes'),
        ],
        [
          'One orchestrator calls each service in order and tracks progress',
          'On failure it runs compensations in reverse and can retry a step',
        ],
        'If the orchestrator crashes, sagas in flight need to resume from where they stopped — so its own state must survive a restart.',
        'Orchestration trades a central coordinator for a readable flow.',
        {
          nodes: [
            node('orchestrator', 'server', 'Orchestrator', 20, 150, { status: 'healthy', sublabel: 'Tracks each step' }),
            node('orders', 'service', 'Orders', 260, 40, { status: 'healthy', sublabel: 'Step 1' }),
            node('payments', 'service', 'Payments', 260, 150, { status: 'healthy', sublabel: 'Step 2' }),
            node('inventory', 'service', 'Inventory', 260, 260, { status: 'healthy', sublabel: 'Step 3' }),
          ],
          edges: [
            edge('orchestrator', 'orders', 'Step 1'),
            edge('orchestrator', 'payments', 'Step 2'),
            edge('orchestrator', 'inventory', 'Step 3'),
          ],
          activeNodeIds: ['orchestrator', 'orders', 'payments', 'inventory'],
          activeEdgeIds: ['orchestrator->orders', 'orchestrator->payments', 'orchestrator->inventory'],
          caption: 'One orchestrator calls each service in order and tracks the saga’s progress.',
        },
      ),
      step(
        's6',
        'Retries must be safe: idempotency',
        'Sagas only work if their steps are safe to retry. A payment step that runs twice must not charge the card twice, so every step carries an idempotency key — a unique id for that step — and the service ignores a repeat with the same key. Compensations need the same care: refunding twice is as bad as charging twice. Finally, remember that compensations are business decisions, not database rollbacks: a refunded order may still need an email, a restocked item, and a note on the customer\'s account.',
        [
          metric('Idempotency key per step', '1'),
          metric('Charges for one retry', '1'),
          metric('Refunds for one failure', '1'),
        ],
        [
          'Every step carries an idempotency key; repeats are ignored',
          'Compensations need the same care: refunding twice is as bad as charging twice',
        ],
        'A compensating action is a business decision, not a database rollback: a refunded order may still need an email and a restocked item.',
        'A saga step must be safe to run twice.',
        {
          nodes: [
            node('client', 'client', 'Client', 20, 150, { status: 'healthy', sublabel: 'Retries, key #42' }),
            node('payments', 'service', 'Payments', 260, 150, { status: 'healthy', sublabel: 'Same key: ignore' }),
            node('db', 'db', 'Payments DB', 500, 150, { status: 'healthy', sublabel: 'Charged once' }),
          ],
          edges: [
            edge('client', 'payments', 'Retry, key #42'),
            edge('payments', 'db', 'Charge once'),
          ],
          activeNodeIds: ['payments', 'db'],
          activeEdgeIds: ['client->payments', 'payments->db'],
          caption: 'A retried payment with the same idempotency key is charged only once.',
        },
      ),
    ],
    summary:
      'A transaction cannot span services that own separate databases, so two-phase commit\'s strong consistency comes with blocking locks and a fragile coordinator. A saga instead chains local transactions, each with a compensating action that undoes it, coordinated by events or by an orchestrator. The system ends up consistent, but there is a window of partial outcomes, and every step must be idempotent so retries and compensations are safe. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['database-scaling'],
  },
  l31: {
    id: 'l31',
    chapterId: 'architecture',
    number: 31,
    title: 'Eventual Consistency',
    durationMin: 12,
    difficulty: 'Advanced',
    intro: 'When "eventually" is a promise you can keep — and when it is not.',
    objectives: [
      'Define strong consistency and eventual consistency in plain terms',
      'State the CAP theorem carefully: it is about network partitions',
      'Explain why a system must choose between consistency and availability during a partition',
      'Describe how replicas converge after writes stop',
      'Explain read-your-writes and monotonic reads as session guarantees',
      'Decide when eventual consistency is unsafe and strong consistency is needed',
    ],
    steps: [
      step(
        's1',
        'Strong consistency: one truth, everywhere',
        'Strong consistency is the simple promise: once a write is acknowledged, every reader, everywhere, sees it. A user changes their name and every page shows the new name at once. That promise is easy to keep with one database, because there is only one copy to update. With copies on several machines, the promise gets expensive: every write must reach every copy before it can be acknowledged, and a slow copy slows every write.',
        [
          metric('Copies', '1'),
          metric('Readers see new write', 'Immediately'),
          metric('Cost of a slow copy', 'Every write waits'),
        ],
        [
          'One database, one copy, one truth for every reader',
          'Every write must reach every copy before it is acknowledged',
        ],
        'Strong consistency is easy with one database, because there is only one copy to update — with several copies, a slow one slows every write.',
        'Strong consistency means every reader sees the latest write.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Changes name' }),
            node('server', 'server', 'App Server', 260, 150, { status: 'healthy' }),
            node('db', 'db', 'Database', 500, 150, { status: 'healthy', sublabel: 'One copy' }),
          ],
          edges: [
            edge('user', 'server', 'Write'),
            edge('server', 'db', 'Write + read, same copy'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'One database holds the only copy, so every reader sees the same truth.',
        },
      ),
      step(
        's2',
        'A partition forces a choice',
        'The CAP theorem describes what happens when the network splits: the link between two data centers goes down, and each side can still serve its own users. In that moment a system cannot guarantee both consistency and availability: it must either refuse writes until the link returns, staying consistent but unavailable, or accept writes on both sides, staying available but letting the copies diverge. The theorem is about partitions, not everyday operation — when the network is healthy, a system can be both consistent and available.',
        [
          metric('Data centers', '2'),
          metric('Link between them', 'Down'),
          metric('Guarantee during partition', 'Pick one'),
        ],
        [
          'The network splits and each side keeps serving its own users',
          'The system must choose: refuse writes, or let the copies diverge',
        ],
        'CAP is about partitions, not everyday operation — when the network is healthy, a system can be both consistent and available.',
        'During a partition, consistency and availability cannot both be guaranteed.',
        {
          nodes: [
            node('client', 'client', 'Users', 20, 150, { status: 'healthy', sublabel: 'Both sides served' }),
            node('dc-a', 'db', 'Data Center A', 280, 40, { status: 'degraded', sublabel: 'Accepts writes' }),
            node('dc-b', 'db', 'Data Center B', 280, 240, { status: 'degraded', sublabel: 'Accepts writes' }),
          ],
          edges: [
            edge('client', 'dc-a', 'Writes'),
            edge('client', 'dc-b', 'Writes'),
            edge('dc-a', 'dc-b', 'Link down', 'replication'),
          ],
          activeNodeIds: ['dc-a', 'dc-b'],
          activeEdgeIds: ['dc-a->dc-b'],
          caption: 'The link between two data centers is down, and each side keeps accepting writes.',
        },
      ),
      step(
        's3',
        'Eventual consistency: converge later',
        'Eventual consistency chooses availability: writes are accepted on one copy and spread to the others afterwards. For a short window the copies disagree — a new post is visible in one region and not yet in another — but if writes stop, the copies converge and agree. That window is usually milliseconds, and most users never notice it. The promise is real but limited: eventually means the copies will agree, not that any particular reader will see the newest value right now.',
        [
          metric('Copies', '2+'),
          metric('Window of disagreement', 'Milliseconds'),
          metric('Copies agree when', 'Writes stop'),
        ],
        [
          'Writes land on one copy and spread to the others afterwards',
          'Copies disagree briefly, then converge once writes stop',
        ],
        'Eventually means the copies will agree — not that any particular reader will see the newest value right now.',
        'Eventual consistency trades a short window of disagreement for availability.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('primary', 'db', 'Primary', 260, 40, { status: 'healthy', sublabel: 'Has the new post' }),
            node('replica', 'db', 'Replica', 260, 240, { status: 'degraded', sublabel: 'Not yet copied' }),
          ],
          edges: [
            edge('server', 'primary', 'Write'),
            edge('primary', 'replica', 'Copies later', 'replication'),
          ],
          activeNodeIds: ['primary', 'replica'],
          activeEdgeIds: ['server->primary', 'primary->replica'],
          caption: 'A write lands on the primary and reaches the replica a moment later.',
        },
      ),
      step(
        's4',
        'Session guarantees: hiding the strangeness',
        'Raw eventual consistency can feel broken to one user, so systems offer session guarantees — promises that hold for a single user\'s session. Read-your-writes means a user always sees their own changes: after posting, their own feed shows the post, even if other users see it a moment later. Monotonic reads means a user never goes backwards: once they have seen version five of a page, they never see version four again. These small guarantees hide most of the strangeness of eventual consistency.',
        [
          metric('Read-your-writes', 'Guaranteed'),
          metric('Monotonic reads', 'Guaranteed'),
          metric('Applies to', 'One session'),
        ],
        [
          'Read-your-writes: a user always sees their own changes',
          'Monotonic reads: a user never sees an older version after a newer one',
        ],
        'Session guarantees hold for a single user\'s session — they do not promise that two different users see the same thing at the same moment.',
        'Small per-user promises make eventual consistency feel solid.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Sees own post' }),
            node('server', 'server', 'App Server', 260, 150, { status: 'healthy', sublabel: 'Routes own reads' }),
            node('primary', 'db', 'Primary', 500, 40, { status: 'healthy', sublabel: 'Own reads go here' }),
            node('replica', 'db', 'Replica', 500, 240, { status: 'healthy', sublabel: 'Others read here' }),
          ],
          edges: [
            edge('user', 'server', 'Reloads feed'),
            edge('server', 'primary', 'Read-your-writes'),
            edge('server', 'replica', 'Other users read here'),
          ],
          activeNodeIds: ['user', 'server', 'primary'],
          activeEdgeIds: ['user->server', 'server->primary', 'server->replica'],
          caption: 'A user’s own reads go to the primary, so they always see their own changes.',
        },
      ),
      step(
        's5',
        'When eventual is not enough',
        'Some data cannot wait for eventually. A bank balance, a seat on a flight, or the last item in stock must be right now, not after convergence — two people buying the last ticket cannot both succeed. For that data, use strong consistency: a single writer, a transaction, or a lock. The art is in splitting the system: strongly consistent where correctness is non-negotiable, eventually consistent where a short delay is harmless, like a like count or a comment feed.',
        [
          metric('Must be exact', 'Balance, seats, stock'),
          metric('Delay is harmless', 'Likes, comments'),
          metric('Two buyers, one ticket', 'One succeeds'),
        ],
        [
          'Money, seats, and stock must be right now, not after convergence',
          'The system splits: strong where correctness is non-negotiable',
        ],
        'Two people buying the last ticket cannot both succeed — that is the test for whether data needs strong consistency.',
        'Use strong consistency where being wrong costs money; eventual where delay is harmless.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Two buyers, one ticket' }),
            node('server', 'server', 'App Server', 260, 150, { status: 'healthy', sublabel: 'Splits the data' }),
            node('ledger', 'db', 'Ledger', 500, 40, { status: 'healthy', sublabel: 'Strong: balance' }),
            node('feed', 'db', 'Feed', 500, 240, { status: 'healthy', sublabel: 'Eventual: likes' }),
          ],
          edges: [
            edge('user', 'server', 'Buy + like'),
            edge('server', 'ledger', 'Must be exact'),
            edge('server', 'feed', 'Delay is fine'),
          ],
          activeNodeIds: ['ledger', 'feed'],
          activeEdgeIds: ['user->server', 'server->ledger', 'server->feed'],
          caption: 'The ledger is strongly consistent while the feed is eventually consistent.',
        },
      ),
    ],
    summary:
      'Strong consistency promises every reader sees the latest write at once, and it is easy with one copy and expensive with many. During a network partition, the CAP theorem says a system cannot guarantee both consistency and availability: it must pick. Eventual consistency picks availability, accepts a short window of disagreement, and converges — with session guarantees like read-your-writes hiding most of the strangeness, and strong consistency reserved for data that must be right now. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['database-scaling'],
  },
  l32: {
    id: 'l32',
    chapterId: 'security',
    number: 32,
    title: 'Authentication and Authorization',
    durationMin: 12,
    difficulty: 'Intermediate',
    intro: 'Proving identity, then proving permission — two different jobs.',
    objectives: [
      'Tell authentication apart from authorization, in plain terms',
      'Explain how server-side sessions work and how they are revoked',
      'Explain how signed tokens work and why they are short-lived',
      'Describe the OAuth 2.0 and OpenID Connect flow at a conceptual level',
      'Compare role-based and attribute-based access control',
      'Apply least privilege when deciding what a user may do',
    ],
    steps: [
      step(
        's1',
        'Two different questions',
        'Authentication and authorization sound alike, but they answer different questions. Authentication is proving who you are: a password, a fingerprint, or a login with another provider. Authorization is proving what you may do once you are known: can this user read this document, delete this project, or refund this order? Mixing them up is how systems end up checking that a user is logged in but never checking whether they are allowed to do what they asked.',
        [
          metric('Authentication answers', 'Who are you?'),
          metric('Authorization answers', 'What may you do?'),
          metric('Checks needed', '2'),
        ],
        [
          'Authentication proves identity; authorization proves permission',
          'A logged-in user is not automatically allowed to do everything',
        ],
        'Checking that a user is logged in is not the same as checking whether they are allowed to do what they asked.',
        'Identity and permission are two separate checks.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Who are you?' }),
            node('server', 'server', 'App Server', 260, 150, { status: 'healthy', sublabel: 'Checks identity' }),
            node('db', 'db', 'Permissions', 500, 150, { status: 'healthy', sublabel: 'What may they do?' }),
          ],
          edges: [
            edge('user', 'server', 'Login'),
            edge('server', 'db', 'Check permission'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'The server first checks who the user is, then what they may do.',
        },
      ),
      step(
        's2',
        'Sessions: the server remembers',
        'The oldest pattern is the session. A user logs in, the server creates a session record — a random id tied to that user — stores it in its database, and hands the id back in a cookie. Every later request carries the cookie, and the server looks the session up. Logging out deletes the record, which ends the session everywhere at once. Sessions are simple and easy to revoke, but the server must store them, and a fleet of servers must share that store.',
        [
          metric('Stored on', 'Server'),
          metric('Carried by client', 'Cookie'),
          metric('Logout ends session', 'Everywhere at once'),
        ],
        [
          'Login creates a session record tied to the user',
          'Logout deletes the record, ending the session everywhere',
        ],
        'A fleet of servers must share the session store, or a user\'s next request may land on a server that does not know them.',
        'Sessions are simple to revoke because the server holds the record.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy', sublabel: 'Holds a cookie' }),
            node('server', 'server', 'App Server', 260, 150, { status: 'healthy', sublabel: 'Looks up session' }),
            node('db', 'db', 'Session Store', 500, 150, { status: 'healthy', sublabel: 'Session records' }),
          ],
          edges: [
            edge('client', 'server', 'Cookie: session id'),
            edge('server', 'db', 'Look up session'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['client->server', 'server->db'],
          caption: 'The browser sends a session cookie and the server looks it up in the store.',
        },
      ),
      step(
        's3',
        'Tokens: the client carries proof',
        'Tokens flip the model: instead of looking a session up, the server hands the client a signed token — commonly a JSON Web Token — that carries the user\'s id and expiry inside it. Any server can verify the signature without a database lookup, which is why tokens suit services spread across machines. The trade-off is revocation: a token stays valid until it expires, so tokens are kept short-lived, often minutes, and refreshed with a separate refresh token that the server can revoke.',
        [
          metric('Stored on', 'Client'),
          metric('Server lookup per request', 'None'),
          metric('Token lifetime', 'Minutes'),
        ],
        [
          'A signed token carries the user id and expiry inside it',
          'Any server can verify the signature without a database lookup',
        ],
        'A token stays valid until it expires, so tokens are kept short-lived and refreshed with a separate refresh token the server can revoke.',
        'Tokens trade easy revocation for no server-side lookup.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy', sublabel: 'Holds a token' }),
            node('server', 'server', 'API Server', 260, 150, { status: 'healthy', sublabel: 'Verifies signature' }),
            node('orders', 'service', 'Orders Service', 500, 150, { status: 'healthy', sublabel: 'Accepts token' }),
          ],
          edges: [
            edge('client', 'server', 'Bearer token'),
            edge('server', 'orders', 'Verified'),
          ],
          activeNodeIds: ['server', 'orders'],
          activeEdgeIds: ['client->server', 'server->orders'],
          caption: 'The browser sends a signed token that any server can verify.',
        },
      ),
      step(
        's4',
        'Logging in with another provider',
        'OAuth 2.0 lets a user log in with an account they already have, without giving your app their password. The user is sent to the provider — say, their email or code-hosting account — approves access, and the provider sends your app a short-lived authorization code, which your server exchanges for tokens. OpenID Connect adds an identity layer on top: an ID token that says who the user is. Your app never sees the password, and the user can revoke access from the provider at any time.',
        [
          metric('Password your app sees', 'None'),
          metric('Authorization code lifetime', 'Minutes'),
          metric('User can revoke access', 'Any time'),
        ],
        [
          'The user approves access at the provider, not in your app',
          'Your server exchanges a short-lived code for tokens',
        ],
        'OpenID Connect adds an identity layer on top of OAuth 2.0: an ID token that says who the user is.',
        'Delegated login means your app never touches the password.',
        {
          nodes: [
            node('user', 'user', 'User', 20, 150, { status: 'healthy', sublabel: 'Logs in there' }),
            node('provider', 'server', 'Login Provider', 260, 40, { status: 'healthy', sublabel: 'Approves access' }),
            node('app', 'server', 'Your App', 260, 240, { status: 'healthy', sublabel: 'Exchanges code' }),
          ],
          edges: [
            edge('user', 'provider', 'Logs in + approves'),
            edge('provider', 'app', 'Authorization code', 'response'),
            edge('app', 'user', 'Logged in', 'response'),
          ],
          activeNodeIds: ['provider', 'app'],
          activeEdgeIds: ['user->provider', 'provider->app', 'app->user'],
          caption: 'The user approves at the provider, which sends the app a code to exchange for tokens.',
        },
      ),
      step(
        's5',
        'Who may do what: roles and attributes',
        'Once identity is settled, authorization decides what each user may do. Role-based access control gives users roles — admin, editor, viewer — and each role carries a fixed set of permissions; it is simple, but roles multiply as products grow. Attribute-based access control decides from attributes instead: the user\'s department, the document\'s owner, the time of day. It is more flexible but harder to reason about. Either way, the rule is least privilege: give each user only the permissions their job needs.',
        [
          metric('Role-based', 'Admin, editor, viewer'),
          metric('Attribute-based', 'Department, owner, time'),
          metric('Rule', 'Least privilege'),
        ],
        [
          'Roles carry fixed sets of permissions; attributes decide case by case',
          'Least privilege: only the permissions the job needs',
        ],
        'Roles are simple but multiply as products grow; attributes are more flexible but harder to reason about.',
        'Authorization is decided per user, per action — never assumed.',
        {
          nodes: [
            node('admin', 'user', 'Admin', 20, 40, { status: 'healthy', sublabel: 'Can delete' }),
            node('editor', 'user', 'Editor', 20, 240, { status: 'healthy', sublabel: 'Can edit only' }),
            node('server', 'server', 'App Server', 300, 150, { status: 'healthy', sublabel: 'Checks permission' }),
            node('db', 'db', 'Documents', 520, 150, { status: 'healthy' }),
          ],
          edges: [
            edge('admin', 'server', 'Delete request'),
            edge('editor', 'server', 'Edit request'),
            edge('server', 'db', 'Allowed actions only'),
          ],
          activeNodeIds: ['admin', 'editor', 'server'],
          activeEdgeIds: ['admin->server', 'editor->server', 'server->db'],
          caption: 'An admin may delete while an editor may only edit, and the server enforces it.',
        },
      ),
    ],
    summary:
      'Authentication proves who you are; authorization proves what you may do — two different jobs, and a system must do both. Sessions store state on the server and revoke cleanly; signed tokens verify without a lookup but need short lifetimes and refresh tokens. OAuth 2.0 with OpenID Connect lets users sign in through a provider they trust, and roles or attributes then decide permissions under the rule of least privilege. ' +
      ILLUSTRATIVE,
  },
};
