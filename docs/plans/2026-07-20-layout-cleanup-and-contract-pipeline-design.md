# Design Document: Layout Cleanup & Layout Contract Pipeline

## Overview
This design covers two main phases to eliminate broken/unsuitable AI layout choices and improve content visual quality:
1. **Layout Cleanup**: Completely remove 37 low-quality or redundant opening layouts from both frontend selection (`StoryboardEditor.jsx`) and backend/Remotion template definitions (`my-video/src/compositions/layouts/templates/`).
2. **Layout Contract Pipeline**: Introduce structured Layout Contracts so AI knows the exact target layout, slot constraints (character limits, item counts), and generates precise visual content without overflow.

---

## Part 1: Layout Cleanup Scope

### Layouts to be completely removed (37 layouts):
- `IntroFullImageSplitHeadline` (intro_full_image_split_headline.json)
- `IntroKineticCountdownImage` (intro_kinetic_countdown_image.json)
- `IntroMediaHero` (intro_media_hero.json / media_headline_hook.json if applicable)
- `IntroMediaPoster` (intro_media_poster.json)
- `IntroMetricConstellationImage` (intro_metric_constellation_image.json)
- `IntroMetricGyroscopeImage` (intro_metric_gyroscope_image.json)
- `IntroMetricKpiBoardImage` (intro_metric_kpi_board_image.json)
- `IntroMetricOrbitImage` (intro_metric_orbit_image.json)
- `IntroNumberLede` (intro_number_lede.json)
- `IntroProfile` (intro_profile.json)
- `IntroStampStackImage` (intro_stamp_stack_image.json)
- `KineticType` (kinetic_type.json)
- `LowerThirdNews` (lower_third_news.json)
- `ManifestoConcept` (manifesto_concept.json)
- `MediaCardHook` (media_card_hook.json)
- `MediaHeadlineHook` (media_headline_hook.json)
- `NeonStackTitle` (neon_stack_title.json)
- `NotificationHook` (notification_hook.json)
- `OrbitMetricsHook` (orbit_metrics_hook.json)
- `PosterTitle` (poster_title.json)
- `PriceAlertHook` (price_alert_hook.json)
- `ProcessStrip` (process_strip.json)
- `Quote` (vignelli_quote.json / quote.json if applicable)
- `RedditPostHook` (reddit_post_hook.json)
- `SplitEditorial` (split_editorial.json)
- `SporlightOutcome` (sporlight_outcome.json)
- `SpotlightConcept` (spotlight_concept.json)
- `StatusGridHook` (status_grid_hook.json)
- `SwissGrid` (swiss_grid.json)
- `SysteamAlertHook` (systeam_alert_hook.json)
- `TerminalCommandHook` (terminal_command_hook.json)
- `Terminal` (terminal.json)
- `TickerTapeHook` (ticker_tape_hook.json)
- `VignelliTitle` (vignelli_title.json)
- `WalkthroughPhoneExample` (walkthrough_phone_example.json)
- `WarmGrainHook` (warm_grain_hook.json)
- `XPostHook` (x_post_hook.json)

---

## Part 2: Layout Contract Architecture

### Pipeline Flow
```
Script ──► Phase 1 Planner ──► Selects layoutId ──► Load Contract ──► Phase 2 Writer ──► Validation ──► Storyboard
```

### Components
1. **Layout Contract Registry**: JSON contracts for active layouts specifying `maxChars` per slot, `itemCount`, and component structure.
2. **Phase 1 Layout Selection**: AI selects an explicit `layoutId` matching the visual intent.
3. **Phase 2 Contract Enforcement**: Inject layout contract constraints into Phase 2 prompt.
4. **Validation Layer**: Backend post-processor auto-trims or validates content before returning final scenes.

---

## Verification Plan

### Automated Tests
- Run `npm run build` in `frontend/` and `my-video/` to ensure no broken imports or missing template references.

### Manual Verification
- Verify layout dropdown in `StoryboardEditor` reflects cleaned layout choices.
- Test AI generation pipeline to ensure `visualLayout` is populated directly.
