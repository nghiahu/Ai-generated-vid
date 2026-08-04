import React from "react";
import { fontOutfit, fontMontserrat, fontPlayfairDisplay, fontBeVietnamPro, fontInter, fontJetBrainsMono, fontSpaceGrotesk, fontChakraPetch } from "./fonts";
import { getVDETokens } from "./vdeTokens";

export interface ThemeStyles {
  fontFamily: string;
  backgroundColor: string;
  cardStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  badgeStyle: React.CSSProperties;
  terminalStyle: React.CSSProperties;
}

export const getThemeBgStyle = (themeName = "glassmorphism"): { backgroundColor: string } => {
  const tokens = getVDETokens(themeName);
  return { backgroundColor: tokens.colors?.background || "#090d1a" };
};

export const getThemeStyles = (themeName: string, accentColor: string): ThemeStyles => {
  const tokens = getVDETokens(themeName);
  
  let fontFamily = fontOutfit;
  const titleFont = tokens.fonts?.title || "";
  if (titleFont.includes("Playfair") || titleFont.includes("Lora")) {
    fontFamily = fontPlayfairDisplay;
  } else if (titleFont.includes("Space Grotesk")) {
    fontFamily = fontSpaceGrotesk;
  } else if (titleFont.includes("Be Vietnam Pro")) {
    fontFamily = fontBeVietnamPro;
  } else if (titleFont.includes("Inter")) {
    fontFamily = fontInter;
  } else if (titleFont.includes("Montserrat")) {
    fontFamily = fontMontserrat;
  } else if (titleFont.includes("JetBrains Mono") || titleFont.includes("monospace")) {
    fontFamily = fontJetBrainsMono;
  } else if (titleFont.includes("Chakra Petch")) {
    fontFamily = fontChakraPetch;
  }

  const backgroundColor = tokens.colors?.background || "#090d1a";

  const hasCustomBorder = tokens.colors?.border && (tokens.colors.border.includes("solid") || tokens.colors.border.includes("px"));
  const borderVal = hasCustomBorder ? tokens.colors.border : `1px solid ${tokens.colors?.border || "rgba(255,255,255,0.1)"}`;

  // Base card styling using compiler tokens
  const cardBgVal = tokens.colors?.cardBg || "rgba(255, 255, 255, 0.03)";
  const cardStyle: React.CSSProperties = {
    padding: "32px 40px",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.2s ease-in-out",
    background: cardBgVal.includes("gradient") ? cardBgVal : undefined,
    backgroundColor: cardBgVal.includes("gradient") ? undefined : cardBgVal,
    border: borderVal,
    boxShadow: tokens.shadow && tokens.shadow !== "none" ? tokens.shadow : "none",
    borderRadius: tokens.radius || "24px",
    color: tokens.colors?.text || "#ffffff"
  };

  // Title styles per VDE style
  const isSerif = tokens.fonts?.title.includes("Playfair") || tokens.fonts?.title.includes("Lora") || tokens.fonts?.title.includes("Georgia") || tokens.fonts?.title.includes("serif");
  const isCyberpunk = themeName.includes("cyberpunk") || themeName.includes("neon") || themeName.includes("ai_driven") || themeName.includes("fintech_edu");
  const titleStyle: React.CSSProperties = {
    color: tokens.colors?.text || "#ffffff",
    fontFamily,
    fontWeight: isSerif ? 700 : 900,
    textTransform: "uppercase",
    letterSpacing: "-0.01em",
    margin: 0,
    textShadow: isCyberpunk && tokens.shadow && tokens.shadow !== "none"
      ? `0 0 25px ${accentColor}aa, 0 0 10px ${accentColor}55`
      : "none"
  };

  // Badge category styles using VDE accent and radius
  const badgeStyle: React.CSSProperties = {
    fontSize: "22px",
    fontFamily: fontMontserrat,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "5px",
    padding: "10px 22px",
    borderRadius: tokens.radius || "36px",
    border: borderVal,
    color: tokens.colors?.accent || accentColor,
    backgroundColor: `${tokens.colors?.accent || accentColor}15`
  };

  // Terminal box styling
  const isLightBg = tokens.colors?.background === "#fdf8f5" || tokens.colors?.background === "#FBF9F4" || tokens.colors?.background === "#ffffff";
  const terminalStyle: React.CSSProperties = {
    backgroundColor: isLightBg ? "#ffffff" : "#0A0B10",
    border: borderVal,
    boxShadow: tokens.shadow && tokens.shadow !== "none" ? tokens.shadow : "0 20px 50px rgba(0,0,0,0.5)",
    borderRadius: tokens.radius || "16px",
    color: tokens.colors?.text || "#ffffff"
  };

  return {
    fontFamily,
    backgroundColor,
    cardStyle,
    titleStyle,
    badgeStyle,
    terminalStyle
  };
};
