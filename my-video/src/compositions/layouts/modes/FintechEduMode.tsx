import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { ModeRendererProps } from "./LayoutModeTypes";
import { fontChakraPetch, fontBeVietnamPro } from "../../../styles/fonts";
import { CircuitBoardBg } from "../../../components/CircuitBoardBg";

const CYAN = "#00d4ff";
const GOLD = "#FFD700";
const WHITE = "#FFFFFF";
const WHITE_75 = "rgba(255,255,255,0.75)";
const CARD_BG = "rgba(0, 40, 160, 0.35)";
const CYAN_BORDER = "1.5px solid rgba(0, 212, 255, 0.4)";
const CYAN_GLOW = "0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)";

/** Numbered list item with cyan circle + title + description */
const NumberedItem: React.FC<{
  index: number;
  title: string;
  description: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ index, title, description, delay, frame, fps }) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        alignItems: "flex-start",
        gap: "20px",
        padding: "20px 24px",
        backgroundColor: CARD_BG,
        border: CYAN_BORDER,
        borderRadius: "12px",
        backdropFilter: "blur(12px)",
        boxShadow: CYAN_GLOW,
      }}
    >
      {/* Cyan numbered circle */}
      <div
        style={{
          minWidth: "44px",
          height: "44px",
          borderRadius: "50%",
          border: `2px solid ${CYAN}`,
          boxShadow: `0 0 12px ${CYAN}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontChakraPetch,
          fontWeight: 700,
          fontSize: "20px",
          color: CYAN,
          backgroundColor: "rgba(0, 212, 255, 0.08)",
        }}
      >
        {index}
      </div>
      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: fontChakraPetch,
            fontWeight: 700,
            fontSize: "22px",
            color: CYAN,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            marginBottom: "6px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: fontBeVietnamPro,
            fontWeight: 400,
            fontSize: "18px",
            color: WHITE_75,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

/** 3-metric dashboard row */
const MetricsRow: React.FC<{
  metrics: Array<{ label: string; value: string; change: string }>;
  frame: number;
  fps: number;
}> = ({ metrics, frame, fps }) => {
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", gap: "16px", width: "100%", opacity }}>
      {metrics.map((m, i) => {
        const itemProgress = spring({
          frame: frame - i * 5,
          fps,
          config: { damping: 18, stiffness: 120 },
        });
        const translateY = interpolate(itemProgress, [0, 1], [20, 0]);
        return (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "16px 20px",
              backgroundColor: CARD_BG,
              border: CYAN_BORDER,
              borderRadius: "12px",
              backdropFilter: "blur(12px)",
              boxShadow: CYAN_GLOW,
              transform: `translateY(${translateY}px)`,
            }}
          >
            <div style={{ fontFamily: fontBeVietnamPro, fontSize: "13px", color: WHITE_75, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {m.label}
            </div>
            <div style={{ fontFamily: fontChakraPetch, fontSize: "28px", fontWeight: 800, color: GOLD, marginBottom: "4px" }}>
              {m.value}
            </div>
            <div style={{ fontFamily: fontBeVietnamPro, fontSize: "14px", color: CYAN }}>
              ↑ {m.change}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const FintechEduMode: React.FC<ModeRendererProps> = ({
  otherComps,
  titleText,
  category,
  accentColor,
  fontScale,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Extract content từ components
  const badgeText = category || "KỲ NGUYÊN AI";
  const heroTitle = titleText || "DATA ANALYST WITH AI";
  const subheadline = otherComps[0]?.data?.text || "Xóa bỏ rào cản sợ code\nBứt phá sự nghiệp cùng AI.";

  // Numbered list items: parse từ otherComps[1..n], fallback defaults
  const rawItems = otherComps.slice(1);
  const DEFAULT_ITEMS = [
    { title: "HỌC TƯ DUY, AI VIẾT CODE", description: "Làm chủ SQL & Python không lo cú pháp phức tạp" },
    { title: "DASHBOARD BÁO CÁO THÔNG MINH", description: "Tích hợp AI diễn giải số liệu tự động trực quan" },
    { title: "GIẢI PHÓNG TÁC VỤ LẶP LẠI", description: "Thiết lập quy trình tự chạy dữ liệu khép kín bằng AI" },
  ];
  const items = rawItems.length >= 1
    ? rawItems.map((c, i) => {
        const parts = (c.data?.text || "").split("|");
        return { title: parts[0]?.trim() || DEFAULT_ITEMS[i % DEFAULT_ITEMS.length].title, description: parts[1]?.trim() || DEFAULT_ITEMS[i % DEFAULT_ITEMS.length].description };
      })
    : DEFAULT_ITEMS;

  // CTA text
  const ctaText = otherComps.find(c => c.type === "cta")?.data?.text || "ĐĂNG KÝ NGAY";

  // Metrics defaults
  const metrics = [
    { label: "TOTAL REVENUE", value: "$12.45M", change: "23.1%" },
    { label: "NEW USERS", value: "8,542", change: "18.7%" },
    { label: "CONVERSION RATE", value: "3.62%", change: "11.3%" },
  ];

  // Animation frame thresholds (at 30fps)
  const heroDelay = 5;
  const metricsDelay = 15;
  const itemsStartDelay = 25;

  // Hero title animation
  const heroScale = spring({ frame: frame - heroDelay, fps, config: { damping: 20, stiffness: 80 } });
  const heroOpacity = interpolate(frame - heroDelay, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const heroScaleVal = interpolate(heroScale, [0, 1], [0.92, 1]);

  // Badge animation
  const badgeOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // CTA animation
  const ctaDelay = itemsStartDelay + items.length * 8;
  const ctaOpacity = interpolate(frame - ctaDelay, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const ctaY = interpolate(
    spring({ frame: frame - ctaDelay, fps, config: { damping: 18, stiffness: 100 } }),
    [0, 1], [20, 0]
  );

  const fs = fontScale || 1;

  return (
    <AbsoluteFill style={{ position: "absolute", inset: 0 }}>
      {/* Background */}
      <CircuitBoardBg glowColor={accentColor === "#00d4ff" || !accentColor ? CYAN : accentColor} />

      {/* Content layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "48px 52px",
          gap: "24px",
          zIndex: 1,
        }}
      >
        {/* Badge */}
        <div
          style={{
            opacity: badgeOpacity,
            display: "inline-flex",
            alignSelf: "flex-start",
            padding: "8px 20px",
            border: CYAN_BORDER,
            borderRadius: "4px",
            boxShadow: CYAN_GLOW,
            backgroundColor: "rgba(0, 212, 255, 0.08)",
            fontFamily: fontChakraPetch,
            fontWeight: 700,
            fontSize: `${16 * fs}px`,
            color: WHITE,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {badgeText}
        </div>

        {/* Hero Title */}
        <div
          style={{
            opacity: heroOpacity,
            transform: `scale(${heroScaleVal})`,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              fontFamily: fontChakraPetch,
              fontWeight: 900,
              fontSize: `${56 * fs}px`,
              color: WHITE,
              textTransform: "uppercase",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              textShadow: `0 0 40px ${CYAN}66, 0 0 80px ${CYAN}22`,
            }}
          >
            {heroTitle}
          </div>
          {subheadline && (
            <div
              style={{
                fontFamily: fontBeVietnamPro,
                fontSize: `${20 * fs}px`,
                color: WHITE_75,
                marginTop: "12px",
                lineHeight: 1.5,
                whiteSpace: "pre-line",
              }}
            >
              {subheadline}
            </div>
          )}
        </div>

        {/* Metrics row */}
        <MetricsRow metrics={metrics} frame={frame - metricsDelay} fps={fps} />

        {/* Numbered items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item, i) => (
            <NumberedItem
              key={i}
              index={i + 1}
              title={item.title}
              description={item.description}
              delay={itemsStartDelay + i * 8}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            marginTop: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              padding: "18px 60px",
              backgroundColor: WHITE,
              borderRadius: "40px",
              fontFamily: fontChakraPetch,
              fontWeight: 800,
              fontSize: `${22 * fs}px`,
              color: "#001060",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              boxShadow: `0 0 30px rgba(255,255,255,0.3), 0 8px 25px rgba(0,0,0,0.3)`,
            }}
          >
            » {ctaText} «
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
