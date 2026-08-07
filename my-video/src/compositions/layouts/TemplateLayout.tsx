import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { LayoutProps } from "./LayoutTypes";
import { getThemeStyles } from "../../styles/themes";
import { CategoryPill, HeadlineText, AccentDivider } from "../../components/atoms/VideoAtoms";
import { resolvePositions } from "../../utils/areaResolver";

// Import modular mode renderers
import { AbsoluteCardsMode } from "./modes/AbsoluteCardsMode";
import { SplitHorizontalMode } from "./modes/SplitHorizontalMode";
import { BeforeAfterPanelMode } from "./modes/BeforeAfterPanelMode";
import { VerticalListMode } from "./modes/VerticalListMode";
import { GridMetricsMode } from "./modes/GridMetricsMode";
import { BroadcastLowerThirdMode } from "./modes/BroadcastLowerThirdMode";
import { CandlestickBreakoutMode } from "./modes/CandlestickBreakoutMode";
import { CaseStudyEditorialMode } from "./modes/CaseStudyEditorialMode";
import { DossierNotesMode } from "./modes/DossierNotesMode";
import { EarningsSnapshotMode } from "./modes/EarningsSnapshotMode";
import { EvidenceBoardMode } from "./modes/EvidenceBoardMode";
import { FearGreedMode } from "./modes/FearGreedMode";
import { FeedScrollMode } from "./modes/FeedScrollMode";
import { FlowchartMode } from "./modes/FlowchartMode";
import { IntroBriefingCardMode } from "./modes/IntroBriefingCardMode";
import { BubbleMode } from "./modes/BubbleMode";
import { OrbitalBubblesMode } from "./modes/OrbitalBubblesMode";
import { VennSpheresMode } from "./modes/VennSpheresMode";
import { ChapterStackMode } from "./modes/ChapterStackMode";
import { IntroCutoutHeadlineMode } from "./modes/IntroCutoutHeadlineMode";
import { IntroEvidenceReadlineMode } from "./modes/IntroEvidenceReadlineMode";
import { IntroEvidenceScanlineMode } from "./modes/IntroEvidenceScanlineMode";
import { IntroEvidenceTimelineMode } from "./modes/IntroEvidenceTimelineMode";
import { IntroFullImageMode } from "./modes/IntroFullImageMode";
import { IntroSplitHeadlineMode } from "./modes/IntroSplitHeadlineMode";
import { CenteredTextMode } from "./modes/CenteredTextMode";
import { PullquoteMode } from "./modes/PullquoteMode";
import { VignelliQuoteMode } from "./modes/VignelliQuoteMode";
import { IntroMediaHeroMode } from "./modes/IntroMediaHeroMode";
import { MediaShowcaseCardMode } from "./modes/MediaShowcaseCardMode";
import { FintechEduMode } from "./modes/FintechEduMode";
import { IntroRadarSignalMode } from "./modes/IntroRadarSignalMode";
import { IntroSignalStepsMode } from "./modes/IntroSignalStepsMode";
import { IntroMapPinsMode } from "./modes/IntroMapPinsMode";
import { OpsMonitorMode } from "./modes/OpsMonitorMode";
import { TimelineShiftMode } from "./modes/TimelineShiftMode";
import { CircularProgressMode } from "./modes/CircularProgressMode";
import { MetricShowcaseHookMode } from "./modes/MetricShowcaseHookMode";
import { MetricFocusShowcaseMode } from "./modes/MetricFocusShowcaseMode";
import { WebMockupHeroMode } from "./modes/WebMockupHeroMode";
import { NumberedAgentPanelMode } from "./modes/NumberedAgentPanelMode";


