# Design Document: Redesign and Complete Video Layouts in my-video

We will upgrade the visual aesthetics of the Remotion video layouts and implement missing layout modes (specifically `centered_text` layoutMode) in `my-video` using the rules and guidelines of the **Redesign Skill** (`redesign-existing-projects`) from `Leonxlnx/taste-skill`.

## Target Objectives
1. **Clean & Upgrade Existing Layouts**: Optimize spacing, borders, shadows, alignment, and typography hierarchy in current modes (such as `IntroEvidenceScanlineMode.tsx`, `AbsoluteCardsMode.tsx`, etc.) to remove generic "AI slop" tells.
2. **Implement Missing Layout Modes**: Create dedicated React mode renderers for templates that currently fall back to the default vertical list (specifically `centered_text` layoutMode used by quotes, messages, and timeline map pins).
3. **Align JSON Templates**: Tune font sizes, border radii, padding, and styles in `.json` template configurations to match the desaturated, high-end styling guide.

---

## 1. Visual Standards (Tokens Alignment)
We will follow these desaturated premium UI tokens:
- **Typography**: Display headlines will use Outfit/Satoshi with tighter letter spacing (`-0.04em` or `-0.05em`) and balanced line heights. Body copy will have max-width limitations (around `65ch`).
- **Surfaces & Borders**: Replace generic black borders with **Whisper borders** (`rgba(255, 255, 255, 0.05)` or `rgba(15, 23, 42, 0.05)` depending on light/dark mode) and inner edge refraction.
- **Organic Shadows**: Replace low-opacity black shadows with background-tinted shadows (e.g., carrying a hint of Slate/Zinc blue/grey) for deep, realistic elevation.
- **Optical Adjustments**: Ensure icons, badges, and inline elements are aligned optically rather than just mathematically.

---

## 2. Proposed Changes

### [Component Name] my-video Layouts Engine

#### [NEW] [CenteredTextMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/CenteredTextMode.tsx)
- Create a dedicated renderer for `layoutMode: "centered_text"`.
- Implement clean, centered displays for quotes and spotlight text with large, high-contrast, track-tight typography.
- Enforce whitespace rules (padding-driven layout) and spring-based animations.

#### [MODIFY] [TemplateLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/TemplateLayout.tsx)
- Map `layoutMode: "centered_text"` to the new `CenteredTextMode` component.
- Clean up default container styling to align headers and category badges cleanly.

#### [MODIFY] [IntroEvidenceScanlineMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/IntroEvidenceScanlineMode.tsx) (and other modes)
- Perform audits on padding, border radii, shadows, and fonts.
- Standardize borders using whisper lines and tinted shadows.
- Adjust font scale and text-wrapping rules (`text-wrap: balance` for display titles).

#### [MODIFY] [templates JSON configs](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/)
- Audit and adjust style configuration properties in templates like [pullquote.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/Qute-Insght/pullquote.json) to match the premium design system tokens.

---

## 3. Verification Plan
- **Aesthetic Review**: Render the layouts locally using the Remotion Preview Player (`npm run dev`) and visually check text wrapping, alignment, shadow tints, and transitions.
- **Template Compatibility**: Check that the `centered_text` layout displays correctly for Quote templates, and no longer falls back to standard bullet points.
- **Build Checks**: Ensure the TypeScript compiler builds `my-video` with zero errors.
