import React from "react";

export interface LayoutProps {
  resolvedComponents: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  accentColor: string;
  theme: string;
  imageUrl: string;
  imageScale: number;
  renderComponent: (comp: any, overrides?: any) => React.ReactNode; // eslint-disable-line @typescript-eslint/no-explicit-any
  renderBackground: () => React.ReactNode;
  visualStyle?: string;
  fontScale?: number;
  paddingScale?: number;
  gap?: number;
  voiceover?: string;
  category?: string;
  highlightWords?: string[];
}
