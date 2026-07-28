import React from "react";
import { useCurrentFrame } from "remotion";

// ── CategoryPill ─────────────────────────────────────────────────────────────
export interface CategoryPillProps {
  text: string;
  bgRgba: string;
  borderRgba: string;
  textRgba: string;
  hasDot?: boolean;
  dotRgba?: string;
  fontSize?: string;
  fontFamily?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  text,
  bgRgba,
  borderRgba,
  textRgba,
  hasDot = true,
  dotRgba,
  fontSize = "17px",
  fontFamily
}) => (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    borderRadius: "999px",
    padding: "10px 16px",
    background: bgRgba,
    border: `1px solid ${borderRgba}`,
    color: textRgba,
    fontSize,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    backdropFilter: "blur(12px)",
    fontFamily,
    width: "fit-content"
  }}>
    {hasDot && (
      <span style={{
        width: "10px",
        height: "10px",
        borderRadius: "999px",
        background: dotRgba || textRgba,
        boxShadow: `${dotRgba || textRgba} 0px 0px 18px`,
        flexShrink: 0
      }} />
    )}
    {text}
  </div>
);

import { highlightHeadingText } from "../layout/UIBlocks";

// ── HeadlineText ─────────────────────────────────────────────────────────────
export interface HeadlineTextProps {
  text: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  textShadow?: string;
  colorRgba?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
  fontFamily?: string;
  textTransform?: "uppercase" | "none";
  lineHeight?: number;
  theme?: string;
  accentColor?: string;
  highlightWords?: string[];
}

export const HeadlineText: React.FC<HeadlineTextProps> = ({
  text,
  fontSize = "86px",
  fontWeight = "900",
  letterSpacing = "-0.075em",
  textShadow,
  colorRgba = "rgb(255, 255, 255)",
  maxWidth,
  align = "center",
  fontFamily,
  textTransform = "uppercase",
  lineHeight = 1.32,
  theme,
  accentColor = "#FFB7C5",
  highlightWords
}) => (
  <h1 style={{
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    color: colorRgba,
    textShadow: "none",
    maxWidth,
    textAlign: align,
    fontFamily,
    textTransform,
    margin: 0,
    width: "100%"
  }}>
    {theme ? highlightHeadingText(text, accentColor, theme, highlightWords) : text}
  </h1>
);

// ── AccentDivider ─────────────────────────────────────────────────────────────
export interface AccentDividerProps {
  gradient: string;
  width?: string;
  height?: string;
  glowRgba?: string;
}

export const AccentDivider: React.FC<AccentDividerProps> = ({
  gradient,
  width = "220px",
  height = "6px",
  glowRgba
}) => (
  <div style={{
    width,
    height,
    borderRadius: "999px",
    background: gradient,
    boxShadow: glowRgba ? `${glowRgba} 0px 0px 28px` : undefined
  }} />
);

// ── NumberedCard ─────────────────────────────────────────────────────────────
export interface NumberedCardProps {
  index: number;
  text: string;
  bgRgba: string;
  borderRgba: string;
  badgeRgba: string;
  shadowGlowRgba?: string;
  borderRadius?: string;
  padding?: string;
  backdropBlur?: string;
  scale?: number;
  minHeight?: string;
  fontFamily?: string;
  textColor?: string;
  fontSize?: string;
  lineHeight?: number;
}

export const NumberedCard: React.FC<NumberedCardProps> = ({
  index,
  text,
  bgRgba,
  borderRgba,
  badgeRgba,
  shadowGlowRgba,
  borderRadius = "18px",
  padding = "14px 16px",
  backdropBlur = "12px",
  scale = 1,
  minHeight = "86px",
  fontFamily,
  textColor,
  fontSize = "25px",
  lineHeight
}) => {
  const shadowPrimary = shadowGlowRgba
    ? `rgba(0, 0, 0, 0.18) 0px 14px 34px, ${shadowGlowRgba} 0px 0px 18px`
    : "rgba(0, 0, 0, 0.18) 0px 14px 34px";

  return (
    <div style={{
      borderRadius,
      padding,
      background: bgRgba,
      border: `1px solid ${borderRgba}`,
      boxShadow: shadowPrimary,
      backdropFilter: `blur(${backdropBlur})`,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      minHeight,
      display: "grid",
      alignContent: "center",
      gap: "8px",
      boxSizing: "border-box"
    }}>
      <div style={{
        color: badgeRgba,
        fontSize: `${Math.round(parseFloat(fontSize) * 0.44)}px`,
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        fontFamily
      }}>
        {String(index).padStart(2, "0")}
      </div>
      <div style={{
        fontSize,
        lineHeight: lineHeight !== undefined ? lineHeight : 1.4,
        fontWeight: 900,
        letterSpacing: "-0.035em",
        textTransform: "uppercase",
        color: textColor || "rgb(255, 255, 255)",
        fontFamily,
        textAlign: "left"
      }}>
        {text}
      </div>
    </div>
  );
};

// ── GlassBubble ──────────────────────────────────────────────────────────────
export interface GlassBubbleProps {
  text: string;
  size: string;
  position: { top: string; left: string };
  borderRgba: string;
  shadowRgba?: string;
  fontSize?: string;
  fontWeight?: string;
  bgGradient?: string;
  floatAmplitude?: number;
  fontFamily?: string;
}

export const GlassBubble: React.FC<GlassBubbleProps> = ({
  text,
  size,
  position,
  borderRgba,
  shadowRgba,
  fontSize = "38px",
  fontWeight = "860",
  bgGradient,
  floatAmplitude = 8,
  fontFamily
}) => {
  const frame = useCurrentFrame();
  const floatY = Math.sin(frame / 40) * floatAmplitude;

  const defaultBg = `radial-gradient(circle at 28% 22%, rgba(254, 238, 173, 0.48), transparent 32%), linear-gradient(145deg, rgba(6, 16, 31, 0.92), rgba(82, 78, 60, 0.847) 58%, rgba(2, 6, 23, 0.78))`;

  return (
    <div style={{
      position: "absolute",
      top: position.top,
      left: position.left,
      width: size,
      height: size,
      borderRadius: "999px",
      background: bgGradient || defaultBg,
      border: `1px solid ${borderRgba}`,
      boxShadow: shadowRgba
        ? `rgba(0, 0, 0, 0.54) 0px 34px 82px, ${shadowRgba} 0px 0px 44px, rgba(255, 255, 255, 0.16) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.18) 0px -24px 54px inset`
        : "rgba(0, 0, 0, 0.32) 0px 18px 42px",
      backdropFilter: "blur(16px)",
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      fontSize,
      lineHeight: 1.35,
      fontWeight,
      color: "rgb(248, 250, 252)",
      textTransform: "uppercase",
      fontFamily,
      transform: `translateY(${floatY}px)`,
      padding: "22px 20px",
      boxSizing: "border-box"
    }}>
      {text}
    </div>
  );
};
