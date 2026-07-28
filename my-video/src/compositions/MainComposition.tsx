import React from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig, useCurrentFrame, staticFile } from "remotion";
import * as Remotion from "remotion";
import * as LucideIcons from "lucide-react";
import { DynamicLayout } from "./layouts/DynamicLayout";
import { getLayoutById, LAYOUT_REGISTRY } from "./layouts";
import { selectBestLayout } from "../utils/layoutScorer";
import { SakuraOverlay } from "../components/overlays/SakuraOverlay";
import { TechParticlesOverlay } from "../components/overlays/TechParticlesOverlay";
import { DefaultBokehOverlay } from "../components/overlays/DefaultBokehOverlay";
import { AIHubGridOverlay } from "../components/overlays/AIHubGridOverlay";
import { DynamicSubtitle, SubtitleWord } from "../components/DynamicSubtitle";
import { EmberSparksOverlay } from "../components/overlays/EmberSparksOverlay";
import { LightLeaksOverlay } from "../components/overlays/LightLeaksOverlay";
import { fontOutfit } from "../styles/fonts";
import { getVDETokens, registerCompiledTokens } from "../styles/vdeTokens";

// Safe Proxy for Lucide Icons
const SafeLucideIcons = new Proxy(LucideIcons as any, {
  get: (target, prop) => {
    if (typeof prop === "symbol" || prop === "then" || prop === "__esModule" || prop === "default") {
      return target[prop];
    }
    if (prop in target && target[prop]) {
      return target[prop];
    }
    const SafeFallbackIcon = (props: any) => {
      const FallbackComp = target.Sparkles || target.Zap || (() => null);
      return React.createElement(FallbackComp, props);
    };
    return SafeFallbackIcon;
  }
});

// Dynamically evaluates compiled JS code strings into live React components during CLI export
function evalAIComponent(compiledJS: string) {
  if (!compiledJS || typeof compiledJS !== "string" || compiledJS.trim() === "") {
    return null;
  }

  try {
    let rewrittenJS = compiledJS;
    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"]react['"];?/gi, (match, imports) => {
      let result = "const React = args.React;";
      if (imports.includes("{")) {
        const named = imports.match(/\{([\s\S]*?)\}/);
        if (named && named[1]) {
          result += `\nconst { ${named[1].replace(/[\r\n]+/g, " ").trim()} } = args.React;`;
        }
      }
      return result;
    });

    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"]remotion['"];?/gi, (match, imports) => {
      if (imports.includes("{")) {
        const named = imports.match(/\{([\s\S]*?)\}/);
        if (named && named[1]) {
          return `const { ${named[1].replace(/[\r\n]+/g, " ").trim()} } = args.Remotion;`;
        }
      }
      return "const Remotion = args.Remotion;";
    });

    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"]lucide-react['"];?/gi, (match, imports) => {
      if (imports.includes("{")) {
        const named = imports.match(/\{([\s\S]*?)\}/);
        if (named && named[1]) {
          return `const { ${named[1].replace(/[\r\n]+/g, " ").trim()} } = args.LucideIcons;`;
        }
      }
      return "const LucideIcons = args.LucideIcons;";
    });

    rewrittenJS = rewrittenJS.replace(/export\s+default\s+([a-zA-Z0-9_$]+);?/gi, "");
    rewrittenJS = rewrittenJS.replace(/export\s+const\s+([a-zA-Z0-9_$]+)/gi, "const $1");

    const fn = new Function("args", `
      ${rewrittenJS}
      return typeof GeneratedScene !== 'undefined' ? GeneratedScene : null;
    `);

    const Comp = fn({ React, Remotion, LucideIcons: SafeLucideIcons });
    return Comp;
  } catch (err: any) {
    console.error("[MainComposition] Error evaluating compiledJS for scene:", err?.message || err);
    return null;
  }
}

