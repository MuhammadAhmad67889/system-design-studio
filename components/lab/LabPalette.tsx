'use client';

/*
 * Design Lab palette: the draggable component cards, grouped by category.
 *
 * The palette data lives here because the canvas and the properties
 * panel both need it — the canvas resolves a dropped card to its
 * defaults, and the properties panel looks up a node's icon and tint.
 * A node keeps its kind and label in its own data, so the lookup is
 * best-effort: if a label was renamed, the canvas falls back to the
 * defaults for that kind.
 */

import { useState } from 'react';
import {
  Activity,
  Boxes,
  ChevronDown,
  ChevronUp,
  Cloud,
  Database,
  DatabaseZap,
  DoorOpen,
  FileText,
  GitBranch,
  Globe,
  HardDrive,
  KeyRound,
  ListOrdered,
  Network,
  Plus,
  Search,
  Server,
  ServerCog,
  Waypoints,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { NodeKind } from '@/lib/types';

export interface PaletteItem {
  id: string;
  kind: NodeKind;
  label: string;
  description: string;
  capacity: string;
  icon: LucideIcon;
}

export interface PaletteGroup {
  category: string;
  tint: string;
  items: PaletteItem[];
}

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    category: 'Networking',
    tint: 'bg-sky',
    items: [
      { id: 'dns', kind: 'dns', label: 'DNS', description: 'Resolves domain names to server addresses.', capacity: '10k lookups / sec', icon: Globe },
      { id: 'cdn', kind: 'cdn', label: 'CDN', description: 'Serves static assets from edge locations close to users.', capacity: '1 TB cache', icon: Cloud },
      { id: 'lb', kind: 'lb', label: 'Load Balancer', description: 'Spreads incoming requests across healthy servers.', capacity: '50k req / sec', icon: Network },
      { id: 'gateway', kind: 'gateway', label: 'API Gateway', description: 'Single entry point: routing, auth checks and rate limits.', capacity: '20k req / sec', icon: DoorOpen },
    ],
  },
  {
    category: 'Application',
    tint: 'bg-leaf',
    items: [
      { id: 'web-server', kind: 'server', label: 'Web Server', description: 'Serves pages and static content to browsers.', capacity: '4 vCPU · 8 GB RAM', icon: Server },
      { id: 'app-server', kind: 'server', label: 'App Server', description: 'Runs the application logic and talks to storage.', capacity: '4 vCPU · 8 GB RAM', icon: ServerCog },
      { id: 'microservice', kind: 'service', label: 'Microservice', description: 'One small service that owns a single capability.', capacity: '2 vCPU · 4 GB RAM', icon: Boxes },
      { id: 'auth-service', kind: 'service', label: 'Auth Service', description: 'Issues and checks login sessions and tokens.', capacity: '5k logins / sec', icon: KeyRound },
    ],
  },
  {
    category: 'Storage',
    tint: 'bg-amber',
    items: [
      { id: 'sql-db', kind: 'db', label: 'SQL Database', description: 'Relational store for structured data that must stay consistent.', capacity: '500 GB · primary + replica', icon: Database },
      { id: 'nosql-db', kind: 'db', label: 'NoSQL Database', description: 'Document or key-value store for flexible, fast reads.', capacity: '1 TB · 3 replicas', icon: DatabaseZap },
      { id: 'cache', kind: 'cache', label: 'Cache / Redis', description: 'In-memory store for hot data and session state.', capacity: '8 GB · TTL 1 h', icon: Zap },
      { id: 'object-storage', kind: 'db', label: 'Object Storage', description: 'Durable blob storage for files, images and backups.', capacity: 'Unlimited · 11 nines durability', icon: HardDrive },
      { id: 'search-index', kind: 'service', label: 'Search Index', description: 'Full-text index for fast search across documents.', capacity: '10M documents', icon: Search },
    ],
  },
  {
    category: 'Messaging',
    tint: 'bg-lilac',
    items: [
      { id: 'queue', kind: 'queue', label: 'Queue', description: 'Holds jobs until a worker is free to process them.', capacity: '100k messages', icon: ListOrdered },
      { id: 'event-bus', kind: 'queue', label: 'Event Bus', description: 'Publishes events so services can react without calling each other.', capacity: '10k events / sec', icon: Waypoints },
    ],
  },
  {
    category: 'Monitoring',
    tint: 'bg-surface',
    items: [
      { id: 'logging', kind: 'service', label: 'Logging', description: 'Collects and stores logs from every service.', capacity: '7 day retention', icon: FileText },
      { id: 'metrics', kind: 'service', label: 'Metrics', description: 'Tracks numbers like latency, errors and request counts.', capacity: '30 day retention', icon: Activity },
      { id: 'tracing', kind: 'service', label: 'Tracing', description: 'Follows one request across every service it touches.', capacity: '1M spans / day', icon: GitBranch },
    ],
  },
];

