/*
 * Initial viewport for a lab or Design Lab canvas.
 *
 * On a wide canvas the whole template fits, so fitView is the right
 * start. On a phone the template is up to 1000 flow pixels wide
 * while the canvas is about 356, so fitView shrinks every node to a
 * postage stamp in a big empty canvas — it reads as broken. There
 * the canvas starts zoomed in on the first node instead, and the
 * learner pans to the rest; the Fit view button is the overview.
 * Same trade-off as the simulation diagrams: legibility first,
 * overview one tap away.
 */

export interface FlowNodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A canvas at least this wide fits the whole template. */
export const WIDE_CANVAS_MIN_WIDTH = 640;

/** Zoom a narrow canvas starts at: nodes render at real size. */
export const NARROW_START_ZOOM = 1;

/** Lab node size in flow pixels (the node is w-[180px]). */
export const LAB_NODE_WIDTH = 180;
export const LAB_NODE_HEIGHT = 70;

export type InitialLabViewport =
  | { kind: 'fit' }
  | { kind: 'viewport'; x: number; y: number; zoom: number };

export function initialLabViewport(args: {
  width: number;
  height: number;
  nodes: FlowNodeBox[];
}): InitialLabViewport {
  const { width, height, nodes } = args;
  if (width <= 0 || width >= WIDE_CANVAS_MIN_WIDTH || nodes.length === 0) {
    return { kind: 'fit' };
  }
  // The start of the template is the leftmost node, topmost on a tie:
  // templates list the request path left to right, starting with Users.
  const first = nodes.reduce((best, node) =>
    node.x < best.x || (node.x === best.x && node.y < best.y) ? node : best,
  );
  const focusX = first.x + first.width / 2;
  const focusY = first.y + first.height / 2;
  return {
    kind: 'viewport',
    x: width / 2 - focusX * NARROW_START_ZOOM,
    y: height / 2 - focusY * NARROW_START_ZOOM,
    zoom: NARROW_START_ZOOM,
  };
}
