import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding } from "./LayoutNestedRenderers";

// Parse pill text: "AI AI viết video" → { label: "AI", text: "AI viết video" }
function parseFeedItem(raw: string): { label: string; text: string } {
  const parts = raw.trim().split(/\s+/);
  if (parts.length >= 2) {
    return { label: parts[0].toUpperCase(), text: parts.slice(1).join(" ") };
  }
  return { label: "—", text: raw };
}

// Deterministic pseudo-random progress bar width per item
const BAR_WIDTHS = [92, 29, 48, 67, 86, 35, 72, 54, 91, 41];

export const FeedScrollMode: React.FC<ModeRendererProps> = ({
  otherComps,
  resolvedPositions,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale
}) => {
  const frame = useCurrentFrame();
  const { fps, height: canvasHeight } = useVideoConfig();

  // Build feed items from user otherComps + template pills
  const pos = resolvedPositions?.[0];
  const templatePills: string[] = (pos?.nestedStructure?.pills || []).slice(1); // skip first (mega-string)

  // Merge: prefer user otherComps content, supplement with template pills
  const userItems = otherComps.slice(0, 10).map((c: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    label: (c?.data?.text || "").split(/\s+/)[0]?.toUpperCase() || "AI",
    text: c?.data?.text || ""
  }));

  // Template pill-based items as additional rows
  const pillItems = templatePills
    .filter(p => p && p.trim().length > 0)
    .map(p => parseFeedItem(p));

  // Combine: user items first, then template items, loop enough for scroll
  const baseItems = userItems.length > 0 ? userItems : pillItems;
  // Duplicate to ensure enough rows for scrolling effect
  const feedItems = [...baseItems, ...baseItems, ...baseItems].slice(0, 20);

  // ── Scroll animation ──────────────────────────────────────────────────
  const ROW_HEIGHT = 110;
  const GAP = 10;
  const ROW_STEP = ROW_HEIGHT + GAP;
  const scrollStart = Math.round(0.5 * fps);
  const scrollDuration = feedItems.length * Math.round(fps * 1.4);
  const maxScroll = baseItems.length * ROW_STEP;

  const scrollY = interpolate(
    frame - scrollStart,
    [0, scrollDuration],
    [0, maxScroll],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.linear
    }
  );

  // Modulo loop: when we've scrolled one set, reset seamlessly
  const loopedScrollY = scrollY % maxScroll;

  // Outer card
  const item = t.items?.itemStyles?.[0] || {};
  const outerCardStyle: React.CSSProperties = {
    borderRadius: item.borderRadius || "34px",
    background: isLight
      ? "rgba(255, 255, 255, 0.82)"
      : "linear-gradient(rgba(6,10,24,0.34), rgba(2,6,23,0.18))",
    border: isLight
      ? "1px solid rgba(0,0,0,0.08)"
      : "1px solid rgba(255,255,255,0.18)",
    boxShadow: isLight
      ? "0 28px 66px rgba(0,0,0,0.08)"
      : `rgba(0,0,0,0.2) 0px 28px 66px, rgba(255,255,255,0.06) 0px 0px 0px 1px inset, rgba(${rgb},0.094) 0px 0px 32px`,
    backdropFilter: `blur(${item.backdropBlur || "8px"}) saturate(1.08)`,
    padding: resolvePadding("28px", paddingScale),
    width: "100%",
    maxWidth: t.container?.maxWidth || "980px",
    minHeight: "760px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    boxSizing: "border-box",
    zIndex: 5
  };

  // VIEWPORT_H: Use raw height from templateJson instead of resolved positions to bypass the resolvePositions() verticalHeight cap
  const rawHeight = t.positions?.[0]?.height || "650px";
  const VIEWPORT_H = Math.min(650, Math.max(400, parseInt(rawHeight, 10)));
  const PADDING_TOP = 10;
  // Highlight position: 3rd row from the bottom
  const ROWS_FROM_BOTTOM = 3;
  const TOTAL_ROWS = Math.ceil(VIEWPORT_H / ROW_STEP); // ~6 rows (650 / 120 = 5.4 -> 6)
  const FOCUS_ROW_IDX = Math.max(0, TOTAL_ROWS - ROWS_FROM_BOTTOM); // 6 - 3 = 3 (4th from top, idx=3)
  const FOCUS_Y = PADDING_TOP + FOCUS_ROW_IDX * ROW_STEP + ROW_HEIGHT / 2; // ≈425px

  return (
    <div style={outerCardStyle}>
      {/* Header: LIVE UPDATES + scrolling */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Red live dot */}
          <div style={{
            width: "12px", height: "12px",
            borderRadius: "999px",
            background: accentColor,
            boxShadow: `rgba(${rgb},0.533) 0px 0px 16px`,
            flexShrink: 0
          }} />
          <div style={{
            fontSize: "13px",
            fontWeight: 900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: isLight ? "#b45309" : "rgb(253,230,138)",
            fontFamily: styles.fontFamily
          }}>
            Live updates
          </div>
        </div>
        <div style={{
          fontSize: "12px",
          fontWeight: 800,
          color: isLight ? "#64748b" : "rgb(203,213,225)",
          fontFamily: styles.fontFamily
        }}>
          scrolling
        </div>
      </div>

      {/* Scrolling viewport — flex-grow fills outer card, height matches proximity math */}
      <div style={{
        position: "relative",
        flexGrow: 1,
        minHeight: 0,
        height: `${VIEWPORT_H}px`,
        overflow: "hidden",
        borderRadius: "28px",
        background: isLight ? "rgba(0,0,0,0.02)" : "rgba(2,6,23,0.48)",
        border: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.1)"
      }}>
        {/* Subtle scanline gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(transparent 0%, rgba(${rgb},0.05) 50%, transparent 100%)`,
          pointerEvents: "none",
          zIndex: 2,
          transform: `translateY(${-loopedScrollY * 0.5}px)`
        }} />

        {/* Top/bottom fade masks */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "56px",
          background: isLight
            ? "linear-gradient(rgba(255,255,255,0.9), transparent)"
            : "linear-gradient(rgba(2,6,23,0.7), transparent)",
          zIndex: 3, pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "56px",
          background: isLight
            ? "linear-gradient(transparent, rgba(255,255,255,0.9))"
            : "linear-gradient(transparent, rgba(2,6,23,0.7))",
          zIndex: 3, pointerEvents: "none"
        }} />

        {/* Scrolling list — starts from top, center item is always brightest */}
        <div style={{
          position: "absolute",
          left: "22px",
          right: "22px",
          top: `${-loopedScrollY}px`,
          display: "grid",
          gap: `${GAP}px`,
          paddingTop: "10px"
        }}>
          {[...feedItems, ...feedItems].map((item, idx) => {
            const barW = BAR_WIDTHS[idx % BAR_WIDTHS.length];
            // Item center Y in viewport space; FOCUS_Y is the 3rd-from-bottom row position
            const itemCenterY = PADDING_TOP + idx * ROW_STEP + ROW_HEIGHT / 2 - loopedScrollY;
            const distFromFocus = Math.abs(itemCenterY - FOCUS_Y);
            const maxDist = VIEWPORT_H * 0.6; // falloff radius
            const viewportCenter = FOCUS_Y;
            const proximity = Math.max(0, 1 - distFromFocus / maxDist);
            const opacity = 0.2 + proximity * 0.8;
            const scale = 0.92 + proximity * 0.08;

            const isFocused = proximity > 0.75;

            return (
              <div
                key={idx}
                style={{
                  borderRadius: "20px",
                  padding: "22px 20px",
                  background: isLight
                    ? (isFocused ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)")
                    : (isFocused ? "rgba(15,23,42,0.8)" : "rgba(15,23,42,0.66)"),
                  border: isLight
                    ? (isFocused ? `1px solid rgba(${rgb},0.2)` : "1px solid rgba(0,0,0,0.06)")
                    : (isFocused ? `1px solid rgba(${rgb},0.133)` : "1px solid rgba(255,255,255,0.1)"),
                  boxShadow: isFocused
                    ? `rgba(0,0,0,0.16) 0px 16px 34px, rgba(${rgb},0.08) 0px 0px 22px`
                    : "none",
                  display: "grid",
                  gap: "8px",
                  opacity,
                  transform: `scale(${scale})`,
                  transformOrigin: "center"
                }}
              >
                {/* Top: label + dot */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: accentColor,
                    fontFamily: styles.fontFamily
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    width: "8px", height: "8px",
                    borderRadius: "999px",
                    background: accentColor,
                    opacity: isFocused ? 0.9 : 0.5,
                    boxShadow: `rgba(${rgb},0.533) 0px 0px 12px`
                  }} />
                </div>

                {/* Bottom: text + progress bar */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px"
                }}>
                  <div style={{
                    fontSize: `${Math.round(22 * fontScale)}px`,
                    lineHeight: 1.15,
                    fontWeight: 780,
                    color: isLight ? "#1e293b" : "rgb(248,250,252)",
                    fontFamily: styles.fontFamily
                  }}>
                    {item.text}
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    flexShrink: 0,
                    width: "74px",
                    height: "10px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"
                  }}>
                    <div style={{
                      width: `${barW}%`,
                      height: "100%",
                      borderRadius: "999px",
                      background: `linear-gradient(90deg, ${accentColor}, rgb(253,230,138))`
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
