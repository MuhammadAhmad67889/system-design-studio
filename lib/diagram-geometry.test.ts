/*
 * Permanent geometry guard for simulation diagrams.
 *
 * Every lesson/step diagram must fit the 150x100 node geometry on the
 * 720x400 viewBox: all nodes in bounds, no two overlapping, and every
 * label/sublabel wrapping to at most two lines. The wrap helper below
 * mirrors the one in DiagramCanvas (same width estimates) and is
 * duplicated here on purpose: this test guards the data even if the
 * component changes. Unlike the component, it does NOT cap at two
 * lines — a label that needs three must fail here and be fixed in the
 * data, not silently truncated by the component.
 */

import { describe, expect, it } from 'vitest';
import { allLessons } from '@/lib/content';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 100;
const VIEWBOX_WIDTH = 720;
const VIEWBOX_HEIGHT = 400;
const INNER_WIDTH = NODE_WIDTH - 16;

const BOLD_CHAR_WIDTH = 0.62;
const REGULAR_CHAR_WIDTH = 0.55;

function wrapText(text: string, fontSize: number, bold: boolean, maxWidth: number): string[] {
  const charWidth = (bold ? BOLD_CHAR_WIDTH : REGULAR_CHAR_WIDTH) * fontSize;
  const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
  const pieces = text.split(' ').flatMap((word) => {
    if (word.length <= maxChars) return [word];
    const chunks: string[] = [];
    for (let i = 0; i < word.length; i += maxChars) {
      chunks.push(word.slice(i, i + maxChars));
    }
    return chunks;
  });
  const lines: string[] = [];
  let line = '';
  for (const piece of pieces) {
    const next = line ? `${line} ${piece}` : piece;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = piece;
    }
  }
  if (line) lines.push(line);
  return lines;
}

describe('diagram geometry', () => {
  it('keeps every node inside the 720x400 viewBox', () => {
    const offenders: string[] = [];
    for (const lesson of allLessons) {
      for (const step of lesson.steps) {
        for (const node of step.diagram.nodes) {
          if (
            node.x < 0 ||
            node.y < 0 ||
            node.x + NODE_WIDTH > VIEWBOX_WIDTH ||
            node.y + NODE_HEIGHT > VIEWBOX_HEIGHT
          ) {
            offenders.push(`${lesson.id}/${step.id} ${node.id} x=${node.x} y=${node.y}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('has no overlapping nodes in any diagram', () => {
    const offenders: string[] = [];
    for (const lesson of allLessons) {
      for (const step of lesson.steps) {
        const nodes = step.diagram.nodes;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const overlap =
              a.x < b.x + NODE_WIDTH &&
              b.x < a.x + NODE_WIDTH &&
              a.y < b.y + NODE_HEIGHT &&
              b.y < a.y + NODE_HEIGHT;
            if (overlap) offenders.push(`${lesson.id}/${step.id} ${a.id} vs ${b.id}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('wraps every label and sublabel to at most two lines', () => {
    const offenders: string[] = [];
    for (const lesson of allLessons) {
      for (const step of lesson.steps) {
        for (const node of step.diagram.nodes) {
          const labelLines = wrapText(node.label, 14, true, INNER_WIDTH);
          if (labelLines.length > 2) {
            offenders.push(`${lesson.id}/${step.id} label "${node.label}" -> ${labelLines.length} lines`);
          }
          if (node.sublabel) {
            const subLines = wrapText(node.sublabel, 12, false, INNER_WIDTH);
            if (subLines.length > 2) {
              offenders.push(`${lesson.id}/${step.id} sublabel "${node.sublabel}" -> ${subLines.length} lines`);
            }
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
