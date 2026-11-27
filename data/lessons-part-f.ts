/*
 * Fully-written lessons — filled in by the curriculum completion work.
 * This file holds Part F: l33 Encryption and Secrets Management,
 * l34 Application and Infrastructure Security, l35 CI/CD and
 * Deployment, and l36 Monitoring, Logging and Observability.
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

export const lessonsPartF: Record<string, Lesson> = {
  l33: {
    id: 'l33',
    chapterId: 'security',
    number: 33,
    title: 'Encryption and Secrets Management',
    durationMin: 11,
    difficulty: 'Intermediate',
    intro:
      'At rest, in transit, and the keys that must never end up in a repo.',
    objectives: [
      'Explain the difference between symmetric and asymmetric encryption',
      'Describe how TLS protects data in transit',
      'Explain how data at rest is encrypted and where the keys live',
      'Explain why passwords are hashed, not encrypted',
      'Describe how secrets are stored and rotated safely',
    ],
    steps: [
      step(
        's1',
        'Two kinds of encryption',
        'Encryption scrambles data so only someone with the right key can read it. Symmetric encryption uses one shared key for both locking and unlocking, which makes it fast — it is what protects the bulk of your data. Asymmetric encryption uses a pair: a public key anyone can use to lock data, and a private key only the owner holds to unlock it. It is slower, so systems use it mainly to exchange a symmetric key safely, then switch to the fast symmetric cipher for the rest.',
        [
          metric('Symmetric key', '256', 'bits'),
          metric('Asymmetric key', '2048', 'bits'),
          metric('Bulk data cipher', 'AES-256'),
        ],
        [
          'Symmetric encryption uses one shared key and is fast',
          'Asymmetric encryption uses a public-private key pair',
        ],
        'The standard pattern is hybrid: use the slow asymmetric pair to agree on a fast symmetric key, then encrypt the actual data symmetrically.',
        'One key for speed, a key pair for safe exchange.',
        {
          nodes: [
            node('client', 'client', 'Sender', 20, 150, { status: 'healthy' }),
            node('service', 'service', 'Key Exchange', 280, 150, { status: 'healthy', sublabel: 'Public key' }),
            node('server', 'server', 'Receiver', 520, 150, { status: 'healthy', sublabel: 'Private key' }),
          ],
          edges: [
            edge('client', 'service', 'Locks with public key'),
            edge('service', 'server', 'Unlocks with private key'),
          ],
          activeNodeIds: ['client', 'service', 'server'],
          activeEdgeIds: ['client->service', 'service->server'],
          caption: 'Asymmetric encryption locks data with a public key that only the matching private key can open.',
        },
      ),
      step(
        's2',
        'TLS protects data in transit',
        'When a browser talks to a server, the data crosses networks the user does not control. TLS encrypts that channel: after a short handshake, everything sent in either direction is scrambled, so anyone watching the wire sees only noise. TLS also authenticates the server through a certificate, so the browser knows it is talking to the real site and not an impostor. Without it, passwords, tokens, and personal data travel in plain text.',
        [
          metric('TLS version', '1.3'),
          metric('Handshake', '1', 'round trip'),
          metric('Data on the wire', 'Encrypted'),
        ],
        [
          'TLS encrypts traffic between browser and server',
          'The server certificate proves the site is genuine',
        ],
        'TLS 1.3 completes its handshake in one round trip, and a valid certificate is what makes the browser show the padlock.',
        'Encryption without authentication still leaves you talking to a stranger.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'Server', 300, 150, { status: 'healthy', sublabel: 'TLS 1.3' }),
            node('db', 'db', 'Database', 540, 150, { status: 'idle', sublabel: 'Not reached yet' }),
          ],
          edges: [edge('client', 'server', 'TLS handshake, then encrypted')],
          activeNodeIds: ['client', 'server'],
          activeEdgeIds: ['client->server'],
          caption: 'The browser and server negotiate TLS, then all traffic between them is encrypted.',
        },
      ),
      step(
        's3',
        'Data at rest is encrypted too',
        'Encryption does not stop at the network. Data stored on disk — database files, backups, object storage — is encrypted at rest, so a stolen hard drive or a leaked backup file is useless without the key. The key itself must never sit next to the data: it lives in a separate key management service, and the application fetches a short-lived data key when it needs one. Encrypting data while storing the key beside it is like locking a door and leaving the key under the mat.',
        [
          metric('Disk encryption', 'AES-256'),
          metric('Key storage', 'Separate service'),
          metric('Stolen disk', 'Unreadable'),
        ],
        [
          'Database files and backups are encrypted on disk',
          'Keys live in a separate key management service',
        ],
        'Most managed databases and cloud storage encrypt at rest by default — but the key management settings are what make that encryption real.',
        'Encryption is only as strong as the place you keep the key.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('service', 'service', 'Key Manager', 280, 40, { status: 'healthy', sublabel: 'Holds the keys' }),
            node('db', 'db', 'Database', 280, 220, { status: 'healthy', sublabel: 'Encrypted disk' }),
          ],
          edges: [
            edge('server', 'service', 'Fetches data key'),
            edge('server', 'db', 'Encrypted writes'),
          ],
          activeNodeIds: ['server', 'service', 'db'],
          activeEdgeIds: ['server->service', 'server->db'],
          caption: 'The app fetches a key from a separate key manager and writes encrypted data to the database.',
        },
      ),
      step(
        's4',
        'Passwords are hashed, not encrypted',
        'Hashing looks like encryption but is a different job. Encryption is reversible with the key; hashing is one-way by design — you can turn a password into a hash, but you cannot turn the hash back into the password. To check a login, the server hashes the password the user typed and compares the two hashes. A slow, salted hash such as bcrypt or Argon2 makes guessing expensive, and a unique salt per user means the same password produces a different hash for every account.',
        [
          metric('Hashing', 'bcrypt'),
          metric('Salt', 'Unique per user'),
          metric('Hash reversed', 'Not possible'),
        ],
        [
          'Passwords are stored as one-way hashes, never as plain text',
          'Each hash uses a unique salt and a slow algorithm',
        ],
        'Fast hashes such as SHA-256 are built for speed, which is exactly what an attacker guessing passwords wants — password hashing needs a deliberately slow algorithm.',
        'Encryption protects data you need back; hashing protects data you never need to see again.',
        {
          nodes: [
            node('client', 'client', 'Login Form', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'Server', 280, 150, { status: 'healthy', sublabel: 'Hashes the password' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'Stores hashes only' }),
          ],
          edges: [
            edge('client', 'server', 'Password'),
            edge('server', 'db', 'Store salted hash'),
          ],
          activeNodeIds: ['client', 'server', 'db'],
          activeEdgeIds: ['client->server', 'server->db'],
          caption: 'The server hashes the password and stores only the hash, never the password itself.',
        },
      ),
      step(
        's5',
        'Secrets never belong in a repo',
        'A secret is anything that grants access: a database password, an API key, a private key. Secrets belong in a secrets manager — a dedicated service that hands them to the application at runtime and records who asked for them. They never belong in source code, chat messages, or screenshots, because a repo is copied far more widely than anyone remembers. Good hygiene also means rotation: replace each secret on a schedule and immediately after any suspected leak, so a stolen secret stops working quickly.',
        [
          metric('Secret lifetime', '24', 'hours'),
          metric('Rotation', 'Every 90', 'days'),
          metric('Secrets in repo', '0'),
        ],
        [
          'Secrets are fetched from a secrets manager at runtime',
          'Secrets are rotated on a schedule and after any leak',
        ],
        'Short-lived secrets are the strongest form of rotation: a secret that expires in a day is only useful to an attacker for a day.',
        'If a secret is in the repo, treat it as already leaked.',
        {
          nodes: [
            node('server', 'server', 'App Server', 20, 150, { status: 'healthy' }),
            node('service', 'service', 'Secrets Manager', 280, 150, { status: 'healthy', sublabel: 'Issues short-lived secrets' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'Accepts the secret' }),
          ],
          edges: [
            edge('server', 'service', 'Fetches secret at runtime'),
            edge('server', 'db', 'Connects with secret'),
          ],
          activeNodeIds: ['server', 'service', 'db'],
          activeEdgeIds: ['server->service', 'server->db'],
          caption: 'The app fetches its database secret from a secrets manager at runtime instead of reading it from code.',
        },
      ),
    ],
    summary:
      'Encryption comes in two forms: fast symmetric ciphers for bulk data and public-private key pairs for safe key exchange, with TLS protecting data in transit and disk encryption protecting it at rest. The key is always the weak point, so it lives in a separate service, never beside the data. Passwords are hashed one-way with a salt, never encrypted, and secrets are fetched from a secrets manager at runtime and rotated regularly — never written into a repo. ' +
      ILLUSTRATIVE,
  },
  l34: {
    id: 'l34',
    chapterId: 'security',
    number: 34,
    title: 'Application and Infrastructure Security',
    durationMin: 12,
    difficulty: 'Advanced',
    intro:
      'The boring checklist that stops the interesting breaches.',
    objectives: [
      'Explain how injection attacks work and how parameterized queries stop them',
      'Describe XSS and CSRF and the defenses against each',
      'Apply least privilege to users, services, and database roles',
      'Explain network segmentation and defense in depth',
      'Describe patching, scanning, and basic incident response',
    ],
    steps: [
      step(
        's1',
        'Injection: never trust input',
        'An injection attack happens when user input is treated as code. The classic case is SQL injection: a login form builds a query by pasting the typed username straight into the SQL string, and a crafted input changes the query itself — logging in without a password or dumping a whole table. The fix is to never build queries from strings. Parameterized queries send the code and the data separately, so the database treats the input as a value no matter what it contains. Validation helps, but it is a second layer, not the fix.',
        [
          metric('Parameterized queries', '100', '%'),
          metric('SQL built from input', '0'),
          metric('Injection attempts blocked', '12', 'today'),
        ],
        [
          'User input pasted into a query can change the query itself',
          'Parameterized queries keep code and data separate',
        ],
        'Injection is not limited to SQL — the same pattern hits command lines, LDAP queries, and template engines whenever input becomes code.',
        'Treat every input as hostile until proven otherwise.',
        {
          nodes: [
            node('client', 'client', 'User Input', 20, 150, { status: 'healthy', sublabel: 'Untrusted' }),
            node('server', 'server', 'App Server', 280, 150, { status: 'healthy', sublabel: 'Parameterizes query' }),
            node('db', 'db', 'Database', 520, 150, { status: 'healthy', sublabel: 'Sees data, not code' }),
          ],
          edges: [
            edge('client', 'server', 'Untrusted input'),
            edge('server', 'db', 'Parameterized query'),
          ],
          activeNodeIds: ['client', 'server', 'db'],
          activeEdgeIds: ['client->server', 'server->db'],
          caption: 'User input reaches the app, but a parameterized query keeps it as data, never as code.',
        },
      ),
      step(
        's2',
        'XSS and CSRF: attacks through the browser',
        'Cross-site scripting, or XSS, happens when an attacker stores a script in your app — in a comment, a profile name, a message — and another user’s browser runs it. The script acts as that user: it can read data and act in their name. The defense is to escape output so text is never interpreted as code, and to mark session cookies HttpOnly so scripts cannot read them. CSRF is the mirror image: a malicious site tricks the user’s browser into sending a request to your app with the user’s cookies attached. The defense is an unpredictable token on state-changing forms, plus SameSite cookies.',
        [
          metric('Output escaping', 'On'),
          metric('Session cookie', 'HttpOnly'),
          metric('State-changing forms', 'CSRF token'),
        ],
        [
          'XSS runs attacker code inside a victim’s browser',
          'CSRF tricks a browser into sending a request the user never made',
        ],
        'Stored XSS is the dangerous kind: one planted comment can attack every user who views the page, so escaping must happen for all user content, not just form fields.',
        'Escape what you display; verify what you receive.',
        {
          nodes: [
            node('client', 'client', 'Browser', 20, 150, { status: 'healthy', sublabel: 'Runs page scripts' }),
            node('server', 'server', 'App Server', 280, 150, { status: 'healthy', sublabel: 'Escapes output' }),
            node('service', 'service', 'Auth Service', 520, 150, { status: 'healthy', sublabel: 'Checks CSRF token' }),
          ],
          edges: [
            edge('client', 'server', 'Page request'),
            edge('server', 'service', 'Verify token'),
          ],
          activeNodeIds: ['client', 'server', 'service'],
          activeEdgeIds: ['client->server', 'server->service'],
          caption: 'The app escapes user content before display and checks a CSRF token on state-changing requests.',
        },
      ),
      step(
        's3',
        'Least privilege, everywhere',
        'Least privilege means every person, service, and database account gets exactly the permissions it needs — and nothing else. A reporting service gets a read-only database role; a web server never gets the right to drop tables; a developer’s everyday account cannot touch production. When an account is compromised, the damage stops at the boundary of what that account could do. Permissions should also be denied by default: nothing is allowed unless it is explicitly granted, and access is reviewed regularly because roles quietly grow over time.',
        [
          metric('Reporting role', 'Read-only'),
          metric('Default access', 'Deny'),
          metric('Access reviews', 'Every 90', 'days'),
        ],
        [
          'Every account gets only the permissions it needs',
          'Access is denied by default and reviewed regularly',
        ],
        'Service accounts deserve the same discipline as people: a service that only reads orders should not hold a database password that can delete them.',
        'A breach is bounded by what the breached account could do.',
        {
          nodes: [
            node('user', 'user', 'Admin', 20, 150, { status: 'healthy' }),
            node('gateway', 'gateway', 'API Gateway', 190, 150, { status: 'healthy', sublabel: 'Checks token' }),
            node('server', 'server', 'Service', 360, 150, { status: 'healthy', sublabel: 'Scoped role' }),
            node('db', 'db', 'Database', 530, 150, { status: 'healthy', sublabel: 'Read-only role' }),
          ],
          edges: [
            edge('user', 'gateway', 'Request with token'),
            edge('gateway', 'server', 'Allowed actions only'),
            edge('server', 'db', 'Read-only query'),
          ],
          activeNodeIds: ['user', 'gateway', 'server', 'db'],
          activeEdgeIds: ['user->gateway', 'gateway->server', 'server->db'],
          caption: 'A request passes through the gateway with a scoped token and reaches the database with a read-only role.',
        },
      ),
      step(
        's4',
        'Segment the network',
        'Defense in depth means no single layer carries the whole security burden. The network is one of those layers: servers live in private subnets with no public address, and only the load balancer faces the internet. The database accepts connections only from the application servers, on one port, and the admin panel is reachable only through a VPN. If one layer fails — a leaked credential, a bug in one service — the next layer still stands between the attacker and the data.',
        [
          metric('Public database ports', '0'),
          metric('Admin access', 'VPN only'),
          metric('App servers', 'Private subnet'),
        ],
        [
          'Only the load balancer faces the internet',
          'The database accepts connections only from app servers',
        ],
        'A database with a public address and a weak password is one of the most common ways real systems get breached — it should never be reachable from the internet at all.',
        'Every layer you add is another chance to stop an attacker.',
        {
          nodes: [
            node('lb', 'lb', 'Load Balancer', 20, 150, { status: 'healthy', sublabel: 'Public' }),
            node('server', 'server', 'App Servers', 220, 150, { status: 'healthy', sublabel: 'Private subnet' }),
            node('db', 'db', 'Database', 420, 150, { status: 'healthy', sublabel: 'Private, one port' }),
            node('service', 'service', 'Admin Panel', 560, 40, { status: 'healthy', sublabel: 'VPN only' }),
          ],
          edges: [
            edge('lb', 'server', 'Public traffic'),
            edge('server', 'db', 'Internal only'),
          ],
          activeNodeIds: ['lb', 'server', 'db'],
          activeEdgeIds: ['lb->server', 'server->db'],
          caption: 'Only the load balancer is public; app servers and the database sit in private subnets.',
        },
      ),
      step(
        's5',
        'Patch, scan, and be ready to respond',
        'Security is a routine, not a one-time setup. Dependencies are scanned for known vulnerabilities on every build, and patches are applied on a schedule — quickly for critical fixes, because attackers automate the search for unpatched systems. Logs from every service are collected centrally, so a strange login or a sudden flood of errors can actually be noticed. And when something does go wrong, the team follows a written runbook: contain the damage, find the cause, fix it, and write down what changed so it does not happen twice.',
        [
          metric('Dependency scan', 'Every build'),
          metric('Critical patches', 'Within 48', 'hours'),
          metric('Incident runbook', 'Written'),
        ],
        [
          'Dependencies are scanned for known vulnerabilities',
          'Logs are collected centrally and a runbook guides response',
        ],
        'Most breaches use a vulnerability that already had a published fix — patching is unglamorous, and it is the single highest-value habit in this lesson.',
        'Prevention fails sometimes; detection and a plan decide what happens next.',
        {
          nodes: [
            node('service', 'service', 'Vuln Scanner', 20, 150, { status: 'healthy', sublabel: 'Scans every build' }),
            node('server', 'server', 'App Servers', 280, 150, { status: 'healthy', sublabel: 'Patched' }),
            node('db', 'db', 'Log Store', 520, 150, { status: 'healthy', sublabel: 'Central logs' }),
          ],
          edges: [
            edge('service', 'server', 'Flags known issues'),
            edge('server', 'db', 'Ships logs'),
          ],
          activeNodeIds: ['service', 'server', 'db'],
          activeEdgeIds: ['service->server', 'server->db'],
          caption: 'A scanner checks every build and the servers ship their logs to one central store.',
        },
      ),
    ],
    summary:
      'Application security starts with treating input as hostile: parameterized queries stop injection, escaping stops XSS, and CSRF tokens stop forged requests. Least privilege bounds the damage when an account is compromised, network segmentation adds layers an attacker must cross, and the routine work — scanning dependencies, patching quickly, collecting logs, and keeping a written incident runbook — is what turns a secure design into a system that stays secure. ' +
      ILLUSTRATIVE,
  },
  l35: {
    id: 'l35',
    chapterId: 'shipping',
    number: 35,
    title: 'CI/CD and Deployment',
    durationMin: 11,
    difficulty: 'Beginner',
    intro:
      'Every commit tested, every release boring.',
    objectives: [
      'Explain what continuous integration does on every commit',
      'Describe the stages of a CI/CD pipeline',
      'Compare rolling, blue-green, and canary deployments',
      'Explain how rollbacks and feature flags make releases safe',
      'Explain why small, frequent releases are safer than big ones',
    ],
    steps: [
      step(
        's1',
        'Continuous integration: test every commit',
        'Continuous integration means every commit is automatically built and tested within minutes of being pushed. A developer pushes code, a CI runner checks it out, installs dependencies, runs the test suite and the linter, and reports a pass or a fail. The point is speed of feedback: a broken change is caught while the developer still remembers writing it, instead of surfacing days later when nobody knows which change caused it. A failing build blocks the merge, so broken code never reaches the main branch.',
        [
          metric('Build + test time', '4', 'minutes'),
          metric('Tests run per commit', '320'),
          metric('Broken code merged', '0'),
        ],
        [
          'Every push triggers an automatic build and test run',
          'A failing build blocks the merge',
        ],
        'CI is not just tests: linting, type checking, and formatting checks all run here, so code style arguments happen once in a config file instead of in every review.',
        'Catch a break in minutes, not days.',
        {
          nodes: [
            node('client', 'client', 'Developer', 20, 150, { status: 'healthy', sublabel: 'Pushes a commit' }),
            node('service', 'service', 'CI Runner', 280, 150, { status: 'healthy', sublabel: 'Build + test' }),
            node('server', 'server', 'Artifact Store', 520, 150, { status: 'healthy', sublabel: 'Passing builds' }),
          ],
          edges: [
            edge('client', 'service', 'Pushes commit'),
            edge('service', 'server', 'Stores passing build'),
          ],
          activeNodeIds: ['client', 'service', 'server'],
          activeEdgeIds: ['client->service', 'service->server'],
          caption: 'A developer pushes a commit, the CI runner builds and tests it, and a passing build is stored.',
        },
      ),
      step(
        's2',
        'The pipeline: build, test, deploy',
        'A CI/CD pipeline is a chain of stages, each with one job. Build turns source code into a runnable artifact — a container image, a bundle, a binary — and stamps it with a version. Test runs the automated checks: unit tests, integration tests, and security scans. Deploy ships the artifact to an environment, first to staging for a final check, then to production. Because the pipeline is code, every release follows the exact same steps, in the same order, with no forgotten manual step in between.',
        [
          metric('Pipeline stages', '3'),
          metric('Environments', 'Staging, then prod'),
          metric('Manual steps', '0'),
        ],
        [
          'Build creates a versioned artifact from source code',
          'Test runs automated checks before any deploy',
        ],
        'The artifact built once in the pipeline is the same one deployed to staging and to production — rebuilding for each environment can hide differences between them.',
        'A pipeline is a checklist that runs itself.',
        {
          nodes: [
            node('build', 'service', 'Build', 20, 150, { status: 'healthy', sublabel: 'Makes an artifact' }),
            node('test', 'service', 'Test', 280, 150, { status: 'healthy', sublabel: 'Runs the checks' }),
            node('deploy', 'server', 'Deploy', 520, 150, { status: 'healthy', sublabel: 'Ships to prod' }),
          ],
          edges: [
            edge('build', 'test', 'Artifact v1.4.2'),
            edge('test', 'deploy', 'All checks pass'),
          ],
          activeNodeIds: ['build', 'test', 'deploy'],
          activeEdgeIds: ['build->test', 'test->deploy'],
          caption: 'The pipeline builds an artifact, tests it, and deploys the same artifact to production.',
        },
      ),
      step(
        's3',
        'Blue-green: swap, don’t upgrade',
        'A blue-green deployment keeps two identical environments. Blue runs the current version and serves all traffic; green runs the new version, idle. The new version is deployed to green and tested there — real servers, real data, zero users. When it is ready, the load balancer flips traffic from blue to green in one step. If anything goes wrong, the flip goes back just as fast. The cost is running two environments, but the release itself becomes a single, reversible switch.',
        [
          metric('Environments', '2'),
          metric('Traffic switch', '1', 'step'),
          metric('Users affected by deploy', '0'),
        ],
        [
          'New version deployed to an idle green environment',
          'Load balancer flips all traffic in one step',
        ],
        'Blue-green needs the database to tolerate both versions during the switch, which is why schema changes are usually made backward compatible first, then the code.',
        'Deploy to the idle half, then flip the switch.',
        {
          nodes: [
            node('lb', 'lb', 'Load Balancer', 20, 150, { status: 'healthy' }),
            node('blue', 'server', 'Blue (v1)', 280, 40, { status: 'healthy', sublabel: 'Live traffic' }),
            node('green', 'server', 'Green (v2)', 280, 220, { status: 'healthy', sublabel: 'Ready to flip' }),
          ],
          edges: [
            edge('lb', 'blue', 'Live traffic'),
            edge('lb', 'green', 'Switch when ready'),
          ],
          activeNodeIds: ['lb', 'blue', 'green'],
          activeEdgeIds: ['lb->blue', 'lb->green'],
          caption: 'Blue serves all traffic while green holds the new version, ready for the load balancer to flip.',
        },
      ),
      step(
        's4',
        'Canary: release to a few first',
        'A canary release sends the new version to a small slice of users — say 5% — while the rest stay on the old version. If the new version misbehaves, only that small group is affected, and the rollout stops before it reaches everyone. If it behaves, the share grows: 5%, then 25%, then 50%, then all. The name comes from the canary in a coal mine: a small, sensitive test that warns you before the danger reaches everyone. Automated checks on error rates decide whether to continue or roll back.',
        [
          metric('First canary slice', '5', '%'),
          metric('Rollout steps', '5 → 25 → 50 → 100', '%'),
          metric('Users at risk first', '5', '%'),
        ],
        [
          'New version released to 5% of users first',
          'Rollout grows in steps if error rates stay normal',
        ],
        'Pick the canary group carefully: it should be a random slice of real traffic, not only internal users, or the test will miss problems real users hit.',
        'Let a few users find the bug before all of them do.',
        {
          nodes: [
            node('lb', 'lb', 'Load Balancer', 20, 150, { status: 'healthy' }),
            node('v1', 'server', 'v1 (95%)', 280, 40, { status: 'healthy', sublabel: 'Most traffic' }),
            node('v2', 'server', 'v2 (5%)', 280, 220, { status: 'busy', sublabel: 'Canary slice' }),
          ],
          edges: [
            edge('lb', 'v1', '95% of traffic'),
            edge('lb', 'v2', '5% of traffic'),
          ],
          activeNodeIds: ['lb', 'v1', 'v2'],
          activeEdgeIds: ['lb->v1', 'lb->v2'],
          caption: 'The load balancer sends 5% of traffic to the new version and 95% to the old one.',
        },
      ),
      step(
        's5',
        'Rollbacks and feature flags',
        'Even a careful release can go wrong, so a release must be reversible. A rollback returns to the previous version — with blue-green it is one load balancer flip; with a canary it is stopping the rollout. Feature flags add a second safety net: new code ships to production turned off, and is switched on for chosen users without a new deploy. If the feature misbehaves, the flag turns it off in seconds. Together they make the rule simple: every release should be small, frequent, and undoable.',
        [
          metric('Rollback time', '2', 'minutes'),
          metric('Feature flag off', 'Seconds'),
          metric('Release size', 'Small'),
        ],
        [
          'A rollback returns to the previous version fast',
          'Feature flags switch code on or off without a deploy',
        ],
        'A rollback only works if the database change is backward compatible — a migration that deletes a column the old version still reads will break the rollback.',
        'If you cannot undo it, you are not ready to ship it.',
        {
          nodes: [
            node('deploy', 'service', 'Deploy Tool', 20, 150, { status: 'healthy' }),
            node('v2', 'server', 'v2 (broken)', 280, 40, { status: 'failed', sublabel: 'Errors rising' }),
            node('v1', 'server', 'v1 (stable)', 280, 220, { status: 'healthy', sublabel: 'Restore traffic' }),
          ],
          edges: [
            edge('deploy', 'v2', 'Roll back'),
            edge('deploy', 'v1', 'Restore traffic'),
          ],
          activeNodeIds: ['deploy', 'v2', 'v1'],
          activeEdgeIds: ['deploy->v2', 'deploy->v1'],
          caption: 'The deploy tool rolls back from the failing new version to the stable previous one.',
        },
      ),
    ],
    summary:
      'CI/CD turns releases from events into routine: every commit is built and tested automatically, and a pipeline of build, test, and deploy stages ships the same artifact everywhere. Blue-green deployments flip traffic between two environments, canary releases expose the new version to a small slice first, and rollbacks plus feature flags make every release undoable. Small, frequent, reversible releases beat rare, big, scary ones. ' +
      ILLUSTRATIVE,
  },
  l36: {
    id: 'l36',
    chapterId: 'shipping',
    number: 36,
    title: 'Monitoring, Logging and Observability',
    durationMin: 12,
    difficulty: 'Intermediate',
    intro:
      'Metrics tell you something is wrong; traces tell you where.',
    objectives: [
      'Explain what metrics, logs, and traces each capture',
      'Describe how the three pillars work together during an incident',
      'Explain the difference between monitoring and observability',
      'Design alerts that fire on symptoms users feel, not on noise',
      'Define an SLO and an error budget in plain terms',
    ],
    formulas: [
      {
        name: 'Error Budget',
        expression: 'Budget = 1 − SLO',
        note: 'With an SLO of 99.9%, the error budget is 0.1% — about 43 minutes of downtime per 30-day month.',
      },
    ],
    steps: [
      step(
        's1',
        'Metrics: the numbers',
        'A metric is a number measured over time: requests per second, error rate, CPU usage, the 95th-percentile latency. Metrics are cheap to store and fast to query, which makes them ideal for dashboards and alerts — you can watch a graph and see an error rate climb the moment it starts. Their weakness is detail: a metric can tell you that checkout errors doubled, but not which user, which request, or why. That is why metrics are only the first of three pillars, not the whole story.',
        [
          metric('Requests per second', '1,200'),
          metric('Error rate', '0.4', '%'),
          metric('p95 latency', '180', 'ms'),
        ],
        [
          'Metrics are numbers measured over time',
          'Dashboards show error rate and latency at a glance',
        ],
        'Percentiles matter more than averages for latency: the average can look fine while the slowest 5% of users wait seconds.',
        'Metrics show that something is wrong, and how big it is.',
        {
          nodes: [
            node('server', 'server', 'App Servers', 20, 150, { status: 'healthy' }),
            node('service', 'service', 'Metrics Store', 280, 150, { status: 'healthy', sublabel: 'Scraped every 15 s' }),
            node('client', 'client', 'Dashboard', 520, 150, { status: 'healthy', sublabel: 'Graphs + alerts' }),
          ],
          edges: [
            edge('server', 'service', 'Scrapes every 15 s'),
            edge('service', 'client', 'Graphs + alerts'),
          ],
          activeNodeIds: ['server', 'service', 'client'],
          activeEdgeIds: ['server->service', 'service->client'],
          caption: 'App servers expose metrics, a metrics store collects them, and a dashboard graphs them.',
        },
      ),
      step(
        's2',
        'Logs: the story',
        'A log is a timestamped line of text recording that something happened: a user logged in, a payment failed, a job retried. Logs carry the detail metrics cannot — the user id, the error message, the exact input that broke. They are written by the application, collected by a pipeline, and stored in one searchable place, because hunting through individual servers during an incident wastes the time that matters most. Structured logs, written as key-value fields instead of free text, make searching and filtering far easier than grepping raw lines.',
        [
          metric('Log lines per second', '850'),
          metric('Retention', '30', 'days'),
          metric('Search', 'Structured fields'),
        ],
        [
          'Logs record individual events with full detail',
          'All logs are collected into one searchable store',
        ],
        'Log the request id on every line: it is the thread that lets you pull one request’s whole story out of millions of lines.',
        'Logs answer the question metrics cannot: what exactly happened?',
        {
          nodes: [
            node('server', 'server', 'App', 20, 150, { status: 'healthy' }),
            node('queue', 'queue', 'Log Pipeline', 190, 150, { status: 'healthy', sublabel: 'Collects lines' }),
            node('service', 'service', 'Log Store', 360, 150, { status: 'healthy', sublabel: 'Searchable' }),
            node('client', 'client', 'Search', 530, 150, { status: 'healthy', sublabel: 'Finds the story' }),
          ],
          edges: [
            edge('server', 'queue', 'Writes log lines'),
            edge('queue', 'service', 'Ships + indexes'),
            edge('service', 'client', 'Search results'),
          ],
          activeNodeIds: ['server', 'queue', 'service', 'client'],
          activeEdgeIds: ['server->queue', 'queue->service', 'service->client'],
          caption: 'The app writes logs, a pipeline collects them into a searchable store, and search finds one request’s story.',
        },
      ),
      step(
        's3',
        'Traces: following one request',
        'A trace follows a single request across every service it touches. When the request enters the system it gets a trace id, and each service adds a span — a timed record of its own work — carrying that same id. Put the spans together and you see the request’s full path: 40 ms in the gateway, 120 ms in the checkout service, 300 ms in a slow database query. Traces turn a vague “the app is slow” into a named service and a named query, which is exactly where a fix starts.',
        [
          metric('Trace id', 'Shared across services'),
          metric('Slowest span', '300', 'ms'),
          metric('Services in trace', '4'),
        ],
        [
          'One trace id follows a request across services',
          'Each service adds a timed span to the trace',
        ],
        'Sampling keeps tracing affordable: recording every request is expensive, so many systems trace all errors and a small random share of normal requests.',
        'A trace turns “slow” into a place and a number.',
        {
          nodes: [
            node('client', 'client', 'User', 20, 150, { status: 'healthy' }),
            node('gateway', 'gateway', 'Gateway', 190, 150, { status: 'healthy', sublabel: '40 ms' }),
            node('server', 'server', 'Service A', 360, 150, { status: 'healthy', sublabel: '120 ms' }),
            node('service', 'service', 'Service B', 530, 150, { status: 'busy', sublabel: '300 ms' }),
          ],
          edges: [
            edge('client', 'gateway', 'Trace id: 7f3a'),
            edge('gateway', 'server', 'Same trace id'),
            edge('server', 'service', 'Same trace id'),
          ],
          activeNodeIds: ['client', 'gateway', 'server', 'service'],
          activeEdgeIds: ['client->gateway', 'gateway->server', 'server->service'],
          caption: 'One trace id follows a request from the user through the gateway and two services, showing where time went.',
        },
      ),
      step(
        's4',
        'Monitoring vs observability',
        'Monitoring is watching known questions: dashboards and alerts for the failure modes you already expect. Observability is the ability to answer questions you did not think to ask — digging into logs and traces to explain a failure nobody predicted. The two work together, and good alerting is the bridge: alert on symptoms users actually feel, like error rate or latency, not on every internal signal. An alert that fires constantly trains people to ignore alerts, which is worse than no alert at all.',
        [
          metric('Alerts on symptoms', 'Error rate, latency'),
          metric('Alert noise', 'Low'),
          metric('Unknown questions', 'Answered by traces'),
        ],
        [
          'Monitoring answers known questions; observability answers new ones',
          'Alerts fire on user-facing symptoms, not on noise',
        ],
        'The test of an alert is simple: if it fires at 3 a.m., does someone know what to do about it? If not, it should be a dashboard, not an alert.',
        'Monitor what you expect; stay able to explain what you did not.',
        {
          nodes: [
            node('server', 'server', 'App Servers', 20, 150, { status: 'degraded', sublabel: 'Error rate rising' }),
            node('service', 'service', 'Alert Rules', 280, 150, { status: 'healthy', sublabel: 'Symptom-based' }),
            node('client', 'client', 'On-call', 520, 150, { status: 'healthy', sublabel: 'Paged with context' }),
          ],
          edges: [
            edge('server', 'service', 'Error rate rises'),
            edge('service', 'client', 'Page on-call'),
          ],
          activeNodeIds: ['server', 'service', 'client'],
          activeEdgeIds: ['server->service', 'service->client'],
          caption: 'Rising errors trip a symptom-based alert rule, which pages the on-call engineer.',
        },
      ),
      step(
        's5',
        'SLOs and error budgets',
        'A service level objective, or SLO, is a promise written as a number: 99.9% of requests succeed over 30 days, for example. The error budget is what is left: 100% minus the SLO, so a 99.9% SLO leaves a 0.1% budget — about 43 minutes of downtime per month. The budget is a shared language between developers and operators: while budget remains, the team can ship risky changes; when it runs out, shipping stops until reliability recovers. It turns “be more reliable” from a vague wish into a number everyone can see.',
        [
          metric('SLO', '99.9', '%'),
          metric('Error budget', '0.1', '%'),
          metric('Budget in time', '43', 'min / month'),
        ],
        [
          'An SLO states the reliability target as a number',
          'The error budget is 100% minus the SLO',
        ],
        'An SLO is not a guarantee to users — it is an internal target the team measures itself against, and it should reflect what users actually notice.',
        'A budget turns reliability from a wish into a number.',
        {
          nodes: [
            node('client', 'client', 'Users', 20, 150, { status: 'healthy' }),
            node('server', 'server', 'Service', 280, 150, { status: 'healthy', sublabel: 'Success rate 99.9%' }),
            node('service', 'service', 'SLO Tracker', 520, 150, { status: 'healthy', sublabel: 'Budget remaining' }),
          ],
          edges: [
            edge('client', 'server', 'Requests'),
            edge('server', 'service', 'Success rate 99.9%'),
          ],
          activeNodeIds: ['client', 'server', 'service'],
          activeEdgeIds: ['client->server', 'server->service'],
          caption: 'Users send requests to the service, and an SLO tracker measures success rate against the budget.',
        },
      ),
    ],
    summary:
      'Metrics, logs, and traces answer different questions: metrics show that something is wrong, logs show what happened, and traces show where the time went across services. Monitoring watches the failure modes you expect, while observability lets you explain the ones you did not. Alert on symptoms users feel, not on noise, and use SLOs and error budgets to turn reliability into a number the whole team can agree on. ' +
      ILLUSTRATIVE,
    relatedCheatsheets: ['reliability-patterns'],
  },
};