export interface TemplateLayoutProps extends LayoutProps {
  templateJson: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const hexToRgb = (hex: string): string => {
  const c = hex.replace("#", "");
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
  return "239, 68, 68";
};

export const TemplateLayout: React.FC<TemplateLayoutProps> = ({
  resolvedComponents,
  accentColor,
  theme,
  renderBackground,
  visualStyle,
  templateJson,
  fontScale = 1.0,
  paddingScale = 1.0,
  gap,
  voiceover,
  category,
  imageUrl,
  highlightWords
}) => {
  const resolvedTheme = visualStyle || theme;
  const styles = getThemeStyles(resolvedTheme, accentColor);
  const t = templateJson;
  const rgb = hexToRgb(accentColor);

  const { width, height } = useVideoConfig();
  const isVertical = width < height;
  const resolvedPositions = resolvePositions(t.positions || [], width, height, isVertical, t.id);

  const isLight = resolvedTheme === "claude" || resolvedTheme === "light" || resolvedTheme === "anime" || resolvedTheme === "rikkei";

  // Calculate a darker version of the accent color dynamically (75% for light themes, 45% for dark themes)
  const darkAccentColor = (() => {
    const factor = isLight ? 0.75 : 0.45;
    return `rgb(${rgb.split(',').map(n => Math.max(0, Math.floor(parseInt(n) * factor))).join(',')})`;
  })();

  // Dynamic contrast check for accent color
  const getLuminance = (r: number, g: number, b: number): number => {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };
  const isAccentLight = (() => {
    const vals = rgb.split(',').map(n => parseInt(n.trim()));
    return getLuminance(vals[0] || 239, vals[1] || 68, vals[2] || 68) > 180;
  })();

  // Theme dependent values
  const activeCardTextColor = isLight ? (isAccentLight ? "#111111" : "#ffffff") : "#ffffff";
  const activeCardBadgeColor = isLight ? (isAccentLight ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.8)") : "rgba(255, 255, 255, 0.9)";
  const inactiveCardTextColor = isLight ? "#191919" : "#ffffff";

  const cleanCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");

  const titleComp = resolvedComponents.find(c => c.type === "title");
  const otherComps = resolvedComponents.filter(c =>
    c.type !== "title" &&
    (c.data?.text?.trim() !== "" || c.type === "hero_metric" || c.type === "logo_row" || c.type === "badge_row")
  );

  const layoutType = t.id;
  const layoutMode = t.layoutMode || "absolute_cards";
  const isBottomAligned = layoutType.toLowerCase().includes("fullimage") ||
    layoutType.toLowerCase().includes("imagebackground") ||
    (t.container && t.container.align === "bottom");

  // Outer container padding/alignment
  const isCenteredLayout = layoutMode === "centered_text";
  const isFlywheel = t.id === "AIHubGrid1" || t.id === "Flywheel";
  
  const titleText = titleComp?.data?.text || "";

  const calculatedPaddingTop = (() => {
    if (isFlywheel || isCenteredLayout || isBottomAligned) return 0;
    const basePadding = parseInt(String(t.container?.paddingTop || "380"));
    if (!titleText) return basePadding;
    if (titleText.length > 40) return Math.max(100, basePadding - 180);
    if (titleText.length > 25) return Math.max(150, basePadding - 100);
    return basePadding;
  })();

  const calculatedMarginBottom = (() => {
    const baseMargin = parseInt(String(t.title?.marginBottom || "100"));
    if (!titleText) return baseMargin;
    if (titleText.length > 40) return Math.max(30, baseMargin - 60);
    if (titleText.length > 25) return Math.max(40, baseMargin - 40);
    return baseMargin;
  })();

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: isCenteredLayout ? "center" : (isBottomAligned || layoutMode === "metric_showcase_hook" || layoutMode === "metric_focus_showcase" || layoutMode === "web_mockup_hero" ? "flex-start" : "center"),
    padding: isFlywheel ? "0px" : (isCenteredLayout ? "0 64px" : "86px"),
    justifyContent: isCenteredLayout ? "center" : (isBottomAligned ? "flex-end" : "flex-start"),
    paddingTop: isFlywheel 
      ? "0px"
      : (isCenteredLayout
        ? "0px"
        : (isBottomAligned
          ? "0px"
          : (layoutMode === "fintech_edu" || layoutMode === "hust_x_rikkei" || layoutMode === "web_mockup_hero" ? "0px" : `${calculatedPaddingTop}px`))),
    paddingBottom: isFlywheel ? "0px" : (isCenteredLayout ? "0px" : (isBottomAligned ? "480px" : "86px")),
    boxSizing: "border-box",
    position: "relative",
    width: "100%",
    height: "100%"
  };

