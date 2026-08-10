const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');

// ─────────────────────────────────────────────
// App Data Directory (where config + database live)
// ─────────────────────────────────────────────
const APP_DATA_DIR = path.join(app.getPath('userData'), 'AI-Video-App');
if (!fs.existsSync(APP_DATA_DIR)) {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });
}
const CONFIG_FILE = path.join(APP_DATA_DIR, 'config.json');

// ─────────────────────────────────────────────
// Resource paths (works both in dev and packaged)
// ─────────────────────────────────────────────
function getResourcePath(...parts) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...parts);
  }
  return path.join(__dirname, '..', ...parts);
}

const RENDERER_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'renderer')
  : path.join(__dirname, '..', 'frontend', 'dist');

const BACKEND_PATH = getResourcePath('backend');
const MY_VIDEO_PATH = getResourcePath('my-video');

// ─────────────────────────────────────────────
// Backend Process Management
// ─────────────────────────────────────────────
let backendProcess = null;
const BACKEND_PORT = 5000;

function killPort5000Sync() {
  if (process.platform !== 'win32') return;
  try {
    const { execSync } = require('child_process');
    const output = execSync('netstat -aon').toString();
    const lines = output.split('\n');
    const pidsToKill = new Set();
    for (const line of lines) {
      if (line.includes(`:${BACKEND_PORT}`)) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && pid !== '0') {
          pidsToKill.add(pid);
        }
      }
    }
    for (const pid of pidsToKill) {
      console.log(`[Main] Killing old zombie process on port ${BACKEND_PORT} with PID: ${pid}`);
      try {
        execSync(`taskkill /pid ${pid} /T /F`);
      } catch (err) { }
    }
  } catch (e) {
    console.error('[Main] Failed to check or kill processes on port 5000:', e.message);
  }
}

function startBackend() {
  // Clean up any old zombie processes occupying port 5000 first
  killPort5000Sync();

  const serverFile = path.join(BACKEND_PATH, 'server.js');

  if (!fs.existsSync(serverFile)) {
    console.error('[Main] Backend server.js not found at:', serverFile);
    return;
  }

  const env = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    ELECTRON_APP_DATA: APP_DATA_DIR,
    MY_VIDEO_PATH: MY_VIDEO_PATH,
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1' // Critical: prevent spawning infinite Electron windows
  };

  // Use Node.js from the system (or Electron's own node)
  const nodeExe = process.execPath; // Electron ships Node.js

  backendProcess = spawn(nodeExe, [serverFile], {
    cwd: BACKEND_PATH,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[Backend]', data.toString().trim());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend Error]', data.toString().trim());
  });

  backendProcess.on('close', (code) => {
    console.log('[Backend] Process exited with code:', code);
    backendProcess = null;
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] Failed to start:', err.message);
  });

  console.log('[Main] Backend started (PID:', backendProcess?.pid, ')');
}

function stopBackend() {
  if (backendProcess) {
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`);
        console.log('[Main] Forcefully killed backend process tree (PID:', backendProcess.pid, ')');
      } catch (e) {
        console.error('[Main] Failed to taskkill backend process tree:', e.message);
        backendProcess.kill('SIGKILL');
      }
    } else {
      backendProcess.kill('SIGTERM');
    }
    backendProcess = null;
  }
}

// ─────────────────────────────────────────────
// Wait for backend to be ready
// ─────────────────────────────────────────────
function waitForBackend(maxWaitMs = 15000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const http = require('http');

    function check() {
      http.get(`http://localhost:${BACKEND_PORT}/api/config/status`, (res) => {
        resolve(true);
      }).on('error', () => {
        if (Date.now() - start < maxWaitMs) {
          setTimeout(check, 500);
        } else {
          console.warn('[Main] Backend did not start in time, loading anyway...');
          resolve(false);
        }
      });
    }

    setTimeout(check, 800); // Give backend 800ms head start
  });
}

// ─────────────────────────────────────────────
// Config helpers (IPC)
// ─────────────────────────────────────────────
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) { }
  return {};
}

function isFirstRun() {
  const config = readConfig();
  return !config.GEMINI_API_KEY;
}

// ─────────────────────────────────────────────
// Settings Window
// ─────────────────────────────────────────────
let settingsWindow = null;

function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 700,
    resizable: true,
    title: 'Cài đặt API - AI Video Creator',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings-window.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// ─────────────────────────────────────────────
