| Task | Status | Component | Details |
| :--- | :---: | :--- | :--- |
| Migrate dev database to user homedir | [x] | Backend Database | Modify getDbPath in db.js |
| Copy existing database on migration | [x] | Backend Database | Check and copy backend/database.sqlite if it exists |
| Export closeDb from db.js | [x] | Backend Database | Implement and export closeDb |
| Handle process signals for shutdown | [x] | Backend Server | Add SIGTERM, SIGINT, SIGUSR2 handlers to server.js |
| Verify database initialization and restarts | [x] | Backend | Run test script and server to verify |
| Add clearStaleLock to remove lock files on startup | [x] | Backend Database | Add helper to clear lock directory |
| Install @rspack/binding-win32-x64-msvc package | [x] | Remotion Packages | Force install native Rspack binding |
| Install @remotion/compositor-win32-x64-msvc package | [x] | Remotion Packages | Force install aligned compositor binary |
| Verify still render MainComposition | [x] | Remotion | Run still render MainComposition test |
| Remove Unsplash auto-search from server.js | [x] | Backend Server | Skip Unsplash search if no selectedMedia is provided |
| Deactivate Unsplash search API endpoint | [x] | Backend Server | Return empty array from /api/media/search |
| Remove Unsplash search inputs from Editor panels | [x] | Frontend UI | Remove search bar and button |
| Remove Stock Images tab from Media Modal | [x] | Frontend UI | Remove STOCK tab button and content block |
| Verify frontend compiles successfully | [x] | Frontend | Run npm run build |
| Increase SQLite busy_timeout to 10s | [x] | Backend Database | Prevent concurrent query locks |
| Fix StoryboardEditor Media Panels responsiveness and image horizontal scrolling | [x] | Frontend UI | Change Split Panel to use minmax(0, 1fr) columns and add minWidth: 0 to flex columns |
| Fix media selection state pollution between background and content modals | [x] | Frontend UI | Introduce modalSelectedMedia to separate modal selection from project selectedMedia state |
| Fix layout repetition for scene 1 across different video generations | [x] | Backend AI | Raise Phase 1 planner temperature to 0.7 and enhance prompt selector instructions |
| Create Template JSON File | [x] | Remotion Layout | Add metric_showcase_hook.json template |
| Register Layout in Index and Template Layout | [x] | Remotion Layout | Update index.ts and TemplateLayout.tsx |
| Implement MetricShowcaseHookMode Component | [x] | Remotion Layout | Create MetricShowcaseHookMode.tsx |
| Register Contract and Prompts in Backend | [x] | Backend AI | Update contractLoader.js and ai.js |
| Add selector option in Frontend editor | [x] | Frontend UI | Update StoryboardEditor.jsx |
