import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";

export const getDynamicFontSize = (text: string, baseSize: number, scale: number = 1.0): string => {
  const scaledBase = baseSize * scale;
  if (!text) return `${scaledBase}px`;
  const len = text.length;
  if (len <= 12) return `${scaledBase}px`;
  if (len <= 25) return `${Math.max(28 * scale, scaledBase * 0.75)}px`;
  if (len <= 45) return `${Math.max(22 * scale, scaledBase * 0.55)}px`;
  return `${Math.max(16 * scale, scaledBase * 0.45)}px`;
};

export const getInitials = (text: string): string => {
  if (!text) return "";
  const cleaned = text.replace(/[?,.:!]/g, "").trim();
  const words = cleaned.split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.map(w => w[0]).join("").substring(0, 3).toUpperCase();
};

export const resolvePadding = (paddingStr: string | undefined, scale: number = 1.0) => {
  const defaultPadding = "24px";
  const p = paddingStr || defaultPadding;
  return p.split(/\s+/).map(part => {
    const num = parseFloat(part);
    const unit = part.replace(String(num), "") || "px";
    return isNaN(num) ? part : `${Math.round(num * scale)}${unit}`;
  }).join(" ");
};

export const getAnimationConfig = (comp: any, idx: number, defaultAnim: string, defaultDelay: number, t: any) => {
  const itemStagger = t.animations?.itemStagger;
  const animation = itemStagger?.type || comp.data.animation || defaultAnim;
  const delay = itemStagger
    ? (itemStagger.baseDelay + idx * itemStagger.staggerDelay)
    : (comp.data.delay !== undefined ? comp.data.delay : defaultDelay);
  return { animation, delay };
};

interface ColorResolutionParams {
  item: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accentColor: string;
  darkAccentColor: string;
  styles: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  rgb: string;
  isLight: boolean;
  isAccentLight: boolean;
}

export const resolveItemColors = ({
  item,
  accentColor,
  darkAccentColor,
  styles,
  rgb,
  isLight,
  isAccentLight
}: ColorResolutionParams) => {
  const isAccent = item?.useAccentBg;
  const fallbackBg = isAccent
    ? `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`
    : (styles.cardStyle.backgroundColor || styles.cardStyle.background || `rgba(2, 6, 23, 0.48)`);
  const fallbackBorder = isAccent ? "none" : (styles.cardStyle.border || `1px solid rgba(${rgb}, 0.22)`);
  const fallbackBadge = accentColor;
  const textColor = isAccent
    ? (isAccentLight ? "#111111" : "#ffffff")
    : (isLight ? "#191919" : "rgb(249, 247, 255)");

  if (isLight) {
    return {
      bgRgba: fallbackBg,
      borderRgba: fallbackBorder,
      badgeRgba: fallbackBadge,
      shadowGlowRgba: isAccent ? `rgba(${rgb}, 0.15)` : null,
      backdropBlur: "blur(16px) saturate(1.15)",
      textColor: textColor
    };
  }

  if (item?.v2) {
    const bBlur = item.backdropBlur || "16px";
    return {
      bgRgba: item.bgRgba || fallbackBg,
      borderRgba: item.borderRgba || fallbackBorder,
      badgeRgba: item.badgeRgba || fallbackBadge,
      shadowGlowRgba: item.shadowGlowRgba || (isAccent ? `rgba(${rgb}, 0.15)` : null),
      backdropBlur: bBlur.includes("blur") ? bBlur : `blur(${bBlur}) saturate(1.15)`,
      textColor: textColor
    };
  }

  return {
    bgRgba: fallbackBg,
    borderRgba: fallbackBorder,
    badgeRgba: fallbackBadge,
    shadowGlowRgba: isAccent ? `rgba(${rgb}, 0.15)` : null,
    backdropBlur: "blur(16px) saturate(1.15)",
    textColor: textColor
  };
};

interface NestedCardContentParams {
  ns: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  comp: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  idx: number;
  isAccentCard: boolean;
  parentDelay: number;
  otherComps: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  accentColor: string;
  rgb: string;
  isLight: boolean;
  darkAccentColor: string;
  styles: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  fontScale: number;
  activeCardTextColor: string;
  activeCardBadgeColor: string;
  inactiveCardTextColor: string;
  theme?: string;
}

