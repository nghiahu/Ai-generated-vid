import { Blueprint, LayoutTree, LayoutNode, LayoutAlignment, LayoutPadding, LayoutPriority } from '../../../schemas';
import { RegionResolvedNode } from './RegionResolver';

export function solveConstraints(
  regionNodes: RegionResolvedNode[],
  blueprint: Blueprint
): LayoutTree {
  const nodes: LayoutNode[] = regionNodes.map(node => {
    let alignment: LayoutAlignment = 'center';
    let grow = 1;
    let padding: LayoutPadding = 'md';
    let priority: LayoutPriority = 'primary';
    
    if (node.region === 'center') {
      alignment = 'center';
      grow = 2;
      padding = 'lg';
      priority = 'hero';
    } else if (node.region === 'top') {
      alignment = 'center';
      grow = 1;
      padding = 'md';
      priority = 'primary';
    } else if (node.region === 'bottom') {
      alignment = 'center';
      grow = 1.2;
      padding = 'md';
      priority = 'secondary';
    }
    
    if (blueprint.semanticTags.includes('HighContrast') && node.region === 'center') {
      padding = 'xl';
    }
    
    return {
      slotId: node.slotId,
      type: node.type,
      contentRef: node.contentRef,
      region: node.region,
      alignment,
      grow,
      padding,
      priority,
    };
  });
  
  return { nodes };
}