// Main Window
// ─────────────────────────────────────────────
let mainWindow = null;

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'AI Video Creator',
    autoHideMenuBar: true,
    show: false, // Show after content loads
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Allow loading local resources
      webSecurity: false
    }
  });

  // Show loading splash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Start backend
  startBackend();

  // Wait for backend to be ready
  console.log('[Main] Waiting for backend...');
  await waitForBackend();
  console.log('[Main] Backend is ready!');

  // Load the frontend app
  const indexPath = path.join(RENDERER_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    // Dev fallback: load from dev server
    mainWindow.loadURL('http://localhost:5173');
  }

  // Open DevTools in dev mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Show settings on first run
  if (isFirstRun()) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        // Redirect to settings view
        mainWindow.webContents.executeJavaScript(`
          localStorage.setItem('activeView', 'SETTINGS');
          window.location.reload();
        `);
      }, 1000);
    });
  }
}

// ─────────────────────────────────────────────
// IPC Handlers
// ─────────────────────────────────────────────
ipcMain.handle('get-config', () => {
  return readConfig();
});

ipcMain.handle('save-config', (event, data) => {
  try {
    const existing = readConfig();
    const merged = { ...existing, ...data };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-settings', () => {
  openSettingsWindow();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// ─────────────────────────────────────────────
// OmniVoice Extraction Check & Runtime Setup
// ─────────────────────────────────────────────
function ensureOmniVoice() {
  return new Promise((resolve) => {
    const omnivoiceDir = path.join(app.getPath('userData'), 'omnivoice-runtime');
    const exePath = path.join(omnivoiceDir, 'Scripts', 'omnivoice-infer.exe');
    
    if (fs.existsSync(exePath)) {
      console.log('[Main] OmniVoice runtime found at:', exePath);
      resolve(exePath);
      return;
    }
    
    const zipSource = getResourcePath('omnivoice-runtime.zip');
    if (!fs.existsSync(zipSource)) {
      console.warn('[Main] OmniVoice runtime zip not found at:', zipSource, 'Skipping extraction.');
      resolve(null);
      return;
    }
    
    console.log('[Main] OmniVoice runtime not found. Starting extraction from:', zipSource);
    
    // Show setup loading window
    const setupWindow = new BrowserWindow({
      width: 500,
      height: 350,
      frame: false,
      resizable: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    setupWindow.loadFile(path.join(__dirname, 'setup-loading.html'));
    
    // Decompress asynchronously to keep Electron window responsive
    setTimeout(() => {
      try {
        fs.mkdirSync(omnivoiceDir, { recursive: true });
        
        // Use native tar.exe on Windows for fast extraction and supporting >2GB files
        const { exec } = require('child_process');
        const cmd = `tar -xf "${zipSource}" -C "${omnivoiceDir}"`;
        console.log('[Main] Running extraction command:', cmd);
        
        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            console.error('[Main] tar extraction failed:', err.message, stderr);
            // Fallback to PowerShell Expand-Archive
            console.log('[Main] Falling back to PowerShell Expand-Archive...');
            const psCmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipSource}' -DestinationPath '${omnivoiceDir}' -Force"`;
            exec(psCmd, (psErr, psStdout, psStderr) => {
              if (psErr) {
                console.error('[Main] PowerShell extraction failed:', psErr.message, psStderr);
                dialog.showErrorBox(
                  'Lỗi cài đặt giọng đọc Offline',
                  'Không thể giải nén bộ thư viện giọng đọc ngoại tuyến.\nChi tiết: ' + psErr.message
                );
                setupWindow.close();
                resolve(null);
              } else {
                console.log('[Main] PowerShell extraction successful.');
                setupWindow.close();
                resolve(exePath);
              }
            });
          } else {
            console.log('[Main] tar extraction successful to:', omnivoiceDir);
            setupWindow.close();
            resolve(exePath);
          }
        });
      } catch (err) {
        console.error('[Main] Extraction error:', err.message);
        dialog.showErrorBox(
          'Lỗi cài đặt giọng đọc Offline',
          'Không thể khởi chạy giải nén bộ thư viện giọng đọc ngoại tuyến.\nChi tiết: ' + err.message
        );
        setupWindow.close();
        resolve(null);
      }
    }, 1000);
  });
}

// ─────────────────────────────────────────────
// App Lifecycle
// ─────────────────────────────────────────────
app.whenReady().then(async () => {
  const exePath = await ensureOmniVoice();
  if (exePath) {
    process.env.OMNIVOICE_INFER_PATH = exePath;
    console.log('[Main] AppData OmniVoice path registered:', process.env.OMNIVOICE_INFER_PATH);
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught exception:', err);
});
