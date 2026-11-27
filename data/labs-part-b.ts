/*
 * Guided labs, part B — chapters 4–6 (Communication, Reliability,
 * Architecture). Labs lab-4 (Decouple with a Queue), lab-5 (Break It
 * on Purpose) and lab-6 (Split the Monolith). Each lab follows the
 * Lab shape in lib/types.ts: goal, whyItMatters, 4 plain-language
 * steps (each with a hint), a starter template, auto checks plus
 * labelled self-checks, and a solution template. All numbers are
 * illustrative examples, never measurements from a real system.
 */

import type { Lab } from '@/lib/types';

export const labsPartB: Lab[] = [
  {
    id: 'lab-4',
    chapterId: 'communication',
    number: 4,
    title: 'Decouple with a Queue',
    goal: 'Put a queue between the app and the worker so a slow job never blocks the user.',
    whyItMatters:
      'Without a queue, the app waits for every slow job before it can answer the user. With one, the user gets an answer at once and the work happens behind the scenes.',
    difficulty: 'Intermediate',
    estMin: 20,
    steps: [
      {
        id: 's1',
        title: 'Add a Queue',
        instruction:
          'Add a Queue to the canvas, to the right of the App Server. A queue is a waiting line for jobs: work goes in one end and comes out the other when a worker is free.',
        hint: 'Find the Queue card in the Messaging group of the palette.',
        paletteItemId: 'queue',
      },
      {
        id: 's2',
        title: 'Connect the App Server to the Queue',
        instruction:
          'Draw an edge from the App Server to the Queue. Now, instead of doing slow work itself, the server can drop a job into the queue and move on.',
        hint: 'Drag from the App Server to the Queue to draw the edge.',
      },
      {
        id: 's3',
        title: 'Add a worker Microservice',
        instruction:
          'Add a Microservice below the Queue. This is the worker: its only job is to take jobs out of the queue, one at a time, and do them.',
        hint: 'Use the Microservice card in the Application group of the palette.',
        paletteItemId: 'microservice',
      },
      {
        id: 's4',
        title: 'Connect the Queue to the worker, and the worker to the Database',
        instruction:
          'Draw an edge from the Queue to the worker, then an edge from the worker to the SQL Database. The job now travels from the queue, through the worker, to the database.',
        hint: 'Check the path: App Server, then Queue, then worker, then Database.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'gateway', kind: 'gateway', label: 'API Gateway', x: 300, y: 160 },
        { id: 'server', kind: 'server', label: 'App Server', x: 560, y: 160 },
        { id: 'db', kind: 'db', label: 'SQL Database', x: 820, y: 160 },
      ],
      edges: [
        { from: 'users', to: 'gateway' },
        { from: 'gateway', to: 'server' },
        { from: 'server', to: 'db' },
      ],
    },
    checks: [
      {
        id: 'lab-4-check-1',
        kind: 'has-node',
        nodeKind: 'queue',
        minCount: 1,
        text: 'A Queue on the canvas',
      },
      {
        id: 'lab-4-check-2',
        kind: 'has-edge',
        fromKind: 'server',
        toKind: 'queue',
        text: 'The App Server connects to the Queue',
      },
      {
        id: 'lab-4-check-3',
        kind: 'has-path',
        fromKind: 'queue',
        toKind: 'db',
        text: 'A job can travel from the Queue to the Database',
      },
      {
        id: 'lab-4-check-4',
        kind: 'self',
        text: 'I can explain what happens to a message while the worker is busy',
      },
    ],
    solution: {
      title: 'Queue between the app and the worker',
      explanation:
        'Users reach the API Gateway, the Gateway reaches the App Server, and the App Server drops slow jobs into the Queue instead of doing them itself. The worker Microservice takes jobs out of the Queue one at a time and writes the result to the SQL Database. While the worker is busy, new jobs simply wait in the queue — the user never waits.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
          { id: 'gateway', kind: 'gateway', label: 'API Gateway', x: 300, y: 160 },
          { id: 'server', kind: 'server', label: 'App Server', x: 560, y: 160 },
          { id: 'queue', kind: 'queue', label: 'Queue', x: 820, y: 160 },
          {
            id: 'worker',
            kind: 'service',
            label: 'Microservice',
            x: 560,
            y: 320,
            description: 'Worker — takes jobs out of the queue one at a time.',
          },
          { id: 'db', kind: 'db', label: 'SQL Database', x: 820, y: 320 },
        ],
        edges: [
          { from: 'users', to: 'gateway' },
          { from: 'gateway', to: 'server' },
          { from: 'server', to: 'queue' },
          { from: 'queue', to: 'worker' },
          { from: 'worker', to: 'db' },
        ],
      },
    },
    relatedLessons: ['l20', 'l21', 'l22', 'l23'],
  },
  {
    id: 'lab-5',
    chapterId: 'reliability',
    number: 5,
    title: 'Break It on Purpose',
    goal: 'Build a system with no single point of failure, then kill one server on purpose and watch it keep working.',
    whyItMatters:
      'Things will fail. A system with a spare keeps serving users while you fix the broken part.',
    difficulty: 'Intermediate',
    estMin: 20,
    steps: [
      {
        id: 's1',
        title: 'Add a second App Server',
        instruction:
          'Add a second App Server and connect the Load Balancer to it. A spare is a second copy of the same thing, standing by in case the first one fails.',
        hint: 'Use the App Server card in the Application group of the palette.',
        paletteItemId: 'app-server',
      },
      {
        id: 's2',
        title: 'Add a second SQL Database',
        instruction:
          'Add a second SQL Database — a copy of the first one — and connect the App Server to it. Now both the servers and the data have a spare.',
        hint: 'Use the SQL Database card in the Storage group of the palette.',
        paletteItemId: 'sql-db',
      },
      {
        id: 's3',
        title: 'Run the node-failure scenario',
        instruction:
          'Run the node-failure scenario using the scenario control in the lab runner. It takes one server down on purpose, the way a real failure would.',
        hint: 'The scenario control sits with the lab runner — look for the scenario button, not the canvas.',
      },
      {
        id: 's4',
        title: 'Check that requests still reach the database',
        instruction:
          'Watch the requests: they should still reach the database, because the spare server carries the load while the broken one is down.',
        hint: 'Follow a request from Users, through the Load Balancer, to the spare server.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 160 },
        { id: 'server', kind: 'server', label: 'App Server', x: 560, y: 80 },
        { id: 'db', kind: 'db', label: 'SQL Database', x: 820, y: 80 },
      ],
      edges: [
        { from: 'users', to: 'lb' },
        { from: 'lb', to: 'server' },
        { from: 'server', to: 'db' },
      ],
    },
    checks: [
      {
        id: 'lab-5-check-1',
        kind: 'has-node',
        nodeKind: 'server',
        minCount: 2,
        text: 'At least two App Servers — one spare',
      },
      {
        id: 'lab-5-check-2',
        kind: 'has-node',
        nodeKind: 'db',
        minCount: 2,
        text: 'Two databases — the original and a copy',
      },
      {
        id: 'lab-5-check-4',
        kind: 'self',
        text: 'I watched the system keep working with one server down',
      },
    ],
    solution: {
      title: 'Two servers, two databases, no single point of failure',
      explanation:
        'Users reach the Load Balancer, and the Load Balancer spreads requests across two App Servers. Each server can reach a database, and the second database is a copy of the first. Kill one server and the other keeps answering; the system has no single part whose failure stops everything.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
          { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 160 },
          { id: 'server-1', kind: 'server', label: 'App Server', x: 560, y: 80 },
          {
            id: 'server-2',
            kind: 'server',
            label: 'App Server',
            x: 560,
            y: 320,
            description: 'Spare server — takes over if the first server fails.',
          },
          { id: 'db-1', kind: 'db', label: 'SQL Database', x: 820, y: 80 },
          {
            id: 'db-2',
            kind: 'db',
            label: 'SQL Database',
            x: 820,
            y: 320,
            description: 'Read copy of the main database.',
          },
        ],
        edges: [
          { from: 'users', to: 'lb' },
          { from: 'lb', to: 'server-1' },
          { from: 'lb', to: 'server-2' },
          { from: 'server-1', to: 'db-1' },
          { from: 'server-2', to: 'db-2' },
          { from: 'db-1', to: 'db-2', label: 'Replicated copy' },
        ],
      },
    },
    relatedLessons: ['l24', 'l25', 'l26', 'l27'],
  },
  {
    id: 'lab-6',
    chapterId: 'architecture',
    number: 6,
    title: 'Split the Monolith',
    goal: 'Split one big app into small services behind one front door, so each part can change on its own.',
    whyItMatters:
      'A monolith is simple until it is not — small services let teams move separately, but only if the seams are clean.',
    difficulty: 'Advanced',
    estMin: 25,
    steps: [
      {
        id: 's1',
        title: 'Add an API Gateway in front',
        instruction:
          'Add an API Gateway between Users and the App Server, and connect Users to the Gateway and the Gateway to the App Server. A gateway is one front door: every request comes in through it, and it sends each one to the right service.',
        hint: 'Use the API Gateway card in the Networking group of the palette.',
        paletteItemId: 'gateway',
      },
      {
        id: 's2',
        title: 'Add two Microservices — Orders and Users',
        instruction:
          'Add two Microservices: name one Orders and the other Users. Each service owns one job: Orders handles orders, Users handles accounts.',
        hint: 'Use the Microservice card twice, then rename each node to Orders and Users.',
        paletteItemId: 'microservice',
      },
      {
        id: 's3',
        title: 'Connect the Gateway to each service',
        instruction:
          'Draw an edge from the API Gateway to the Orders service, and another edge from the Gateway to the Users service. The Gateway now routes each request to the service that owns that job.',
        hint: 'The Gateway should have two edges going out — one to each service.',
      },
      {
        id: 's4',
        title: 'Connect each service to the Database',
        instruction:
          'Draw an edge from the Orders service to the SQL Database, and another from the Users service to the Database. Both services read and write the same database.',
        hint: 'The Database should have two edges coming in — one from each service.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'server', kind: 'server', label: 'Monolith App', x: 300, y: 160 },
        { id: 'db', kind: 'db', label: 'SQL Database', x: 560, y: 160 },
      ],
      edges: [
        { from: 'users', to: 'server' },
        { from: 'server', to: 'db' },
      ],
    },
    checks: [
      {
        id: 'lab-6-check-1',
        kind: 'has-node',
        nodeKind: 'gateway',
        minCount: 1,
        text: 'An API Gateway in front',
      },
      {
        id: 'lab-6-check-2',
        kind: 'has-node',
        nodeKind: 'service',
        minCount: 2,
        text: 'Two Microservices',
      },
      {
        id: 'lab-6-check-3',
        kind: 'has-edge',
        fromKind: 'gateway',
        toKind: 'service',
        text: 'The Gateway connects to a service',
      },
      {
        id: 'lab-6-check-4',
        kind: 'has-edge',
        fromKind: 'service',
        toKind: 'db',
        text: 'A service connects to the Database',
      },
      {
        id: 'lab-6-check-5',
        kind: 'self',
        text: 'I can say which service owns which job',
      },
    ],
    solution: {
      title: 'One front door, two services, one database',
      explanation:
        'Users reach the API Gateway, and the Gateway routes each request to the service that owns that job: Orders or Users. Each service talks to the same SQL Database. The old Monolith App node is gone — its work is now split between the two services, so each one can change on its own.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
          { id: 'gateway', kind: 'gateway', label: 'API Gateway', x: 300, y: 160 },
          // 'Orders' and 'Users' match no palette card, so the canvas
          // falls back to the default icon for kind 'service' — fine.
          { id: 'service-orders', kind: 'service', label: 'Orders', x: 560, y: 80 },
          { id: 'service-users', kind: 'service', label: 'Users', x: 560, y: 320 },
          { id: 'db', kind: 'db', label: 'SQL Database', x: 820, y: 200 },
        ],
        edges: [
          { from: 'users', to: 'gateway' },
          { from: 'gateway', to: 'service-orders' },
          { from: 'gateway', to: 'service-users' },
          { from: 'service-orders', to: 'db' },
          { from: 'service-users', to: 'db' },
        ],
      },
    },
    relatedLessons: ['l28', 'l29', 'l30', 'l31'],
  },
];
