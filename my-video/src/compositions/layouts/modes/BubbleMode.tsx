import React from "react";
import { useCurrentFrame } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";

export const BubbleMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale
}) => {
  const frame = useCurrentFrame();

  const bubbleItems = otherComps.slice(0, 3).map((comp) => {
    if (!comp || !comp.data?.text?.trim()) return null;
    return {
      text: comp.data.text.trim(),
      comp
    };
  }).filter(Boolean) as { text: string; comp: any }[];

  const getFloatOffset = (phase: number, amp: number) => {
    return Math.sin(frame / 15 + phase) * amp;
  };

  // Dynamically derive 3 harmonious palette colors from active theme's accentColor (rgb)
  // This guarantees 100% color harmony in EVERY theme (Dark, Light, Claude, Rikkei, Anime, etc.)
  const themeColors = (() => {
    const mainRgb = rgb || "59, 130, 246";
    const [r, g, b] = mainRgb.split(",").map(n => parseInt(n.trim(), 10) || 100);

    const color1 = { border: accentColor, rgb: mainRgb };
    
    // Color 2: Harmonious analogous shift (warm/gold tint of theme)
    const color2Rgb = `${Math.min(255, Math.floor(r * 0.8 + 70))}, ${Math.min(255, Math.floor(g * 0.9 + 50))}, ${Math.max(0, Math.floor(b * 0.4))}`;
    const color2Border = `rgb(${color2Rgb})`;

    // Color 3: Harmonious analogous shift (cool/purple-indigo tint of theme)
    const color3Rgb = `${Math.max(0, Math.floor(r * 0.6 + 50))}, ${Math.max(0, Math.floor(g * 0.5 + 30))}, ${Math.min(255, Math.floor(b * 1.2 + 60))}`;
    const color3Border = `rgb(${color3Rgb})`;

    return [color1, { border: color2Border, rgb: color2Rgb }, { border: color3Border, rgb: color3Rgb }];
  })();

  // 3 interlocked overlapping circles in a balanced Venn-diagram formation
  const bubbleConfigs = [
    {
      left: 250,
      top: 0,
      size: 340,
      fontSize: "22px",
      fontWeight: 860,
      padding: "45px 36px",
      floatPhase: 0,
      floatAmp: 4,
      zIndex: 3
    },
    {
      left: 80,
      top: 175,
      size: 340,
      fontSize: "22px",
      fontWeight: 860,
      padding: "45px 36px",
      floatPhase: 2,
      floatAmp: 6,
      zIndex: 2
    },
    {
      left: 420,
      top: 175,
      size: 340,
      fontSize: "22px",
      fontWeight: 860,
      padding: "45px 36px",
      floatPhase: 4,
      floatAmp: 5,
      zIndex: 1
    }
  ];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "840px",
      height: "530px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box"
    }}>
      {bubbleItems.map((item, idx) => {
        const config = bubbleConfigs[idx];
        const palette = themeColors[idx % themeColors.length];
        if (!config || !palette) return null;

        const animConfig = item.comp 
          ? getAnimationConfig(item.comp, idx, "scale-in", 0.2 + idx * 0.1, t)
          : { animation: "scale-in" as const, delay: 0.2 + idx * 0.1 };

        const floatY = getFloatOffset(config.floatPhase, config.floatAmp);
        const size = config.size;

        const bgStyle = isLight
          ? `radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.95) 0%, transparent 45%), linear-gradient(135deg, rgba(${palette.rgb}, 0.18), rgba(255, 255, 255, 0.88))`
          : `radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.25) 0%, transparent 45%), linear-gradient(135deg, rgba(${palette.rgb}, 0.22), rgba(10, 18, 36, 0.78))`;

        const borderStyle = `2.5px solid rgba(${palette.rgb}, 0.65)`;
        const boxShadow = isLight
          ? `0 15px 35px rgba(${palette.rgb}, 0.15), inset 0 0 15px rgba(255, 255, 255, 0.8)`
          : `0 0 35px rgba(${palette.rgb}, 0.3), inset 0 0 20px rgba(${palette.rgb}, 0.15)`;
        const textColor = isLight ? "#0f172a" : "rgb(248, 250, 252)";

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${config.left}px`,
              top: `${config.top}px`,
              width: `${size}px`,
              height: `${size}px`,
              transform: `translateY(${floatY}px)`,
              zIndex: config.zIndex
            }}
          >
            <AnimatedBlock 
              animation={animConfig.animation} 
              delaySeconds={animConfig.delay}
              style={{ height: "100%" }}
            >
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                padding: resolvePadding(config.padding, paddingScale),
                background: bgStyle,
                border: borderStyle,
                boxShadow: boxShadow,
                backdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxSizing: "border-box",
                textTransform: "uppercase"
              }}>
                <div style={{
                  fontSize: `${Math.round(parseInt(config.fontSize, 10) * fontScale)}px`,
                  lineHeight: 1.3,
                  fontWeight: config.fontWeight,
                  color: textColor,
                  fontFamily: styles.fontFamily,
                  textShadow: isLight ? "none" : `0 0 18px rgba(${palette.rgb}, 0.35)`,
                  wordBreak: "break-word",
                  maxHeight: "180px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {item.text}
                </div>
              </div>
            </AnimatedBlock>
          </div>
        );
      })}
    </div>
  );
};