  const modeProps = {
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
    voiceover,
    category: category || "",
    titleText: titleComp?.data.text || "",
    parentDelay: 0,
    activeCardTextColor,
    activeCardBadgeColor,
    inactiveCardTextColor,
    imageUrl,
    theme: resolvedTheme,
    highlightWords
  };

  const renderLayoutContent = () => {
    switch (layoutMode) {
      case "absolute_cards":
        return <AbsoluteCardsMode {...modeProps} />;
      case "split_horizontal":
        return <SplitHorizontalMode {...modeProps} />;
      case "timeline_shift":
        return <TimelineShiftMode {...modeProps} />;
      case "before_after_panel":
        return <BeforeAfterPanelMode {...modeProps} />;
      case "vertical_list":
      case "horizontal_list":
        return <VerticalListMode {...modeProps} />;
      case "grid_metrics":
        return <GridMetricsMode {...modeProps} />;
      case "broadcast_lower_third":
        return <BroadcastLowerThirdMode {...modeProps} />;
      case "candlestick_breakout":
        return <CandlestickBreakoutMode {...modeProps} />;
      case "case_study_editorial":
        return <CaseStudyEditorialMode {...modeProps} />;
      case "dossier_notes":
        return <DossierNotesMode {...modeProps} />;
      case "earnings_snapshot":
        return <EarningsSnapshotMode {...modeProps} />;
      case "evidence_board":
        return <EvidenceBoardMode {...modeProps} />;
      case "fear_greed":
        return <FearGreedMode {...modeProps} />;
      case "feed_scroll":
        return <FeedScrollMode {...modeProps} />;
      case "flowchart":
        return <FlowchartMode {...modeProps} />;
      case "intro_briefing_card":
        return <IntroBriefingCardMode {...modeProps} />;
      case "bubble":
        return <BubbleMode {...modeProps} />;
      case "orbital_bubbles":
        return <OrbitalBubblesMode {...modeProps} />;
      case "venn_spheres":
        return <VennSpheresMode {...modeProps} />;
      case "chapter_stack":
        return <ChapterStackMode {...modeProps} />;
      case "cutout_headline":
        return <IntroCutoutHeadlineMode {...modeProps} />;
      case "evidence_readline":
        return <IntroEvidenceReadlineMode {...modeProps} />;
      case "evidence_scanline":
        return <IntroEvidenceScanlineMode {...modeProps} />;
      case "evidence_timeline":
        return <IntroEvidenceTimelineMode {...modeProps} />;
      case "intro_full_image":
        return <IntroFullImageMode {...modeProps} />;
      case "split_headline":
        return <IntroSplitHeadlineMode {...modeProps} />;
      case "intro_radar_signal":
        return <IntroRadarSignalMode {...modeProps} />;
      case "intro_signal_steps":
        return <IntroSignalStepsMode {...modeProps} />;
      case "intro_map_pins":
        return <IntroMapPinsMode {...modeProps} />;
      case "ops_monitor":
        return <OpsMonitorMode {...modeProps} />;
      case "circular_progress":
        console.log("[TemplateLayout] Rendering circular_progress with props:", modeProps);
        return <CircularProgressMode {...modeProps} />;
      case "pullquote":
        return <PullquoteMode {...modeProps} />;
      case "vignelliquote":
        return <VignelliQuoteMode {...modeProps} />;
      case "intro_media_hero":
        return <IntroMediaHeroMode {...modeProps} />;
      case "media_showcase_card":
        return <MediaShowcaseCardMode {...modeProps} />;
      case "metric_showcase_hook":
        return <MetricShowcaseHookMode {...modeProps} />;
      case "metric_focus_showcase":
        return <MetricFocusShowcaseMode {...modeProps} />;
      case "web_mockup_hero":
        return <WebMockupHeroMode {...modeProps} />;
      case "numbered_agent_panel":
        return <NumberedAgentPanelMode {...modeProps} />;
      case "centered_text":
        return <CenteredTextMode {...modeProps} />;
      case "fintech_edu":
        return <FintechEduMode {...modeProps} />;
      case "blank":
        return null;
      default:
        return <VerticalListMode {...modeProps} />;
    }
  };

