# Design: UI Preview Enlargement and Header Cleanup

## Background

The user requested improvements to the frontend workspace view. Currently:
1. The header contains a redundant "Export" button which performs the same action as the "XUẤT VIDEO (.MP4)" button in the right sidebar.
2. The right sidebar contains a simulated "Timeline & Scrubber Panel" which has no actual functionality to control the video player, cluttering the UI and taking up vertical space.
3. The video preview frame is limited to a small size (maximum width of 250px) and surrounded by thick padding, making it hard to preview the generated video content clearly.

## Proposed Changes

### 1. Remove Redundant Header "Export" Button
We will remove the "Export" button from the header to clean up the navigation area. The video rendering trigger is already available in the Master Preview panel.

- **File**: `frontend/src/App.jsx`
- **Change**: Delete the button and its wrapping `div` at the top right of the header bar.

### 2. Remove Simulated Timeline & Scrubber Panel
We will remove the static timeline controls in the right sidebar since they do not control the actual Remotion Player video playback.

- **File**: `frontend/src/components/MasterPlayer.jsx`
- **Change**: Delete the entire `{/* Timeline & Scrubber Panel */}` block.

### 3. Enlarge Video Preview Screen
We will adjust the spacing and constraints in the Master Player component to make the video preview frame significantly larger.

- **File**: `frontend/src/components/MasterPlayer.jsx`
- **Changes**:
  - Reduce workspace padding from `24px` to `12px`.
  - Increase phone frame `maxWidth` from `250px` to `280px`.

## Success Criteria

1. No "Export" button is present on the main header.
2. The simulated timeline and scrubber panel under the video player are removed.
3. The video preview frame is larger, wider, and utilizes the sidebar space better.
4. Video rendering/exporting and layout rendering functions normally.

## Files to Modify

- [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx)
- [MasterPlayer.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/MasterPlayer.jsx)
