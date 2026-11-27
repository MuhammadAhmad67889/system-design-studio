import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DiagramCanvas } from '@/components/simulation/DiagramCanvas';
import type { DiagramConfig } from '@/lib/types';

// No global test setup in this repo, so unmount after each test.
afterEach(cleanup);

const diagram: DiagramConfig = {
  nodes: [
    { id: 'user', kind: 'user', label: 'User', sublabel: 'Browser', x: 20, y: 150 },
    { id: 'server', kind: 'server', label: 'Web Server', sublabel: 'Node.js', x: 300, y: 150 },
    { id: 'db', kind: 'db', label: 'Database', sublabel: 'Postgres', x: 580, y: 150, status: 'healthy' },
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
});
