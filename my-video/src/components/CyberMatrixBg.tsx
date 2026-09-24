import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface CyberMatrixBgProps {
  /** Primary glow color, defaults to #00F0FF (electric cyan) */
  glowColor?: string;
  /** Accent color, defaults to #00F5D4 */
  accentColor?: string;
  /** Overall opacity of binary streams, 0–1, defaults to 0.8 */
  streamOpacity?: number;
}

interface BinaryColumn {
  id: number;
  leftPercent: number;
  speed: number;
  fontSize: number;
  opacity: number;
  length: number;
  seed: number;
}

/**
 * CyberMatrixBg — Component nền động cho theme cyber_security.
 * Bao gồm:
 * 1. Deep Cyber Dark gradient base (#020B14 -> #031824)
 * 2. Lưới tọa độ perspective 3D
 * 3. Các cột số nhị phân 1010101 tuôn chảy (Matrix falling stream) với ký tự đầu phát sáng và đuôi mờ dần
 * 4. Bệ phóng ánh sáng Holographic Podium ở đáy sàn với các chùm tia sáng thẳng đứng
 */
export const CyberMatrixBg: React.FC<CyberMatrixBgProps> = ({
  glowColor = "#00b0ea",
  accentColor = "#66efff",
  streamOpacity = 0.85,
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  // Pulse animation cho holographic podium (chu kỳ 3s)
  const pulse = Math.sin((frame / fps) * Math.PI) * 0.2 + 0.8;
  const beamFlicker = 0.85 + Math.sin(frame * 0.15) * 0.15;

  // Cấu hình các cột ma trận số nhị phân:
  // Mật độ cao ở 2 bên cánh (2% -> 24% và 76% -> 98%), mật độ thưa & mờ ở giữa
  const columns = useMemo<BinaryColumn[]>(() => {
    const cols: BinaryColumn[] = [
      // Cánh trái (Server rack / data stream)
      { id: 1, leftPercent: 3, speed: 7, fontSize: 20, opacity: 0.85, length: 24, seed: 11 },
      { id: 2, leftPercent: 7, speed: 11, fontSize: 18, opacity: 0.7, length: 28, seed: 23 },
      { id: 3, leftPercent: 12, speed: 6, fontSize: 22, opacity: 0.9, length: 22, seed: 37 },
      { id: 4, leftPercent: 17, speed: 9, fontSize: 19, opacity: 0.75, length: 26, seed: 49 },
      { id: 5, leftPercent: 22, speed: 5, fontSize: 17, opacity: 0.5, length: 20, seed: 53 },

      // Trung tâm (rất mờ để không cản trở chữ trên thẻ nội dung)
      { id: 6, leftPercent: 32, speed: 4, fontSize: 16, opacity: 0.2, length: 18, seed: 67 },
      { id: 7, leftPercent: 48, speed: 5, fontSize: 16, opacity: 0.15, length: 16, seed: 79 },
      { id: 8, leftPercent: 64, speed: 4, fontSize: 16, opacity: 0.2, length: 18, seed: 89 },

      // Cánh phải (Server rack / data stream)
      { id: 9, leftPercent: 77, speed: 6, fontSize: 18, opacity: 0.55, length: 22, seed: 101 },
      { id: 10, leftPercent: 82, speed: 9, fontSize: 21, opacity: 0.8, length: 26, seed: 113 },
      { id: 11, leftPercent: 87, speed: 7, fontSize: 19, opacity: 0.75, length: 25, seed: 127 },
      { id: 12, leftPercent: 92, speed: 12, fontSize: 18, opacity: 0.85, length: 28, seed: 139 },
      { id: 13, leftPercent: 96, speed: 8, fontSize: 22, opacity: 0.9, length: 24, seed: 151 },
    ];
    return cols;
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        backgroundColor: "#020B14",
      }}
    >
      {/* Layer 1: Deep Cyber Dark Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #01080F 0%, #02121D 40%, #031E2B 75%, #010C14 100%)",
        }}
      />

      {/* Layer 2: 3D Perspective Grid Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 85%)",
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: Dynamic Falling Binary Streams (1010101) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: streamOpacity,
          pointerEvents: "none",
          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
        }}
      >
        {columns.map((col) => {
          const charHeight = col.fontSize * 1.35;
          const totalStreamHeight = col.length * charHeight;
          const cycleHeight = height + totalStreamHeight;
          
          // Vị trí Y di chuyển từ trên xuống dưới theo frame
          const currentY = ((frame * col.speed + col.seed * 37) % cycleHeight) - totalStreamHeight;

          return (
            <div
              key={col.id}
              style={{
                position: "absolute",
                left: `${col.leftPercent}%`,
                top: 0,
                transform: `translateY(${currentY}px)`,
                fontSize: `${col.fontSize}px`,
                lineHeight: `${charHeight}px`,
                textAlign: "center",
                opacity: col.opacity,
                letterSpacing: "2px",
                fontWeight: 700,
                userSelect: "none",
              }}
            >
              {Array.from({ length: col.length }).map((_, charIdx) => {
                // Tạo số 0 hoặc 1, đôi lúc nhấp nháy chuyển trạng thái
                const isOne =
                  Math.sin(frame * 0.2 + col.seed + charIdx * 17) > 0.1;
                const char = isOne ? "1" : "0";

                // Ký tự cuối cùng của chuỗi là đầu rơi (Lead character) phát sáng mạnh nhất
                const isHead = charIdx === col.length - 1;
                const isNearHead = charIdx >= col.length - 3;
                const fadeFactor = (charIdx + 1) / col.length; // 0 -> 1 từ đuôi lên đầu

                let charColor = `rgba(0, 240, 255, ${Math.max(0.12, fadeFactor * 0.75)})`;
                let charShadow = "none";

                if (isHead) {
                  charColor = "#FFFFFF";
                  charShadow = `0 0 12px ${glowColor}, 0 0 24px ${accentColor}`;
                } else if (isNearHead) {
                  charColor = accentColor;
                  charShadow = `0 0 8px ${glowColor}`;
                }

                return (
                  <div
                    key={charIdx}
                    style={{
                      color: charColor,
                      textShadow: charShadow,
                      transition: "color 0.1s ease",
                    }}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Layer 4: Holographic Light Beams from Bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "550px",
          height: "500px",
          background: `radial-gradient(ellipse at 50% 100%, rgba(0, 240, 255, ${0.28 * beamFlicker}) 0%, rgba(0, 245, 212, ${0.12 * beamFlicker}) 40%, transparent 80%)`,
          filter: "blur(25px)",
          pointerEvents: "none",
        }}
      />

      {/* Layer 5: Concentric Holographic Podium at the bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "35px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "650px",
          height: "170px",
          pointerEvents: "none",
        }}
      >
        {/* Vòng ngoài lớn */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `2px solid rgba(0, 240, 255, ${0.65 * pulse})`,
            boxShadow: `0 0 35px rgba(0, 240, 255, ${0.45 * pulse}), inset 0 0 25px rgba(0, 245, 212, ${0.3 * pulse})`,
            background: "radial-gradient(ellipse at center, rgba(0, 240, 255, 0.12) 0%, transparent 75%)",
          }}
        />

        {/* Vòng giữa */}
        <div
          style={{
            position: "absolute",
            top: "22px",
            bottom: "22px",
            left: "55px",
            right: "55px",
            borderRadius: "50%",
            border: `1.5px solid rgba(0, 245, 212, ${0.85 * pulse})`,
            boxShadow: `0 0 20px rgba(0, 245, 212, ${0.5 * pulse})`,
          }}
        />

        {/* Vòng tâm lõi sáng */}
        <div
          style={{
            position: "absolute",
            top: "44px",
            bottom: "44px",
            left: "140px",
            right: "140px",
            borderRadius: "50%",
            border: `2px solid #FFFFFF`,
            boxShadow: `0 0 25px #00F0FF, 0 0 50px ${accentColor}`,
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(0, 240, 255, 0.25) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Layer 6: Ambient Corner Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 110% 100% at 50% 50%, transparent 45%, rgba(1, 8, 15, 0.75) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
