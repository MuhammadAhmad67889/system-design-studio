/*
 * Guided labs, part C — chapters 7–9 (Security, Shipping,
 * Whole Systems). Labs lab-7 ("Lock the Front Door"), lab-8
 * ("Ship It and Watch It") and lab-9 ("Design a URL Shortener").
 * Each lab follows the Lab shape in lib/types.ts: goal,
 * whyItMatters, plain-language steps (each with a hint), a starter
 * template, auto checks plus labelled self-checks, and a solution
 * template. All numbers are illustrative examples, never
 * measurements from a real system.
 */

import type { Lab } from '@/lib/types';

export const labsPartC: Lab[] = [
  {
    id: 'lab-7',
    chapterId: 'security',
    number: 7,
    title: 'Lock the Front Door',
    goal: 'Put a gateway and a login check in front of everything, so the database is never reachable directly.',
    whyItMatters:
      'The database holds the crown jewels. If anyone on the internet can talk to it directly, one mistake leaks everything.',
    difficulty: 'Intermediate',
    estMin: 20,
    steps: [
      {
        id: 's1',
        title: 'Add an API Gateway',
        instruction:
          'Drag an API Gateway onto the canvas. Connect Users to the Gateway, then connect the Gateway to the App Server.',
        hint: 'The gateway is the single front door — every request comes through it first.',
        paletteItemId: 'gateway',
      },
      {
        id: 's2',
        title: 'Add an Auth Service',
        instruction:
          'Add an Auth Service and connect the Gateway to it, so the gateway can ask "who is this?" before letting anyone in.',
        hint: 'Auth means proving who you are — a login check, not a password stored in the app.',
        paletteItemId: 'auth-service',
      },
      {
        id: 's3',
        title: 'Cut the direct road to the database',
        instruction:
          'Check the canvas: there must be no edge from Users straight to the SQL Database. If you see one, delete it.',
        hint: 'The database should only ever hear from the App Server, never from a user directly.',
      },
      {
        id: 's4',
        title: 'Confirm the only way in',
        instruction:
          'Trace every path from Users to the Database with your finger. Each one should pass through the Gateway.',
        hint: 'If you can reach the database without passing the gateway, the front door has a hole in it.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'app-server', kind: 'server', label: 'App Server', x: 300, y: 160 },
        { id: 'sql-db', kind: 'db', label: 'SQL Database', x: 560, y: 160 },
      ],
      edges: [
        { from: 'users', to: 'app-server' },
        { from: 'users', to: 'sql-db' },
        { from: 'app-server', to: 'sql-db' },
      ],
    },
    checks: [
      {
        id: 'has-gateway',
        kind: 'has-node',
        nodeKind: 'gateway',
        minCount: 1,
        text: 'An API Gateway in front',
      },
      {
        id: 'has-auth',
        kind: 'has-node',
        nodeKind: 'service',
        label: 'Auth',
        minCount: 1,
        text: 'An Auth Service',
      },
      {
        id: 'gateway-auth-edge',
        kind: 'has-edge',
        fromKind: 'gateway',
        toKind: 'service',
        text: 'The Gateway connects to the Auth Service',
      },
      {
        id: 'no-direct-db',
        kind: 'no-direct-edge',
        fromKind: 'client',
        toKind: 'db',
        text: 'No direct edge from Users to the Database',
      },
      {
        id: 'self-why',
        kind: 'self',
        text: 'I can explain why the database is never reachable directly',
      },
    ],
    solution: {
      title: 'Locked-down front door',
      explanation:
        'Users reach only the API Gateway. The gateway asks the Auth Service to check the login, then passes real requests to the App Server. The App Server is the only node that talks to the SQL Database, so the database is never reachable directly.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 200 },
          {
            id: 'gateway',
            kind: 'gateway',
            label: 'API Gateway',
            x: 300,
            y: 200,
            description: 'Single entry point for every request.',
          },
          {
            id: 'auth-service',
            kind: 'service',
            label: 'Auth Service',
            x: 560,
            y: 80,
            description: 'Checks logins and issues sessions.',
          },
          { id: 'app-server', kind: 'server', label: 'App Server', x: 560, y: 200 },
          { id: 'sql-db', kind: 'db', label: 'SQL Database', x: 820, y: 200 },
        ],
        edges: [
          { from: 'users', to: 'gateway' },
          { from: 'gateway', to: 'auth-service' },
          { from: 'gateway', to: 'app-server' },
          { from: 'app-server', to: 'sql-db' },
        ],
      },
    },
    relatedLessons: ['l32', 'l33', 'l34'],
  },
  {
    id: 'lab-8',
    chapterId: 'shipping',
    number: 8,
    title: 'Ship It and Watch It',
    goal: 'Run two versions side by side behind a load balancer, and add the monitoring that tells you if the new one breaks.',
    whyItMatters:
      'A release should be boring. Two servers let you switch traffic gradually, and metrics plus logs tell you within minutes whether the new version is healthy.',
    difficulty: 'Beginner',
    estMin: 15,
    steps: [
      {
        id: 's1',
        title: 'Add the new version',
        instruction:
          'Add a second App Server next to the old one and connect the Load Balancer to it. Label it "App Server (new version)".',
        hint: 'The load balancer spreads requests across servers, so both versions can run at once.',
        paletteItemId: 'app-server',
      },
      {
        id: 's2',
        title: 'Add Metrics',
        instruction:
          'Add a Metrics node and connect an App Server to it, so you can see request counts, errors and speed at a glance.',
        hint: 'Metrics are numbers over time — for example, how many requests failed in the last minute.',
        paletteItemId: 'metrics',
      },
      {
        id: 's3',
        title: 'Add Logging',
        instruction:
          'Add a Logging node and connect an App Server to it, so every server writes down what it did.',
        hint: 'Logs are the written record — when a number looks wrong, the logs say why.',
        paletteItemId: 'logging',
      },
      {
        id: 's4',
        title: 'Confirm both servers sit behind the balancer',
        instruction:
          'Check that the Load Balancer connects to both App Servers, and that Users only reach the servers through the balancer.',
        hint: 'If Users connect straight to a server, the balancer cannot move traffic away from a broken version.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 160 },
        {
          id: 'app-server-old',
          kind: 'server',
          label: 'App Server (old version)',
          x: 560,
          y: 80,
        },
        { id: 'sql-db', kind: 'db', label: 'SQL Database', x: 820, y: 80 },
      ],
      edges: [
        { from: 'users', to: 'lb' },
        { from: 'lb', to: 'app-server-old' },
        { from: 'app-server-old', to: 'sql-db' },
      ],
    },
    checks: [
      {
        id: 'two-servers',
        kind: 'has-node',
        nodeKind: 'server',
        minCount: 2,
        text: 'Two App Servers — old and new',
      },
      {
        id: 'has-metrics',
        kind: 'has-node',
        nodeKind: 'service',
        label: 'Metrics',
        minCount: 1,
        text: 'A Metrics node',
      },
      {
        id: 'has-logging',
        kind: 'has-node',
        nodeKind: 'service',
        label: 'Logging',
        minCount: 1,
        text: 'A Logging node',
      },
      {
        id: 'self-both-behind-lb',
        kind: 'self',
        text: 'Both App Servers sit behind the Load Balancer — I checked the arrows',
      },
      {
        id: 'self-first-look',
        kind: 'self',
        text: 'I can say where I would look first if the new version broke',
      },
    ],
    solution: {
      title: 'Two versions, watched closely',
      explanation:
        'The load balancer sends a small share of traffic to the new version first. Metrics show errors and speed within minutes, and logs explain any failure. If the new version breaks, the balancer sends all traffic back to the old one.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 200 },
          { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 300, y: 200 },
          {
            id: 'app-server-old',
            kind: 'server',
            label: 'App Server (old version)',
            x: 560,
            y: 80,
          },
          {
            id: 'app-server-new',
            kind: 'server',
            label: 'App Server (new version)',
            x: 560,
            y: 200,
          },
          { id: 'sql-db', kind: 'db', label: 'SQL Database', x: 820, y: 80 },
          {
            id: 'metrics',
            kind: 'service',
            label: 'Metrics',
            x: 820,
            y: 200,
            description: 'Request counts, errors and speed over time.',
          },
          {
            id: 'logging',
            kind: 'service',
            label: 'Logging',
            x: 820,
            y: 320,
            description: 'Written record of what each server did.',
          },
        ],
        edges: [
          { from: 'users', to: 'lb' },
          { from: 'lb', to: 'app-server-old' },
          { from: 'lb', to: 'app-server-new' },
          { from: 'app-server-old', to: 'sql-db' },
          { from: 'app-server-new', to: 'sql-db' },
          { from: 'app-server-old', to: 'metrics' },
          { from: 'app-server-new', to: 'logging' },
        ],
      },
    },
    relatedLessons: ['l35', 'l36'],
  },
  {
    id: 'lab-9',
    chapterId: 'whole-systems',
    number: 9,
    title: 'Design a URL Shortener',
    goal: 'Design a complete URL shortener end to end: short links in, real pages out, fast at scale.',
    whyItMatters:
      'It is the smallest real system that still needs a gateway, a cache, a database and a plan for growth — everything the course taught, in one design.',
    difficulty: 'Advanced',
    estMin: 30,
    steps: [
      {
        id: 's1',
        title: 'Add an App Server',
        instruction: 'Add an App Server and connect the API Gateway to it.',
        hint: 'The gateway is the front door; the server does the shortening and redirecting.',
        paletteItemId: 'app-server',
      },
      {
        id: 's2',
        title: 'Add a Cache',
        instruction:
          'Add a Cache and connect the App Server to it. The cache holds the hottest short links in memory.',
        hint: 'A cache is fast memory in front of the database — most clicks should never reach the database.',
        paletteItemId: 'cache',
      },
      {
        id: 's3',
        title: 'Add a SQL Database',
        instruction:
          'Add a SQL Database and connect the App Server to it. Every short link lives here.',
        hint: 'The database is the permanent record — the cache is only a shortcut to it.',
        paletteItemId: 'sql-db',
      },
      {
        id: 's4',
        title: 'Add a second server and a Load Balancer',
        instruction:
          'Add a second App Server and a Load Balancer. Connect Gateway → Load Balancer → both servers.',
        hint: 'The balancer spreads clicks across both servers, so one server can fail without the site going down.',
        paletteItemId: 'lb',
      },
      {
        id: 's5',
        title: 'Trace a short link',
        instruction:
          'Pick a short link, for example sho.rt/aB3x9Q. Write down each hop it takes when it is created, and each hop when someone clicks it.',
        hint: 'Creating a link writes to the database; clicking one reads the cache first and only asks the database on a miss.',
      },
    ],
    starter: {
      nodes: [
        { id: 'users', kind: 'client', label: 'Users', x: 40, y: 160 },
        { id: 'gateway', kind: 'gateway', label: 'API Gateway', x: 300, y: 160 },
      ],
      edges: [{ from: 'users', to: 'gateway' }],
    },
    checks: [
      {
        id: 'gateway-lb-edge',
        kind: 'has-edge',
        fromKind: 'gateway',
        toKind: 'lb',
        text: 'The Gateway connects to the Load Balancer',
      },
      {
        id: 'has-cache',
        kind: 'has-node',
        nodeKind: 'cache',
        minCount: 1,
        text: 'A Cache',
      },
      {
        id: 'has-db',
        kind: 'has-node',
        nodeKind: 'db',
        minCount: 1,
        text: 'A Database',
      },
      {
        id: 'two-servers',
        kind: 'has-node',
        nodeKind: 'server',
        minCount: 2,
        text: 'Two App Servers',
      },
      {
        id: 'client-db-path',
        kind: 'has-path',
        fromKind: 'client',
        toKind: 'db',
        text: 'A click can travel from Users to the Database',
      },
      {
        id: 'self-where-code-lives',
        kind: 'self',
        text: 'I can explain where a short code lives and how a click finds it',
      },
    ],
    solution: {
      title: 'A complete shortener',
      explanation:
        'Example numbers from the case study (illustrative assumptions, not real measurements): about 5M new short URLs a day and about 500M redirects a day — roughly 100 reads for every write. A 7-character base62 code gives about 3.5 trillion possible codes. Creating a link is POST /shorten; clicking one is GET /{code}, which returns a 302 redirect. The cache serves the hottest links, so most clicks never touch the database.',
      template: {
        nodes: [
          { id: 'users', kind: 'client', label: 'Users', x: 40, y: 200 },
          { id: 'gateway', kind: 'gateway', label: 'API Gateway', x: 300, y: 200 },
          { id: 'lb', kind: 'lb', label: 'Load Balancer', x: 560, y: 200 },
          { id: 'app-server-1', kind: 'server', label: 'App Server', x: 820, y: 80 },
          { id: 'app-server-2', kind: 'server', label: 'App Server', x: 820, y: 200 },
          {
            id: 'cache',
            kind: 'cache',
            label: 'Cache / Redis',
            x: 560,
            y: 320,
            description: 'Holds the hottest short links in memory.',
          },
          {
            id: 'sql-db',
            kind: 'db',
            label: 'SQL Database',
            x: 820,
            y: 320,
            description: 'Permanent record of every short link.',
          },
        ],
        edges: [
          { from: 'users', to: 'gateway' },
          { from: 'gateway', to: 'lb' },
          { from: 'lb', to: 'app-server-1' },
          { from: 'lb', to: 'app-server-2' },
          { from: 'app-server-1', to: 'cache' },
          { from: 'app-server-2', to: 'cache' },
          { from: 'app-server-1', to: 'sql-db' },
          { from: 'app-server-2', to: 'sql-db' },
        ],
      },
    },
    relatedLessons: ['l37'],
  },
];
