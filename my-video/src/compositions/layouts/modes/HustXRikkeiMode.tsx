import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, Audio, staticFile } from "remotion";
import { ModeRendererProps } from "./LayoutModeTypes";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { fontMontserrat, fontChakraPetch } from "../../../styles/fonts";

export const HustXRikkeiMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  titleText,
  category,
  imageUrl
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Extract texts
  const searchBarText = otherComps[0]?.data?.text || "Trường Điện - Điện Tử, Đại học Bách Khoa x Rikkeisoft";
  const rawPointsList = otherComps.slice(1);

  // Default 4 checklist points – ** marks which words are bold in each row
  const DEFAULT_POINTS = [
    { data: { text: "Lộ trình tỷ lệ vàng: **\"40% lý thuyết, 60% thực hành\"**" } },
    { data: { text: "Cam kết **kết nối với doanh nghiệp lớn** trong và ngoài nước" } },
    { data: { text: "**Chứng nhận độc quyền**: từ Trường Điện - Điện tử (HUST)" } },
    { data: { text: "Thiết kế lộ trình **cá nhân hoá** từng học viên" } },
  ];
  const pointsList = rawPointsList.length > 0 ? rawPointsList : DEFAULT_POINTS;

  // Typing calculations: start at 0.45s, speed 1.5 frames per character
  const startFrame = Math.round(0.45 * fps);
  const typingSpeed = 1.5;
  const charsToShow = Math.max(0, Math.floor((frame - startFrame) / typingSpeed));
  const visibleText = searchBarText.slice(0, charsToShow);
  const showCursor = charsToShow > 0 && charsToShow < searchBarText.length && Math.floor(frame / 6) % 2 === 0;
  const typedSearchText = visibleText + (showCursor ? "|" : "");

  // Helper: parse **bold** inline markers into React nodes
  const renderInlineBold = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={i} style={{ fontWeight: "900" }}>
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  const displayCategory = category && category.trim() !== "" ? category : "Chương trình đào tạo";
  const displayTitle = titleText && titleText.trim() !== "" ? titleText : "LẬP TRÌNH NHÚNG ĐỘC QUYỀN";

  const formattedTitle = (() => {
    const upperTitle = displayTitle.toUpperCase().trim();
    if (upperTitle === "LẬP TRÌNH NHÚNG ĐỘC QUYỀN") {
      return <>LẬP TRÌNH NHÚNG<br />ĐỘC QUYỀN</>;
    }
    if (upperTitle === "LẬP TRÌNH NHÚNG CHUẨN CÔNG NGHIỆP") {
      return <>LẬP TRÌNH NHÚNG CHUẨN<br />CÔNG NGHIỆP</>;
    }
    return displayTitle;
  })();

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#b91c1c", pointerEvents: "none" }}>
      {/* 1. Blank background template aligned to fill 100% width and height */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0
      }}>
        <img
          src={staticFile("hust_x_rikkei_bg.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt="HUST X RIKKEI Background"
        />
      </div>

      {/* 2. Text Content Layer overlaying the pre-baked template inside the same coordinate system */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
        {/* A. Category Pill Badge */}
        {displayCategory && (
          <AnimatedBlock 
            animation="scale-in" 
            delaySeconds={0.15}
            style={{
              position: "absolute",
              top: "180px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "auto"
            }}
          >
            <div style={{
              background: "linear-gradient(90deg, rgba(185, 28, 28, 0) 0%, rgba(185, 28, 28, 0.95) 20%, rgba(185, 28, 28, 0.95) 80%, rgba(185, 28, 28, 0) 100%)",
              border: "none",
              borderRadius: "0px",
              padding: "10px 40px",
              fontSize: "26px",
              fontWeight: "900",
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: "none",
              textAlign: "center",
              fontFamily: fontMontserrat
            }}>
              {displayCategory}
            </div>
          </AnimatedBlock>
        )}

        {/* B. Japanese Quote brackets title */}
        {displayTitle && (
          <AnimatedBlock 
            animation="scale-in" 
            delaySeconds={0.3}
            style={{
              position: "absolute",
              top: "260px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <span style={{ fontSize: "86px", fontWeight: "300", color: "#ffffff", lineHeight: 1, marginTop: "-12px", fontFamily: fontChakraPetch }}>「</span>
              <h1 style={{
                fontSize: "88px",
                fontWeight: "900",
                color: "#ffffff",
                margin: 0,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 1.15,
                maxWidth: "900px",
                fontFamily: fontChakraPetch,
                textShadow: "0 4px 12px rgba(0, 0, 0, 0.45)"
              }}>
                {formattedTitle}
              </h1>
              <span style={{ fontSize: "86px", fontWeight: "300", color: "#ffffff", lineHeight: 1, marginTop: "-12px", fontFamily: fontChakraPetch }}>」</span>
            </div>
          </AnimatedBlock>
        )}

        {/* C. Search Bar Text overlay & Typing Sound Sequence */}
        {searchBarText && (
          <>
            <Sequence
              from={startFrame}
              durationInFrames={Math.round(searchBarText.length * typingSpeed)}
            >
              <Audio
                src={staticFile("typewriter.mp3")}
                volume={0.4}
              />
            </Sequence>
            <AnimatedBlock
              animation="fade-in"
              delaySeconds={0.45}
              style={{
                position: "absolute",
                top: "500px",
                left: "175px",
                width: "600px",
                height: "80px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <div style={{
                fontSize: "25px",
                fontWeight: "500",
                color: "#b91c1c", // Red matching the HUST brand color on white input
                fontFamily: fontMontserrat,
                textAlign: "left",
                whiteSpace: "nowrap",
                width: "100%"
              }}>
                "{typedSearchText}"
              </div>
            </AnimatedBlock>
          </>
        )}

        {/* D. Stacked points text next to baked-in checkmarks */}
        {pointsList.map((comp, idx) => {
          const textVal = comp.data?.text || "";
          const colonIndex = textVal.indexOf(":");
          const hasColon = colonIndex !== -1;
          const itemTitle = hasColon ? textVal.substring(0, colonIndex).trim() : textVal;
          const itemDetail = hasColon ? textVal.substring(colonIndex + 1).trim() : "";
          // If no colon: treat whole text as inline with bold markers (no detail line)
          const isInlineOnly = !hasColon;

          // IMPORTANT: These TOP values are Y-centers of the baked-in checkmark circles.
          // AnimatedBlock applies its own transform, so we CANNOT put translateY(-50%)
          // on the AnimatedBlock directly. We use a wrapper div as the absolute anchor.
          const tops = ["813px", "980px", "1148px", "1318px"];
          const currentTop = tops[idx] || `${752 + idx * 111}px`;

          return (
            // Outer wrapper: absolute-positioned anchor at the checkmark's Y-center
            <div
              key={idx}
              style={{
                position: "absolute",
                top: currentTop,
                left: "158px",
                width: "500px",
              }}
            >
              {/* Inner div: shifts up 50% of its own height to vertically center on checkmark */}
              <div style={{ transform: "translateY(-50%)" }}>
                <AnimatedBlock
                  animation="slide-right"
                  delaySeconds={0.7 + idx * 0.25}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {isInlineOnly ? (
                      // Whole line with inline bold/regular markers
                      <span style={{ fontSize: "28px", fontWeight: "400", color: "#ffffff", lineHeight: 1.3, fontFamily: fontMontserrat }}>
                        {renderInlineBold(itemTitle)}
                      </span>
                    ) : (
                      <>
                        {/* Title line – use renderInlineBold so ** markers control bold */}
                        <span style={{ fontSize: "28px", fontWeight: "400", color: "#ffffff", lineHeight: 1.25, fontFamily: fontMontserrat }}>
                          {renderInlineBold(itemTitle)}
                        </span>
                        {/* Detail line – same: ** markers control bold */}
                        <span style={{ fontSize: "28px", fontWeight: "400", color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.3, fontFamily: fontMontserrat }}>
                          {renderInlineBold(itemDetail)}
                        </span>
                      </>
                    )}
                  </div>
                </AnimatedBlock>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
