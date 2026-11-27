/*
 * Guided labs, part A — chapters 1–3 (Foundations, Scaling,
 * Data & Storage). Labs lab-1 (Trace a Request), lab-2 (Survive a
 * Traffic Spike) and lab-3 (Make Reads Fast). Each lab follows the
 * Lab shape in lib/types.ts: goal, whyItMatters, 4 plain-language
 * steps (each with a hint), a starter template, auto checks plus
 * labelled self-checks, and a solution template. All numbers are
 * illustrative examples, never measurements from a real system.
 */

import type { Lab } from '@/lib/types';

export const labsPartA: Lab[] = [
  {
    id: 'lab-1',
    chapterId: 'foundations',
    number: 1,
    title: 'Trace a Request',
    goal: 'Build the path one click takes from a user to a database and back — and see what breaks when one link fails.',
    whyItMatters:
      'Every system is a path a request travels. If you cannot trace the path, you cannot find where it breaks — so tracing it comes first.',
    difficulty: 'Beginner',
    estMin: 15,
    steps: [
      {
        id: 's1',
        title: 'Connect Users to the App Server',
        instruction:
          'Drag a line from the bottom dot of Users to the top dot of the App Server. A line means the two boxes can talk to each other.',
        hint: 'Drag from the small dot under Users to the small dot above the App Server.',
      },
      {
        id: 's2',
        title: 'Connect the App Server to the Database',
        instruction:
          'Draw a line from the App Server to the SQL Database. Now the whole path exists.',
        hint: 'The path runs left to right: Users, then the App Server, then the Database.',
      },
      {
        id: 's3',
        title: 'Trace the path out loud',
        instruction:
          'Follow the path with your finger and say each hop out loud: Users → App Server → Database → back. A request goes one way and the answer comes back the same way.',
        hint: 'Say what each box does with the request: the user sends it, the server works on it, the database stores it.',
      },
      {
        id: 's4',
        title: 'Break the path, then fix it',
        instruction:
          'Delete the line between the App Server and the Database and notice what stops working: the request has nowhere to go. Then draw the line back so the path works again.',
        hint: 'Click the line to select it, then press Backspace — or use Delete in the details panel. Deleting a line does not delete the boxes.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'server', kind: 'server', label: 'App Server', x: 300, y: 160 },
        { id: 'db', kind: 'db', label: 'SQL Database', x: 560, y: 160 },
      ],
      edges: [],
    },
    checks: [
      {
        id: 'lab-1-path',
        kind: 'has-path',
        fromKind: 'client',
        toKind: 'db',
        text: 'A request can travel from Users to the Database',
      },
      {
        id: 'lab-1-edge',
        kind: 'has-edge',
        fromKind: 'client',
        toKind: 'server',
        text: 'Users connect to the App Server',
      },
      {
        id: 'lab-1-self',
        kind: 'self',
        text: 'I can point to each hop a request takes',
      },
    ],
    solution: {
      title: 'The connected path',
      explanation:
        'The solution is one straight path: Users → App Server → SQL Database. Draw the path before anything else, because every later decision — where to add a server, where to put a cache — is a change to this path. If you cannot see the path, you cannot see what a change will do.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
          { id: 'server', kind: 'server', label: 'App Server', x: 300, y: 160 },
          { id: 'db', kind: 'db', label: 'SQL Database', x: 560, y: 160 },
        ],
        edges: [
          { from: 'users', to: 'server', label: 'Sends a request' },
          { from: 'server', to: 'db', label: 'Reads / writes' },
        ],
      },
    },
    relatedLessons: ['l1', 'l2', 'l3'],
  },
  {
    id: 'lab-2',
    chapterId: 'scaling',
    number: 2,
    title: 'Survive a Traffic Spike',
    goal: 'Add servers behind a load balancer so a traffic spike spreads out instead of crushing one machine.',
    whyItMatters:
      'One server has a limit. A load balancer is a front door that shares requests across many servers, so you add more servers instead of buying a bigger one.',
    difficulty: 'Beginner',
    estMin: 20,
    steps: [
      {
        id: 's1',
        title: 'Add two more App Servers',
        instruction:
          'Add two App Servers from the Components palette, so there are three in total. One server can only do so much work; three can share it.',
        hint: 'Use the App Server card in the Components palette — tap + or drag it onto the canvas.',
        paletteItemId: 'app-server',
      },
      {
        id: 's2',
        title: 'Connect the Load Balancer to each server',
        instruction:
          'Draw a line from the Load Balancer to each of the three servers, including the one that was already there. The load balancer can only share work with servers it is connected to.',
        hint: 'Each server needs its own line from the Load Balancer.',
      },
      {
        id: 's3',
        title: 'Run the traffic-spike scenario',
        instruction:
          'Run the traffic-spike scenario using the scenario control in the lab runner. It sends a sudden rush of requests, like a crowd arriving all at once.',
        hint: 'The scenario control is in the lab runner — it starts the spike for you.',
      },
      {
        id: 's4',
        title: 'Watch the load spread',
        instruction:
          'Watch the requests spread across the three servers. Notice one server getting busy while the others keep working — that is the load balancer sharing the work instead of letting one machine take it all.',
        hint: 'A busy server is normal during a spike. The problem would be one server doing everything while the others sit idle.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 160 },
        { id: 'server-1', kind: 'server', label: 'App Server', x: 560, y: 80 },
        { id: 'db', kind: 'db', label: 'SQL Database', x: 820, y: 80 },
      ],
      edges: [
        { from: 'users', to: 'lb', label: 'HTTPS requests' },
        { from: 'server-1', to: 'db', label: 'Reads / writes' },
      ],
    },
    checks: [
      {
        id: 'lab-2-servers',
        kind: 'has-node',
        nodeKind: 'server',
        minCount: 3,
        text: 'At least three App Servers',
      },
      {
        id: 'lab-2-lb-edge',
        kind: 'has-edge',
        fromKind: 'lb',
        toKind: 'server',
        text: 'The Load Balancer connects to an App Server',
      },
      {
        id: 'lab-2-path',
        kind: 'has-path',
        fromKind: 'client',
        toKind: 'server',
        text: 'Users can reach an App Server',
      },
      {
        id: 'lab-2-self',
        kind: 'self',
        text: 'I saw one server get busy while the others kept working',
      },
    ],
    solution: {
      title: 'Three servers behind one front door',
      explanation:
        'The solution is Users → Load Balancer → three App Servers → SQL Database. The load balancer is the only front door, so every request passes through it, and it shares the work across all three servers. Adding a fourth server later is the same move again: add the box, connect it to the load balancer, and it starts sharing the load.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 200 },
          { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 200 },
          { id: 'server-1', kind: 'server', label: 'App Server', x: 560, y: 80 },
          { id: 'server-2', kind: 'server', label: 'App Server', x: 560, y: 200 },
          { id: 'server-3', kind: 'server', label: 'App Server', x: 560, y: 320 },
          { id: 'db', kind: 'db', label: 'SQL Database', x: 820, y: 200 },
        ],
        edges: [
          { from: 'users', to: 'lb', label: 'HTTPS requests' },
          { from: 'lb', to: 'server-1', label: 'Forwards' },
          { from: 'lb', to: 'server-2', label: 'Forwards' },
          { from: 'lb', to: 'server-3', label: 'Forwards' },
          { from: 'server-1', to: 'db', label: 'Reads / writes' },
          { from: 'server-2', to: 'db', label: 'Reads / writes' },
          { from: 'server-3', to: 'db', label: 'Reads / writes' },
        ],
      },
    },
    relatedLessons: ['l4', 'l5', 'l6', 'l7', 'l8'],
  },
  {
    id: 'lab-3',
    chapterId: 'data-storage',
    number: 3,
    title: 'Make Reads Fast',
    goal: 'Put a cache between the app and the database, and add a read copy of the database, so reads stop hammering one machine.',
    whyItMatters:
      'The fastest database call is the one you never make. A cache is a fast memory that keeps answers to repeat questions, so the database only hears a question the first time.',
    difficulty: 'Intermediate',
    estMin: 25,
    steps: [
      {
        id: 's1',
        title: 'Add a Cache',
        instruction:
          'Add a Cache from the Components palette. A cache is a fast memory that sits next to the server and remembers answers.',
        hint: 'Use the Cache / Redis card in the Components palette.',
        paletteItemId: 'cache',
      },
      {
        id: 's2',
        title: 'Connect the App Server to the Cache',
        instruction:
          'Draw a line from the App Server to the Cache. Now the server can ask the cache for an answer before it asks the database.',
        hint: 'The line runs from the server to the cache, because the server is the one asking.',
      },
      {
        id: 's3',
        title: 'Connect the Cache to the Database',
        instruction:
          'Draw a line from the Cache to the SQL Database. The cache sits between the server and the database: when the cache does not know an answer, it asks the database and remembers what comes back.',
        hint: 'The order is Server → Cache → Database. The cache answers first when it can.',
      },
      {
        id: 's4',
        title: 'Add a read copy of the Database',
        instruction:
          'Add a second SQL Database from the Components palette — this one is a read copy, a second copy of the same data that only answers read questions. Connect the App Server to it, so reads can go to the copy instead of the original.',
        hint: 'Use the SQL Database card again. The copy holds the same data; it just shares the reading work.',
        paletteItemId: 'sql-db',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 160 },
        { id: 'server', kind: 'server', label: 'App Server', x: 560, y: 160 },
        { id: 'db', kind: 'db', label: 'SQL Database', x: 820, y: 80 },
      ],
      edges: [
        { from: 'users', to: 'lb', label: 'HTTPS requests' },
        { from: 'lb', to: 'server', label: 'Forwards' },
        { from: 'server', to: 'db', label: 'Reads / writes' },
      ],
    },
    checks: [
      {
        id: 'lab-3-cache',
        kind: 'has-node',
        nodeKind: 'cache',
        minCount: 1,
        text: 'A Cache on the canvas',
      },
      {
        id: 'lab-3-server-cache-edge',
        kind: 'has-edge',
        fromKind: 'server',
        toKind: 'cache',
        text: 'The App Server connects to the Cache',
      },
      {
        id: 'lab-3-cache-db-edge',
        kind: 'has-edge',
        fromKind: 'cache',
        toKind: 'db',
        text: 'The Cache connects to the Database',
      },
      {
        id: 'lab-3-two-dbs',
        kind: 'has-node',
        nodeKind: 'db',
        minCount: 2,
        text: 'Two databases — the original and a read copy',
      },
      {
        id: 'lab-3-self',
        kind: 'self',
        text: 'I can explain why the cache answers before the database',
      },
    ],
    solution: {
      title: 'A cache in front, a read copy beside',
      explanation:
        'The solution is Users → Load Balancer → App Server → Cache → SQL Database, plus App Server → a second SQL Database that works as a read copy. Repeat questions stop at the cache, so the database hears each question once instead of a hundred times — and reads that do reach a database can go to either copy.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 200 },
          { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 200 },
          { id: 'server', kind: 'server', label: 'App Server', x: 560, y: 200 },
          { id: 'cache', kind: 'cache', label: 'Cache / Redis', x: 820, y: 200 },
          { id: 'db-primary', kind: 'db', label: 'SQL Database', x: 820, y: 80 },
          { id: 'db-replica', kind: 'db', label: 'SQL Database', x: 560, y: 320 },
        ],
        edges: [
          { from: 'users', to: 'lb', label: 'HTTPS requests' },
          { from: 'lb', to: 'server', label: 'Forwards' },
          { from: 'server', to: 'cache', label: 'Reads first' },
          { from: 'cache', to: 'db-primary', label: 'Fills the cache' },
          { from: 'server', to: 'db-replica', label: 'Reads (copy)' },
        ],
      },
    },
    relatedLessons: ['l9', 'l10', 'l11', 'l14', 'l15'],
  },
];
