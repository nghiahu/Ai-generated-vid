import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export interface SubtitleWord {
  word: string;
  speechStart?: number;
  speechEnd?: number;
  start?: number;
  end?: number;
  displayStart?: number;
  displayEnd?: number;
}

interface Students2K9OverlayProps {
  subtitles?: SubtitleWord[] | any[];
}

export const Students2K9Overlay: React.FC<Students2K9OverlayProps> = ({ subtitles = [] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const currentSeconds = frame / fps;

  // 1. Voice Reactivity: Detect if speech is active at the current frame
  const isSpeechActive = useMemo(() => {
    if (!subtitles || subtitles.length === 0) return true; // Fallback to active if no subtitles
    return subtitles.some((w) => {
      const start = w.speechStart ?? w.start ?? w.displayStart ?? 0;
      const end = w.speechEnd ?? w.end ?? w.displayEnd ?? 0;
      return currentSeconds >= start && currentSeconds <= end;
    });
  }, [subtitles, currentSeconds]);

  // Calculate distance to nearest active speech segment to smooth the amplitude transition
  const distanceToSpeech = useMemo(() => {
    if (!subtitles || subtitles.length === 0) return 0;
    let minDistance = 999;
    subtitles.forEach((w) => {
      const start = w.speechStart ?? w.start ?? w.displayStart ?? 0;
      const end = w.speechEnd ?? w.end ?? w.displayEnd ?? 0;
      if (currentSeconds >= start && currentSeconds <= end) {
        minDistance = 0;
      } else {
        const dist = Math.min(Math.abs(currentSeconds - start), Math.abs(currentSeconds - end));
        if (dist < minDistance) {
          minDistance = dist;
        }
      }
    });
    return minDistance;
  }, [subtitles, currentSeconds]);

  // Voice intensity factor (decays to 0.15 when silent)
  const voiceIntensity = interpolate(distanceToSpeech, [0, 0.25], [1.0, 0.15], {
    extrapolateRight: "clamp",
  });

  // Dynamic scale factor for Circular Sound Ring / Pulsing ambient glow
  const pulseScale = 1.0 + 0.08 * voiceIntensity * (0.9 + 0.1 * Math.sin(frame * 0.2));

  // --- NEON WAVEFORM PATH CALCULATION ---
  // Overlapping sine waves with phase differences
  const width = 1080;
  const segments = 60;
  const maxAmplitude = 35;

  const wavePaths = useMemo(() => {
    // Wave 1: Primary Cyan
    const pts1: string[] = [];
    // Wave 2: Sky Blue
    const pts2: string[] = [];

    const yCenter = 960; // Rendered at Y=960px

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      
      // Wave 1
      const angle1 = (i / segments) * Math.PI * 4.5 + (frame * 0.15);
      const waveMod1 = 0.75 + 0.25 * Math.sin(frame * 0.06 + i * 0.15);
      const y1 = yCenter + Math.sin(angle1) * maxAmplitude * voiceIntensity * waveMod1;
      pts1.push(`${x},${y1}`);

      // Wave 2 (phase shifted, slightly slower)
      const angle2 = (i / segments) * Math.PI * 3.8 - (frame * 0.12) + 1.2;
      const waveMod2 = 0.70 + 0.30 * Math.cos(frame * 0.05 - i * 0.1);
      const y2 = yCenter + Math.cos(angle2) * (maxAmplitude * 0.8) * voiceIntensity * waveMod2;
      pts2.push(`${x},${y2}`);
    }

    return {
      path1: `M ${pts1.join(" L ")}`,
      path2: `M ${pts2.join(" L ")}`,
    };
  }, [frame, voiceIntensity]);

  // --- EQUALIZER BARS ---
  const barCount = 18;
  const barWidth = 8;
  const barGap = 6;
  const equalizerBars = useMemo(() => {
    const barsList = [];
    for (let i = 0; i < barCount; i++) {
      // Create a deterministic pseudo-random height modulated by voiceIntensity
      const sineVal = Math.sin(frame * 0.2 + i * 0.75) * 0.4 + Math.cos(frame * 0.09 - i * 0.4) * 0.6;
      const normVal = (sineVal + 1) / 2; // 0.0 to 1.0
      // Height ranges from 6px (idle) to 75px (active peak)
      const barHeight = Math.max(6, normVal * 65 * voiceIntensity + 4);
      barsList.push(barHeight);
    }
    return barsList;
  }, [frame, voiceIntensity]);

  // --- PROGRESS BAR PROGRESS ---
  const progressPercent = (frame / Math.max(1, durationInFrames)) * 100;

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {/* 1. Base Grid Layer: Dot Grid with 8% opacity */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(56, 189, 248, 0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 100%)",
        }}
      />

      {/* 2. Circular Sound Ring / Ambient Pulse (Scale maps with voice) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          transform: `translate(-50%, -50%) scale(${pulseScale.toFixed(4)})`,
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 242, 254, 0.06) 0%, rgba(56, 189, 248, 0.02) 50%, transparent 70%)",
          filter: "blur(40px)",
          willChange: "transform",
        }}
      />

      {/* 3. Neon Waveforms (Y: 960px) */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "1080px",
          height: "1920px",
          overflow: "visible",
        }}
      >
        {/* Wave 2 (Background - Sky Blue) */}
        <path
          d={wavePaths.path2}
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2"
          opacity={0.45 * voiceIntensity}
        />
        {/* Wave 1 (Foreground Glowing Cyan) */}
        <path
          d={wavePaths.path1}
          fill="none"
          stroke="#00F2FE"
          strokeWidth="3.5"
          opacity={0.8 * voiceIntensity}
          filter="drop-shadow(0 0 8px rgba(0, 242, 254, 0.65))"
        />
      </svg>

      {/* 4. Frequency Equalizer Bars (Y: 1060px) */}
      <div
        style={{
          position: "absolute",
          top: "1060px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: `${barGap}px`,
          height: "80px",
          width: "350px",
        }}
      >
        {equalizerBars.map((h, i) => (
          <div
            key={i}
            style={{
              width: `${barWidth}px`,
              height: `${h}px`,
              borderRadius: "4px",
              background: "linear-gradient(to top, #38BDF8 0%, #FACC15 100%)",
              opacity: 0.85,
              transition: "height 0.04s linear",
              boxShadow: "0 0 4px rgba(56, 189, 248, 0.2)",
            }}
          />
        ))}
      </div>

      {/* 5. Data Progress Visualizer (Y: 1240px) */}
      <div
        style={{
          position: "absolute",
          top: "1240px",
          left: "10%",
          width: "80%",
          height: "6px",
          borderRadius: "3px",
          backgroundColor: "rgba(30, 41, 59, 0.5)",
          border: "1px solid rgba(51, 65, 85, 0.3)",
          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Active Progress Track */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progressPercent}%`,
            borderRadius: "3px",
            background: "linear-gradient(90deg, #00F2FE 0%, #38BDF8 100%)",
            boxShadow: "0 0 6px rgba(0, 242, 254, 0.5)",
          }}
        />
        {/* Glowing Head Bead */}
        <div
          style={{
            position: "absolute",
            left: `calc(${progressPercent}% - 6px)`,
            top: "-3px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#00F2FE",
            boxShadow: "0 0 10px #00F2FE, 0 0 20px #00F2FE",
            border: "1.5px solid #FFFFFF",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
