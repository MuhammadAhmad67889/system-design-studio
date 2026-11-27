/*
 * Fully-written lessons — Part D: Communication (l22–l23) and
 * Reliability (l24–l27).
 *
 * - l22 Message Queues
 * - l23 Event-Driven Architecture
 * - l24 Timeouts and Retries
 * - l25 Circuit Breakers
 * - l26 Rate Limiting
 * - l27 Fault Tolerance and Redundancy
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

export const lessonsPartD: Record<string, Lesson> = {
  l22: {
    id: 'l22',
    chapterId: 'communication',
    number: 22,
    title: 'Message Queues',
    durationMin: 12,
    difficulty: 'Intermediate',
    intro:
      'Decoupling producers from consumers with a durable middle.',
    objectives: [
      'Explain what a message queue does between a producer and a consumer',
      'Describe how a queue absorbs bursts and smooths load',
      'Compare at-least-once and at-most-once delivery',
      'Explain why consumers must be idempotent',
      'Describe ordering guarantees and dead-letter queues',
      'Decide when a queue is the right tool instead of a direct call',
    ],
    steps: [
      step(
        's1',
        'The direct call that blocks everything',
        'A checkout service that calls the email service directly is coupled to it in the worst way. When a customer places an order, checkout waits while the email service composes and sends a confirmation. If the email service slows down, every checkout slows down with it. If it goes down, orders fail for a reason that has nothing to do with ordering. One slow dependency now sets the speed — and the fate — of the whole request.',
        [
          metric('Checkout latency', '2,400', 'ms', 'bad'),
          metric('Orders blocked', 'All'),
          metric('Email service', 'Down', undefined, 'bad'),
        ],
        [
          'Checkout calls the email service directly and waits for it',
          'A slow or down email service blocks every order',
        ],
        'A direct call couples two services in time: the caller can only be as fast — and as healthy — as the service it calls.',
        'A slow dependency sets the speed of everything that calls it.',
        {
          nodes: [
            node('user', 'user', 'Customer', 20, 150, { status: 'healthy', sublabel: 'Places an order' }),
            node('server', 'server', 'Checkout API', 280, 150, { status: 'busy', sublabel: 'Waiting on email' }),
            node('service', 'service', 'Email Service', 520, 150, { status: 'failed', sublabel: 'Down' }),
          ],
          edges: [
            edge('user', 'server', 'Places order'),
            edge('server', 'service', 'Sends email'),
          ],
          activeNodeIds: ['server', 'service'],
          activeEdgeIds: ['user->server', 'server->service'],
          caption: 'Checkout calls the email service directly, so a slow email service blocks every order.',
        },
      ),
      step(
        's2',
        'A queue in the middle',
        'A message queue breaks that coupling. Checkout no longer calls the email service at all: it writes a small message — “order 4821 placed” — into a durable queue and returns to the customer in milliseconds. A separate worker reads messages from the queue and sends the emails at its own pace. The producer and the consumer no longer need to be alive at the same time, and neither one waits on the other.',
        [
          metric('Checkout latency', '45', 'ms', 'good'),
          metric('Queue depth', '120', 'messages'),
          metric('Consumer rate', '30', 'msg/s'),
        ],
        [
          'Checkout writes a message to the queue instead of calling email',
          'A worker reads messages and sends emails at its own pace',
        ],
        'The queue is durable: messages written to disk survive a restart, so work is never lost just because the worker was down.',
        'A queue decouples services in time — neither side waits on the other.',
        {
          nodes: [
            node('server', 'server', 'Checkout API', 20, 150, { status: 'healthy', sublabel: 'Writes message' }),
            node('queue', 'queue', 'Order Queue', 280, 150, { status: 'healthy', sublabel: 'Durable' }),
            node('service', 'service', 'Email Worker', 520, 150, { status: 'healthy', sublabel: 'Sends emails' }),
          ],
          edges: [
            edge('server', 'queue', 'Order placed', 'async'),
            edge('queue', 'service', 'Delivers message', 'async'),
          ],
          activeNodeIds: ['server', 'queue', 'service'],
          activeEdgeIds: ['server->queue', 'queue->service'],
          caption: 'Checkout writes an order message to the queue and returns immediately.',
        },
      ),
      step(
        's3',
        'Bursts become a backlog, not an outage',
        'Queues also absorb bursts. During a flash sale, orders may arrive at 5,000 per minute while the email worker can only send 1,800 per minute. Without a queue, the extra load would crash the email service or time out checkouts. With a queue, the messages simply pile up — a backlog of 2,400 — and drain over the next minute and a half. The system gets slower for a while, but nothing fails and no order is lost.',
        [
          metric('Orders arriving', '5,000', '/min'),
          metric('Consumer rate', '1,800', '/min'),
          metric('Queue depth', '2,400', 'messages', 'warn'),
        ],
        [
          'Orders arrive faster than the worker can send emails',
          'The backlog grows to 2,400 messages and drains in about 80 seconds',
        ],
        'Queue depth is the metric to watch: a backlog that grows without ever draining means the consumer is permanently too slow, not just busy.',
        'A burst becomes a backlog, and a backlog drains — an outage does not.',
        {
          nodes: [
            node('user', 'user', 'Shoppers', 20, 150, { status: 'healthy', sublabel: '5,000 orders/min' }),
            node('queue', 'queue', 'Order Queue', 280, 150, { status: 'busy', sublabel: '2,400 waiting' }),
            node('service', 'service', 'Email Worker', 520, 150, { status: 'busy', sublabel: '1,800/min' }),
          ],
          edges: [
            edge('user', 'queue', 'Orders arrive', 'async'),
            edge('queue', 'service', '1,800/min', 'async'),
          ],
          activeNodeIds: ['queue', 'service'],
          activeEdgeIds: ['user->queue', 'queue->service'],
          caption: 'A burst of orders fills the queue instead of crashing the email service.',
        },
      ),
      step(
        's4',
        'At-least-once delivery and idempotent consumers',
        'Delivery guarantees are the queue’s honest fine print. Most queues promise at-least-once delivery: if a worker crashes after sending an email but before acknowledging the message, the queue hands the same message to another worker, and the customer gets the email twice. The fix is idempotency — the worker records each order id it has already processed, so a duplicate message is recognised and skipped instead of acted on twice.',
        [
          metric('Delivery guarantee', 'At-least-once'),
          metric('Duplicate rate', '0.4', '%', 'warn'),
          metric('Retries before DLQ', '3'),
        ],
        [
          'The queue redelivers any message not acknowledged in time',
          'A crashed worker can cause the same email to be sent twice',
        ],
        'At-most-once delivery is the alternative — a message is never delivered twice — but it can lose messages entirely, which is worse for most work.',
        'At-least-once delivery means duplicates will happen; idempotency makes them harmless.',
        {
          nodes: [
            node('queue', 'queue', 'Order Queue', 20, 150, { status: 'healthy', sublabel: 'Redelivers' }),
            node('service', 'service', 'Email Worker', 280, 150, { status: 'busy', sublabel: 'Sends email' }),
            node('db', 'db', 'Sent Log', 520, 150, { status: 'healthy', sublabel: 'Order ids seen' }),
          ],
          edges: [
            edge('queue', 'service', 'Deliver · ack', 'async'),
            edge('service', 'db', 'Records order id'),
          ],
          activeNodeIds: ['queue', 'service', 'db'],
          activeEdgeIds: ['queue->service', 'service->db'],
          caption: 'The queue redelivers until the worker acknowledges, so the worker records each order id to spot duplicates.',
        },
      ),
      step(
        's5',
        'When a message cannot be delivered',
        'Some messages will never succeed: a malformed payload fails on every attempt, and retrying it forever would block the queue. After three failed attempts the message is moved to a dead-letter queue — a holding area where a human can inspect it, fix the problem, and requeue it. Queues also order messages only within a partition or a key, not across the whole system, so global order is a promise you should not expect.',
        [
          metric('Failed deliveries', '3'),
          metric('Dead-letter queue', '12', 'messages'),
          metric('Ordered per', 'Order ID'),
        ],
        [
          'A message that fails three times is moved aside, not retried forever',
          'Ordering holds within one partition or key, not across the whole queue',
        ],
        'A dead-letter queue needs an alarm, not just a dashboard: messages sitting there unread are work silently not happening.',
        'Poison messages go to a dead-letter queue; ordering is per key, never global.',
        {
          nodes: [
            node('queue', 'queue', 'Order Queue', 20, 150, { status: 'healthy', sublabel: 'Main queue' }),
            node('service', 'service', 'Worker', 280, 150, { status: 'degraded', sublabel: 'Fails 3 times' }),
            node('dlq', 'queue', 'Dead-Letter Q', 520, 150, { status: 'healthy', sublabel: '12 messages' }),
          ],
          edges: [
            edge('queue', 'service', 'Poison message', 'async'),
            edge('service', 'dlq', 'After 3 failures', 'async'),
          ],
          activeNodeIds: ['service', 'dlq'],
          activeEdgeIds: ['queue->service', 'service->dlq'],
          caption: 'A message that fails three times moves to the dead-letter queue for inspection.',
        },
      ),
    ],
    summary:
      'A message queue sits between a producer and a consumer so neither waits on the other: the producer writes a durable message and returns, the consumer works at its own pace, and bursts become a backlog that drains instead of an outage. Most queues deliver at least once, so consumers must be idempotent to survive duplicates, and messages that fail repeatedly move to a dead-letter queue. Ordering holds within a partition or key, never across the whole system. ' +
      ILLUSTRATIVE,
  },
  l23: {
    id: 'l23',
    chapterId: 'communication',
    number: 23,
    title: 'Event-Driven Architecture',
    durationMin: 13,
    difficulty: 'Advanced',
    intro:
      'Systems that react to things that happened, instead of asking for them.',
    objectives: [
      'Define an event and an event-driven flow',
      'Compare event-driven and request-driven designs',
      'Explain publish-subscribe and topics',
      'Distinguish event notification, event-carried state transfer, and event sourcing',
      'Describe how ordering and duplicates are handled',
      'Name the costs: eventual consistency, debugging, and schema change',
    ],
    steps: [
      step(
        's1',
        'Asking versus being told',
        'In a request-driven system, one service asks another for something and waits for an answer. In an event-driven system, services announce that something happened — “OrderPlaced”, “PaymentFailed” — and any service that cares reacts on its own. Nobody asks, nobody waits. The order service does not know the email service exists, and the email service does not need to be running when the order is placed. The flow inverts: work is triggered by facts, not by requests.',
        [
          metric('Services coupled', '0'),
          metric('Polling interval', 'None'),
          metric('Order service knows about email', 'No'),
        ],
        [
          'Services announce facts instead of answering questions',
          'Producers and consumers no longer need to be alive at the same time',
        ],
        'Polling is the request-driven habit this replaces: asking “anything new?” every few seconds wastes work when nothing happened and still notices late.',
        'Events invert the flow: facts push work out instead of requests pulling it in.',
        {
          nodes: [
            node('service', 'service', 'Order Service', 20, 150, { status: 'healthy', sublabel: 'Takes orders' }),
            node('service2', 'service', 'Email Service', 280, 150, { status: 'busy', sublabel: 'Polling: any orders?' }),
            node('db', 'db', 'Orders DB', 520, 150, { status: 'healthy', sublabel: 'Checked every 5 s' }),
          ],
          edges: [edge('service2', 'db', 'Asks every 5 s')],
          activeNodeIds: ['service2', 'db'],
          activeEdgeIds: ['service2->db'],
          caption: 'In a request-driven design the email service polls the database asking whether anything happened.',
        },
      ),
      step(
        's2',
        'Publish-subscribe and topics',
        'Events travel through a broker using publish and subscribe. A producer publishes each event to a named topic, such as “orders”, and consumers subscribe to the topics they care about. One event can reach many subscribers — email, analytics, and inventory can all react to the same “OrderPlaced” event independently. Adding a new subscriber means changing nothing in the producer, which is why event-driven systems grow new features cheaply.',
        [
          metric('Topics', '1'),
          metric('Subscribers', '3'),
          metric('Producer changes to add one', '0'),
        ],
        [
          'Producers publish to topics; consumers subscribe to them',
          'One OrderPlaced event reaches email, analytics, and inventory',
        ],
        'A topic is a named channel, not a queue for one consumer: every subscriber group gets its own copy of each event.',
        'One event, many subscribers, zero changes to the producer.',
        {
          nodes: [
            node('server', 'server', 'Order Service', 20, 60, { status: 'healthy', sublabel: 'Publishes' }),
            node('queue', 'queue', 'Event Broker', 280, 150, { status: 'healthy', sublabel: 'Topic: orders' }),
            node('email', 'service', 'Email Service', 520, 60, { status: 'healthy', sublabel: 'Subscribed' }),
            node('inventory', 'service', 'Inventory', 520, 240, { status: 'healthy', sublabel: 'Subscribed' }),
          ],
          edges: [
            edge('server', 'queue', 'OrderPlaced', 'async'),
            edge('queue', 'email', 'OrderPlaced', 'async'),
            edge('queue', 'inventory', 'OrderPlaced', 'async'),
          ],
          activeNodeIds: ['server', 'queue', 'email', 'inventory'],
          activeEdgeIds: ['server->queue', 'queue->email', 'queue->inventory'],
          caption: 'One OrderPlaced event reaches every subscriber through the broker.',
        },
      ),
      step(
        's3',
        'Three ways to use an event',
        'Not all events carry the same weight. An event notification says only that something happened — “order 4821 changed” — and subscribers fetch the details themselves. An event-carried state transfer includes the data itself, so subscribers rarely need to call back. Event sourcing goes further: the log of events is the source of truth, and current state is rebuilt by replaying them. Each step trades simplicity for power, and each one costs more to run well.',
        [
          metric('Notification payload', 'ID only'),
          metric('State transfer payload', 'Full data'),
          metric('Event sourcing store', 'Append-only log'),
        ],
        [
          'Notifications carry an id; state transfer carries the data',
          'Event sourcing treats the log itself as the source of truth',
        ],
        'Event sourcing makes auditing free — every change is already recorded — but rebuilding state by replaying years of events needs snapshots to stay fast.',
        'The more an event carries, the less subscribers need to ask for.',
        {
          nodes: [
            node('server', 'server', 'Order Service', 20, 150, { status: 'healthy', sublabel: 'Appends event' }),
            node('queue', 'queue', 'Event Log', 280, 150, { status: 'healthy', sublabel: 'Source of truth' }),
            node('service', 'service', 'Read Model', 520, 150, { status: 'healthy', sublabel: 'Rebuilt by replay' }),
          ],
          edges: [
            edge('server', 'queue', 'Appends event', 'async'),
            edge('queue', 'service', 'Replays events', 'async'),
          ],
          activeNodeIds: ['queue', 'service'],
          activeEdgeIds: ['server->queue', 'queue->service'],
          caption: 'In event sourcing the log is the source of truth and state is rebuilt by replaying it.',
        },
      ),
      step(
        's4',
        'Order, duplicates, and eventual consistency',
        'Events do not arrive in a neat order, and they can arrive twice. A consumer might see “OrderShipped” before “OrderPlaced”, or process the same “PaymentReceived” event two times after a redelivery. Well-built consumers are idempotent — processing a duplicate changes nothing — and they tolerate out-of-order events, for example by comparing timestamps or sequence numbers. Until every subscriber has caught up, different parts of the system hold different views of the truth.',
        [
          metric('Delivery guarantee', 'At-least-once'),
          metric('Duplicate events', 'Possible'),
          metric('Consistency', 'Eventual'),
        ],
        [
          'Events can arrive twice and out of order',
          'Consumers must be idempotent and tolerate ordering gaps',
        ],
        'A sequence number on each event lets a consumer spot a gap and wait for the missing event instead of acting on a half-told story.',
        'Different subscribers catch up at different speeds — that lag is eventual consistency.',
        {
          nodes: [
            node('queue', 'queue', 'Event Broker', 20, 150, { status: 'healthy', sublabel: 'Redelivers' }),
            node('email', 'service', 'Email Service', 280, 150, { status: 'degraded', sublabel: 'Duplicate event' }),
            node('inventory', 'service', 'Inventory', 520, 150, { status: 'busy', sublabel: 'Out-of-order event' }),
          ],
          edges: [
            edge('queue', 'email', 'PaymentReceived ×2', 'async'),
            edge('queue', 'inventory', 'Shipped before Placed', 'async'),
          ],
          activeNodeIds: ['email', 'inventory'],
          activeEdgeIds: ['queue->email', 'queue->inventory'],
          caption: 'Events can arrive twice or out of order, so consumers must tolerate both.',
        },
      ),
      step(
        's5',
        'The price of loose coupling',
        'The price of loose coupling shows up elsewhere. Tracing a single order across five services that only talk through events is harder than following one request through one call stack. Schemas evolve, so old events must keep working while new fields appear. And a flood of events can cascade through the system faster than anyone can stop it. Event-driven design fits reactions and fan-out; a simple request that needs one answer right now is still better as a direct call.',
        [
          metric('Services in one order flow', '5'),
          metric('Traceability', 'Harder', undefined, 'warn'),
          metric('Best fit', 'Reactions & fan-out'),
        ],
        [
          'Debugging across events is harder than following one call stack',
          'Schemas must evolve without breaking old consumers',
        ],
        'A correlation id carried on every event in a flow is what makes tracing possible at all: without it, five services’ logs are five unrelated stories.',
        'Loose coupling is bought with harder debugging — spend it where reactions matter.',
        {
          nodes: [
            node('server', 'server', 'Order Service', 20, 150, { status: 'healthy', sublabel: 'Flood of events' }),
            node('queue', 'queue', 'Event Broker', 280, 150, { status: 'busy', sublabel: 'Event storm' }),
            node('email', 'service', 'Email Service', 520, 60, { status: 'degraded', sublabel: 'Overloaded' }),
            node('inventory', 'service', 'Inventory', 520, 240, { status: 'degraded', sublabel: 'Overloaded' }),
          ],
          edges: [
            edge('server', 'queue', 'Flood of events', 'async'),
            edge('queue', 'email', 'Events', 'async'),
            edge('queue', 'inventory', 'Events', 'async'),
          ],
          activeNodeIds: ['queue', 'email', 'inventory'],
          activeEdgeIds: ['server->queue', 'queue->email', 'queue->inventory'],
          caption: 'A flood of events spreads through every subscriber at once, which makes debugging harder.',
        },
      ),
    ],
    summary:
      'Event-driven systems react to facts instead of answering questions: a producer publishes an event to a topic, and every subscribed service reacts on its own, without the producer knowing they exist. Events can be bare notifications, carry their data with them, or — in event sourcing — form the log that is itself the source of truth. The trade-offs are real: events arrive twice and out of order, subscribers lag behind, and tracing a flow across services is harder than following one call. ' +
      ILLUSTRATIVE,
  },
  l24: {
    id: 'l24',
    chapterId: 'reliability',
    number: 24,
    title: 'Timeouts and Retries',
    durationMin: 11,
    difficulty: 'Intermediate',
    intro:
      'How long to wait, when to try again, and when retrying makes everything worse.',
    objectives: [
      'Explain why every outbound call needs a timeout',
      'Choose a timeout from measured latency, not a guess',
      'Decide which failures are safe to retry',
      'Apply exponential backoff with jitter',
      'Explain retry budgets and why retries can amplify an outage',
      'Describe idempotency keys for safe retries',
    ],
    steps: [
      step(
        's1',
        'A call with no timeout waits forever',
        'Every call to another service can hang. A database that never answers, a payment gateway that stalls — without a timeout, the caller waits forever, holding a thread and a connection that no other request can use. As more callers pile up waiting, the whole service slows and then stops, even though its own code is fine. A timeout is a deadline: if the answer has not arrived by then, give up, free the resources, and let the caller decide what to do next.',
        [
          metric('Timeout set', 'None', undefined, 'bad'),
          metric('Threads waiting', 'All of them', undefined, 'bad'),
          metric('Checkout serving requests', 'No', undefined, 'bad'),
        ],
        [
          'A stalled payment service leaves checkout threads waiting',
          'The whole service stops even though its own code is fine',
        ],
        'A timeout protects the caller, not the service being called: it bounds how long one slow dependency can hold your resources hostage.',
        'Without a timeout, one hung call can take down the caller.',
        {
          nodes: [
            node('server', 'server', 'Checkout', 20, 150, { status: 'busy', sublabel: 'Threads waiting' }),
            node('service', 'service', 'Payment Gateway', 280, 150, { status: 'failed', sublabel: 'Stalled' }),
            node('user', 'user', 'Customers', 520, 150, { status: 'degraded', sublabel: 'Waiting' }),
          ],
          edges: [
            edge('user', 'server', 'Requests pile up'),
            edge('server', 'service', 'Call, no timeout'),
          ],
          activeNodeIds: ['server', 'service'],
          activeEdgeIds: ['user->server', 'server->service'],
          caption: 'Without a timeout, a stalled payment service leaves checkout threads waiting forever.',
        },
      ),
      step(
        's2',
        'Setting a timeout from real numbers',
        'A timeout should come from measurements, not from a round number someone guessed. If a service answers in 40 ms on average and 180 ms at the 99th percentile, a 500 ms timeout gives slow calls room while still cutting off the truly stuck ones. Set it too short and healthy calls get killed; set it too long and a slow dependency still drags you down. Use separate timeouts for connecting and for waiting on a response, and revisit them as the dependency’s latency changes.',
        [
          metric('Average latency', '40', 'ms'),
          metric('p99 latency', '180', 'ms'),
          metric('Timeout chosen', '500', 'ms'),
        ],
        [
          'Latency is measured: 40 ms average, 180 ms at p99',
          'The timeout is set at 500 ms, above p99 with room to spare',
        ],
        'Connection timeouts and read timeouts are different knobs: connecting usually fails fast, while waiting for a response is where a slow service burns your time.',
        'Measure first, then set the timeout just above what healthy calls need.',
        {
          nodes: [
            node('client', 'client', 'Checkout', 160, 150, { status: 'healthy', sublabel: 'Timeout 500 ms' }),
            node('service', 'service', 'Payment API', 440, 150, { status: 'healthy', sublabel: 'p99 180 ms' }),
          ],
          edges: [edge('client', 'service', 'Call with 500 ms deadline')],
          activeNodeIds: ['client', 'service'],
          activeEdgeIds: ['client->service'],
          caption: 'A 500 millisecond timeout gives slow calls room while cutting off the truly stuck ones.',
        },
      ),
      step(
        's3',
        'Retry only what is safe to repeat',
        'Retrying a failed call is only safe when repeating it is harmless. A timeout or a 503 from an overloaded service is usually worth one more try, because the first attempt may never have arrived. A 400 error is not — the request itself is wrong, and sending it again changes nothing. And a payment request that may already have gone through must never be blindly retried, unless it carries an idempotency key that lets the server recognise the duplicate and return the original result.',
        [
          metric('Retry a timeout', 'Yes'),
          metric('Retry a 400 error', 'No'),
          metric('Retry a payment', 'Only with a key'),
        ],
        [
          'Timeouts and 503s are usually safe to retry',
          'A 400 error and a blind payment retry are not',
        ],
        'A 429 response is retryable too — it literally tells you to try again later — and it usually carries a Retry-After header saying when.',
        'Retry transient failures, never client errors or blind payments.',
        {
          nodes: [
            node('server', 'server', 'Checkout', 20, 150, { status: 'healthy', sublabel: 'Retries with same key' }),
            node('service', 'service', 'Payment API', 280, 150, { status: 'healthy', sublabel: 'Sees the key' }),
            node('db', 'db', 'Idempotency Keys', 520, 150, { status: 'healthy', sublabel: 'Seen keys' }),
          ],
          edges: [
            edge('server', 'service', 'Retry with same key'),
            edge('service', 'db', 'Key seen? Return original'),
          ],
          activeNodeIds: ['server', 'service', 'db'],
          activeEdgeIds: ['server->service', 'service->db'],
          caption: 'An idempotency key lets the server recognise a retried payment and return the original result.',
        },
      ),
      step(
        's4',
        'Backoff with jitter',
        'When several clients retry at once, they can synchronise into a wave that hits the struggling service all at the same moment. Exponential backoff spreads them out: wait 100 ms, then 200, then 400, doubling each time up to a cap. Jitter adds randomness to each wait, so retries from thousands of clients land at different moments instead of in lockstep. The combination turns a hammering crowd into a gentle trickle, and it is the standard way to retry anything at scale.',
        [
          metric('Retry waits', '100 → 200 → 400', 'ms'),
          metric('Jitter', 'Random ±50', 'ms'),
          metric('Retrying clients', '1,000'),
        ],
        [
          'Retries wait 100 ms, then 200, then 400, doubling each time',
          'Jitter randomises each wait so retries do not synchronise',
        ],
        'Cap the backoff — ten or thirty seconds is typical — or a client can end up waiting minutes for an answer the user gave up on long ago.',
        'Backoff spaces retries out; jitter keeps them from landing together.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: '1,000 retries' }),
            node('queue', 'queue', 'Backoff + Jitter', 280, 150, { status: 'healthy', sublabel: '100→200→400 ms' }),
            node('service', 'service', 'Payment API', 520, 150, { status: 'healthy', sublabel: 'Trickle, not wave' }),
          ],
          edges: [
            edge('client', 'queue', 'Retries wait'),
            edge('queue', 'service', 'Spread out', 'async'),
          ],
          activeNodeIds: ['client', 'queue', 'service'],
          activeEdgeIds: ['client->queue', 'queue->service'],
          caption: 'Exponential backoff with jitter spreads retries out so they land as a trickle, not a wave.',
        },
      ),
      step(
        's5',
        'Retry budgets: the amplifier',
        'Retries can also make an outage worse. If every client retries three times, a service receiving 1,000 requests per second suddenly faces 4,000 — and it was already struggling. A retry budget caps the damage: allow retries to be at most 10% of all requests, for example, and stop retrying once the budget is spent. Combine budgets with backoff and a circuit breaker, and retries stay a recovery tool instead of becoming a second outage.',
        [
          metric('Incoming requests', '1,000', 'req/s'),
          metric('With 3 retries each', '4,000', 'req/s', 'bad'),
          metric('Retry budget', '10', '% of requests'),
        ],
        [
          'Three retries per client turn 1,000 requests into 4,000',
          'A 10% retry budget caps the extra load a struggling service faces',
        ],
        'The budget is usually measured over a short window — ten seconds or so — so a brief spike cannot spend the whole allowance at once.',
        'Retries multiply load; a budget keeps them from multiplying an outage.',
        {
          nodes: [
            node('client', 'client', 'Clients', 20, 150, { status: 'healthy', sublabel: '4,000 req/s' }),
            node('gateway', 'gateway', 'API Gateway', 280, 150, { status: 'healthy', sublabel: 'Enforces budget' }),
            node('service', 'service', 'Payment API', 520, 150, { status: 'degraded', sublabel: 'Overloaded' }),
          ],
          edges: [
            edge('client', 'gateway', '4,000 req/s'),
            edge('gateway', 'service', '1,100 req/s pass'),
          ],
          activeNodeIds: ['gateway', 'service'],
          activeEdgeIds: ['client->gateway', 'gateway->service'],
          caption: 'A retry budget caps retries at 10 percent, so a struggling service faces 1,100 requests instead of 4,000.',
        },
      ),
    ],
    summary:
      'Every outbound call needs a timeout chosen from measured latency — above the 99th percentile, but low enough to cut off a truly stuck call quickly. Retry only transient failures, never client errors or blind payments, and give payment retries an idempotency key. Space retries with exponential backoff and jitter so they land as a trickle, and cap them with a retry budget so a struggling service faces a little extra load, not four times its normal traffic. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['reliability-patterns'],
  },
  l25: {
    id: 'l25',
    chapterId: 'reliability',
    number: 25,
    title: 'Circuit Breakers',
    durationMin: 11,
    difficulty: 'Intermediate',
    intro:
      'Stop calling a service that is already down — fail fast, recover gracefully.',
    objectives: [
      'Explain cascading failure and why fail-fast matters',
      'Describe the three states: closed, open, and half-open',
      'Trace a breaker tripping, opening, and recovering',
      'Choose thresholds: failure rate, minimum calls, and timeout',
      'Design fallbacks for the open state',
      'Explain where breakers belong: client side, per dependency',
    ],
    steps: [
      step(
        's1',
        'One slow dependency drags everything down',
        'When a dependency slows down, callers do not just fail — they wait. Each waiting call holds a thread, and threads run out. Soon the checkout service cannot serve anyone, even customers who never touch payments, because every thread is stuck waiting on the same slow payment service. The failure has cascaded: one bad dependency has taken down everything that depends on it. The fix is to stop calling the broken service before it drags the rest of the system with it.',
        [
          metric('Payment latency', '30', 's', 'bad'),
          metric('Checkout threads free', '0', undefined, 'bad'),
          metric('Customers affected', 'All', undefined, 'bad'),
        ],
        [
          'A slow payment service exhausts checkout’s threads',
          'Customers who never touch payments fail too — the failure cascaded',
        ],
        'Cascading failure is why timeouts alone are not enough: a timeout still lets every caller hammer a dying service, just for a shorter time.',
        'A slow dependency does not fail alone — it takes its callers with it.',
        {
          nodes: [
            node('user', 'user', 'Customers', 20, 150, { status: 'healthy', sublabel: 'Orders' }),
            node('server', 'server', 'Checkout', 280, 150, { status: 'busy', sublabel: 'Threads exhausted' }),
            node('service', 'service', 'Payment Service', 520, 150, { status: 'failed', sublabel: 'Slow · 30 s' }),
          ],
          edges: [
            edge('user', 'server', 'Orders'),
            edge('server', 'service', 'Waits 30 s'),
          ],
          activeNodeIds: ['server', 'service'],
          activeEdgeIds: ['user->server', 'server->service'],
          caption: 'A slow payment service exhausts checkout threads, so even unrelated requests fail.',
        },
      ),
      step(
        's2',
        'Closed: calls flow, failures are counted',
        'A circuit breaker sits between a caller and a dependency, and in its normal closed state it simply lets calls through while counting failures. Every success resets the count; every failure adds to it. The breaker watches a rolling window — say, the last 20 calls — and as long as failures stay below the threshold, nothing changes. The system behaves exactly as it did before, with one new habit: it is now keeping score.',
        [
          metric('Breaker state', 'Closed'),
          metric('Failures in window', '6', 'of 20'),
          metric('Failure threshold', '50', '%'),
        ],
        [
          'A breaker is added between checkout and payments',
          'In the closed state it counts failures and lets calls through',
        ],
        'The window needs a minimum number of calls before it can trip — otherwise two failures on a quiet night would open the breaker for no reason.',
        'Closed means normal: calls flow, and the breaker keeps score.',
        {
          nodes: [
            node('server', 'server', 'Checkout', 20, 150, { status: 'healthy', sublabel: 'Counting failures' }),
            node('gateway', 'gateway', 'Circuit Breaker', 280, 150, { status: 'healthy', sublabel: 'Closed · counting' }),
            node('service', 'service', 'Payment Service', 520, 150, { status: 'degraded', sublabel: 'Failures rising' }),
          ],
          edges: [
            edge('server', 'gateway', 'Calls pass through'),
            edge('gateway', 'service', '6 of 20 failed'),
          ],
          activeNodeIds: ['server', 'gateway', 'service'],
          activeEdgeIds: ['server->gateway', 'gateway->service'],
          caption: 'While closed, the breaker lets calls through and counts failures in a rolling window.',
        },
      ),
      step(
        's3',
        'Open: stop calling and fail fast',
        'When failures cross the threshold — for example, half of the last 20 calls failed — the breaker opens. From that moment, calls to the dependency are rejected immediately, without ever touching the network. The caller gets a fast failure it can handle with a fallback, and the struggling service gets a rest from new load. Opening the breaker trades a slow, cascading failure for a fast, contained one.',
        [
          metric('Breaker state', 'Open', undefined, 'warn'),
          metric('Failures in window', '10', 'of 20'),
          metric('Calls reaching payments', '0'),
        ],
        [
          'Failures reach 10 of 20 and the breaker opens',
          'New calls are rejected immediately instead of waiting',
        ],
        'An open breaker should raise an alarm, not fail silently: someone needs to know a dependency is down even while users see a graceful fallback.',
        'Open means stop: fail fast instead of failing slowly.',
        {
          nodes: [
            node('server', 'server', 'Checkout', 20, 150, { status: 'healthy', sublabel: 'Gets fast failure' }),
            node('gateway', 'gateway', 'Circuit Breaker', 280, 150, { status: 'busy', sublabel: 'OPEN' }),
            node('service', 'service', 'Payment Service', 520, 150, { status: 'failed', sublabel: 'Resting' }),
          ],
          edges: [
            edge('server', 'gateway', 'Call rejected fast'),
            edge('gateway', 'service', 'No calls sent'),
          ],
          activeNodeIds: ['server', 'gateway'],
          activeEdgeIds: ['server->gateway'],
          caption: 'Once open, the breaker rejects calls immediately and the payment service gets a rest.',
        },
      ),
      step(
        's4',
        'Half-open: one careful probe',
        'An open breaker does not stay open forever. After a sleep window — thirty seconds, say — it moves to half-open and lets a single trial call through. If the trial succeeds, the breaker closes and normal traffic resumes. If it fails, the breaker opens again for another sleep window. The probe is deliberately small: one call tests the water instead of flooding a service that may only just be recovering.',
        [
          metric('Breaker state', 'Half-open'),
          metric('Sleep window', '30', 's'),
          metric('Trial calls allowed', '1'),
        ],
        [
          'After 30 seconds the breaker moves to half-open',
          'One trial call tests whether the service has recovered',
        ],
        'Some breakers allow a few trial calls instead of one, but the principle is the same: probe gently, and only reopen the floodgates on proof.',
        'Half-open is a question, asked with one call: are you back yet?',
        {
          nodes: [
            node('server', 'server', 'Checkout', 20, 150, { status: 'healthy', sublabel: 'Waits for result' }),
            node('gateway', 'gateway', 'Circuit Breaker', 280, 150, { status: 'healthy', sublabel: 'Half-open' }),
            node('service', 'service', 'Payment Service', 520, 150, { status: 'busy', sublabel: 'Trial call' }),
          ],
          edges: [
            edge('server', 'gateway', 'One trial call'),
            edge('gateway', 'service', 'Probe'),
          ],
          activeNodeIds: ['gateway', 'service'],
          activeEdgeIds: ['server->gateway', 'gateway->service'],
          caption: 'After thirty seconds the breaker lets one trial call through to test whether the service recovered.',
        },
      ),
      step(
        's5',
        'Tuning and fallbacks',
        'Good breakers are tuned per dependency, because a search service and a payment service fail differently. Thresholds come from real failure rates, not guesses, and every breaker needs a fallback for the open state: cached data, a queued job for later, or a clear message to the user. And a breaker is not a retry — it is the opposite. Retries push more work at a struggling service; a breaker stops the pushing until the service can breathe.',
        [
          metric('Thresholds', 'Per dependency'),
          metric('Fallback', 'Cached data'),
          metric('Breaker vs retry', 'Opposites'),
        ],
        [
          'Thresholds are tuned per dependency from real failure rates',
          'The open state serves a fallback instead of an error',
        ],
        'A breaker lives on the caller’s side, one per dependency: checkout’s breaker for payments knows nothing about search’s breaker for search.',
        'A breaker is the opposite of a retry — it stops the pushing, not the trying.',
        {
          nodes: [
            node('server', 'server', 'Checkout', 20, 150, { status: 'healthy', sublabel: 'Uses fallback' }),
            node('cache', 'cache', 'Cached Rates', 280, 150, { status: 'healthy', sublabel: 'Fallback data' }),
            node('service', 'service', 'Payment Service', 520, 150, { status: 'failed', sublabel: 'Still down' }),
          ],
          edges: [
            edge('server', 'cache', 'Serves cached data'),
            edge('server', 'service', 'Breaker open — no call'),
          ],
          activeNodeIds: ['server', 'cache'],
          activeEdgeIds: ['server->cache'],
          caption: 'With the breaker open, checkout serves cached data instead of failing outright.',
        },
      ),
    ],
    summary:
      'A circuit breaker stops a slow dependency from taking its callers down with it. Closed, it counts failures in a rolling window; once they cross the threshold it opens, rejecting calls immediately so the caller fails fast and the dependency gets a rest. After a sleep window it goes half-open and sends one trial call: success closes it, failure reopens it. Every open breaker needs a fallback, and thresholds are tuned per dependency. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['reliability-patterns'],
  },
  l26: {
    id: 'l26',
    chapterId: 'reliability',
    number: 26,
    title: 'Rate Limiting',
    durationMin: 10,
    difficulty: 'Intermediate',
    intro:
      'Protecting a service from its own users, fairly.',
    objectives: [
      'Explain why a service limits its own callers',
      'Compare fixed window, sliding window, token bucket, and leaky bucket',
      'Work through a token bucket example',
      'Describe fair limits: per user, per key, and per IP',
      'Explain how limits are communicated with headers and 429 responses',
      'Decide where to enforce limits: gateway, service, or both',
    ],
    formulas: [
      {
        name: 'Token bucket',
        expression: 'tokens = min(capacity, tokens + rate × time)',
        note: 'A bucket with capacity 100 refilling at 10 tokens per second: after 5 idle seconds from empty it holds min(100, 0 + 10 × 5) = 50 tokens, so a burst of 50 requests is allowed and the 51st waits or is refused.',
      },
    ],
    steps: [
      step(
        's1',
        'One client can starve the rest',
        'A service has a speed limit, and its users will find it. A bug that loops over an API, a scraper that never sleeps, or a launch-day crowd can all send far more requests than the service can handle. Without a limit, one heavy client starves every other client: latencies climb, queues grow, and the service falls over for everyone. Rate limiting is the guardrail — it caps how many requests each caller may make, so no single caller can spend the whole budget.',
        [
          metric('One client sending', '10,000', 'req/min', 'bad'),
          metric('Other clients affected', 'All', undefined, 'bad'),
          metric('Limit in place', 'None', undefined, 'bad'),
        ],
        [
          'One heavy client floods the API with 10,000 requests per minute',
          'Every other client slows down with it — there is no limit',
        ],
        'Rate limiting is also a cost control: every request costs compute, and an unlimited API lets one caller run up the bill for everyone.',
        'Without a limit, one caller can spend the whole service’s budget.',
        {
          nodes: [
            node('client', 'client', 'Scraper Bot', 20, 150, { status: 'busy', sublabel: '10,000 req/min' }),
            node('gateway', 'gateway', 'API Gateway', 280, 150, { status: 'busy', sublabel: 'No limit set' }),
            node('server', 'server', 'API Server', 520, 150, { status: 'failed', sublabel: 'Overloaded' }),
          ],
          edges: [
            edge('client', 'gateway', 'Flood'),
            edge('gateway', 'server', 'Everything passes'),
          ],
          activeNodeIds: ['client', 'gateway', 'server'],
          activeEdgeIds: ['client->gateway', 'gateway->server'],
          caption: 'Without a limit, one heavy client floods the API and starves everyone else.',
        },
      ),
      step(
        's2',
        'Fixed window: simple, with a sharp edge',
        'The simplest limiter is a fixed window: allow 100 requests per minute, counted from the top of each minute. It is easy to build and easy to explain, but it has a sharp edge. A client can send 100 requests at 11:59:59 and 100 more at 12:00:01 — 200 requests in two seconds — because the counter resets at the boundary. For most products that burst is harmless, but a service that must never exceed its limit needs a smoother rule.',
        [
          metric('Limit', '100', 'req/min'),
          metric('Burst across boundary', '200', 'req in 2 s', 'warn'),
          metric('Counter resets', 'Every minute'),
        ],
        [
          'A fixed window allows 100 requests per minute',
          'The counter resets at the minute boundary, letting 200 through in 2 seconds',
        ],
        'A sliding window fixes the edge by counting the last 60 seconds at any moment instead of the current minute — smoother, but it needs more bookkeeping.',
        'Fixed windows are simple; their reset boundary is the crack in the wall.',
        {
          nodes: [
            node('client', 'client', 'One Client', 20, 150, { status: 'healthy', sublabel: '100 at 11:59:59' }),
            node('gateway', 'gateway', 'Fixed Window', 280, 150, { status: 'healthy', sublabel: '100/min · resets' }),
            node('server', 'server', 'API Server', 520, 150, { status: 'busy', sublabel: '200 in 2 s' }),
          ],
          edges: [
            edge('client', 'gateway', '100 requests'),
            edge('gateway', 'server', '100 more at 12:00:01'),
          ],
          activeNodeIds: ['client', 'gateway', 'server'],
          activeEdgeIds: ['client->gateway', 'gateway->server'],
          caption: 'A fixed window resets at the minute boundary, so 200 requests can slip through in two seconds.',
        },
      ),
      step(
        's3',
        'Token bucket: bursts allowed, average enforced',
        'A token bucket allows bursts while enforcing an average. Imagine a bucket that holds 100 tokens and refills at 10 per second. Each request spends one token; when the bucket is empty, requests wait or are refused. A client that has been quiet can spend its saved tokens in a burst of up to 100, but over a minute it can never exceed 600 requests — the refill rate sets the ceiling, and the bucket size sets the burst.',
        [
          metric('Bucket capacity', '100', 'tokens'),
          metric('Refill rate', '10', 'tokens/s'),
          metric('Max per minute', '600', 'requests'),
        ],
        [
          'A bucket of 100 tokens refills at 10 per second',
          'Quiet clients can burst up to 100, but never exceed 600 per minute',
        ],
        'The bucket never holds more than its capacity: tokens that would overflow are simply lost, which is what stops a client from saving up an endless burst.',
        'Refill rate sets the average; bucket size sets the burst.',
        {
          nodes: [
            node('client', 'client', 'Quiet Client', 20, 150, { status: 'healthy', sublabel: 'Saved tokens' }),
            node('gateway', 'gateway', 'Token Bucket', 280, 150, { status: 'healthy', sublabel: '100 tokens · +10/s' }),
            node('server', 'server', 'API Server', 520, 150, { status: 'healthy', sublabel: 'Burst of 50 OK' }),
          ],
          edges: [
            edge('client', 'gateway', '50 requests'),
            edge('gateway', 'server', '50 tokens spent'),
          ],
          activeNodeIds: ['client', 'gateway', 'server'],
          activeEdgeIds: ['client->gateway', 'gateway->server'],
          caption: 'A token bucket lets a quiet client spend saved tokens in a burst of up to 100.',
        },
      ),
      step(
        's4',
        'Leaky bucket: smooth output',
        'A leaky bucket is the mirror image: instead of saving up tokens, it smooths traffic out. Requests enter a queue and leave at a fixed rate — say, 10 per second — no matter how fast they arrived. A sudden burst waits in the queue rather than overwhelming the service, which is ideal when the downstream system needs a steady, predictable flow. The cost is latency: requests at the back of a full queue wait, and a queue that overflows must drop or reject them.',
        [
          metric('Outflow rate', '10', 'req/s'),
          metric('Burst handling', 'Queued'),
          metric('Downstream load', 'Steady'),
        ],
        [
          'Requests queue up and drain at a fixed 10 per second',
          'A burst waits instead of overwhelming the service',
        ],
        'Token bucket and leaky bucket are often confused: the token bucket limits how fast requests may arrive in bursts, while the leaky bucket controls how fast they leave.',
        'A leaky bucket turns a spike into a steady stream — at the cost of waiting.',
        {
          nodes: [
            node('client', 'client', 'Bursty Client', 20, 150, { status: 'healthy', sublabel: 'Spike' }),
            node('queue', 'queue', 'Leaky Bucket', 280, 150, { status: 'busy', sublabel: 'Queue drains 10/s' }),
            node('server', 'server', 'API Server', 520, 150, { status: 'healthy', sublabel: 'Steady 10/s' }),
          ],
          edges: [
            edge('client', 'queue', 'Burst arrives', 'async'),
            edge('queue', 'server', 'Steady outflow'),
          ],
          activeNodeIds: ['queue', 'server'],
          activeEdgeIds: ['client->queue', 'queue->server'],
          caption: 'A leaky bucket queues a burst and releases it at a steady ten requests per second.',
        },
      ),
      step(
        's5',
        'Fairness and telling the client',
        'Limits should be fair, and callers should be able to see them. A limit per API key or per user is fairer than one per IP address, which can punish a whole office behind one address. Tiers are common: free accounts get fewer requests than paying ones. And the service should answer a refused request with HTTP 429 and a Retry-After header, plus headers showing the limit and how many requests remain — a client that can read its budget can pace itself instead of guessing.',
        [
          metric('Free tier', '100', 'req/min'),
          metric('Paying tier', '10,000', 'req/min'),
          metric('Refused request', '429 + Retry-After'),
        ],
        [
          'Limits are set per API key, with higher tiers for paying users',
          'Refused requests answer 429 with a Retry-After header',
        ],
        'Enforce limits at the gateway for the whole system and again inside a service for its own expensive operations — the two layers protect different things.',
        'A limit a client can read is a limit a client can respect.',
        {
          nodes: [
            node('free', 'client', 'Free User', 20, 60, { status: 'healthy', sublabel: '100/min' }),
            node('paying', 'client', 'Paying User', 20, 240, { status: 'healthy', sublabel: '10,000/min' }),
            node('gateway', 'gateway', 'API Gateway', 280, 150, { status: 'healthy', sublabel: 'Per-key limits' }),
            node('server', 'server', 'API Server', 520, 150, { status: 'healthy', sublabel: '429 + Retry-After' }),
          ],
          edges: [
            edge('free', 'gateway', '100/min'),
            edge('paying', 'gateway', '10,000/min'),
            edge('gateway', 'free', '429 · Retry-After', 'response'),
          ],
          activeNodeIds: ['free', 'gateway'],
          activeEdgeIds: ['free->gateway', 'gateway->free'],
          caption: 'Limits are set per API key, and refused requests get a 429 with a Retry-After header.',
        },
      ),
    ],
    summary:
      'Rate limiting caps how many requests each caller may make, so one heavy client cannot starve the rest. A fixed window is simple but lets a burst slip across its reset boundary; a token bucket allows bursts up to its capacity while the refill rate sets the average; a leaky bucket smooths traffic out at a fixed rate. Limits should be per user or per key, tiered by plan, and communicated with a 429, a Retry-After header, and headers showing the remaining budget. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['reliability-patterns'],
  },
  l27: {
    id: 'l27',
    chapterId: 'reliability',
    number: 27,
    title: 'Fault Tolerance and Redundancy',
    durationMin: 12,
    difficulty: 'Advanced',
    intro:
      'No single point of failure: the discipline behind "five nines".',
    objectives: [
      'Define fault tolerance and redundancy',
      'Find single points of failure in a diagram',
      'Compare active-active and active-passive redundancy',
      'Explain failure domains: rack, availability zone, and region',
      'Describe graceful degradation when a part fails',
      'Calculate downtime from an availability target',
    ],
    formulas: [
      {
        name: 'Availability and downtime',
        expression: 'downtime per year = (1 − availability) × 525,600 minutes',
        note: 'At 99.999% availability, downtime = 0.00001 × 525,600 = 5.26 minutes per year. At 99.9% it is 0.001 × 525,600 = 525.6 minutes, about 8.8 hours.',
      },
      {
        name: 'Availability in series',
        expression: 'A_total = A₁ × A₂',
        note: 'Two components at 99.9% each, one depending on the other, give 0.999 × 0.999 = 0.998, or 99.8% — a chain is only as strong as its weakest link, which is why redundancy runs in parallel instead.',
      },
    ],
    steps: [
      step(
        's1',
        'Everything fails eventually',
        'Every component fails eventually: disks die, servers crash, networks partition, and whole data centres lose power. Fault tolerance is the discipline of assuming that, and designing so that no single failure stops the system. The first step is to name the single points of failure — the one database, the one load balancer, the one region — and then remove them one by one until every critical path has a spare.',
        [
          metric('Single points of failure', '1', 'database'),
          metric('Copies of the data', '1'),
          metric('If it dies', 'Everything stops', undefined, 'bad'),
        ],
        [
          'One database is the single point of failure',
          'Fault tolerance starts by naming every such point',
        ],
        'A single point of failure is not always a machine: one person who alone knows how to deploy, or one vendor for a critical service, counts just as much.',
        'Design as if failure is certain — because over a long enough run, it is.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Requests' }),
            node('server', 'server', 'App Server', 220, 150, { status: 'healthy', sublabel: 'Serves traffic' }),
            node('db', 'db', 'Database', 440, 150, { status: 'failed', sublabel: 'Single copy' }),
          ],
          edges: [
            edge('user', 'server', 'Requests'),
            edge('server', 'db', 'Reads + writes'),
          ],
          activeNodeIds: ['server', 'db'],
          activeEdgeIds: ['user->server', 'server->db'],
          caption: 'One database is a single point of failure: if it dies, the whole system stops.',
        },
      ),
      step(
        's2',
        'Redundancy: a spare ready to take over',
        'Redundancy means keeping a spare ready. In active-passive redundancy, one copy serves traffic while a standby waits, taking over only when the primary fails — simple, but the standby sits idle and the takeover takes time. In active-active redundancy, both copies serve traffic at once, so a failure just shifts load to the survivor with no takeover at all. Active-active costs more to run, but it is faster to recover and easier to test, because the spare is always in use.',
        [
          metric('Servers', '2'),
          metric('Mode', 'Active-active'),
          metric('Takeover time', '0', 's', 'good'),
        ],
        [
          'A second server joins and both serve traffic at once',
          'A failure now just shifts load, with no takeover step',
        ],
        'An untested standby is a hope, not a spare: failover must be practised, because a takeover that has never run is the one that fails when it matters.',
        'A spare that is always in use is a spare you know works.',
        {
          nodes: [
            node('lb', 'lb', 'Load Balancer', 20, 150, { status: 'healthy', sublabel: 'Splits traffic' }),
            node('server-a', 'server', 'Server A', 220, 60, { status: 'healthy', sublabel: 'Active' }),
            node('server-b', 'server', 'Server B', 220, 240, { status: 'healthy', sublabel: 'Active' }),
            node('db', 'db', 'Database', 440, 150, { status: 'healthy', sublabel: 'Replicated' }),
          ],
          edges: [
            edge('lb', 'server-a', 'Half the traffic'),
            edge('lb', 'server-b', 'Half the traffic'),
            edge('server-a', 'db', 'Reads + writes'),
            edge('server-b', 'db', 'Reads + writes'),
          ],
          activeNodeIds: ['lb', 'server-a', 'server-b'],
          activeEdgeIds: ['lb->server-a', 'lb->server-b'],
          caption: 'In active-active redundancy both servers take traffic, so one failure just shifts the load.',
        },
      ),
      step(
        's3',
        'Failure domains: don’t put both copies in one place',
        'Two copies are only redundant if they cannot fail together. Servers in the same rack share power and a network switch; servers in the same availability zone share a building; servers in the same region share floods, power grids, and bad deploys. A failure domain is the blast radius of one failure, and copies must sit in different ones. The rule is simple: a spare that shares fate with the original is not a spare.',
        [
          metric('Copies', '2'),
          metric('Availability zones', '2'),
          metric('Shared fate', 'None', undefined, 'good'),
        ],
        [
          'The second copy moves to a different availability zone',
          'One zone failing can no longer take both copies',
        ],
        'Cross-zone traffic costs more and adds latency, so copies are usually placed close — different zones in one region — unless the system must survive a whole region failing.',
        'A spare that shares fate with the original is not a spare.',
        {
          nodes: [
            node('server-a', 'server', 'Server A', 20, 60, { status: 'healthy', sublabel: 'Zone A' }),
            node('server-b', 'server', 'Server B', 20, 240, { status: 'healthy', sublabel: 'Zone B' }),
            node('db-a', 'db', 'Primary DB', 280, 60, { status: 'healthy', sublabel: 'Zone A' }),
            node('db-b', 'db', 'Replica DB', 280, 240, { status: 'healthy', sublabel: 'Zone B' }),
          ],
          edges: [
            edge('server-a', 'db-a', 'Reads + writes'),
            edge('server-b', 'db-b', 'Reads + writes'),
            edge('db-a', 'db-b', 'Replication', 'replication'),
          ],
          activeNodeIds: ['server-a', 'server-b', 'db-a', 'db-b'],
          activeEdgeIds: ['db-a->db-b'],
          caption: 'Copies live in different availability zones, so one zone failing cannot take both.',
        },
      ),
      step(
        's4',
        'Graceful degradation: less, not nothing',
        'When part of a system fails, the rest should do less — not nothing. A shop whose recommendation service is down can still show products and take orders, just without personalised suggestions. A feed that cannot load fresh posts can serve cached ones with a note that they are stale. This is graceful degradation: shedding the nice-to-have features so the must-have ones keep working, and telling the user honestly what is missing.',
        [
          metric('Recommendations', 'Down', undefined, 'warn'),
          metric('Checkout', 'Working', undefined, 'good'),
          metric('Feed', 'Cached posts'),
        ],
        [
          'The recommendation service fails',
          'Checkout keeps working and the feed serves cached posts',
        ],
        'Decide the shedding order in advance: which features may be dropped, in which order, and who decides — because that decision should never be made during an outage.',
        'When something fails, do less — not nothing.',
        {
          nodes: [
            node('user', 'user', 'Users', 20, 150, { status: 'healthy', sublabel: 'Orders work' }),
            node('server', 'server', 'Shop', 220, 150, { status: 'healthy', sublabel: 'Core works' }),
            node('service', 'service', 'Recommendations', 440, 60, { status: 'failed', sublabel: 'Down' }),
            node('cache', 'cache', 'Cached Feed', 440, 240, { status: 'healthy', sublabel: 'Stale is fine' }),
          ],
          edges: [
            edge('user', 'server', 'Orders work'),
            edge('server', 'service', 'Skipped — degraded'),
            edge('server', 'cache', 'Serves cached posts'),
          ],
          activeNodeIds: ['server', 'cache'],
          activeEdgeIds: ['user->server', 'server->cache'],
          caption: 'With recommendations down, the shop still sells and the feed serves cached posts.',
        },
      ),
      step(
        's5',
        'Five nines: the math of uptime',
        'Availability is measured in nines, and each nine costs more than the last. Three nines — 99.9% uptime — allows about 8.8 hours of downtime a year; five nines — 99.999% — allows about 5.3 minutes. That last gap is the expensive one: it needs redundancy everywhere, fast automated failover, and practised recovery. Most products do not need five nines. Choose the target from what users actually lose during an outage, not from how impressive the number sounds.',
        [
          metric('99.9% uptime', '8.8', 'h downtime/yr'),
          metric('99.999% uptime', '5.26', 'min downtime/yr'),
          metric('Cost of each nine', 'Rises steeply', undefined, 'warn'),
        ],
        [
          'Availability targets are converted into downtime budgets',
          'Five nines allows about 5.26 minutes of downtime per year',
        ],
        'Downtime budgets are spent on deploys and maintenance too, not just failures — a target of five nines leaves almost no room for either.',
        'Pick the nines from what an outage costs, not from how the number sounds.',
        {
          nodes: [
            node('server', 'server', 'App', 20, 150, { status: 'healthy', sublabel: '99.999%' }),
            node('db', 'db', 'Replicated DB', 280, 150, { status: 'healthy', sublabel: '99.999%' }),
            node('user', 'user', 'Users', 520, 150, { status: 'healthy', sublabel: '5.26 min down/yr' }),
          ],
          edges: [
            edge('server', 'db', 'Replicated'),
            edge('db', 'user', 'Available 99.999%'),
          ],
          activeNodeIds: ['server', 'db', 'user'],
          activeEdgeIds: ['server->db', 'db->user'],
          caption: 'Five nines means the system may be down for about five minutes a year.',
        },
      ),
    ],
    summary:
      'Fault tolerance assumes failure and designs around it: name every single point of failure, then give each critical path a spare. Redundancy works best active-active, with copies in different failure domains so one rack, zone, or region cannot take both. When part of the system fails anyway, shed the nice-to-have features and keep the must-haves running. And availability is a budget: 99.9% allows about 8.8 hours of downtime a year, while 99.999% allows only about 5.26 minutes. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['reliability-patterns'],
  },
};

