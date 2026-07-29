# Design Document — Theme Ba: Modern Corporate

**Date:** 2026-07-29  
**Goal:** Register a new premium video theme named "Ba" based on the user's high-contrast corporate blue color palette, optimized for Vietnamese content using "Be Vietnam Pro" typography and glassmorphism.

---

## 1. Design Overview

The "Ba" theme represents a modern tech-corporate identity (Modern Corporate Glassmorphism). It utilizes a deep dark navy background gradient combined with rich blue, transparent container boxes (glassmorphism cards) and electric blue border outlines to ensure maximum legibility against light backgrounds. Highlighting accents are colored in vibrant Tech Cyan (`#5DC8FB`) to draw the eye to critical metrics.

---

## 2. Color Palette & Functional Token Roles

| Brand Color Name | Hex Code | Functional Token Role |
| :--- | :--- | :--- |
| **Deep Data Navy** | `#002691` | Background gradient start (deep contrast and depth). |
| **Business Blue** | `#004BBF` | Secondary background and content block core. |
| **Digital Blue** | `#0059D7` | Background gradient end and card overlay color. |
| **Electric Blue** | `#0259E9` | Outlines, borders, CTA borders, and icon containers. |
| **Tech Cyan** | `#5DC8FB` | Core accent highlights, neon glow details, and line graphs. |
| **Ice Blue** | `#A7E7F7` | Metallic silver accents and high-priority subtext. |
| **Pure White** | `#FFFFFF` | Core title text and logos (highest hierarchy). |
| **Soft White** | `#EAF8FF` | Long body text, paragraphs, and list details. |

---

## 3. Specifications

### A. Theme Registration (`my-video/src/styles/vde_themes.json`)
We will register `"ba"` as a new theme extending `"minimal"` with the following attributes:
* **Background Gradient:** `linear-gradient(135deg, #002691 0%, #004BBF 50%, #0059D7 100%)`
* **Card Background:** `linear-gradient(135deg, rgba(0, 38, 145, 0.85) 0%, rgba(0, 75, 191, 0.8) 100%)`
* **Card Border:** `1.5px solid rgba(2, 89, 233, 0.45)`
* **Accent:** `#5DC8FB` (Tech Cyan)
* **Fonts:** `Be Vietnam Pro` (both title and body)
* **Border Radius:** `16px`
* **Shadow:** `0 8px 32px rgba(2, 89, 233, 0.15)`
* **Motion Style:** `["slide-up", "fade"]`

### B. Static Override Resolution (`my-video/src/styles/vdeTokens.ts`)
Inject a hardcoded static block matching `"ba"` to prevent database stale sync issues, overriding the color structure to guarantee pixel-perfect UI.

---

## 4. Verification Plan

1. **Build check:** Compile `my-video` and check that the typescript definitions build successfully.
2. **Visual preview:** Verify the render using the Remotion Preview or the server's VDE synchronization logs.
