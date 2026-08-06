import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { ModeRendererProps } from "./LayoutModeTypes";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { CategoryPill } from "../../../components/atoms/VideoAtoms";

export const WebMockupHeroMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  isVertical,
  styles,
  fontScale,
  imageUrl,
  category
}) => {
  const frame = useCurrentFrame();

  // 1. Resolve Category Pill text
  const cleanCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "") || "TRENDING";

  // 2. Resolve Top Detail Pills — pull from kịch bản
  let badgeComps = otherComps.filter(c => c.type === "badge_row" || (c.data?.badges && c.data.badges.length > 0));
  if (badgeComps.length === 0) {
    // Fallback: collect text from feature_card items in the script to build badge pills
    const cardTexts = otherComps
      .filter(c => (c.type === "feature_card" || c.type === "card") && c.data?.text?.trim())
      .map(c => c.data.text.trim());
    if (cardTexts.length > 0) {
      badgeComps = [
        {
          id: "script-badges-from-cards",
          type: "badge_row",
          data: { badges: cardTexts }
        }
      ] as any[];
    } else {
      // Hard-coded decorative fallback
      badgeComps = [
        {
          id: "mock-badges-1",
          type: "badge_row",
          data: { badges: ["★ 3.4K stars", "BY MengTo", "LICENSE MIT"] }
        }
      ] as any[];
    }
  }

  // 3. Resolve Browser Bottom-Left Overlay Tag — pull from kịch bản
  let overlayTag = "";
  const firstCardComp = otherComps.find(c => (c.type === "feature_card" || c.type === "card") && c.data?.text);
  if (firstCardComp) {
    overlayTag = firstCardComp.data.text;
    if (firstCardComp.data.value) {
      overlayTag += ` · ${firstCardComp.data.value}`;
    }
  } else {
    overlayTag = "• 89 demo · gallery xem trước";
  }

  // 4. Address Bar URL resolution
  let addressUrl = "github.com/mengto/skills";
  const badgesList = badgeComps[0]?.data?.badges || [];
  const authorBadge = badgesList.find((b: string) => b.toLowerCase().includes("by ") || b.toLowerCase().includes("author"));
  if (authorBadge) {
    const authorName = authorBadge.replace(/by\s+/i, "").trim().toLowerCase();
    addressUrl = `github.com/${authorName}/skills`;
  }

  // 5. Animations configuration (3D Perspective Tilt & Float)
  const mountStart = 0;
  const mountDuration = 35;

  // Intro scale interpolation (0.85 -> 1.0)
  const scale = interpolate(frame - mountStart, [0, mountDuration], [0.85, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  // Intro progress interpolation (0 -> 1)
  const introProgress = interpolate(frame - mountStart, [0, mountDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  // 2D Rotation (Z-axis tilt). Starts almost flat and slowly rotates clockwise to 2.5 degrees as in the user's reference image.
  const currentRotZ = interpolate(frame, [0, 95], [-1, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad)
  });

  const floatY = Math.sin(frame / 25) * 6 * introProgress;

  // Responsive sizes based on screen orientation
  const browserHeight = isVertical ? "520px" : "480px";
  const containerGap = isVertical ? "48px" : "28px";

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: isVertical ? "100%" : (t.container?.maxWidth || "940px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: containerGap,
    boxSizing: "border-box",
    zIndex: 5,
    paddingLeft: isVertical ? "32px" : "20px",
    paddingRight: isVertical ? "32px" : "20px",
    marginTop: isVertical ? "320px" : "120px"
  };

  const isDefaultImage = (url: string) => {
    if (!url) return true;
    const lower = url.toLowerCase();
    return (
      lower === "undefined" || 
      lower === "null" || 
      lower.endsWith("/undefined") || 
      lower.endsWith("/null") ||
      lower.includes("placeholder") ||
      lower.includes("bg") || 
      lower.includes("background") || 
      lower.includes("circuit") || 
      lower.includes("bokeh")
    );
  };

  return (
    <div style={containerStyle}>
      {/* 1. Category Pill */}
      {cleanCategory && (
        <AnimatedBlock animation="slide-down" delaySeconds={0.15}>
          <CategoryPill
            text={cleanCategory}
            bgRgba={isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)"}
            borderRgba={isLight ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)"}
            textRgba={accentColor}
            hasDot={true}
            dotRgba={accentColor}
            fontSize={isVertical ? "20px" : "17px"}
            fontFamily={styles.fontFamily}
          />
        </AnimatedBlock>
      )}

      {/* 2. Top Detail Pills Row */}
      {badgeComps.length > 0 && (
        <AnimatedBlock animation="slide-down" delaySeconds={0.3}>
          <div style={{ display: "flex", justifyContent: "flex-start", gap: "14px", flexWrap: "wrap", width: "100%" }}>
            {badgeComps[0].data?.badges?.map((badge: string, idx: number) => {
              const pillColor = idx === 0 ? accentColor : (isLight ? "#334155" : "#e2e8f0");
              const pillBg = idx === 0 
                ? (isLight ? "rgba(0, 0, 0, 0.04)" : `rgba(${rgb}, 0.08)`) 
                : (isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.04)");
              const pillBorder = idx === 0 
                ? `rgba(${rgb}, 0.25)` 
                : (isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)");

              return (
                <span key={idx} style={{
                  borderRadius: "24px",
                  padding: isVertical ? "12px 24px" : "8px 18px",
                  background: pillBg,
                  border: `1.5px solid ${pillBorder}`,
                  color: pillColor,
                  fontWeight: 800,
                  fontSize: isVertical ? "24px" : "20px",
                  fontFamily: styles.fontFamily,
                  display: "inline-flex",
                  alignItems: "center"
                }}>
                  {badge}
                </span>
              );
            })}
          </div>
        </AnimatedBlock>
      )}

      {/* 3. 3D Rotating & Floating Browser Mockup */}
      <div style={{
        width: "100%",
        perspective: "1200px",
        transformStyle: "preserve-3d",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: isVertical ? "120px" : "48px"
      }}>
        <div style={{
          width: "100%",
          height: browserHeight,
          display: "flex",
          flexDirection: "column",
          borderRadius: "20px",
          overflow: "hidden",
          border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: isLight
            ? "0 30px 60px rgba(0, 0, 0, 0.12)"
            : `0 40px 90px rgba(0, 0, 0, 0.65), 0 0 40px rgba(${rgb}, 0.15)`,
          backgroundColor: isLight ? "#ffffff" : "#0A0B10",
          transform: `scale(${scale}) translateY(${floatY}px) rotate(${currentRotZ}deg)`,
          transformStyle: "preserve-3d",
          position: "relative"
        }}>
          {/* Mock Browser Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isVertical ? "20px 24px" : "16px 20px",
            backgroundColor: isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            {/* Window controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5F56" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#27C93F" }} />
            </div>
            {/* Address bar */}
            <div style={{
              fontSize: isVertical ? "16px" : "14px",
              color: isLight ? "rgba(0, 0, 0, 0.45)" : "rgba(255, 255, 255, 0.35)",
              fontFamily: styles.fontFamily,
              backgroundColor: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)",
              padding: "4px 30px",
              borderRadius: "8px",
              width: isVertical ? "200px" : "280px",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {addressUrl}
            </div>
            <div style={{ width: "52px" }} />
          </div>

          {/* Client frame area (Display Image) */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", background: isLight ? "#f8fafc" : "#020617" }}>
            {imageUrl && !isDefaultImage(imageUrl) ? (
              <img
                src={imageUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
                alt="Web Mockup"
              />
            ) : (
              // Default premium dashboard UI placeholder if no image
              <div style={{
                width: "100%",
                height: "100%",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                color: isLight ? "#1e293b" : "#f8fafc",
                fontFamily: styles.fontFamily,
                boxSizing: "border-box"
              }}>
                <div style={{ height: "48px", width: "40%", background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", borderRadius: "8px" }} />
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ flex: 1, height: "180px", background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)", borderRadius: "16px", border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)" }} />
                  <div style={{ flex: 1, height: "180px", background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)", borderRadius: "16px", border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)" }} />
                </div>
              </div>
            )}

            {/* Glassmorphic Overlay Sub-tag on bottom-left */}
            {overlayTag && (
              <div style={{
                position: "absolute",
                bottom: "20px",
                left: "20px",
                background: isLight ? "rgba(255, 255, 255, 0.85)" : "rgba(10, 15, 30, 0.65)",
                backdropFilter: "blur(12px)",
                border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "24px",
                padding: "10px 20px",
                fontSize: isVertical ? "20px" : "18px",
                fontWeight: "900",
                color: isLight ? "#1e293b" : "#ffffff",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                zIndex: 10,
                display: "inline-flex",
                alignItems: "center",
                fontFamily: styles.fontFamily
              }}>
                {overlayTag}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