/** Fallbacks for a node whose palette card cannot be found by label. */
const KIND_DEFAULTS: Record<NodeKind, { icon: LucideIcon; tint: string; category: string }> = {
  user: { icon: Globe, tint: 'bg-sky', category: 'Networking' },
  client: { icon: Globe, tint: 'bg-sky', category: 'Networking' },
  dns: { icon: Globe, tint: 'bg-sky', category: 'Networking' },
  cdn: { icon: Cloud, tint: 'bg-sky', category: 'Networking' },
  lb: { icon: Network, tint: 'bg-sky', category: 'Networking' },
  gateway: { icon: DoorOpen, tint: 'bg-sky', category: 'Networking' },
  server: { icon: Server, tint: 'bg-leaf', category: 'Application' },
  service: { icon: Boxes, tint: 'bg-leaf', category: 'Application' },
  db: { icon: Database, tint: 'bg-amber', category: 'Storage' },
  cache: { icon: Zap, tint: 'bg-amber', category: 'Storage' },
  queue: { icon: ListOrdered, tint: 'bg-lilac', category: 'Messaging' },
};

export function findPaletteItem(id: string): PaletteItem | undefined {
  for (const group of PALETTE_GROUPS) {
    const found = group.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

export interface NodeLook {
  icon: LucideIcon;
  tint: string;
  category: string;
}

/** Icon, tint and category for a node, by its current label then its kind. */
export function lookUpNode(label: string, kind: NodeKind): NodeLook {
  for (const group of PALETTE_GROUPS) {
    const found = group.items.find((item) => item.label === label && item.kind === kind);
    if (found) {
      return { icon: found.icon, tint: group.tint, category: group.category };
    }
  }
  return KIND_DEFAULTS[kind];
}

interface LabPaletteProps {
  onAddNode: (item: PaletteItem) => void;
}

export default function LabPalette({ onAddNode }: LabPaletteProps) {
  // On small screens the palette is a horizontal strip that can be
  // folded away; on large screens it is always open as a side column.
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="border-b-2 border-line bg-surface lg:w-[240px] lg:shrink-0 lg:border-b-0 lg:border-r-2">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-sm font-bold">Components</h2>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 font-display text-xs font-bold lg:hidden"
        >
          {collapsed ? (
            <>
              Show <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              Hide <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>

      <div className={collapsed ? 'hidden lg:block' : 'block'}>
        <p className="px-4 pb-2 text-xs text-muted">
          Drag a card onto the canvas, or tap + to add it.
        </p>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:pb-6">
          {PALETTE_GROUPS.map((group) => (
            <section key={group.category} className="w-[220px] shrink-0 lg:w-auto">
              <h3 className="font-display text-xs font-bold uppercase tracking-wide text-muted">
                {group.category}
              </h3>
              <ul className="mt-2 space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <div
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('application/reactflow', item.id);
                          event.dataTransfer.effectAllowed = 'move';
                        }}
                        className={`flex cursor-grab items-center gap-2.5 rounded-md border-2 border-ink ${group.tint} px-3 py-2 active:cursor-grabbing`}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{item.label}</span>
                          <span className="block truncate text-xs text-muted">
                            {item.description}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onAddNode(item)}
                          aria-label={`Add ${item.label} to the canvas`}
                          title={`Add ${item.label}`}
                          className="shrink-0 rounded border-2 border-ink bg-surface p-0.5 hover:bg-leaf"
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
