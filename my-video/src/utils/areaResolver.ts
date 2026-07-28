export interface AbsolutePosition {
  left: string;
  top: string;
  width: string;
  height: string;
  zIndex?: string;
}

/**
 * Dynamically resolves coordinates for components to match screen ratio.
 * Transforms absolute landscape coordinates into clean vertical stacks on 9:16 screens.
 */
export function resolvePositions(
  positions: AbsolutePosition[],
  width: number,
  height: number,
  isVertical: boolean,
  layoutId?: string
): AbsolutePosition[] {
  if (
    !isVertical || 
    layoutId === "AIHubGrid2" || 
    layoutId === "WindingRoadmap" ||
    layoutId === "SelectorWheelRadio"
  ) {
    // Return original positions for map pins, roadmap, and wheel layouts
    return positions;
  }

  // 9:16 Vertical Video (e.g. 1080x1920)
  // Stack items vertically to prevent cutoffs and overflow on narrow portrait screens
  const targetWidth = Math.round(width * 0.88); // 88% width of the portrait screen
  const left = Math.round((width - targetWidth) / 2); // Perfectly centered horizontally
  const startTop = Math.round(height * 0.28); // Start stacking below title (at 28% height offset)
  const itemGap = Math.round(height * 0.016); // Dynamic gap based on screen height

  return positions.map((pos, idx) => {
    const origHeight = parseFloat(pos.height) || 180;
    
    // Scale individual card height slightly down for vertical stack
    const verticalHeight = Math.min(220, Math.round(origHeight * 0.85));
    const top = startTop + idx * (verticalHeight + itemGap);

    return {
      ...pos,
      left: `${left}px`,
      top: `${top}px`,
      width: `${targetWidth}px`,
      height: `${verticalHeight}px`,
      zIndex: pos.zIndex || String(positions.length - idx)
    };
  });
}
