import React from "react";
import { ModeRendererProps } from "./LayoutModeTypes";
import { CategoryPill } from "../../../components/atoms/VideoAtoms";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const CenteredTextMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  titleText,
  category,
  imageUrl,
  theme,
  highlightWords
}) => {
  const titleFontSize = t.title?.fontSize ? parseInt(t.title.fontSize) : 80;
  const titleFontWeight = t.title?.fontWeight || "800";
  const titleLetterSpacing = t.title?.letterSpacing || "-0.04em";

  const isContactCard = t.id === "ContactCardEnding";
  const isLaunch = t.id === "Launch";

  // Check if accent divider should be placed at the top (header divider style) or bottom (underline style)
  const isDividerAtTop = t.accentDivider && (
    t.accentDivider.width?.includes("%") || 
    (t.accentDivider.width && parseInt(t.accentDivider.width) > 300) || 
    t.id === "CenterLineOutro" ||
    t.id === "Minimal"
  );

  // 1. Special renderer for Contact Card Ending layout mockup
  if (isContactCard) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: "1020px",
        minHeight: "450px",
        textAlign: "center",
        padding: "24px",
        boxSizing: "border-box",
        zIndex: 5
      }}>
        <AnimatedBlock animation="slide-up" delaySeconds={0.1}>
          <div style={{
            width: "100%",
            maxWidth: t.container?.maxWidth || "860px",
            background: isLight 
              ? "rgba(255, 255, 255, 0.88)" 
              : "rgba(15, 23, 42, 0.65)", // Dark translucent card background
            border: isLight 
              ? "1px solid rgba(0, 0, 0, 0.08)" 
              : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "28px",
            padding: "48px 40px",
            boxShadow: isLight
              ? "0 24px 64px rgba(0, 0, 0, 0.08)"
              : "0 24px 64px rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.04) 0px 0px 0px 1px inset",
            backdropFilter: "blur(16px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxSizing: "border-box"
          }}>
            {/* Avatar/Logo Image at the top */}
            {imageUrl && (
              <div style={{
                width: "110px",
                height: "110px",
                borderRadius: "24px",
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "2px solid rgba(255, 255, 255, 0.15)",
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.3), ${accentColor} 0px 0px 16px`,
                marginBottom: "20px"
              }} />
            )}

            {/* Category badge */}
            {category && category.trim() !== "" && (
              <div style={{ marginBottom: "20px" }}>
                <CategoryPill
                  text={category}
                  bgRgba={t.categoryPill?.bgRgba || (isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)")}
                  borderRgba={t.categoryPill?.borderRgba || `rgba(${rgb}, 0.3)`}
                  textRgba={t.categoryPill?.textRgba || accentColor}
                  fontFamily={styles.fontFamily}
                />
              </div>
            )}

            {/* Title */}
            {titleText && (
              <h1 style={{
                fontSize: `${titleFontSize * fontScale * 0.9}px`, // Slight scale adjustment for card containment
                fontWeight: titleFontWeight,
                letterSpacing: titleLetterSpacing,
                lineHeight: 1.55,
                color: isLight ? "#0f172a" : "#f8fafc",
                margin: "0 0 32px 0",
                fontFamily: styles.fontFamily,
                textTransform: "uppercase",
                textAlign: "center",
                textWrap: "balance" as any
              }}>
                {highlightHeadingText(titleText, accentColor, theme, highlightWords)}
              </h1>
            )}

            {/* Contact Details rows (Pills with WEBSITE/EMAIL badges) */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: "16px",
              width: "100%",
              maxWidth: "680px"
            }}>
              {otherComps.map((comp, idx) => {
                const textVal = comp.data?.text || "";
                const isUrl = /\b[a-z0-9-]+\.[a-z]{2,6}\b/i.test(textVal);
                const label = isUrl ? "WEBSITE" : "EMAIL";
                const labelBg = isUrl 
                  ? (isLight ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.3)") 
                  : (isLight ? `rgba(${rgb}, 0.15)` : `rgba(${rgb}, 0.3)`);
                const labelColor = isUrl ? "#f87171" : accentColor;

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      background: isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.05)",
                      border: isLight ? "1px solid rgba(0, 0, 0, 0.05)" : "1px solid rgba(255, 255, 255, 0.06)",
                      padding: "14px 22px",
                      borderRadius: "999px",
                      boxSizing: "border-box",
                      width: "100%"
                    }}
                  >
                    {/* Left Badge */}
                    <div style={{
                      fontSize: "12px",
                      fontWeight: "900",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      background: labelBg,
                      color: labelColor,
                      fontFamily: styles.fontFamily,
                      minWidth: "85px",
                      textAlign: "center"
                    }}>
                      {label}
                    </div>

                    {/* Right Text */}
                    <div style={{
                      fontSize: `${22 * fontScale}px`,
                      fontWeight: "700",
                      color: isLight ? "#1f2937" : "#ffffff",
                      fontFamily: styles.fontFamily,
                      textAlign: "left"
                    }}>
                      {textVal}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedBlock>
      </div>
    );
  }

  // 2. Special renderer for Launch layout mockup
  if (isLaunch) {
    const subtitleText = otherComps[0]?.data?.text || "";
    const sideBySideComps = otherComps.slice(1);

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: "1020px",
        minHeight: "450px",
        textAlign: "center",
        padding: "24px",
        boxSizing: "border-box",
        zIndex: 5
      }}>
        {/* Category Pill at the top */}
        {category && category.trim() !== "" && (
          <AnimatedBlock animation="slide-up" delaySeconds={0.15}>
            <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "28px" }}>
              <CategoryPill
                text={category}
                bgRgba={t.categoryPill?.bgRgba || (isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)")}
                borderRgba={t.categoryPill?.borderRgba || `rgba(${rgb}, 0.3)`}
                textRgba={t.categoryPill?.textRgba || accentColor}
                fontFamily={styles.fontFamily}
              />
            </div>
          </AnimatedBlock>
        )}

        {/* Title */}
        {titleText && (
          <AnimatedBlock animation="slide-up" delaySeconds={0.3}>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <h1 style={{
                fontSize: `${titleFontSize * fontScale}px`,
                fontWeight: titleFontWeight,
                letterSpacing: titleLetterSpacing,
                lineHeight: 1.55,
                color: isLight ? "#0f172a" : "#f8fafc",
                margin: "0 0 28px 0",
                fontFamily: styles.fontFamily,
                textTransform: "uppercase",
                textAlign: "center",
                textWrap: "balance" as any
              }}>
                {highlightHeadingText(titleText, accentColor, theme, highlightWords)}
              </h1>
            </div>
          </AnimatedBlock>
        )}

        {/* Centered Small Logo Image */}
        {imageUrl && (
          <AnimatedBlock animation="scale" delaySeconds={0.45}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "18px",
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "2px solid rgba(255, 255, 255, 0.15)",
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.3), ${accentColor} 0px 0px 16px`,
              margin: "0 auto 24px auto"
            }} />
          </AnimatedBlock>
        )}

        {/* Gold/Accent Subtitle */}
        {subtitleText && (
          <AnimatedBlock animation="slide-up" delaySeconds={0.6}>
            <div style={{
              fontSize: `${28 * fontScale}px`,
              fontWeight: "900",
              color: accentColor,
              fontFamily: styles.fontFamily,
              marginBottom: "32px",
              textTransform: "uppercase"
            }}>
              {subtitleText}
            </div>
          </AnimatedBlock>
        )}

        {/* Side-by-side Capsule Buttons */}
        {sideBySideComps.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            width: "100%",
            flexWrap: "wrap"
          }}>
            {sideBySideComps.map((comp, idx) => {
              const textVal = comp.data?.text || "";
              return (
                <AnimatedBlock key={idx} animation="slide-up" delaySeconds={0.75 + idx * 0.12}>
                  <div style={{
                    background: isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.05)",
                    border: isLight ? "1px solid rgba(0, 0, 0, 0.05)" : "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "10px 24px",
                    borderRadius: "999px",
                    fontSize: `${18 * fontScale}px`,
                    fontWeight: "800",
                    color: isLight ? "#1f2937" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    boxSizing: "border-box"
                  }}>
                    {textVal}
                  </div>
                </AnimatedBlock>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default CenteredTextMode renderer
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: t.container?.maxWidth || "1020px",
      minHeight: "450px",
      textAlign: "center",
      padding: "24px",
      boxSizing: "border-box",
      zIndex: 5
    }}>
      {/* 1. Header Accent Divider (if styled as header bar) */}
      {isDividerAtTop && t.accentDivider && (
        <AnimatedBlock animation="scale" delaySeconds={0.1}>
          <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "32px" }}>
            <div style={{
              width: t.accentDivider.width || "86%",
              height: t.accentDivider.height || "2px",
              backgroundColor: accentColor,
              borderRadius: "999px",
              boxShadow: `0 0 16px rgba(${rgb}, 0.3)`
            }} />
          </div>
        </AnimatedBlock>
      )}

      {/* 2. Category badge (rendered above title for optimal outro header hierarchy) */}
      {category && category.trim() !== "" && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.25}>
          <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "20px" }}>
            <CategoryPill
              text={category}
              bgRgba={t.categoryPill?.bgRgba || (isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)")}
              borderRgba={t.categoryPill?.borderRgba || `rgba(${rgb}, 0.3)`}
              textRgba={t.categoryPill?.textRgba || accentColor}
              fontFamily={styles.fontFamily}
            />
          </div>
        </AnimatedBlock>
      )}

      {/* 3. Title block */}
      {titleText && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.4}>
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <h1 style={{
              fontSize: `${titleFontSize * fontScale}px`,
              fontWeight: titleFontWeight,
              letterSpacing: titleLetterSpacing,
              lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.15,
              color: isLight ? "#0f172a" : "#f8fafc",
              margin: "0 0 32px 0",
              fontFamily: styles.fontFamily,
              textTransform: "uppercase",
              textAlign: "center",
              textWrap: "balance" as any
            }}>
              {highlightHeadingText(titleText, accentColor, theme, highlightWords)}
            </h1>
          </div>
        </AnimatedBlock>
      )}

      {/* 4. Underline Accent Divider (if styled as short title underline) */}
      {!isDividerAtTop && t.accentDivider && (
        <AnimatedBlock animation="scale" delaySeconds={0.5}>
          <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "32px" }}>
            <div style={{
              width: t.accentDivider.width || "94px",
              height: t.accentDivider.height || "6px",
              backgroundColor: accentColor,
              borderRadius: "999px",
              boxShadow: `0 0 16px rgba(${rgb}, 0.3)`
            }} />
          </div>
        </AnimatedBlock>
      )}

      {/* 5. Other components (Points) */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        width: "100%"
      }}>
        {otherComps.map((comp, idx) => {
          let textVal = comp.data?.text || "";
          // Detect if the line represents a domain/URL link to color/pill it
          const isUrlOrDomain = /\b[a-z0-9-]+\.[a-z]{2,6}\b/i.test(textVal);

          const itemStyleSetting = t.items?.itemStyles?.[idx] || t.items?.itemStyles?.[0];
          const parsedFontSize = itemStyleSetting?.fontSize ? parseInt(itemStyleSetting.fontSize) : 26;

          let itemBg = "none";
          let itemBorder = "none";
          let itemPadding = "0px";
          let itemBorderRadius = "0px";
          let itemTextColor = isLight ? "#334155" : "#cbd5e1";
          let itemFontWeight = "600";
          let itemMarginTop = "0px";

          if (t.id === "Minimal") {
            if (isUrlOrDomain) {
              itemTextColor = isLight ? "#475569" : "#94a3b8"; // Muted for minimal look
              textVal = textVal.toUpperCase();
              itemFontWeight = "700";
              itemMarginTop = "8px";
            } else if (idx === 0) {
              // Highlight the first point with accent color in Minimal style
              itemTextColor = accentColor;
              itemFontWeight = "800";
            } else {
              itemTextColor = isLight ? "#334155" : "#cbd5e1";
            }
          } else {
            // Normal behavior for other layouts
            if (isUrlOrDomain) {
              itemMarginTop = "16px";
              itemFontWeight = "800";
              
              // Render as a pill if template has item style settings
              if (itemStyleSetting) {
                itemPadding = itemStyleSetting.padding || "12px 24px";
                itemBorderRadius = itemStyleSetting.borderRadius || "999px";
                
                if (itemStyleSetting.useAccentBg) {
                  // Bright accent background, high-contrast text
                  itemBg = `linear-gradient(135deg, ${accentColor}, ${darkAccentColor || accentColor})`;
                  itemTextColor = isLight ? "#111111" : "#ffffff";
                  itemBorder = itemStyleSetting.useAccentBorder ? `1px solid rgba(255,255,255,0.2)` : "none";
                } else {
                  // Transparent or subtle background, bright accent text color
                  itemTextColor = accentColor;
                  if (itemStyleSetting.useSubtleThemeBg) {
                    itemBg = isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.08)";
                  }
                  if (itemStyleSetting.useThemeBorder) {
                    itemBorder = isLight ? `1px solid rgba(0, 0, 0, 0.08)` : `1px solid rgba(255, 255, 255, 0.12)`;
                  }
                }
              } else {
                // Fallback simple link text
                itemTextColor = accentColor;
              }
            } else {
              // Normal point item: render as clean plain text line (no background card)
              itemTextColor = isLight ? "#334155" : "#cbd5e1";
            }
          }

          return (
            <AnimatedBlock key={idx} animation="slide-up" delaySeconds={0.5 + idx * 0.12}>
              <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: itemMarginTop }}>
                <div
                  style={{
                    fontSize: `${parsedFontSize * fontScale * 1.15}px`, // Slight scale boost for clean lines readability
                    fontWeight: itemFontWeight,
                    lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.4,
                    color: itemTextColor,
                    background: itemBg,
                    border: itemBorder,
                    padding: itemPadding,
                    borderRadius: itemBorderRadius,
                    maxWidth: "820px",
                    fontFamily: styles.fontFamily,
                    textAlign: "center",
                    boxSizing: "border-box",
                    letterSpacing: isUrlOrDomain ? "0.02em" : "normal"
                  }}
                >
                  {textVal}
                </div>
              </div>
            </AnimatedBlock>
          );
        })}
      </div>
    </div>
  );
};
