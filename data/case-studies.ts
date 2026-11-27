/*
 * Case study library: one full worked design — a URL shortener.
 *
 * This is an educational design exercise written for this app, not a
 * description of any real company’s architecture. All traffic and
 * storage numbers are assumptions made for the exercise.
 */

import type { CaseStudy } from '@/lib/types';

export const caseStudies: CaseStudy[] = [
  {
    id: 'url-shortener',
    title: 'Design a URL Shortener',
    difficulty: 'Intermediate',
    estMin: 20,
    problem:
      'Design a service like the well-known URL shorteners: a user pastes a long URL and gets back a short link, and anyone who opens the short link is redirected to the original. This is an educational design exercise, not a description of any real company’s architecture. The interesting parts are not the redirect itself — they are generating short codes that never collide, serving far more reads than writes, and keeping the service fast at internet scale. All numbers below are assumptions chosen for this exercise, not measurements from a real system.',
    requirements: [
      'Shorten a long URL into a short link, for example https://sho.rt/aB3x9Q',
      'Redirect a short link to its original URL with a fast HTTP redirect',
      'Short codes must be unique: two different URLs may share a code only if the same URL is shortened twice',
      'Support custom aliases when a user picks their own short code',
      'Let link owners see basic click statistics: total clicks and clicks over time',
      'Links can expire or be deleted by their owner',
      'The service must stay available and fast under far more reads than writes',
      'Do not serve malicious or illegal destinations: check new URLs against a blocklist',
    ],
    estimates: [
      {
        label: 'New short URLs per day',
        value: '5M',
        note: 'Assumption for this exercise: most users share links they already have, so creation is the smaller flow.',
      },
      {
        label: 'Redirects per day',
        value: '500M',
        note: 'Assumption: each short link is opened many times, so reads dominate the system.',
      },
      {
        label: 'Read-to-write ratio',
        value: '~100:1',
        note: '500M redirects a day against 5M new URLs a day — roughly 100 reads for every write.',
      },
      {
        label: 'Average redirects per second',
        value: '~5,800/sec',
        note: '500M redirects divided by 86,400 seconds in a day.',
      },
      {
        label: 'Peak redirects per second',
        value: '~11,600/sec',
        note: 'Assumption: peak traffic runs about twice the daily average.',
      },
      {
        label: 'Storage for 5 years',
        value: '~4.5 TB',
        note: 'Assumption: each stored URL record is about 500 bytes; 5M a day is about 2.5 GB a day, or about 4.5 TB over 5 years.',
      },
    ],
    apis: [
      {
        method: 'POST',
        path: '/shorten',
        desc: 'Accepts a long URL (and an optional custom alias) and returns the short link. Returns the existing code if the same URL was already shortened.',
      },
      {
        method: 'GET',
        path: '/{code}',
        desc: 'Looks up the code and redirects to the original URL with a 302 (or 301 for permanent links). The hottest path in the system, so it must avoid slow work.',
      },
      {
        method: 'DELETE',
        path: '/urls/{code}',
        desc: 'Deletes a short link owned by the caller. The code is retired and future visits return a 404.',
      },
      {
        method: 'GET',
        path: '/stats/{code}',
        desc: 'Returns click statistics for a link: total clicks and a breakdown over time, for the link owner.',
      },
    ],
    dataModel: [
      'One row per short link: short code, original URL, owner id, creation time, expiry time, and click count.',
      'The short code is the primary key: lookups are a single key fetch, never a scan.',
      'Short codes use base62 — digits, lowercase, and uppercase letters — so a 7-character code gives 62^7, or about 3.5 trillion, possible values.',
      'Two ways to make a code: hash the URL and take the first characters, or take a global counter and encode it in base62. A counter guarantees uniqueness; a hash needs a collision check and a retry.',
      'A counter avoids collisions but needs a single source of numbers; a hash is stateless but can collide, so the design checks the database and retries with a salt on collision.',
      'Click events are written separately from the link table — counting clicks in the same row would make every redirect a write to a hot row.',
    ],
    architecture: [
      'A load balancer spreads traffic across stateless app servers, so any server can handle any request and servers can be added or removed freely.',
      'A cache sits in front of the database on the read path: the hottest short links live in memory, so most redirects never touch the database.',
      'The primary database stores every short link and is replicated to read replicas for the stats and admin reads that can tolerate slight delay.',
      'A distributed counter service hands out unique numbers for base62 encoding, so code generation never depends on one machine’s local counter.',
      'Click events go to a message queue first and are counted asynchronously, keeping the redirect path fast and letting analytics lag slightly behind.',
      'A blocklist service checks new URLs at creation time, not at redirect time, so the hot path stays a single cache lookup.',
      'Static assets and the landing page are served from a CDN, leaving the app servers to do only shortening and redirecting.',
    ],
    tradeoffs: [
      {
        choice: 'Counter-based codes vs hash-based codes',
        pro: 'A counter encoded in base62 never collides, so creation is a single insert.',
        con: 'The counter is a shared dependency: it must stay available and ordered, or creation stalls.',
      },
      {
        choice: 'Cache the hot links vs read the database every time',
        pro: 'Caching makes redirects a fast memory lookup and protects the database from the read load.',
        con: 'A deleted or expired link can linger in the cache, so expiry and deletion need explicit cache invalidation.',
      },
      {
        choice: '301 permanent vs 302 temporary redirects',
        pro: 'A 301 lets browsers cache the redirect, cutting repeat traffic to the service.',
        con: 'A cached 301 cannot be revoked easily if the destination changes, so 302 is safer for links that may move.',
      },
      {
        choice: 'Count clicks synchronously vs via a queue',
        pro: 'Queueing keeps the redirect path to one lookup and absorbs click spikes without slowing redirects.',
        con: 'Statistics lag behind reality by seconds, and a lost queue message loses a click.',
      },
    ],
    bottlenecks: [
      'The redirect read path: 500M reads a day must be served mostly from cache, or the database becomes the bottleneck.',
      'The counter service for code generation: every new URL needs a unique number, so the counter must be fast and highly available.',
      'The click-counting pipeline: counting every redirect synchronously would turn a read-heavy system into a write-heavy one.',
      'Cache invalidation on delete and expiry: a stale cache entry can keep serving a link the owner already removed.',
    ],
  },
];
