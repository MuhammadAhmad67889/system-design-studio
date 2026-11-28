import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DiagramCanvas } from '@/components/simulation/DiagramCanvas';
import type { DiagramConfig } from '@/lib/types';

// No global test setup in this repo, so unmount after each test.
afterEach(cleanup);

const diagram: DiagramConfig = {
  nodes: [
    { id: 'user', kind: 'user', label: 'User', sublabel: 'Browser', x: 20, y: 150 },
    { id: 'server', kind: 'server', label: 'Web Server', sublabel: 'Node.js', x: 280, y: 150 },
    { id: 'db', kind: 'db', label: 'Database', sublabel: 'Postgres', x: 520, y: 150, status: 'healthy' },
  ],
  edges: [
    { from: 'user', to: 'server', label: 'GET /' },
    { from: 'server', to: 'db', label: 'SELECT' },
  ],
  activeNodeIds: ['server'],
  activeEdgeIds: ['user->server'],
  caption: 'A user request travels from the browser to the web server and then to the database.',
};

describe('DiagramCanvas', () => {
  it('renders every node label', () => {
    render(<DiagramCanvas diagram={diagram} playing={false} />);
    expect(screen.getByText('User')).toBeTruthy();
    expect(screen.getByText('Web Server')).toBeTruthy();
    expect(screen.getByText('Database')).toBeTruthy();
  });

  it('renders the caption as visible text', () => {
    render(<DiagramCanvas diagram={diagram} playing={false} />);
    expect(
      screen.getByText(
        'A user request travels from the browser to the web server and then to the database.',
        { selector: 'figcaption' },
      ),
    ).toBeTruthy();
  });

  it('renders a particle circle on the active edge', () => {
    const { container } = render(<DiagramCanvas diagram={diagram} playing />);
    const particle = container.querySelector('[data-testid="sim-particle"]');
    expect(particle).not.toBeNull();
    expect(particle?.tagName.toLowerCase()).toBe('circle');
    expect(particle?.querySelector('animateMotion')).not.toBeNull();
  });

  it('renders no particle when no edge is active', () => {
    const idle: DiagramConfig = { ...diagram, activeEdgeIds: [] };
    const { container } = render(<DiagramCanvas diagram={idle} playing={false} />);
    expect(container.querySelector('[data-testid="sim-particle"]')).toBeNull();
  });

  it('shows a text label for a failed node, not just a coloured dot', () => {
    const failing: DiagramConfig = {
      ...diagram,
      nodes: diagram.nodes.map((node) =>
        node.id === 'db' ? { ...node, status: 'failed' as const } : node,
      ),
    };
    render(<DiagramCanvas diagram={failing} playing={false} />);
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('never squishes text with a textLength attribute', () => {
    const { container } = render(<DiagramCanvas diagram={diagram} playing={false} />);
    expect(container.querySelectorAll('text[textLength]').length).toBe(0);
  });

  it('wraps a long label onto two lines instead of squeezing it', () => {
    const wrapping: DiagramConfig = {
      nodes: [
        { id: 'replica', kind: 'db', label: 'Replica → Primary', x: 20, y: 150 },
        { id: 'kv', kind: 'db', label: 'Key-Value Store', x: 280, y: 150 },
      ],
      edges: [],
      caption: 'Wrapping check.',
    };
    render(<DiagramCanvas diagram={wrapping} playing={false} />);
    // "Replica → Primary" is 148px at 14px bold in a 134px inner width,
    // so it wraps; "Key-Value Store" is 130px and stays on one line.
    expect(screen.getByText('Replica →')).toBeTruthy();
    expect(screen.getByText('Primary')).toBeTruthy();
    expect(screen.getByText('Key-Value Store')).toBeTruthy();
  });

  it('keeps every node rect inside the 720x400 viewBox', () => {
    const { container } = render(<DiagramCanvas diagram={diagram} playing={false} />);
    // Node boxes are exactly 150x100; the active-node halo is 158x108.
    const nodeRects = [...container.querySelectorAll('rect')].filter(
      (rect) => rect.getAttribute('width') === '150' && rect.getAttribute('height') === '100',
    );
    expect(nodeRects.length).toBe(diagram.nodes.length);
    for (const rect of nodeRects) {
      const x = Number(rect.getAttribute('x'));
      const y = Number(rect.getAttribute('y'));
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + 150).toBeLessThanOrEqual(720);
      expect(y + 100).toBeLessThanOrEqual(400);
    }
  });
});