// SceneContainer handles dynamic Continuous Dark Ambient Fade transitions for each scene
const SceneContainer: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  disableTransitions?: boolean;
}> = ({ children, durationInFrames, disableTransitions = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const transitionFrames = Math.round(fps * 0.35); // Smooth 0.35s transition duration

  // Default steady state
  let opacity = 1;
  let scale = 1;

  if (!disableTransitions) {
    if (frame < transitionFrames) {
      const t = Math.min(1, Math.max(0, frame / transitionFrames));
      // Cubic Ease-out for smooth UI card entrance
      const progress = 1 - Math.pow(1 - t, 3);
      opacity = progress;
      scale = 0.96 + 0.04 * progress;
    } else if (frame > durationInFrames - transitionFrames) {
      const exitFrame = frame - (durationInFrames - transitionFrames);
      const t = Math.min(1, Math.max(0, exitFrame / transitionFrames));
      // Cubic Ease-in for smooth UI card exit over continuous backdrop
      const progress = Math.pow(t, 2);
      opacity = 1 - progress;
      scale = 1.0 + 0.02 * progress;
    }
  }

  return (
    <div style={{
      width: "100%",
      height: "100%",
      opacity,
      transform: `scale(${scale.toFixed(4)})`,
      willChange: "transform, opacity",
      backfaceVisibility: "hidden",
      transformStyle: "preserve-3d"
    }}>
      {children}
    </div>
  );
};



export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";
  color: string;
}

export interface ProjectConfig {
  voice: string;
  backgroundMusic: string;
  backgroundMusicVolume?: number;
  watermark: WatermarkConfig;
  videoTheme?: string;
  visualStyle?: string;
  theme?: string;
}

export interface SceneData {
  id: string;
  sceneIndex: number;
  duration: number;
  layoutFamily: string;
  visualLayout: string;
  sceneIntent?: any;
  heading: string;
  points: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  voiceover: string;
  voiceoverAudioUrl: string;
  voiceoverDuration?: number;
  mediaList: string[];
  selectedMediaIndex: number;
  placement: string;
  theme?: string;
  accentColor?: string;
  subtitlesJson?: SubtitleWord[];
}

export interface MainCompositionProps {
  scenes?: SceneData[];
  config?: ProjectConfig;
  backendUrl?: string;
}

const defaultBackendUrl = "http://localhost:5000";

export const safeParseFloat = (val: any, fallback = 6.0): number => { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (val === undefined || val === null || val === "") return fallback;
  const normalized = String(val).replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? fallback : parsed;
};

// Calculates exact scene duration in frames based on subtitle timestamps, backend TTS audio duration, and duration seconds
export const getSceneDurationFrames = (scene: any, fps: number = 30): number => {
  if (!scene) return Math.round(6.0 * fps);

  // 1. Check max timestamp from Karaoke subtitles
  let maxSubtitleTime = 0;
  const subJson = scene.subtitlesJson || scene.voiceoverTtsJson;
  if (Array.isArray(subJson) && subJson.length > 0) {
    for (const w of subJson) {
      const endVal = w.end !== undefined ? w.end : (w.endMs ? w.endMs / 1000 : 0);
      if (typeof endVal === "number" && endVal > maxSubtitleTime) {
        maxSubtitleTime = endVal;
      }
    }
  }

  // 2. Read backend durationFrames calculated from TTS WAV file
  const backendFrames = (scene.durationFrames && typeof scene.durationFrames === "number")
    ? Math.round((scene.durationFrames / 30) * fps)
    : 0;

  // 3. Read scene.duration in seconds
  const sec = (scene.duration !== undefined && scene.duration !== null && scene.duration !== "")
    ? safeParseFloat(scene.duration, 0)
    : 0;
  const secFrames = sec > 0 ? Math.round(sec * fps) : 0;

  const subtitleFrames = maxSubtitleTime > 0 ? Math.round(maxSubtitleTime * fps) : 0;

  // Max duration signal across all sources
  const maxSignalFrames = Math.max(backendFrames, secFrames, subtitleFrames);
  const baseFrames = maxSignalFrames > 0 ? maxSignalFrames : Math.round(6.0 * fps);

  // Add 15 frames (0.5s) safety buffer so final word is never cut off
  return baseFrames + 15;
};

export const getThemeBgStyle = (themeName = "glassmorphism") => {
  switch (themeName) {
    case "cyberpunk":
      return { backgroundColor: "#020205" };
    case "minimalist":
      return { backgroundColor: "#fafafa" };
    case "brutalist":
      return { backgroundColor: "#f5f3ef" };
    case "glassmorphism":
    default:
      return { backgroundColor: "#090d1a" };
  }
};

export const getBgmAsset = (bgmName: string) => {
  switch (bgmName) {
    case "Chill Lofi Beats":
      return staticFile("bgm/chill-lofi.mp3");
    case "Tech Ambient":
      return staticFile("bgm/tech-ambient.mp3");
    case "Energy Beats":
      return staticFile("bgm/energy-beats.mp3");
    default:
      return staticFile("bgm/chill-lofi.mp3");
  }
};

