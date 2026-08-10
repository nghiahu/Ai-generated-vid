| Task | Status | Description |
| --- | --- | --- |
| Install adm-zip dependency in Electron package | [x] | Run npm install adm-zip in the electron directory |
| Implement extraction flow and setup window in main.js | [x] | Create loading setup window and extract runtime zip to AppData using adm-zip |
| Inject path environment variable to Backend process | [x] | Pass OMNIVOICE_INFER_PATH to spawned backend server |
| Configure Electron Builder extraResources and build.js | [x] | Map zip file in extraResources and copy it during build.js |
| Manual End-to-End Verification | [x] | Verify extraction flow and cloner behavior |


