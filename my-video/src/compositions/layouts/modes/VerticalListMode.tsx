import React from "react";
import { useCurrentFrame } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { NumberedCard } from "../../../components/atoms/VideoAtoms";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig, 
  resolveItemColors,
  renderNestedCardContent 
} from "./LayoutNestedRenderers";

export const VerticalListMode: React.FC<ModeRendererProps> = ({
  otherComps,
  resolvedPositions,
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
  activeCardBadgeColor,
  inactiveCardTextColor,
  category,
  theme
}) => {
  const layoutMode = t.layoutMode;
  const isAuditChecklist = t.id === "AuditTrailChecklist";
  const frame = useCurrentFrame();

  if (isAuditChecklist) {
    // Progressively highlight items:
    // Frame 0-15: none
    // Frame 15-30: index 0
    // Frame 30-45: index 1
    // Frame 45+: index 2
    let activeIdx = -1;
    if (frame >= 15 && frame < 30) activeIdx = 0;
    else if (frame >= 30 && frame < 45) activeIdx = 1;
    else if (frame >= 45) activeIdx = 2;

    const checklistContainerStyle: React.CSSProperties = {
      width: "100%",
      maxWidth: t.container?.maxWidth || "960px",
      borderRadius: "28px",
      padding: "32px",
      background: isLight 
        ? "rgba(255, 255, 255, 0.88)" 
        : "rgba(9, 9, 11, 0.85)", // dark slate background
      border: isLight 
        ? `1px solid rgba(${rgb}, 0.18)` 
        : `1px solid rgba(${rgb}, 0.25)`,
      boxShadow: isLight
        ? `rgba(0, 0, 0, 0.08) 0px 24px 64px, rgba(${rgb}, 0.06) 0px 0px 32px`
        : `rgba(0, 0, 0, 0.5) 0px 24px 64px, rgba(${rgb}, 0.1) 0px 0px 32px`,
      display: "grid",
      gap: "24px",
      boxSizing: "border-box",
      zIndex: 5
    };

    return (
      <div style={checklistContainerStyle}>
        {/* Header Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: isLight 
            ? "1px solid rgba(0,0,0,0.06)" 
            : "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "16px"
        }}>
          <div style={{
            fontSize: "16px",
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: accentColor,
            textTransform: "uppercase",
            fontFamily: styles.fontFamily
          }}>
            {otherComps[0]?.data?.text || "AUDIT LOG"}
          </div>
          <div style={{
            fontSize: "16px",
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: accentColor, // Theme Accent Color for PASS status
            textTransform: "uppercase",
            fontFamily: styles.fontFamily
          }}>
            PASS
          </div>
        </div>

        {/* Checklist Rows */}
        <div style={{ display: "grid", gap: "16px" }}>
          {otherComps.slice(0, 3).map((comp, idx) => {
            const isActive = idx === activeIdx;
            
            // Extract timestamp from t.positions or fallback
            let timestamp = "00:00";
            const origPill = t.positions?.[0]?.nestedStructure?.pills?.[idx * 2];
            if (origPill) {
              const tokens = origPill.split(/\s+/);
              if (tokens[0] && tokens[0].includes(":")) {
                timestamp = tokens[0];
              }
            } else {
              const fallbacks = ["00:12", "00:19", "00:26"];
              timestamp = fallbacks[idx] || "00:00";
            }

            const rowStyle: React.CSSProperties = {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "28px",
              padding: "22px 32px",
              borderRadius: "18px",
              background: isActive 
                ? (isLight ? `rgba(${rgb}, 0.09)` : `rgba(${rgb}, 0.2)`)
                : (isLight ? "rgba(0, 0, 0, 0.015)" : "rgba(255, 255, 255, 0.02)"),
              border: isActive 
                ? `1px solid ${accentColor}` 
                : (isLight ? "1px solid rgba(0, 0, 0, 0.05)" : "1px solid rgba(255, 255, 255, 0.06)"),
              boxShadow: isActive 
                ? (isLight ? `rgba(${rgb}, 0.1) 0px 0px 20px` : `rgba(${rgb}, 0.2) 0px 0px 28px`)
                : "none",
              transition: "all 0.2s ease-in-out",
              opacity: frame >= (10 + idx * 15) ? 1 : 0, // sequential entrance fade-in
              transform: frame >= (10 + idx * 15) ? "translateY(0)" : "translateY(10px)",
            };

            return (
              <div key={idx} style={rowStyle}>
                {/* Timestamp */}
                <div style={{
                  fontSize: `${Math.round(28 * fontScale)}px`,
                  fontWeight: 900,
                  color: accentColor,
                  fontFamily: styles.fontFamily,
                  minWidth: "90px"
                }}>
                  {timestamp}
                </div>

                {/* Status Badge */}
                <div style={{
                  borderRadius: "999px",
                  border: `1px solid ${accentColor}`,
                  background: `rgba(${rgb}, 0.12)`,
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: 900,
                  color: accentColor,
                  fontFamily: styles.fontFamily,
                  textTransform: "uppercase"
                }}>
                  OK
                </div>

                {/* Main Text */}
                <div style={{
                  fontSize: `${Math.round(32 * fontScale)}px`,
                  lineHeight: 1.38,
                  fontWeight: 800,
                  color: isActive 
                    ? (isLight ? "#1e293b" : "#ffffff") 
                    : (isLight ? "rgba(30, 41, 59, 0.6)" : "rgba(255,255,255,0.7)"),
                  fontFamily: styles.fontFamily,
                  textTransform: "uppercase"
                }}>
                  {comp.data?.text || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const isSignalRail = t.id === "SignalRailBullet";
  if (isSignalRail) {
    const visibleComps = otherComps.slice(0, 4);

    const containerStyle: React.CSSProperties = {
      width: "100%",
      maxWidth: t.container?.maxWidth || "960px",
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "48px",
      background: "transparent",
      boxSizing: "border-box",
      zIndex: 5,
      position: "relative"
    };

    const getBlendedColor = (idx: number, total: number) => {
      if (total <= 1) return accentColor;
      const factor = 1.0 - (idx / (total - 1)) * 0.75;
      const blendedRgb = rgb.split(',').map(n => {
        const val = parseInt(n.trim());
        return Math.round(val * factor + 255 * (1 - factor));
      }).join(',');
      return `rgba(${blendedRgb}, 1.0)`;
    };

    return (
      <div style={containerStyle}>
        {/* Style tag for CSS animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes cursorBlink {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
        `}} />

        {/* Left Column: Vertical Signal Rail List */}
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column", width: "100%" }}>
          {visibleComps.map((comp, idx) => {
            const animConfig = getAnimationConfig(comp, idx, "slide-up", 0.3 * idx, t);
            const itemColor = getBlendedColor(idx, visibleComps.length);

            const text = comp.data?.text || "";
            const parts = text.split(/[:\-]/);
            let badgeLabel = "";
            let cleanText = "";
            if (parts.length >= 2) {
              badgeLabel = parts[0].trim().toUpperCase();
              cleanText = parts.slice(1).join(":").trim();
            } else {
              badgeLabel = `STEP 0${idx + 1}`;
              cleanText = text.trim();
            }
            if (!cleanText) cleanText = text;

            const itemStyle: React.CSSProperties = {
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingLeft: "76px",
              paddingBottom: idx === visibleComps.length - 1 ? "0px" : "48px",
              minHeight: "90px",
              boxSizing: "border-box",
              width: "100%"
            };

            const dotStyle: React.CSSProperties = {
              position: "absolute",
              left: "11px",
              top: "4px",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: itemColor,
              boxShadow: `0 0 16px ${itemColor}`,
              zIndex: 10
            };

            const lineStyle: React.CSSProperties = {
              position: "absolute",
              left: "22px",
              top: "14px",
              bottom: "-14px",
              width: "4px",
              background: `linear-gradient(180deg, ${itemColor}, ${getBlendedColor(idx + 1, visibleComps.length)})`,
              zIndex: 5,
              transformOrigin: "top center"
            };

            return (
              <div key={comp.id || idx} style={{ position: "relative", width: "100%" }}>
                {idx < visibleComps.length - 1 && <div style={lineStyle} />}

                <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                  <div style={itemStyle}>
                    <div style={dotStyle} />
                    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                      <span style={{
                        fontSize: "15px",
                        fontWeight: 900,
                        letterSpacing: "0.15em",
                        color: itemColor,
                        textTransform: "uppercase",
                        marginBottom: "6px",
                        fontFamily: styles.fontFamily
                      }}>
                        {badgeLabel}
                      </span>
                      <span style={{
                        fontSize: getDynamicFontSize(cleanText, 32, fontScale),
                        lineHeight: 1.25,
                        fontWeight: 700,
                        color: isLight ? "#1f2937" : "#ffffff",
                        fontFamily: styles.fontFamily,
                        textTransform: "uppercase"
                      }}>
                        {cleanText}
                      </span>
                    </div>
                  </div>
                </AnimatedBlock>
              </div>
            );
          })}
        </div>

        {/* Right Column: Glassmorphic macOS Terminal */}
        <div style={{
          flex: 1.3,
          height: "380px",
          position: "relative",
          borderRadius: "24px",
          background: isLight
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 240, 240, 0.7) 100%)"
            : "linear-gradient(135deg, rgba(8, 17, 37, 0.72) 0%, rgba(3, 7, 18, 0.85) 100%)",
          border: isLight ? `1.5px solid rgba(0, 0, 0, 0.08)` : `1.5px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: isLight
            ? "rgba(0, 0, 0, 0.08) 0px 24px 60px, rgba(0, 0, 0, 0.03) 0px 0px 1px inset"
            : `rgba(0, 0, 0, 0.5) 0px 24px 60px, rgba(${rgb}, 0.15) 0px 0px 30px, rgba(255, 255, 255, 0.04) 0px 0px 1px inset`,
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box"
        }}>
          {/* Scanning Line overlay */}
          <div style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: "4px",
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 12px ${accentColor}`,
            animation: "scanLine 4s infinite linear",
            pointerEvents: "none",
            zIndex: 10
          }} />

          {/* Terminal Titlebar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.06)",
            background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.01)"
          }}>
            {/* macOS Buttons */}
            <div style={{ display: "flex", gap: "8px", marginRight: "20px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#27c93f" }} />
            </div>
            <div style={{
              fontSize: "12px",
              fontWeight: 600,
              color: isLight ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              {(category || "Process").trim()} Console
            </div>
          </div>

          {/* Console Area */}
          <div style={{
            padding: "24px 28px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
            fontSize: "14px",
            lineHeight: 1.6,
            textAlign: "left",
            justifyContent: "center"
          }}>
            <div style={{
              color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
              marginBottom: "12px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}>
              Initializing Process Log...
            </div>

            {visibleComps.map((comp, idx) => {
              const text = comp.data?.text || "";
              const parts = text.split(/[:\-]/);
              let badgeLabel = "";
              let cleanText = "";
              if (parts.length >= 2) {
                badgeLabel = parts[0].trim().toUpperCase();
                cleanText = parts.slice(1).join(":").trim();
              } else {
                badgeLabel = `STEP 0${idx + 1}`;
                cleanText = text.trim();
              }
              if (!cleanText) cleanText = text;

              // Calculate animation state based on frame
              // Delay is 0.3 * idx seconds = 9 * idx frames at 30fps
              const startFrame = Math.round(9 * idx);
              const nextStartFrame = Math.round(9 * (idx + 1));

              let status = "PENDING";
              let statusColor = isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)";
              let textColor = isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)";

              if (frame >= nextStartFrame) {
                status = "SUCCESS";
                statusColor = "#10b981"; // Emerald green
                textColor = isLight ? "#1f2937" : "#ffffff";
              } else if (frame >= startFrame) {
                status = "RUNNING";
                statusColor = accentColor;
                textColor = accentColor;
              }

              return (
                <div key={idx} style={{
                  marginBottom: "8px",
                  color: textColor,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: status === "PENDING" ? 0.35 : 1,
                  transition: "opacity 0.2s ease, color 0.2s ease"
                }}>
                  <span style={{ color: statusColor, fontWeight: 700 }}>&gt;</span>
                  <span style={{ fontWeight: 800, color: statusColor }}>[{badgeLabel}]</span>
                  <span style={{
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "200px"
                  }}>
                    {cleanText}
                  </span>
                  <span style={{ marginLeft: "auto", color: isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}>...</span>
                  <span style={{
                    fontWeight: 900,
                    color: statusColor,
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {status}
                    {status === "RUNNING" && (
                      <span style={{
                        width: "6px",
                        height: "12px",
                        background: accentColor,
                        display: "inline-block",
                        marginLeft: "4px",
                        animation: "cursorBlink 1s infinite"
                      }} />
                    )}
                  </span>
                </div>
              );
            })}

            <div style={{
              marginTop: "12px",
              fontSize: "11px",
              color: frame >= Math.round(9 * visibleComps.length)
                ? "#10b981"
                : (isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)"),
              fontWeight: 700,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span>Status:</span>
              <span>
                {frame >= Math.round(9 * visibleComps.length) ? "ALL STEPS COMPLETED SUCCESSFULLY" : "PROCESSING..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDossierProof = t.id === "DossierProofBullet";
  if (isDossierProof) {
    const leftComp = otherComps[0];
    const rightComps = otherComps.slice(1, 4);

    const getLocalInitials = (text: string, maxLen: number = 4): string => {
      if (!text) return "";
      const cleaned = text.replace(/[?,.\-;:!*]/g, "").trim();
      const words = cleaned.split(/\s+/);
      if (words.length === 1) return words[0].substring(0, maxLen).toUpperCase();
      return words.map(w => w[0]).join("").substring(0, maxLen).toUpperCase();
    };

    const isAccentLight = (() => {
      const getLuminance = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;
      const vals = rgb.split(',').map(n => parseInt(n.trim()));
      return getLuminance(vals[0] || 239, vals[1] || 68, vals[2] || 68) > 180;
    })();

    const containerStyle: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: "43% 57%",
      gap: "14px",
      width: "100%",
      maxWidth: t.container?.maxWidth || "1000px",
      zIndex: 5,
      boxSizing: "border-box",
      alignItems: "stretch"
    };

    const yellowColor = "#FDE68A";

    const titleInitials = getLocalInitials(leftComp?.data?.text || "");
    const watermarkText = titleInitials.substring(0, 2);

    const op1Initials = getLocalInitials(rightComps[0]?.data?.text || "");
    const op2Initials = getLocalInitials(rightComps[1]?.data?.text || "");

    return (
      <div style={containerStyle}>
        {/* Left Column: Large Dossier Folder Card */}
        {leftComp && (() => {
          const itemStyleSetting = t.items.itemStyles[0] || {};
          const colors = resolveItemColors({
            item: itemStyleSetting,
            accentColor,
            darkAccentColor,
            styles,
            rgb,
            isLight,
            isAccentLight,
            theme
          });
          const animConfig = getAnimationConfig(leftComp, 0, "scale-in", 0.15, t);

          return (
            <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay} style={{ height: "100%" }}>
              <div style={{
                borderRadius: "28px",
                padding: resolvePadding("28px 24px", paddingScale),
                background: colors.bgRgba,
                border: `1.5px solid ${colors.borderRgba}`,
                boxShadow: colors.shadowGlowRgba ? `0 15px 45px ${colors.shadowGlowRgba}` : "rgba(0, 0, 0, 0.2) 0px 24px 58px",
                backdropFilter: colors.backdropBlur,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
                transform: "rotate(-1deg)"
              }}>
                {/* Background Watermark */}
                {watermarkText && (
                  <div style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-10px",
                    fontSize: "140px",
                    fontWeight: 900,
                    color: accentColor,
                    opacity: 0.12,
                    pointerEvents: "none",
                    zIndex: 0,
                    fontFamily: styles.fontFamily,
                    letterSpacing: "-0.05em"
                  }}>
                    {watermarkText}
                  </div>
                )}

                <div style={{ zIndex: 1, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  {/* Top: Pill of Option 1 initials */}
                  {op1Initials && (
                    <div style={{
                      borderRadius: "999px",
                      border: `1px solid ${accentColor}`,
                      background: `rgba(${rgb}, 0.12)`,
                      padding: "4px 10px",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: accentColor,
                      fontFamily: styles.fontFamily,
                      letterSpacing: "0.08em",
                      alignSelf: "flex-start",
                      textTransform: "uppercase"
                    }}>
                      {op1Initials}
                    </div>
                  )}

                  {/* Middle: Title text */}
                  <div style={{
                    fontSize: getDynamicFontSize(leftComp.data.text, 36, fontScale),
                    lineHeight: 1.05,
                    fontWeight: 900,
                    color: "#ffffff",
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase",
                    marginTop: "30px",
                    marginBottom: "auto"
                  }}>
                    {leftComp.data.text}
                  </div>

                  {/* Bottom: Pill of Option 2 initials and accent gold line */}
                  {op2Initials && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "24px" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 900,
                        color: yellowColor,
                        fontFamily: styles.fontFamily,
                        letterSpacing: "0.05em"
                      }}>
                        {op2Initials}
                      </span>
                      <div style={{
                        width: "36px",
                        height: "3px",
                        background: yellowColor,
                        borderRadius: "2px"
                      }} />
                    </div>
                  )}
                </div>
              </div>
            </AnimatedBlock>
          );
        })()}

        {/* Right Column: Stack of 3 horizontal cards */}
        <div style={{
          display: "grid",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: "12px",
          width: "100%"
        }}>
          {rightComps.map((comp, idx) => {
            const rightIdx = idx + 1;
            const itemStyleSetting = t.items.itemStyles[rightIdx] || {};
            const colors = resolveItemColors({
              item: itemStyleSetting,
              accentColor,
              darkAccentColor,
              styles,
              rgb,
              isLight,
              isAccentLight,
              theme
            });

            const text = comp.data?.text || "";
            const initials = getLocalInitials(text);
            const badgeLabel = initials;
            const roundLabel = initials.substring(0, 2);

            // Icon select
            let iconSvg = null;
            if (idx === 0) {
              // File Document icon (Red active)
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              );
            } else if (idx === 1) {
              // Shield icon (Yellow folder shield)
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              );
            } else {
              // Check circle or clock icon (Yellow check)
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              );
            }

            const animConfig = getAnimationConfig(comp, idx, "slide-up", 0.3 + idx * 0.12, t);

            return (
              <AnimatedBlock key={comp.id || idx} animation={animConfig.animation} delaySeconds={animConfig.delay} style={{ height: "100%" }}>
                <div style={{
                  borderRadius: "18px",
                  padding: "16px 20px",
                  background: colors.bgRgba,
                  border: `1.5px solid ${colors.borderRgba}`,
                  boxShadow: colors.shadowGlowRgba ? `0 8px 25px ${colors.shadowGlowRgba}` : "rgba(0, 0, 0, 0.15) 0px 10px 30px",
                  backdropFilter: colors.backdropBlur,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  boxSizing: "border-box",
                  textAlign: "left",
                  width: "100%",
                  height: "100%"
                }}>
                  {/* Left Icon Square */}
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: idx === 0 ? `rgba(${rgb}, 0.2)` : "rgba(253, 230, 138, 0.12)",
                    color: idx === 0 ? accentColor : yellowColor,
                    display: "grid",
                    placeItems: "center",
                    marginRight: "16px",
                    flexShrink: 0
                  }}>
                    {iconSvg}
                  </div>

                  {/* Text middle */}
                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden", marginRight: "10px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      color: idx === 0 ? accentColor : yellowColor,
                      textTransform: "uppercase",
                      marginBottom: "2px",
                      fontFamily: styles.fontFamily
                    }}>
                      {badgeLabel}
                    </span>
                    <span style={{
                      fontSize: getDynamicFontSize(text, 20, fontScale),
                      lineHeight: 1.1,
                      fontWeight: 800,
                      color: "#ffffff",
                      fontFamily: styles.fontFamily,
                      textTransform: "uppercase"
                    }}>
                      {text}
                    </span>
                  </div>

                  {/* Right small round initials circle */}
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: idx === 0 ? `1px solid rgba(${rgb}, 0.4)` : "1px solid rgba(253, 230, 138, 0.25)",
                    background: idx === 0 ? `rgba(${rgb}, 0.1)` : "rgba(253, 230, 138, 0.05)",
                    color: idx === 0 ? accentColor : yellowColor,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 900,
                      fontFamily: styles.fontFamily
                    }}>
                      {roundLabel}
                    </span>
                  </div>
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      </div>
    );
  }

  if (layoutMode === "horizontal_list") {
    const visibleComps = otherComps.slice(0, 3);

    const rowContainerStyle: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: `repeat(${visibleComps.length}, minmax(0, 1fr))`,
      gap: t.container.gap || "14px",
      width: "100%",
      maxWidth: t.container.maxWidth || "820px",
      zIndex: 5
    };

    const isAccentLight = (() => {
      const getLuminance = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;
      const vals = rgb.split(',').map(n => parseInt(n.trim()));
      return getLuminance(vals[0] || 239, vals[1] || 68, vals[2] || 68) > 180;
    })();

    return (
      <div style={rowContainerStyle}>
        {visibleComps.map((comp, idx) => {
          const item = t.items.itemStyles[idx % t.items.itemStyles.length] || {};
          const colors = resolveItemColors({
            item,
            accentColor,
            darkAccentColor,
            styles,
            rgb,
            isLight,
            isAccentLight,
            theme
          });
          return (
            <AnimatedBlock key={comp.id || idx} animation={comp.data.animation || "slide-up"} delaySeconds={comp.data.delay || 0.2 * idx}>
              <NumberedCard
                index={idx + 1}
                text={comp.data.text}
                bgRgba={colors.bgRgba}
                borderRgba={colors.borderRgba}
                badgeRgba={colors.badgeRgba}
                shadowGlowRgba={colors.shadowGlowRgba}
                borderRadius={item.borderRadius}
                padding={item.padding}
                scale={item.scale}
                backdropBlur={colors.backdropBlur}
                fontFamily={styles.fontFamily}
                textColor={colors.textColor}
                lineHeight={theme === "ai_hub_grid" ? 1.5 : 1.38}
              />
            </AnimatedBlock>
          );
        })}
      </div>
    );
  }

  // Default: vertical_list
  const visibleComps = otherComps.slice(0, 4); // Limit list to max 4 items

  const listContainerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: t.container.maxWidth || "860px",
    borderRadius: t.container.borderRadius || "28px",
    padding: resolvePadding(t.container.padding, paddingScale),
    display: "grid",
    gap: gap !== undefined ? `${gap}px` : (t.container.gap || "12px"),
    background: t.container.useAccentBg
      ? `linear-gradient(135deg, ${accentColor}18, ${darkAccentColor}08)`
      : isLight
        ? "rgba(250, 250, 249, 0.45)"
        : "rgba(2, 6, 23, 0.45)",
    border: `1px solid rgba(${rgb}, 0.22)`,
    boxShadow: `0 24px 70px rgba(0, 0, 0, 0.2)`,
    boxSizing: "border-box",
    zIndex: 5
  };

  const isAccentLight = (() => {
    const getLuminance = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;
    const vals = rgb.split(',').map(n => parseInt(n.trim()));
    return getLuminance(vals[0] || 239, vals[1] || 68, vals[2] || 68) > 180;
  })();

  return (
    <div style={listContainerStyle}>
      {visibleComps.map((comp, idx) => {
        const item = t.items.itemStyles[idx % t.items.itemStyles.length] || {};
        const colors = resolveItemColors({
          item,
          accentColor,
          darkAccentColor,
          styles,
          rgb,
          isLight,
          isAccentLight,
          theme
        });
        const animConfig = getAnimationConfig(comp, idx, "slide-up", 0.3 * idx, t);
        const pos = resolvedPositions[idx % resolvedPositions.length];
        return (
          <AnimatedBlock key={comp.id || idx} animation={animConfig.animation} delaySeconds={animConfig.delay}>
            {pos && pos.nestedStructure ? (
               <div style={{
                 borderRadius: item.borderRadius || "18px",
                 padding: resolvePadding(item.padding || "18px", paddingScale),
                 background: colors.bgRgba,
                 border: `1px solid ${colors.borderRgba}`,
                 backdropFilter: colors.backdropBlur
               }}>
                  {renderNestedCardContent({
                    ns: pos.nestedStructure,
                    comp,
                    idx,
                    isAccentCard: item.useAccentBg,
                    parentDelay: animConfig.delay,
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
                  })}
               </div>
             ) : (
               <NumberedCard
                 index={idx + 1}
                 text={comp.data.text}
                 bgRgba={colors.bgRgba}
                 borderRgba={colors.borderRgba}
                 badgeRgba={colors.badgeRgba}
                 shadowGlowRgba={colors.shadowGlowRgba}
                 borderRadius={item.borderRadius || "18px"}
                 padding={resolvePadding(item.padding || "18px", paddingScale)}
                 scale={item.scale}
                 backdropBlur={colors.backdropBlur}
                 fontFamily={styles.fontFamily}
                 minHeight="100px"
                 textColor={colors.textColor}
                 fontSize={getDynamicFontSize(comp.data.text, 25, fontScale)}
                 lineHeight={theme === "ai_hub_grid" ? 1.5 : 1.38}
               />
             )}
          </AnimatedBlock>
        );
      })}
    </div>
  );
};
