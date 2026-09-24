| Task | Status | Description |
| --- | --- | --- |
| 1. Add Delete Media Endpoint in Backend (`db.js` & `server.js`) | [x] | Implement db.deleteUploadedMedia and POST /api/media/delete with disk file unlinking |
| 2. Switch AI Image Generation to Local Disk | [x] | Save Gemini Imagen base64 images directly to backend/public/uploads instead of Cloudinary |
| 3. Update StoryboardEditor.jsx (Local upload & Hover Red X) | [x] | Add multi-file local upload, update UI copy, add hover red X delete button |
| 4. Update BatchStudioPage.jsx (Local upload & Hover Red X) | [x] | Align upload UI copy and add hover red X delete button in Your Media |
| 5. End-to-End Verification | [x] | Verified upload, file unlinking, database deletion, and frontend build |
| 6. Export 406 Custom Pronunciations to JSON | [x] | Exported current phoneme_cache to backend/data/custom_pronunciations.json |
| 7. Auto-seed SQLite from JSON on DB init | [x] | In db.js initDb(), load entries from custom_pronunciations.json so any new clone gets all terms |
| 8. Keep JSON synced on POST and DELETE | [x] | Whenever terms are added or removed, write updated list to custom_pronunciations.json |
| 9. Verification | [x] | Verified export, auto-import on fresh DB, two-way sync, and git status |

