import React from "react";
import { useCurrentFrame } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig 
} from "./LayoutNestedRenderers";

export const GridMetricsMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  isVertical,
  styles,
  fontScale,
  paddingScale,
  gap,
  activeCardTextColor,
  inactiveCardTextColor
}) => {
  const frame = useCurrentFrame();
  const visibleComps = otherComps.slice(0, 4); // Limit to max 4 cards
  
  const layoutId = t.id;
  const isMetricCards = layoutId === "MetricCards";
  const isHeroMetrics = layoutId === "HeroMetricCards";
  const isGridMetrics = layoutId === "GridMetrics";

  // 1. Container Style (Grid vs Flex based on Layout ID and Orientation)
  const containerStyle: React.CSSProperties = {
    display: isMetricCards ? "flex" : "grid",
    flexDirection: isMetricCards ? (isVertical ? "column" : "row") : undefined,
    gridTemplateColumns: isHeroMetrics
      ? (isVertical ? "repeat(2, 1fr)" : "3fr 2fr")
      : isMetricCards
        ? undefined
        : "repeat(2, 1fr)",
    gap: gap !== undefined ? `${gap}px` : (t.container.gap || "20px"),
    width: "100%",
    maxWidth: t.container.maxWidth || "860px",
    zIndex: 5
  };

  // 2. CSS Animations Injection
  const animStyles = `
    @keyframes grid-metric-shine {
      0% { left: -150%; }
      40% { left: 150%; }
      100% { left: 150%; }
    }
    @keyframes grid-metric-float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
      100% { transform: translateY(0px); }
    }
    @keyframes grid-metric-glow {
      0% { box-shadow: 0 18px 44px rgba(0, 0, 0, 0.2), 0 0 10px rgba(${rgb}, 0.1); }
      50% { box-shadow: 0 18px 44px rgba(0, 0, 0, 0.25), 0 0 30px rgba(${rgb}, 0.35); }
      100% { box-shadow: 0 18px 44px rgba(0, 0, 0, 0.2), 0 0 10px rgba(${rgb}, 0.1); }
    }
  `;

  const activeCardDescColor = isLight ? "rgba(0, 0, 0, 0.72)" : "rgba(255, 255, 255, 0.85)";

  return (
    <div style={containerStyle}>
      <style>{animStyles}</style>
      {visibleComps.map((comp, idx) => {
        const itemStyleSetting = t.items.itemStyles[idx % t.items.itemStyles.length] || { fontSize: "28px", fontWeight: "700" };
        
        // Hero metrics layout: first card is the hero (accent background, full width/height)
        const isHeroCard = isHeroMetrics && idx === 0;
        const isAccentMetric = isHeroCard || itemStyleSetting.useAccentBg;

        // Custom card positioning/spans for Hero Metrics layout
        const heroCardStyleOverride: React.CSSProperties = isHeroMetrics
          ? isHeroCard
            ? {
                gridColumn: isVertical ? "1 / span 2" : "1",
                gridRow: isVertical ? undefined : "1 / span 2",
                minHeight: isVertical ? "220px" : "380px",
                animation: "grid-metric-glow 4s ease-in-out infinite",
              }
            : {
                gridColumn: isVertical ? "span 1" : "2",
                minHeight: isVertical ? "150px" : "180px",
              }
          : {};

        const cardStyle: React.CSSProperties = {
          borderRadius: itemStyleSetting.borderRadius || "28px",
          padding: resolvePadding(itemStyleSetting.padding || "28px", paddingScale),
          background: isAccentMetric
            ? `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`
            : isLight
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.05)",
          border: isAccentMetric ? "none" : `1px solid rgba(${rgb}, 0.26)`,
          boxShadow: isMetricCards 
            ? `0 24px 50px rgba(${rgb}, 0.15)` 
            : `0 18px 44px rgba(0, 0, 0, 0.2)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: isMetricCards ? (isVertical ? "160px" : "200px") : "180px",
          flex: isMetricCards ? "1" : undefined,
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          animation: isGridMetrics ? "grid-metric-float 5s ease-in-out infinite" : undefined,
          animationDelay: isGridMetrics ? `${idx * 0.6}s` : undefined,
          ...heroCardStyleOverride
        };

        const valueStyle: React.CSSProperties = {
          fontSize: isHeroCard 
            ? `${Math.round(84 * fontScale)}px` 
            : `${Math.round(48 * fontScale)}px`,
          fontWeight: 900,
          color: isAccentMetric ? activeCardTextColor : accentColor,
          fontFamily: styles.fontFamily,
          lineHeight: 1.0,
          zIndex: 2
        };

        const labelStyle: React.CSSProperties = {
          fontSize: getDynamicFontSize(comp.data.text, isHeroCard ? 24 : 22, fontScale),
          fontWeight: itemStyleSetting.fontWeight || "800",
          color: isAccentMetric ? activeCardDescColor : inactiveCardTextColor,
          fontFamily: styles.fontFamily,
          textTransform: "uppercase",
          lineHeight: 1.1,
          zIndex: 2
        };

        const animConfig = getAnimationConfig(comp, idx, "scale-in", 0.2 * idx, t);

        // Animate the sparkline line drawing progress
        const sparklineProgress = Math.min(1, Math.max(0, (frame - (animConfig.delay * 30)) / 25));
        const lineLength = 200;
        const strokeDashoffset = lineLength * (1 - sparklineProgress);

        return (
          <AnimatedBlock key={comp.id || idx} animation={animConfig.animation} delaySeconds={animConfig.delay}>
            <div style={cardStyle}>
              {/* Shine Sweep animation for Metric Cards layout */}
              {isMetricCards && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "-150%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)",
                  transform: "skewX(-30deg)",
                  animation: "grid-metric-shine 4s ease-in-out infinite",
                  animationDelay: `${idx * 0.8}s`,
                  pointerEvents: "none",
                  zIndex: 3
                }} />
              )}

              {isHeroCard ? (
                // Hero card layout with side-by-side Value + SVG Sparkline
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexGrow: 1, marginBottom: "20px", zIndex: 2 }}>
                  <div style={valueStyle}>
                    {comp.data.value || `0${idx + 1}`}
                  </div>
                  {/* SVG Sparkline Chart */}
                  <div style={{ width: isVertical ? "120px" : "200px", height: isVertical ? "55px" : "90px" }}>
                    <svg width="100%" height="100%" viewBox="0 0 100 50" style={{ overflow: "visible" }}>
                      <defs>
                        <linearGradient id={`grad_hero_${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 45 C 20 40, 40 10, 60 25 C 80 40, 90 5, 100 15 L 100 50 L 0 50 Z"
                        fill={`url(#grad_hero_${idx})`}
                        opacity={sparklineProgress}
                      />
                      <path
                        d="M 0 45 C 20 40, 40 10, 60 25 C 80 40, 90 5, 100 15"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="4"
                        strokeDasharray={lineLength.toString()}
                        strokeDashoffset={strokeDashoffset.toString()}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div style={valueStyle}>
                  {comp.data.value || `0${idx + 1}`}
                </div>
              )}
              
              <div style={labelStyle}>
                {comp.data.text}
              </div>
            </div>
          </AnimatedBlock>
        );
      })}
    </div>
  );
};
