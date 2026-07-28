import React from "react";

export interface ModeRendererProps {
  otherComps: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  resolvedPositions: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  t: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accentColor: string;
  darkAccentColor: string;
  rgb: string;
  isLight: boolean;
  isVertical: boolean;
  styles: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  fontScale: number;
  paddingScale: number;
  gap: number | undefined;
  voiceover?: string;
  titleText?: string;
  parentDelay: number;
  activeCardTextColor: string;
  activeCardBadgeColor: string;
  inactiveCardTextColor: string;
  category?: string;
  imageUrl?: string;
  theme?: string;
  highlightWords?: string[];
}
