/**
 * config.js — Local config file manager
 * 
 * Stores user API keys and settings in a JSON file at:
 *   - Electron packaged: %APPDATA%/AI-Video-App/config.json
 *   - Dev mode: backend/.local-config.json
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getConfigPath() {
  if (process.env.ELECTRON_APP_DATA) {
    return path.join(process.env.ELECTRON_APP_DATA, 'config.json');
  }
  return path.join(__dirname, '../.local-config.json');
}

function readConfig() {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[config] Error reading config file:', e.message);
  }
  return {};
}

function writeConfig(data) {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Apply config to process.env so all services pick up the values immediately.
 */
function applyConfigToEnv(config) {
  if (config.GEMINI_API_KEY) process.env.GEMINI_API_KEY = config.GEMINI_API_KEY;
  if (config.GEMINI_MODEL) process.env.GEMINI_MODEL = config.GEMINI_MODEL;
  if (config.VBEE_API_KEY) process.env.VBEE_API_KEY = config.VBEE_API_KEY;
  if (config.VBEE_APP_ID) process.env.VBEE_APP_ID = config.VBEE_APP_ID;
  if (config.CLOUDINARY_CLOUD_NAME) process.env.CLOUDINARY_CLOUD_NAME = config.CLOUDINARY_CLOUD_NAME;
  if (config.CLOUDINARY_API_KEY) process.env.CLOUDINARY_API_KEY = config.CLOUDINARY_API_KEY;
  if (config.CLOUDINARY_API_SECRET) process.env.CLOUDINARY_API_SECRET = config.CLOUDINARY_API_SECRET;
  if (config.OMNIVOICE_INFER_PATH) process.env.OMNIVOICE_INFER_PATH = config.OMNIVOICE_INFER_PATH;
}

/**
 * Load config on startup — local config overrides .env values.
 */
function loadConfigOnStartup() {
  const config = readConfig();
  applyConfigToEnv(config);
  console.log('[config] Local config loaded from:', getConfigPath());
  return config;
}

/**
 * Check if the app has been configured (has at least a Gemini API key).
 */
function isConfigured() {
  const config = readConfig();
  return !!(config.GEMINI_API_KEY || process.env.GEMINI_API_KEY);
}

module.exports = {
  readConfig,
  writeConfig,
  applyConfigToEnv,
  loadConfigOnStartup,
  isConfigured
};