export const renderNestedCardContent = ({
  ns,
  comp,
  idx,
  isAccentCard,
  parentDelay,
  otherComps,
  accentColor,
  rgb,
  isLight,
  darkAccentColor,
  styles,
  fontScale,
  activeCardTextColor,
  activeCardBadgeColor,
  inactiveCardTextColor,
  theme
}: NestedCardContentParams) => {
  if (ns.type === "card_with_nested_pills") {
    // Real content always from comp.data.text (AI-generated). ns.titleText is a design placeholder — never use as content fallback.
    const leftTitle = comp?.data?.text?.trim() || "";
    // Pills come from ns.pills if explicitly set, or remaining comps ONLY in single-card layouts
    const leftPills = (Array.isArray(ns.pills) && ns.pills.length > 0)
      ? ns.pills
      : (idx === 0 && otherComps.length > 1 && (!ns.type || ns.type === "card_with_nested_pills") && otherComps.length <= 2)
        ? otherComps.slice(1).filter(c => c?.data?.text?.trim()).map(c => c.data.text)
        : [];
    // ns.badgeText is category/section label — keep this as-is
    const badgeLabel = ns.badgeText || "";
    
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", gap: "20px" }}>
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{
            fontSize: "16px",
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: isAccentCard ? activeCardBadgeColor : accentColor,
            fontFamily: styles.fontFamily,
            opacity: isAccentCard ? 0.8 : 1
          }}>
            {badgeLabel}
          </div>
          <div style={{
            fontSize: getDynamicFontSize(leftTitle, 52, fontScale),
            lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.38,
            fontWeight: 860,
            color: isAccentCard ? activeCardTextColor : inactiveCardTextColor,
            fontFamily: styles.fontFamily,
            textTransform: "uppercase"
          }}>
            {leftTitle}
          </div>
        </div>
        
        {leftPills.length > 0 && (
          <div style={{ display: "grid", gap: "10px" }}>
            {leftPills.map((pillText, pIdx) => {
              const isEven = pIdx % 2 === 0;
              const useAccentStyle = !isEven;
              
              return (
                <AnimatedBlock key={pIdx} animation="slide-up" delaySeconds={parentDelay + 0.1 + pIdx * 0.12}>
                  <div style={{
                    borderRadius: "16px",
                    padding: "14px",
                    background: useAccentStyle
                      ? `rgba(${rgb}, 0.12)`
                      : isLight
                        ? "rgba(0, 0, 0, 0.04)"
                        : "rgba(255, 255, 255, 0.035)",
                    border: useAccentStyle
                      ? `1px solid rgba(${rgb}, 0.4)`
                      : isLight
                        ? "1px solid rgba(0, 0, 0, 0.1)"
                        : "1px solid rgba(255, 255, 255, 0.14)",
                    boxShadow: useAccentStyle
                      ? `rgba(${rgb}, 0.133) 0px 0px 22px`
                      : "none",
                    fontSize: getDynamicFontSize(pillText, 24, fontScale),
                    lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.38,
                    fontWeight: 700,
                    color: useAccentStyle
                      ? (isLight ? darkAccentColor : "rgb(220, 252, 231)")
                      : (isLight ? "#334155" : "rgb(220, 252, 231)"),
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase"
                  }}>
                    {pillText}
                  </div>
                </AnimatedBlock>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  if (ns.type === "vertical_item_list") {
    // Real content from otherComps — filter out empties
    const rightItems: string[] = otherComps.filter(c => c?.data?.text?.trim()).map(c => c.data.text);
    // ns.badgeText is the section category label. ns.titleText is a design placeholder — never show as content.
    const badgeLabel = ns.badgeText || "";
    
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "20px" }}>
        {badgeLabel && (
          <div style={{
            fontSize: "16px",
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: isAccentCard ? activeCardBadgeColor : accentColor,
            fontFamily: styles.fontFamily,
            opacity: isAccentCard ? 0.8 : 1
          }}>
            {badgeLabel}
          </div>
        )}
        <div style={{ display: "grid", gap: "12px", alignContent: "start", flexGrow: 1 }}>
          {rightItems.slice(0, 4).map((itemText, iIdx) => {
            const isItemAccented = iIdx % 2 === 0;
            
            return (
              <AnimatedBlock key={iIdx} animation="slide-up" delaySeconds={parentDelay + 0.1 + iIdx * 0.08}>
                <div style={{
                  minHeight: "62px",
                  borderRadius: "14px",
                  padding: "12px",
                  background: isItemAccented
                    ? `rgba(${rgb}, ${iIdx === 0 ? 0.08 : 0.133})`
                    : isLight
                      ? "rgba(0, 0, 0, 0.02)"
                      : "rgba(255, 255, 255, 0.03)",
                  border: isItemAccented
                    ? `1px solid ${accentColor}`
                    : isLight
                      ? "1px solid rgba(0, 0, 0, 0.06)"
                      : "1px solid rgba(255, 255, 255, 0.14)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: getDynamicFontSize(itemText, 20, fontScale),
                  lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.38,
                  fontWeight: isItemAccented ? 780 : 680,
                  color: isItemAccented
                    ? (isLight ? darkAccentColor : "rgb(236, 253, 245)")
                    : (isLight ? "#475569" : "rgb(236, 253, 245)"),
                  fontFamily: styles.fontFamily,
                  textTransform: "uppercase"
                }}>
                  {itemText}
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      </div>
    );
  }
  
  if (ns.type === "grid_item_list") {
    const rightItems: string[] = otherComps.map(c => c.data.text);
    const badgeLabel = ns.titleText || ns.badgeText || "Surface";
    
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "16px" }}>
        {badgeLabel && (
          <div style={{
            fontSize: "16px",
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: isAccentCard ? activeCardBadgeColor : accentColor,
            fontFamily: styles.fontFamily,
            opacity: isAccentCard ? 0.8 : 1
          }}>
            {badgeLabel}
          </div>
        )}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))", 
          gap: "12px", 
          alignContent: "start", 
          flexGrow: 1 
        }}>
          {rightItems.slice(0, 4).map((itemText, iIdx) => {
            const isItemAccented = iIdx % 2 === 0;
            
            return (
              <AnimatedBlock key={iIdx} animation="slide-up" delaySeconds={parentDelay + 0.1 + iIdx * 0.08}>
                <div style={{
                  minHeight: "88px",
                  borderRadius: "16px",
                  padding: "12px",
                  background: isItemAccented
                    ? `rgba(${rgb}, ${iIdx === 0 ? 0.08 : 0.133})`
                    : isLight
                      ? "rgba(0, 0, 0, 0.02)"
                      : "rgba(255, 255, 255, 0.03)",
                  border: isItemAccented
                    ? `1px solid ${accentColor}`
                    : isLight
                      ? "1px solid rgba(0, 0, 0, 0.06)"
                      : "1px solid rgba(255, 255, 255, 0.14)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: getDynamicFontSize(itemText, 18, fontScale),
                  lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.38,
                  fontWeight: isItemAccented ? 780 : 680,
                  color: isItemAccented
                    ? (isLight ? darkAccentColor : "rgb(236, 253, 245)")
                    : (isLight ? "#475569" : "rgb(236, 253, 245)"),
                  fontFamily: styles.fontFamily,
                  textTransform: "uppercase",
                  boxSizing: "border-box"
                }}>
                  {itemText}
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      </div>
    );
  }

  // card_simple fallback
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", textAlign: "left", width: "100%" }}>
      <div style={{ display: "grid", gap: "8px", justifyItems: "start" }}>
        <div style={{ 
          fontSize: "15px", 
          fontWeight: 900, 
          letterSpacing: "0.2em", 
          color: isAccentCard ? activeCardBadgeColor : accentColor,
          fontFamily: styles.fontFamily,
          opacity: isAccentCard ? 0.9 : 1,
          textTransform: "uppercase"
        }}>
          {ns.badgeText || String(idx + 1).padStart(2, "0")}
        </div>
        <div style={{ 
          width: "58px", 
          height: "4px", 
          borderRadius: "999px", 
          background: isAccentCard ? activeCardBadgeColor : accentColor 
        }} />
      </div>
      
      <div style={{ 
        fontSize: getDynamicFontSize(comp.data.text, 36, fontScale), 
        lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.38, 
        fontWeight: 820, 
        letterSpacing: "-0.04em", 
        color: isAccentCard ? activeCardTextColor : inactiveCardTextColor,
        fontFamily: styles.fontFamily,
        textTransform: "uppercase",
        marginTop: "16px"
      }}>
        {comp.data.text}
      </div>
    </div>
  );
};
