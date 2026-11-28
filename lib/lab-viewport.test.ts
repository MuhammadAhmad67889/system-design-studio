import { describe, expect, it } from 'vitest';
import {
  LAB_NODE_HEIGHT,
  LAB_NODE_WIDTH,
  initialLabViewport,
} from './lab-viewport';

// Lab-1 starter: three nodes in a row at y=160.
const LAB_1 = [
  { x: 40, y: 160, width: LAB_NODE_WIDTH, height: LAB_NODE_HEIGHT },
  { x: 300, y: 160, width: LAB_NODE_WIDTH, height: LAB_NODE_HEIGHT },
  { x: 560, y: 160, width: LAB_NODE_WIDTH, height: LAB_NODE_HEIGHT },
];

describe('initialLabViewport', () => {
  it('fits the whole template on a wide canvas', () => {
    expect(initialLabViewport({ width: 1280, height: 800, nodes: LAB_1 })).toEqual({
      kind: 'fit',
    });
  });

  it('fits at exactly the wide threshold', () => {
    expect(initialLabViewport({ width: 640, height: 480, nodes: LAB_1 })).toEqual({
      kind: 'fit',
    });
  });

  it('starts zoomed in on the first node on a narrow canvas', () => {
    // First node centre is (130, 195); a 356x480 canvas centres it.
    expect(initialLabViewport({ width: 356, height: 480, nodes: LAB_1 })).toEqual({
      kind: 'viewport',
      x: 178 - 130,
      y: 240 - 195,
      zoom: 1,
    });
  });

  it('starts just under the wide threshold zoomed in', () => {
    const result = initialLabViewport({ width: 639, height: 480, nodes: LAB_1 });
    expect(result.kind).toBe('viewport');
    if (result.kind === 'viewport') expect(result.zoom).toBe(1);
  });

  it('picks the leftmost node even when it is not listed first', () => {
    const shuffled = [LAB_1[2], LAB_1[0], LAB_1[1]];
    const result = initialLabViewport({ width: 356, height: 480, nodes: shuffled });
    expect(result).toEqual({
      kind: 'viewport',
      x: 178 - 130,
      y: 240 - 195,
      zoom: 1,
    });
  });

  it('picks the topmost node when two share the left edge', () => {
    const nodes = [
      { x: 40, y: 250, width: LAB_NODE_WIDTH, height: LAB_NODE_HEIGHT },
      { x: 40, y: 80, width: LAB_NODE_WIDTH, height: LAB_NODE_HEIGHT },
    ];
    // Focus is the y=80 node: centre (130, 115).
    expect(initialLabViewport({ width: 356, height: 480, nodes })).toEqual({
      kind: 'viewport',
      x: 178 - 130,
      y: 240 - 115,
      zoom: 1,
    });
  });

  it('fits when there are no nodes', () => {
    expect(initialLabViewport({ width: 356, height: 480, nodes: [] })).toEqual({
      kind: 'fit',
    });
  });

  it('fits when the canvas has not been measured yet', () => {
    expect(initialLabViewport({ width: 0, height: 0, nodes: LAB_1 })).toEqual({
      kind: 'fit',
    });
  });
});