export const MainComposition: React.FC<MainCompositionProps> = ({
  scenes = [],
  config,
  backendUrl = defaultBackendUrl,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  registerCompiledTokens((config as any)?.vdeTokens); // eslint-disable-line @typescript-eslint/no-explicit-any

  const scenesDurationFrames = scenes.reduce(
    (sum, scene) => sum + getSceneDurationFrames(scene, fps),
    0
  );

  // Calculate cumulative/total frames for entire video
  const totalDurationFrames = scenesDurationFrames;
  const progressPercent = (frame / Math.max(1, totalDurationFrames)) * 100;

  const mainBgmDurationFrames = totalDurationFrames;

  if (!scenes || scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#000000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#ffffff", fontFamily: fontOutfit }}>
          Loading Storyboard...
        </h1>
      </AbsoluteFill>
    );
  }

  // Prepend backend host if URL is relative
  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${backendUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  };



  // Calculate cumulative frames for each sequence
  let currentFrameOffset = 0;

  const vdeStyle = (config?.visualStyle || config?.videoTheme || config?.theme || "rikkei").toLowerCase();
  const vdeTokens = getVDETokens(vdeStyle);
  const isRikkei = vdeStyle.includes("rikkei") || vdeStyle.includes("academic");
  const isLightTheme = isRikkei || vdeStyle.includes("light") || vdeStyle.includes("claude") || vdeStyle === "minimal";
  const isFintechEdu = vdeStyle.includes("fintech");
  const hasOverlayEffects = !isLightTheme && vdeStyle !== "apple" && !isFintechEdu;
  const bgStyle = {
    background: vdeTokens.colors.background || (isLightTheme ? "linear-gradient(135deg, #FFFFFF 0%, #FFF2F4 50%, #FFE6E9 100%)" : "#030712")
  };

  return (
    <AbsoluteFill style={{ ...bgStyle, overflow: "hidden" }}>
      {/* Permanent Continuous Ambient Background Layer for Dark Themes (Zero Flash) */}
      {!isLightTheme && !isFintechEdu && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 35%, #0f172a 0%, #090d1a 65%, #030712 100%)"
          }} />
        <div style={{
          position: "absolute",
          top: "-180px",
          right: "-180px",
          width: "750px",
          height: "750px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
          filter: "blur(90px)",
          transform: `translateY(${Math.sin(frame * 0.01) * 30}px)`
        }} />
        <div style={{
          position: "absolute",
          bottom: "-180px",
          left: "-180px",
          width: "750px",
          height: "750px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249, 115, 22, 0.16) 0%, transparent 70%)",
          filter: "blur(90px)",
          transform: `translateY(${Math.cos(frame * 0.012) * 30}px)`
        }} />
      </div>
      )}
      {/* Background Music Layer */}
      {config?.backgroundMusic && config?.backgroundMusic !== "None" && (
        <Sequence
          from={0}
          durationInFrames={mainBgmDurationFrames}
        >
          <Audio
            src={getBgmAsset(config.backgroundMusic)}
            volume={config.backgroundMusicVolume ?? 0.025}
            loop
          />
        </Sequence>
      )}
      {/* Render Scenes sequentially */}
      {scenes.map((scene, index) => {
        const sceneDurationFrames = getSceneDurationFrames(scene, fps);
        const startFrame = currentFrameOffset;
        currentFrameOffset += sceneDurationFrames;

        const imageUrl =
          scene.mediaList && scene.mediaList.length > 0 && scene.selectedMediaIndex !== -1
            ? scene.mediaList[scene.selectedMediaIndex || 0]
            : "";

        return (
          <Sequence
            key={scene.id || index}
            from={startFrame}
            durationInFrames={sceneDurationFrames}
            style={{
              width: "100%",
              height: "100%"
            }}
          >
            <SceneContainer durationInFrames={sceneDurationFrames} disableTransitions={scenes.length === 1}>
              {/* Lớp nền nghệ thuật chuẩn */}
              {hasOverlayEffects && <LightLeaksOverlay />}
              {hasOverlayEffects && <EmberSparksOverlay />}

              {/* Overlay Effects Layer */}
              {hasOverlayEffects && scene.theme === "japan" && <SakuraOverlay />}
              {hasOverlayEffects && scene.theme === "tech" && <TechParticlesOverlay />}
              {hasOverlayEffects && (scene.theme === "ai_hub_grid" || vdeStyle === "ai_hub_grid") && <AIHubGridOverlay />}
              {hasOverlayEffects && scene.theme === "default" && <DefaultBokehOverlay />}

              {/* Render component-based dynamic layout resolving constraints */}
              {(() => {
                const layoutId = (() => {
                  if (scene.visualLayout) return scene.visualLayout;
                  if (scene.sceneIntent) {
                    const descriptors = {
                      pointCount: scene.points?.length || 0,
                      headingLength: scene.heading?.length || 0,
                      hasImage: !!imageUrl,
                      hasMetrics: scene.points?.some(p => p && p.type === "metric") || false,
                      hasTerminal: scene.points?.some(p => p && p.type === "terminal") || false,
                    };
                    return selectBestLayout(scene.sceneIntent, descriptors, LAYOUT_REGISTRY);
                  }
                  return "IntroMediaHero";
                })();

                const sceneComp = (scene as any).Component || ((scene as any).compiledJS ? evalAIComponent((scene as any).compiledJS) : null);

                if (sceneComp) {
                  const Comp = sceneComp;
                  return (
                    <>
                      <Comp fps={30} scene={scene} subtitlesJson={scene.subtitlesJson || (scene as any).voiceoverTtsJson} />
                      <DynamicSubtitle
                        voiceover={scene.voiceover}
                        durationSeconds={safeParseFloat(scene.duration)}
                        voiceoverDuration={(scene as any).voiceoverDuration}
                        subtitlesJson={scene.subtitlesJson || (scene as any).voiceoverTtsJson}
                        accentColor={scene.accentColor || "#f97316"}
                        visualStyle={vdeStyle}
                      />
                    </>
                  );
                }

                return (
                  <>
                    <DynamicLayout
                      layoutType={layoutId}
                      heading={scene.heading}
                      category={(scene as any).category}
                      points={scene.points}
                      imageUrl={imageUrl}
                      accentColor={scene.accentColor}
                      theme={config?.videoTheme || config?.theme || "glassmorphism"}
                      visualStyle={config?.visualStyle}
                      voiceover={scene.voiceover}
                      layoutData={(scene as any).layout}
                      themeMetadata={(scene as any).themeMetadata}
                      highlightWords={scene.sceneIntent?.highlightWords}
                    />
                    
                    {/* Synchronized Subtitles */}
                    <DynamicSubtitle
                      voiceover={scene.voiceover}
                      durationSeconds={safeParseFloat(scene.duration)}
                      voiceoverDuration={scene.voiceoverDuration}
                      subtitlesJson={scene.subtitlesJson}
                      accentColor={scene.accentColor}
                      visualStyle={vdeStyle}
                      customSubtitle={getLayoutById(layoutId)?.templateJson?.subtitle}
                    />
                  </>
                );
              })()}
            </SceneContainer>

            {/* Sync TTS Voiceover Audio */}
            {(() => {
              const audioUrl = scene.voiceoverAudioUrl || (scene as any).audioUrl;
              if (!audioUrl) return null;
              return (
                <Audio 
                  key={`${scene.id || index}_${audioUrl}`}
                  src={getFullUrl(audioUrl)} 
                  volume={1.8} 
                />
              );
            })()}
          </Sequence>
        );
      })}

      {/* Watermark Overlay layer (Tĩnh xuyên suốt video) */}
      {(config?.watermark?.enabled !== false) && (config?.watermark?.text || "yupclip.com") && (
        <div
          style={{
            position: "absolute",
            zIndex: 100,
            padding: "10px 20px",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            fontFamily: "Be Vietnam Pro, sans-serif",
            fontWeight: "700",
            fontSize: "15px",
            letterSpacing: "1px",
            borderRadius: "20px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            opacity: 0.85,
            ...(() => {
              switch (config?.watermark?.position || "top-right") {
                case "top-left":
                  return { top: "35px", left: "35px" };
                case "bottom-left":
                  return { bottom: "160px", left: "35px" };
                case "bottom-right":
                  return { bottom: "160px", right: "35px" };
                case "bottom-center":
                  return { bottom: "160px", left: "50%", transform: "translateX(-50%)" };
                case "top-right":
                default:
                  return { top: "35px", right: "35px" };
              }
            })(),
          }}
        >
          {config?.watermark?.text || "yupclip.com"}
        </div>
      )}

      {/* Bottom Scrubber Progress Bar for AI Hub Grid theme */}
      {config?.visualStyle === "ai_hub_grid" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: `${progressPercent}%`,
            height: "10px",
            backgroundColor: "#3b82f6",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.8)",
            zIndex: 101,
            transition: "width 0.1s linear"
          }}
        />
      )}
    </AbsoluteFill>
  );
};