  return (
    <AbsoluteFill style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {renderBackground()}

      {/* Contrast overlay — sits between background image and content */}
      {layoutMode !== "blank" && resolvedTheme !== "fintech_edu" && !resolvedTheme?.includes("fintech") && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: isLight
            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.35) 45%, rgba(255, 255, 255, 0.5) 100%)"
            : "linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.25) 45%, rgba(0, 0, 0, 0.45) 100%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />
      )}

      {/* Content layer — carries containerStyle (flex/padding) and sits above overlay via zIndex: 1 */}
      <div style={{ ...containerStyle, position: "relative", zIndex: 1, fontFamily: styles.fontFamily }}>
        {titleComp && layoutMode !== "intro_briefing_card" && layoutMode !== "chapter_stack" && layoutMode !== "cutout_headline" && layoutMode !== "evidence_readline" && layoutMode !== "evidence_scanline" && layoutMode !== "evidence_timeline" && layoutMode !== "intro_full_image" && layoutMode !== "split_headline" && layoutMode !== "centered_text" && layoutMode !== "hust_x_rikkei" && layoutMode !== "fintech_edu" && layoutMode !== "blank" && layoutMode !== "metric_showcase_hook" && layoutMode !== "metric_focus_showcase" && layoutMode !== "web_mockup_hero" && layoutMode !== "numbered_agent_panel" && layoutMode !== "circular_progress" && t.id !== "AIHubGrid2" && t.id !== "AIHubGrid1" && t.id !== "AIHubGrid3" && (
          <div style={{
            marginBottom: `${calculatedMarginBottom}px`,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: isBottomAligned ? "flex-start" : "center",
            width: "100%"
          }}>
            {isBottomAligned && cleanCategory && (
              <div style={{ marginBottom: "16px", zIndex: 10 }}>
                <CategoryPill
                  text={cleanCategory}
                  bgRgba={t.categoryPill?.bgRgba || `rgba(2, 6, 23, 0.72)`}
                  borderRgba={t.categoryPill?.borderRgba || `rgba(${rgb}, 0.4)`}
                  textRgba={t.categoryPill?.textRgba || accentColor}
                  fontFamily={styles.fontFamily}
                />
              </div>
            )}
            <HeadlineText
              text={titleComp.data.text}
              fontSize={t.title.fontSize}
              fontWeight={t.title.fontWeight || "800"}
              letterSpacing={t.title.letterSpacing}
              textShadow={t.title.textShadow || (t.title.useAccentTextShadow ? `rgba(0, 0, 0, 0.25) 0px 10px 30px` : undefined)}
              colorRgba={styles.titleStyle.color || (isLight ? "#1F2937" : "#ffffff")}
              align={isBottomAligned ? "left" : "center"}
              fontFamily={styles.fontFamily}
              maxWidth={isBottomAligned ? "760px" : undefined}
              theme={resolvedTheme}
              accentColor={accentColor}
              lineHeight={resolvedTheme === "ai_hub_grid" ? 1.5 : 1.32}
              highlightWords={highlightWords}
            />
            {isBottomAligned && t.accentDivider && (
              <div style={{ marginTop: "12px", zIndex: 10 }}>
                <AccentDivider
                  gradient={t.accentDivider.gradient}
                  width={t.accentDivider.width}
                  height={t.accentDivider.height}
                  glowRgba={t.accentDivider.glowRgba}
                />
              </div>
            )}
          </div>
        )}

        {renderLayoutContent()}
      </div>
    </AbsoluteFill>
  );
};
