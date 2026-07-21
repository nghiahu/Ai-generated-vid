# Design Document: Real-Time Storyboard Generation Progress Tracking

## Problem Statement
The storyboard generation progress indicator (`CircularProgressLoader` in `StoryboardEditor.jsx`) previously used an artificial timer (`setInterval` incrementing by arbitrary deltas up to 95%). It did not reflect actual backend AI processing, voiceover TTS generation, or scene rendering.

## Technical Solution
1. **Backend State Tracking (`server.js`)**:
   - Maintain `storyboardProgressMap` (`Map<projectId, { percent: number, stage: string, completed: boolean }>`).
   - Endpoint `GET /api/projects/:id/generate-storyboard/status` returns the current real status.
   - Update progress dynamically inside `POST /api/projects/:id/generate-storyboard`:
     - 15%: "Đang dùng AI phân tích kịch bản & trích xuất phân cảnh..."
     - 35%: "Đã tạo X phân cảnh. Bắt đầu xử lý giọng đọc & hình ảnh..."
     - 35% -> 90%: Progress per scene `i`: `35 + Math.round(((i + 1) / total) * 55)%` with stage `"Đang tạo giọng đọc TTS & hình ảnh phân cảnh (i+1)/total..."`.
     - 100%: "Hoàn tất kịch bản Storyboard!".
2. **Frontend Real-Time Polling (`StoryboardEditor.jsx`)**:
   - Remove dummy timer logic from `CircularProgressLoader`.
   - Poll `GET /api/projects/:id/generate-storyboard/status` every 500ms while `isGenerating` is true.
   - Render exact percentage and real backend status message.

## Verification Plan
1. Trigger storyboard generation for a project.
2. Verify progress starts at 15%, updates step-by-step for each processed scene, and smoothly finishes at 100%.
