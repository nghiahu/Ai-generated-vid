# Design Document: Editable Voiceover & Custom User Note for Single Scene Regeneration

## 1. Overview
Allow users to edit the scene's voiceover text and provide custom design instructions/notes when regenerating a single scene in Studio AI Gen.

## 2. Requirements
- **Editable Voiceover**: User can modify the scene voiceover script inside the regeneration modal.
- **Custom User Note (Prompt Instruction)**: User can enter specific instructions (e.g. layout preferences, color emphasis, component style) to guide Gemini AI.
- **Backend & AI Integration**:
  - `userNote` injected into Gemini's system prompt as a high-priority user directive.
  - TTS engine regenerates voiceover audio for the updated text.

## 3. Architecture & Data Flow
1. **Frontend (`StudioAIGen.jsx`)**:
   - Add `regenVoiceover` and `regenUserNote` state variables.
   - Upgrade modal UI with textareas for Voiceover and User Note.
   - Pass modified `voiceover` and `userNote` to `api.generateStudioAiGenScene`.
2. **Frontend Service (`api.js`)**:
   - Add `userNote` parameter to `generateStudioAiGenScene` API helper.
3. **Backend Route (`studioAiGenRoute.js`)**:
   - Extract `userNote` body param and pass to `aiGen.generateSingleSceneCode`.
4. **Backend AI Engine (`aiGen.js`)**:
   - Accept `userNote` parameter.
   - Inject `userNoteInstruction` into `generateTSXCodeForScene` system prompt.

## 4. Verification Plan
- Verify opening regeneration modal populates the voiceover field correctly.
- Test editing voiceover and adding custom notes.
- Verify backend receives `userNote` and Gemini respects the custom instructions.
