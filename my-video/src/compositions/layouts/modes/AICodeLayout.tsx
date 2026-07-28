import React from "react";
import { AbsoluteFill } from "remotion";

export interface AICodeLayoutProps {
  customHtml?: string;
  renderBackground: () => React.ReactNode;
  themeMetadata?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const AICodeLayout: React.FC<AICodeLayoutProps> = ({
  customHtml = "",
  renderBackground,
  themeMetadata
}) => {
  // Theme compiler: Inject CSS variables dynamically into outer container
  const theme = themeMetadata?.theme || {};
  const palette = theme.palette || {};
  const typography = theme.typography || {};
  const surface = theme.surface || {};

  const themeVariables: React.CSSProperties = {
    "--color-primary": palette.primary || "#00F0FF",
    "--color-secondary": palette.secondary || "#7C3AED",
    "--color-bg": palette.background || "#081120",
    "--color-text": palette.text || "#FFFFFF",
    "--font-main": typography.fontFamily || "Inter, sans-serif",
    "--font-title-size": typography.titleSize || "86px",
    "--font-body-size": typography.bodySize || "28px",
    "--radius-card": surface.cornerRadius || "16px",
    "--shadow-card": surface.shadow === "soft" ? "0 4px 30px rgba(0,0,0,0.1)" : "none",
    width: "100%",
    height: "100%",
    position: "relative",
    pointerEvents: "none"
  } as React.CSSProperties;

  return (
    <AbsoluteFill style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {renderBackground()}
      {/* Structural 78% Height Clamp Container to protect bottom 22% Subtitle Safe Zone */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "78%",
          maxHeight: "1497px",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 10
        }}
      >
        <div 
          style={themeVariables}
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      </div>
    </AbsoluteFill>
  );
};
