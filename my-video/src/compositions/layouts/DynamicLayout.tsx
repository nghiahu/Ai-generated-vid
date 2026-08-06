import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { parseSceneToComponents, adaptiveLayoutEngine } from "../../utils/layoutResolver";
import { 
  TitleBlock, 
  TerminalBlock, 
  HeroMetricBlock, 
  FeatureCardBlock, 
  BadgeRowBlock,
  SubheaderBlock,
  LogoRowBlock,
  CTAButtonBlock
} from "../../components/layout/UIBlocks";
import { AnimatedBlock } from "../../components/layout/AnimatedBlock";
import { getLayoutById } from "./index";
import { getVDETokens } from "../../styles/vdeTokens";
import { AICodeLayout } from "./modes/AICodeLayout";
import { CircuitBoardBg } from "../../components/CircuitBoardBg";

const hexToRgb = (hex: string): string => {
  let cleaned = hex.trim();
  if (cleaned.includes("gradient")) {
    const match = cleaned.match(/#[0-9A-Fa-f]{3,6}/);
    if (match) {
      cleaned = match[0];
    }
  }
  const c = cleaned.replace("#", "");
  if (c.length === 3) {
    const r = parseInt(c[0] + c[0], 16);
    const g = parseInt(c[1] + c[1], 16);
    const b = parseInt(c[2] + c[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (c.length === 6) {
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return "6, 8, 19";
};

export interface DynamicLayoutProps {
  layoutType: string;
  heading: string;
  points: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  imageUrl: string;
  accentColor?: string;
  theme?: string;
  visualStyle?: string;
  voiceover?: string;
  layoutData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  themeMetadata?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  category?: string;
  highlightWords?: string[];
  config?: any;
  bgImageUrl?: string;
  disableBackground?: boolean;
}

export const DynamicLayout: React.FC<DynamicLayoutProps> = ({
  layoutType,
  heading,
  points,
  imageUrl,
  accentColor = "#FFB7C5",
  theme: defaultTheme = "glassmorphism",
  visualStyle,
  voiceover,
  layoutData,
  themeMetadata,
  category,
  highlightWords,
  config,
  bgImageUrl,
  disableBackground = false
}) => {
  const theme = visualStyle || defaultTheme;
  const frame = useCurrentFrame();
  const imageScale = interpolate(frame, [0, 250], [1.0, 1.08], { extrapolateRight: "clamp" });

  // 1. Generate & resolve components constraints using V2 Adaptive Engine
  const rawComponents = parseSceneToComponents(heading, points, imageUrl, layoutType);
  const { components: resolvedComponents, fontScale, paddingScale, gap } = adaptiveLayoutEngine(rawComponents, 1550);

  // Common background renderer
  const renderBackground = () => {
    const isRikkei = theme === "rikkei";
    const isAiHubGrid = theme === "ai_hub_grid";
    const isFintechEdu = theme === "fintech_edu" || (theme && theme.includes("fintech"));

    // Resolve final background image (scene-specific bgImageUrl or project-wide globalBgImage)
    const globalBgImage = config?.bgImage;
    const finalBgImage = bgImageUrl || globalBgImage;

    // If a background image is resolved, render it!
    if (finalBgImage) {
      return (
        <AbsoluteFill style={{ position: "absolute", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
          <img 
            src={finalBgImage} 
            style={{ 
              position: "absolute",
              inset: 0,
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              opacity: 1.0
            }} 
            alt="Video Background"
          />
        </AbsoluteFill>
      );
    }


    // Default generated background when NO user image is uploaded
    if (isFintechEdu) {
      return (
        <AbsoluteFill style={{ position: "absolute", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
          <CircuitBoardBg glowColor="#00d4ff" circuitOpacity={0.25} />
        </AbsoluteFill>
      );
    }

    if (isRikkei) {
      return (
        <AbsoluteFill style={{ position: "absolute", inset: 0, zIndex: -1, backgroundColor: "#ffffff" }} />
      );
    }

    const bgImgUrl = imageUrl || (isAiHubGrid ? "/ai_hub_grid_bg.png" : "");
    if (!bgImgUrl) return null;

    const tokens = getVDETokens(theme);
    const bgColor = tokens.colors?.background || "#090d1a";
    const isLight = theme === "claude" || theme === "light" || theme === "anime" || theme === "rikkei";
    
    // Detect if layout is designed to show full-screen background image
    const isFullImageBg = layoutType.toLowerCase().includes("fullimage") || 
                          layoutType.toLowerCase().includes("imagebackground") ||
                          layoutType.toLowerCase().includes("backgrounddefault") ||
                          layoutType.toLowerCase().includes("backgroundbadge") ||
                          layoutType.toLowerCase().includes("backgroundglobe") ||
                          layoutType.toLowerCase().includes("backgroundposter") ||
                          layoutType.toLowerCase().includes("blank");

    // Choose gradient matching VDE background color
    const rgbStr = hexToRgb(bgColor);
    const overlayGradient = isFullImageBg
      ? "linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.72) 100%)"
      : isLight
        ? `linear-gradient(to bottom, rgba(${rgbStr}, 0.2) 0%, rgba(${rgbStr}, 0.6) 100%)`
        : "linear-gradient(to bottom, rgba(6, 8, 19, 0.35) 0%, rgba(6, 8, 19, 0.75) 100%)";
        
    const imageOpacity = isRikkei
      ? 0.95
      : isFullImageBg
        ? 1.0
        : isLight ? 0.45 : 0.4;
      
    const imageFilter = isRikkei
      ? "none"
      : isFullImageBg
        ? "grayscale(10%)"
        : "grayscale(10%) blur(2px)";

    return (
      <AbsoluteFill style={{ position: "absolute", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
        {/* Blurred duplicate backdrop to cover screen gaps for non-9:16 images */}
        <img 
          src={bgImgUrl} 
          style={{ 
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            opacity: 1.0, 
            filter: "blur(45px) brightness(0.9)",
            transform: "scale(1.2)"
          }} 
          alt="Blurred Backdrop Background"
        />

        {/* Sharp foreground image centered and fit perfectly */}
        <img 
          src={bgImgUrl} 
          style={{ 
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            opacity: imageOpacity, 
            filter: imageFilter,
            transform: isRikkei ? "none" : `scale(${imageScale})` 
          }} 
          alt="Scene Background"
        />
        {layoutType.toLowerCase() !== "blank" && !isRikkei && (
          <AbsoluteFill style={{ 
            background: overlayGradient, 
            zIndex: 1,
            mixBlendMode: isFullImageBg ? undefined : (isLight ? "multiply" : "normal")
          }} />
        )}
      </AbsoluteFill>
    );
  };

  // Render custom HTML layout from SPE if available
  if (layoutType === "custom-html" || layoutData?.type === "custom-html" || layoutData?.processedHtml) {
    return (
      <AICodeLayout
        customHtml={layoutData?.processedHtml || layoutData?.customHtml || ""}
        renderBackground={renderBackground}
        themeMetadata={themeMetadata}
      />
    );
  }

  // Track feature cards to identify primary vs secondary
  let featureCardCount = 0;

  // Common atomic component renderer with animations and delays
  const renderComponent = (comp: any, overrides = {}) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const animation = comp.data.animation || "slide-up";
    const delay = typeof comp.data.delay === "number" ? comp.data.delay : 0;

    let content = null;
    switch (comp.type) {
      case "title":
        content = <TitleBlock text={comp.data.text} theme={theme} accentColor={accentColor} highlightWords={highlightWords} />;
        break;
      case "terminal":
        content = <TerminalBlock code={comp.data.code} theme={theme} accentColor={accentColor} />;
        break;
      case "hero_metric":
        content = <HeroMetricBlock value={comp.data.value} subtext={comp.data.subtext} theme={theme} accentColor={accentColor} />;
        break;
      case "feature_card":
        const isPrimaryCard = featureCardCount === 0;
        featureCardCount++;
        content = (
          <FeatureCardBlock 
            text={comp.data.text} 
            theme={theme} 
            accentColor={accentColor} 
            isPrimary={isPrimaryCard} 
            {...overrides} 
          />
        );
        break;
      case "badge_row":
        content = <BadgeRowBlock badges={comp.data.badges} theme={theme} accentColor={accentColor} />;
        break;
      case "subheader":
        content = <SubheaderBlock text={comp.data.text} theme={theme} accentColor={accentColor} />;
        break;
      case "logo_row":
        content = <LogoRowBlock logos={comp.data.logos} theme={theme} accentColor={accentColor} />;
        break;
      case "button":
        content = <CTAButtonBlock text={comp.data.text} theme={theme} accentColor={accentColor} />;
        break;
      default:
        break;
    }

    if (!content) return null;

    return (
      <AnimatedBlock key={comp.id} animation={animation} delaySeconds={delay}>
        {content}
      </AnimatedBlock>
    );
  };

  const layoutProps = {
    resolvedComponents,
    accentColor,
    theme: visualStyle || theme,
    imageUrl,
    imageScale,
    renderComponent,
    renderBackground: disableBackground ? () => null : renderBackground,
    visualStyle,
    fontScale,
    paddingScale,
    gap,
    voiceover,
    category,
    highlightWords
  };

  // Lookup and render from registry
  const layoutMeta = getLayoutById(layoutType);
  const LayoutComponent = layoutMeta.component;

  return <LayoutComponent {...layoutProps} />;
};
