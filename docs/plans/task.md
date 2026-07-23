# Task List: Remove Ending Card & Sidebar Features

| Task | Description | Status |
| --- | --- | --- |
| Task 1 | Backend Database & Config Cleanup (`db.js`) | [x] Completed |
| Task 2 | Backend TTS Logic Removal (`server.js`) | [x] Completed |
| Task 3 | Frontend App Default Config (`App.jsx`) | [x] Completed |
| Task 4 | Frontend Sidebar Form Removal (`SidebarConfig.jsx`) | [x] Completed |
| Task 5 | Frontend Player Duration Adjustment (`MasterPlayer.jsx`) | [x] Completed |
| Task 6 | Remotion Root Duration Calculation (`Root.tsx`) | [x] Completed |
| Task 7 | Remotion Composition Rendering Cleanup (`MainComposition.tsx`) | [x] Completed |
| Task 8 | Remove Left SideNavBar from App.jsx | [x] Completed |
| Task 9 | Expand scene preview width in StoryboardEditor.jsx | [x] Completed |
| Task 11 | Backend Layout Contract Validator & Smart Auto-Backfill (`contractLoader.js`) | [x] Completed |
| Task 12 | Backend Storyboard AI Prompt Guard for Points & Contracts (`ai.js`) | [x] Completed |
| Task 13 | Remotion Layout Typography Line-Height Enhancement to 1.35-1.45 (`VideoAtoms.tsx`, `VerticalListMode.tsx`, `LayoutNestedRenderers.tsx`, `TemplateLayout.tsx`) | [x] Completed |
| Task 14 | Fix Multi-Card Nested Pill Duplication & Inline-Block Line Height Breaking (`LayoutNestedRenderers.tsx`, `UIBlocks.tsx`, `ranked_impact_bullet.json`, `evidence_board_concept.json`) | [x] Completed |
| Task 15 | Increase Giant Headline Line-Height to 1.55-1.6 Across All Title Components (`HeadlineText` in `VideoAtoms.tsx`, `UIBlocks.tsx`, `TemplateLayout.tsx`, `IntroFullImageMode.tsx`, `BeforeAfterPanelMode.tsx`) | [x] Completed |
| Task 16 | Fix Subtitle Flex Row Gap in Karaoke Overlay (`DynamicSubtitle.tsx`: replaced uniform `gap: 14px` with `columnGap: 14px` & `rowGap: 32px`) | [x] Completed |
| Task 17 | Fix Hardcoded 1.05 Title Line-Height in Intro Evidence Timeline Mode & Related Intro Layouts (`IntroEvidenceTimelineMode.tsx`, `IntroEvidenceScanlineMode.tsx`, `IntroEvidenceReadlineMode.tsx`, `IntroCutoutHeadlineMode.tsx`, `CenteredTextMode.tsx`) | [x] Completed |
| Task 18 | Fine-Tune Headline Line-Height to Golden Ratio 1.32 Across All Layouts & Subtitle rowGap to 22px (`IntroEvidenceTimelineMode.tsx`, `VideoAtoms.tsx`, `TemplateLayout.tsx`, `UIBlocks.tsx`, `DynamicSubtitle.tsx`) | [x] Completed |
| Task 19 | Fix Highlight Words Mismatch Bug & Auto-Fallback System (`UIBlocks.tsx`, `ai.js`) | [x] Completed |
| Task 20 | Remove Hardcoded Default Tech Keywords & Enforce Pure Highlight Words Match against Heading (`UIBlocks.tsx`, `ai.js`) | [x] Completed |
| Task 21 | Fix Webkit Background Clip Tone Mark Clipping Bug on Vietnamese Capital Letters (`UIBlocks.tsx`: added `paddingTop: 0.22em` & negative `marginTop: -0.22em`) | [x] Completed |
| Task 22 | Fix Intro Metric Pill Image Template Positions & Staggered Pill Coordinates (`intro_metric_pill_image.json`: set `borderRadius: 999px` & staggered top/left coordinates) | [x] Completed |
| Task 23 | Fix Outer Container Padding Shift for Absolute Cards Layouts (`TemplateLayout.tsx`: fixed `paddingTop: 60px` & `marginBottom: 28px` for `absolute_cards` / `bubble`) | [x] Completed |
| Task 24 | Redesign Interlocked 3-Circle Overlapping Venn Diagram Layout (`BubbleMode.tsx`: 3 overlapping translucent glass circles with glowing borders) | [x] Completed |
| Task 25 | Map Intro Metric Pill Image Layout Mode to `bubble` (`intro_metric_pill_image.json`: changed `layoutMode` to `bubble`) | [x] Completed |
| Task 26 | Fix 3-Circle Interlocked Overlap Coordinates for Intro Metric Pill Image (`BubbleMode.tsx`: set tight overlapping coordinates `left: 245/100/390`, `top: 0/155/155`, `size: 350px`) | [x] Completed |
| Task 27 | Fix Text Overlap & Implement Dynamic Theme-Harmonious Color Palette in BubbleMode (`BubbleMode.tsx`: derived RGB theme analogous palette, set `padding: 45px 36px` to lock text inside inner core) | [x] Completed |
| Task 28 | Implement Dedicated Intro Radar Signal Mode (`IntroRadarSignalMode.tsx`, `intro_radar_signal_image.json`, `TemplateLayout.tsx`) | [x] Completed |
| Task 29 | Implement Radar Sweep Trailing Trail Effect (`IntroRadarSignalMode.tsx`) | [x] Completed |
| Task 30 | Implement Seamless Conic Radar Trail & Fluid Rotation (`IntroRadarSignalMode.tsx`) | [x] Completed |
| Task 31 | Implement Dedicated Intro Signal Steps Mode (`IntroSignalStepsMode.tsx`, `intro_signal_steps_images.json`, `TemplateLayout.tsx`) | [x] Completed |
| Task 32 | Enlarge Step Cards & Remove Voiceover Block (`IntroSignalStepsMode.tsx`) | [x] Completed |
| Task 33 | Make Step Cards 100% Equal Width & Uniform Size (`IntroSignalStepsMode.tsx`) | [x] Completed |
| Task 34 | Implement Dedicated Intro MAP Pins Mode (`IntroMapPinsMode.tsx`, `map_pins_hook.json`, `intro_map_pins_image.json`, `TemplateLayout.tsx`) | [x] Completed |
| Task 35 | Remove Duplicate Bottom Cards & Enlarge Map Pins (`IntroMapPinsMode.tsx`) | [x] Completed |
| Task 36 | Implement Dedicated OPS Monitor Mode (`OpsMonitorMode.tsx`, `ops_monitor_hook.json`, `TemplateLayout.tsx`) | [x] Completed |
| Task 37 | Optimize AI Text Length Limits & Early Stagger Delays (`ai.js`, `contractLoader.js`) | [x] Completed |
| Task 38 | Set Peak Frame (2.0s) for Static Thumbnail Previews (`Dashboard.jsx`) | [x] Completed |
| Task 39 | Persist Active Project & View State Across F5 Page Reloads (`App.jsx`) | [x] Completed |
| Task 40 | Replace Simple Loader with SVG Circular Progress Ring & Phase Steps (`StoryboardEditor.jsx`) | [x] Completed |
| Task 41 | Clone & Register Quang Anh Voice (`omnivoice_quanganh`) in TTS Service & UI Dropdowns | [x] Completed |
| Task 42 | Fix Layout Intent Auto-Matching & Strict 50% Delay Hard Clamp (`ai.js`, `contractLoader.js`) | [x] Completed |
| Task 43 | Fix Blank Layout Render Bug & Complete Layout Family Dropdown Mapping (`modes/*.tsx`, `StoryboardEditor.jsx`) | [x] Completed |
| Task 44 | Rikkei Light Theme Default Fix & Dark Overlay Exclusion (`MainComposition.tsx`, `vdeTokens.ts`, `App.jsx`) | [x] Completed |
| Task 45 | Redesign Versus Arena Layout (`SplitHorizontalMode.tsx`) | [x] Completed |
| Task 46 | Implement Split Verdict Table & Fix Blank Render (`split_proof_bullet.json`, `BeforeAfterPanelMode.tsx`, `before_after_panel.json`) | [x] Completed |
| Task 47 | Redesign Split Verdict Table 2-Row Layout & Enlarged Right Card (`BeforeAfterPanelMode.tsx`) | [x] Completed |
| Task 48 | Implement Versus Timeline Shift Layout (`split_band_checklist.json`, `TimelineShiftMode.tsx`, `TemplateLayout.tsx`) | [x] Completed |
| Task 49 | Apply 3D Spatial Depth & Compact Diagonal Stacking (`TimelineShiftMode.tsx`) | [x] Completed |
| Task 50 | Theme-aware Refactor for Intro MAP Pins Image (`IntroMapPinsMode.tsx`) | [x] Completed |
| Task 51 | Theme-aware High-Contrast Text Refactor for Before After Panel (`BeforeAfterPanelMode.tsx`) | [x] Completed |
| Task 52 | Implement Real-Time Backend Storyboard Progress Tracking (`server.js`, `StoryboardEditor.jsx`) | [x] Completed |
| Task 53 | Implement Inline Spinner & Toast Notification System (`App.jsx`, `StoryboardEditor.jsx`) | [x] Completed |
| Task 54 | Fix Audio Silence Bug on Regenerated TTS (`MainComposition.tsx`) | [x] Completed |
| Task 55 | Fix Mid-Word Heading Truncation Bug with `smartTrimWordBoundary` (`contractLoader.js`) | [x] Completed |
| Task 56 | Restore `IntroBubbleImage` (`OrbitalBubblesMode.tsx`) & Separate `IntroMetricPillImage` (`VennSpheresMode.tsx`) | [x] Completed |
| Task 57 | Register & Link `IntroMetricPillImage` (`venn_spheres`) across Registry, Layouts Dropdown & Contract Loader | [x] Completed |
| Task 58 | Theme-aware Dynamic Color Palette Refactor for Venn Spheres & Orbital Bubbles (`VennSpheresMode.tsx`, `OrbitalBubblesMode.tsx`) | [x] Completed |
| Task 59 | Real-Time Video Render Progress Upgrade with ANSI-Clean stdout Parsing & 300ms Fast Polling (`render.js`, `App.jsx`) | [x] Completed |
| Task 60 | Studio AI Gen: Live Remotion Codegen Pipeline, Background Image Upload, Full Video Setup & Sucrase Compilation | [x] Completed |
| Task 60 | Custom Video Download Filename & Save Location Picker (`MasterPlayer.jsx`, `App.jsx`) | [x] Completed |
| Task 61 | Fix Video Export Progress Percentage Calculation Bug (`render.js`, `App.jsx`) | [x] Completed |
| Task 62 | Implement dynamic subtitle sentence-by-sentence splitting and prevent layout overlapping | [x] Completed |
| Task 63 | Prevent Component Overlapping and Text Clipping (Flexbox badges & 80px margins) | [x] Completed |
| Task 64 | Prevent Mock Terminal Box Abuse (Trigger keywords and metaphorical constraints) | [x] Completed |
| Task 65 | Force vertical layout centering and spacing gaps for core visual components | [x] Completed |
| Task 66 | Implement robust TSX code extraction to prevent black screen compiles | [x] Completed |
| Task 67 | Implement layout-only reference image adaptation rules (protect theme colors) | [x] Completed |
| Task 68 | Change generation loop to sequential and handle API errors cleanly | [x] Completed |
| Task 69 | Implement split generator API (/plan, /generate-scene) and update frontend React flow | [x] Completed |
| Task 70 | Fix scene loading skeleton state & add single scene regenerate button (`StudioAIGen.jsx`) | [ ] Pending |



