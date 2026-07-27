# Design: Studio AI Gen Token Usage Tracking Fix

**Date:** 2026-07-27  
**Status:** Approved  

## 1. Problem Statement
Token counts in `video_token_usage.log` read 0 because:
1. `finalProjectId` was generated after `generateAIGenStoryboard` completed.
2. `db.accumulateTokens` returned early because the project row did not exist in DB yet.
3. `db.saveAIGenProject` overwritten `config` on completion without merging existing `tokenUsage`.

---

## 2. Technical Fixes

### 1. `backend/routes/studioAiGenRoute.js`
- Generate `finalProjectId` first.
- Call `db.saveAIGenProject(finalProjectId, projectTitle, config, 'IN_PROGRESS')` BEFORE calling `aiGen.generateAIGenStoryboard`.
- Pass `projectId: finalProjectId` into `aiGen.generateAIGenStoryboard`.
- On completion, call `db.saveAIGenProject(finalProjectId, projectTitle, updatedConfig, 'COMPLETED')`.

### 2. `backend/services/db.js`
- Update `saveAIGenProject` to read existing `config` from DB on `ON CONFLICT` and merge `tokenUsage` so accumulated tokens are preserved.

---

## 3. Verification Plan
1. Create a test script simulating the full route lifecycle (`saveAIGenProject(IN_PROGRESS)` -> `accumulateTokens` -> `saveAIGenProject(COMPLETED)`).
2. Verify `config.tokenUsage` has accurate non-zero prompt, completion, and total tokens.
