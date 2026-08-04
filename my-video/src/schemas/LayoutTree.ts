// my-video/src/schemas/LayoutTree.ts
// Rule: no logic, no functions, no defaults. Types only.

import { NodeType } from './VisualTree';

export type LayoutRegion = 'top' | 'center' | 'bottom' | 'overlay';
export type LayoutAlignment = 'start' | 'center' | 'end';
export type LayoutPadding = 'sm' | 'md' | 'lg' | 'xl';
export type LayoutPriority = 'hero' | 'primary' | 'secondary' | 'support';

export interface LayoutNode {
  slotId: string;
  type: NodeType;
  contentRef: string;
  region: LayoutRegion;
  alignment: LayoutAlignment;
  grow: number;
  minHeight?: number;
  padding: LayoutPadding;
  priority: LayoutPriority;
}

export interface LayoutTree {
  nodes: LayoutNode[];
}
