| Task | Status | Description |
| --- | --- | --- |
| 1. Update Backend Server (`server.js`) | [x] | Find the ending scene and merge selectedCtaMedia into it instead of appending a new scene |
| 2. Update Remotion Composition (`MainComposition.tsx`) | [x] | Render subtitles over video CTA scenes |
| 3. Verify changes | [x] | Test video CTA generation with voiceover script and verify subtitles |
| 4. Fix HF_HUB_OFFLINE for OmniVoice CLI | [x] | Configure environment to fall back to online download and use official HF_ENDPOINT when mirror is slow/down |
| 5. Fix English pronunciation issue in TTS | [x] | Download missing cmudict.dict, add technical terms to transliteration dictionary, and improve isEnglishWord detection logic |
| 6. Keep Voiceover saving and TTS audio regeneration separate | [x] | Revert automatic TTS generation during script saving, letting the frontend render subtitles using its built-in linear fallback, and keep TTS audio regeneration manual on user click |
| 7. Exclude suggestions/hints from TTS and subtitles alignment | [x] | Detect and strip trailing suggestions (e.g., Gợi ý, Đáp án) from the text read by TTS and aligned by aligner, while displaying the full text with suggestion on the player screen statically |
| 8. Add retro_editorial theme to backend and composition vde_themes.json | [x] | Add theme definition mapping colors, fonts, radius, and shadows |
| 9. Add retro_editorial overrides and light contrast rules | [x] | Update vdeTokens.ts, TemplateLayout.tsx, DynamicLayout.tsx, and DynamicSubtitle.tsx |
| 10. Register theme preset in frontend editors | [x] | Add retro_editorial styling metadata to StoryboardEditor.jsx and BatchStudioPage.jsx |
| 11. Build and verify the Remotion bundle | [x] | Run local build checks to verify compilation success |
| 12. Fix TTS voice random pauses and newline handling | [x] | Replace hyphens with spaces for phonetic pronunciations and replace newlines with commas to introduce natural pauses |

