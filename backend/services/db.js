const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine database path:
// - In Electron packaged app: use %APPDATA%/AI-Video-App/database.db
// - In dev mode: use backend directory
function getDbPath() {
  if (process.env.ELECTRON_APP_DATA) {
    const appDataDir = process.env.ELECTRON_APP_DATA;
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    return path.join(appDataDir, 'database.db');
  }
  
  // For development: store in the user's home directory under .ai-video-creator to avoid OneDrive sync lock issues
  const devDbDir = path.join(os.homedir(), '.ai-video-creator');
  const devDbPath = path.join(devDbDir, 'database.sqlite');
  
  if (!fs.existsSync(devDbPath)) {
    const oldDbPath = path.join(__dirname, '../database.sqlite');
    if (fs.existsSync(oldDbPath)) {
      if (!fs.existsSync(devDbDir)) {
        fs.mkdirSync(devDbDir, { recursive: true });
      }
      try {
        fs.copyFileSync(oldDbPath, devDbPath);
        console.log(`[DB Migration] Copied existing database from ${oldDbPath} to ${devDbPath}`);
      } catch (err) {
        console.error(`[DB Migration] Failed to copy database:`, err.message);
      }
    }
  }

  if (!fs.existsSync(devDbDir)) {
    fs.mkdirSync(devDbDir, { recursive: true });
  }
  return devDbPath;
}

function clearStaleLock() {
  const dbPath = getDbPath();
  const lockPath = `${dbPath}.lock`;
  if (fs.existsSync(lockPath)) {
    try {
      fs.rmSync(lockPath, { recursive: true, force: true });
      console.log(`[DB Lock Cleanup] Removed stale lock directory: ${lockPath}`);
    } catch (err) {
      console.error(`[DB Lock Cleanup] Failed to remove lock directory:`, err.message);
    }
  }
}

let db = null;
let initPromise = null;

function getDb() {
  if (!db) {
    const dbPath = getDbPath();
    clearStaleLock(); // Clear any stale lock directory left behind by abrupt shutdowns
    db = new Database(dbPath);
    // Set busy timeout FIRST so subsequent commands wait if locked
    db.exec('PRAGMA busy_timeout = 10000');
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

// Custom transaction wrapper since node-sqlite3-wasm doesn't have db.transaction() helper
function runTransaction(fn) {
  const database = getDb();
  database.exec('BEGIN TRANSACTION');
  try {
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

async function initDb() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const database = getDb();

    // Create tables
    database.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        type TEXT DEFAULT 'STORYBOARD',
        created_at TEXT DEFAULT (datetime('now')),
        config TEXT NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS scenes (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        scene_index INTEGER NOT NULL,
        duration REAL DEFAULT 6.0,
        layout_family TEXT,
        visual_layout TEXT,
        scene_intent TEXT DEFAULT '{}',
        heading TEXT,
        points TEXT DEFAULT '[]',
        voiceover TEXT,
        voiceover_tts TEXT,
        voiceover_audio_url TEXT,
        placement TEXT,
        media_list TEXT DEFAULT '[]',
        selected_media_index INTEGER DEFAULT 0,
        bg_media_list TEXT DEFAULT '[]',
        selected_bg_media_index INTEGER DEFAULT -1,
        theme TEXT DEFAULT 'default',
        accent_color TEXT DEFAULT '#FFB7C5',
        voiceover_duration REAL,
        subtitles_json TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS phoneme_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term TEXT NOT NULL UNIQUE,
        display_term TEXT,
        phoneme TEXT NOT NULL,
        phoneme_format TEXT NOT NULL DEFAULT 'CMU',
        language TEXT NOT NULL DEFAULT 'en',
        source TEXT NOT NULL DEFAULT 'g2p',
        confidence REAL DEFAULT 1.0,
        manual_override INTEGER DEFAULT 0,
        review_required INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS phoneme_alias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneme_id INTEGER REFERENCES phoneme_cache(id) ON DELETE CASCADE,
        alias TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS uploaded_media (
        url TEXT PRIMARY KEY,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Add columns that may not exist in older schemas (safe to re-run)
    const safeAlters = [
      `ALTER TABLE projects ADD COLUMN type TEXT DEFAULT 'STORYBOARD'`,
      `ALTER TABLE scenes ADD COLUMN theme TEXT DEFAULT 'default'`,
      `ALTER TABLE scenes ADD COLUMN accent_color TEXT DEFAULT '#FFB7C5'`,
      `ALTER TABLE scenes ADD COLUMN voiceover_tts TEXT`,
      `ALTER TABLE scenes ADD COLUMN scene_intent TEXT DEFAULT '{}'`,
      `ALTER TABLE scenes ADD COLUMN voiceover_duration REAL`,
      `ALTER TABLE scenes ADD COLUMN subtitles_json TEXT DEFAULT '[]'`,
      `ALTER TABLE scenes ADD COLUMN bg_media_list TEXT DEFAULT '[]'`,
      `ALTER TABLE scenes ADD COLUMN selected_bg_media_index INTEGER DEFAULT -1`,
    ];

    for (const sql of safeAlters) {
      try {
        database.exec(sql);
      } catch (e) {
        // Column already exists — safe to ignore
      }
    }

    // Seed standard developer abbreviations
    const seedData = [
      ['ai', 'AI', 'EY1 AY1'],
      ['api', 'API', 'EY1 P IY1 AY1'],
      ['sdk', 'SDK', 'EH1 S D IY1 K EY1'],
      ['sql', 'SQL', 'EH1 S K Y UW1 EH1 L'],
      ['cli', 'CLI', 'S IY1 EH1 L AY1'],
      ['ui', 'UI', 'Y UW1 AY1'],
      ['ux', 'UX', 'Y UW1 EH1 K S'],
      ['url', 'URL', 'Y UW1 AA1 R EH1 L'],
      ['mcp', 'MCP', 'EH1 M S IY1 P IY1'],
      ['json', 'JSON', 'JH EY1 S AH0 N'],
      ['html', 'HTML', 'EY1 CH T IY1 EH1 M EH1 L'],
      ['css', 'CSS', 'S IY1 EH1 S EH1 S'],
      ['git', 'Git', 'G IH1 T'],
      ['npm', 'npm', 'EH1 N P IY1 EH1 M']
    ];

    const insertSeed = database.prepare(`
      INSERT OR IGNORE INTO phoneme_cache (term, display_term, phoneme, source, confidence, manual_override)
      VALUES (?, ?, ?, 'system_seed', 1.0, 1)
    `);

    runTransaction(() => {
      for (const [term, display, phoneme] of seedData) {
        insertSeed.run([term, display, phoneme]);
      }
    });
    insertSeed.finalize();

    console.log('SQLite database initialized successfully at:', getDbPath());
  })();

  return initPromise;
}

// Helper: parse JSON from DB, return fallback on failure
function parseJSON(str, fallback = null) {
  if (str === null || str === undefined) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function mapScene(s) {
  return {
    id: s.id,
    sceneIndex: s.scene_index,
    duration: s.duration,
    layoutFamily: s.layout_family,
    visualLayout: s.visual_layout,
    sceneIntent: parseJSON(s.scene_intent, null),
    heading: s.heading,
    points: parseJSON(s.points, []),
    voiceover: s.voiceover,
    voiceoverTts: s.voiceover_tts,
    voiceoverAudioUrl: s.voiceover_audio_url,
    placement: s.placement,
    mediaList: parseJSON(s.media_list, []),
    selectedMediaIndex: s.selected_media_index,
    bgMediaList: parseJSON(s.bg_media_list, []),
    selectedBgMediaIndex: s.selected_bg_media_index ?? -1,
    theme: s.theme || 'default',
    accentColor: s.accent_color || '#FFB7C5',
    voiceoverDuration: s.voiceover_duration,
    subtitlesJson: parseJSON(s.subtitles_json, [])
  };
}

function closeDb() {
  if (db) {
    try {
      db.close();
      console.log('SQLite database connection closed.');
    } catch (err) {
      console.error('Error closing SQLite database:', err.message);
    }
    db = null;
    initPromise = null;
  }
}

module.exports = {
  initDb,
  closeDb,

  getProjects: async () => {
    await initDb();
    const database = getDb();

    // Use JSON-safe queries
    const projects = database.prepare(`
      SELECT p.*,
        (SELECT json_object(
           'id', s.id,
           'duration', s.duration,
           'media_list', s.media_list,
           'selected_media_index', s.selected_media_index
         )
         FROM scenes s
         WHERE s.project_id = p.id
         ORDER BY s.scene_index ASC
         LIMIT 1) as first_scene
      FROM projects p
      WHERE p.type != 'AIGEN'
         OR p.status = 'COMPLETED'
         OR (
           json_valid(p.config)
           AND json_array_length(json_extract(p.config, '$.scenes')) > 0
           AND json_extract(p.config, '$.scenes[0].compiledJS') IS NOT NULL
           AND json_extract(p.config, '$.scenes[0].compiledJS') != ''
         )
      ORDER BY p.created_at DESC
    `).all();

    return projects.map(row => ({
      ...row,
      config: parseJSON(row.config, {}),
      first_scene: parseJSON(row.first_scene, null),
      createdAt: row.created_at
    }));
  },

  getProjectById: async (id) => {
    await initDb();
    const database = getDb();

    const project = database.prepare('SELECT * FROM projects WHERE id = ?').get([id]);
    if (!project) return null;

    const config = parseJSON(project.config, {});

    if (project.type === 'AIGEN') {
      return {
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.created_at,
        type: project.type,
        config,
        scenes: config?.scenes || []
      };
    }

    const scenes = database.prepare('SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_index ASC').all([id]);

    return {
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.created_at,
      type: project.type,
      config,
      scenes: scenes.map(mapScene)
    };
  },

  createProject: async (title) => {
    await initDb();
    const database = getDb();

    const id = `proj_${Math.random().toString(36).substr(2, 9)}`;
    const defaultConfig = {
      length: "Short (~60s)",
      language: "Vietnamese",
      voice: "vbee_ngochuyen",
      watermark: { enabled: true, text: "yupclip.com", position: "top-right", color: "#000000" },
      backgroundMusic: "Chill Lofi Beats"
    };

    database.prepare(`
      INSERT INTO projects (id, title, status, config)
      VALUES (?, ?, 'DRAFT', ?)
    `).run([id, title, JSON.stringify(defaultConfig)]);

    const row = database.prepare('SELECT * FROM projects WHERE id = ?').get([id]);
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      createdAt: row.created_at,
      config: parseJSON(row.config, {}),
      scenes: []
    };
  },

  updateProjectConfig: async (id, config) => {
    await initDb();
    const database = getDb();

    const project = database.prepare('SELECT config FROM projects WHERE id = ?').get([id]);
    if (!project) return null;

    const currentConfig = parseJSON(project.config, {});
    const mergedConfig = { ...currentConfig, ...config };

    database.prepare('UPDATE projects SET config = ? WHERE id = ?').run([JSON.stringify(mergedConfig), id]);
    return database.prepare('SELECT * FROM projects WHERE id = ?').get([id]);
  },

  updateProjectScenes: async (id, scenes) => {
    await initDb();
    const database = getDb();

    const insertScene = database.prepare(`
      INSERT INTO scenes (
        id, project_id, scene_index, duration, layout_family, visual_layout, scene_intent,
        heading, points, voiceover, voiceover_tts, voiceover_audio_url, placement, media_list, selected_media_index,
        bg_media_list, selected_bg_media_index, theme, accent_color, voiceover_duration, subtitles_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    runTransaction(() => {
      database.prepare('DELETE FROM scenes WHERE project_id = ?').run([id]);
      for (const scene of scenes) {
        insertScene.run([
          scene.id,
          id,
          scene.sceneIndex,
          scene.duration,
          scene.layoutFamily || null,
          scene.visualLayout || null,
          JSON.stringify(scene.sceneIntent || null),
          scene.heading,
          JSON.stringify(scene.points),
          scene.voiceover,
          scene.voiceoverTts || scene.voiceover_tts || scene.voiceover || "",
          scene.voiceoverAudioUrl,
          scene.placement,
          JSON.stringify(scene.mediaList),
          scene.selectedMediaIndex,
          JSON.stringify(scene.bgMediaList || []),
          scene.selectedBgMediaIndex ?? -1,
          scene.theme || 'default',
          scene.accentColor || '#FFB7C5',
          scene.voiceoverDuration || null,
          JSON.stringify(scene.subtitlesJson || [])
        ]);
      }
    });

    insertScene.finalize();
    return module.exports.getProjectById(id);
  },

  updateScene: async (projectId, sceneId, sceneData) => {
    await initDb();
    const database = getDb();

    const columnMapping = {
      sceneIndex: 'scene_index',
      duration: 'duration',
      layoutFamily: 'layout_family',
      visualLayout: 'visual_layout',
      sceneIntent: 'scene_intent',
      heading: 'heading',
      points: 'points',
      voiceover: 'voiceover',
      voiceoverTts: 'voiceover_tts',
      voiceoverAudioUrl: 'voiceover_audio_url',
      placement: 'placement',
      mediaList: 'media_list',
      selectedMediaIndex: 'selected_media_index',
      bgMediaList: 'bg_media_list',
      selectedBgMediaIndex: 'selected_bg_media_index',
      theme: 'theme',
      accentColor: 'accent_color',
      voiceoverDuration: 'voiceover_duration',
      subtitlesJson: 'subtitles_json'
    };

    const jsonFields = new Set(['points', 'mediaList', 'bgMediaList', 'subtitlesJson', 'sceneIntent']);
    const fields = [];
    const values = [];

    for (const [key, dbCol] of Object.entries(columnMapping)) {
      if (sceneData[key] !== undefined) {
        fields.push(`${dbCol} = ?`);
        values.push(jsonFields.has(key) ? JSON.stringify(sceneData[key]) : sceneData[key]);
      }
    }

    if (fields.length === 0) return null;

    values.push(projectId, sceneId);
    const sql = `UPDATE scenes SET ${fields.join(', ')} WHERE project_id = ? AND id = ?`;
    database.prepare(sql).run(values);

    const s = database.prepare('SELECT * FROM scenes WHERE project_id = ? AND id = ?').get([projectId, sceneId]);
    if (!s) return null;
    return mapScene(s);
  },

  createScene: async (projectId, sceneData) => {
    await initDb();
    const database = getDb();

    const countRow = database.prepare('SELECT COUNT(*) as cnt FROM scenes WHERE project_id = ?').get([projectId]);
    const nextIndex = countRow.cnt;

    const id = `scene_${projectId}_${nextIndex}_${Math.random().toString(36).substr(2, 4)}`;

    database.prepare(`
      INSERT INTO scenes (
        id, project_id, scene_index, duration, layout_family, visual_layout, scene_intent,
        heading, points, voiceover, voiceover_tts, voiceover_audio_url, placement, media_list, selected_media_index,
        theme, accent_color, voiceover_duration, subtitles_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run([
      id,
      projectId,
      nextIndex,
      sceneData.duration || 6.0,
      sceneData.layoutFamily || null,
      sceneData.visualLayout || null,
      JSON.stringify(sceneData.sceneIntent || { type: "opening", importance: "medium", density: "medium", emotion: "neutral" }),
      sceneData.heading || "Tiêu đề phân cảnh mới",
      JSON.stringify(sceneData.points || [{ type: "card", text: "Ý chính 1" }, { type: "card", text: "Ý chính 2" }]),
      sceneData.voiceover || "Lời thoại của phân cảnh mới.",
      sceneData.voiceoverTts || sceneData.voiceover_tts || sceneData.voiceover || "Lời thoại của phân cảnh mới.",
      sceneData.voiceoverAudioUrl || "",
      sceneData.placement || "Full",
      JSON.stringify(sceneData.mediaList || []),
      sceneData.selectedMediaIndex || 0,
      sceneData.theme || "default",
      sceneData.accentColor || "#FFB7C5",
      sceneData.voiceoverDuration || null,
      JSON.stringify(sceneData.subtitlesJson || [])
    ]);

    const s = database.prepare('SELECT * FROM scenes WHERE id = ?').get([id]);
    return mapScene(s);
  },

  deleteScene: async (projectId, sceneId) => {
    await initDb();
    const database = getDb();

    runTransaction(() => {
      database.prepare('DELETE FROM scenes WHERE project_id = ? AND id = ?').run([projectId, sceneId]);

      // Re-index remaining scenes
      const remaining = database.prepare('SELECT id FROM scenes WHERE project_id = ? ORDER BY scene_index ASC').all([projectId]);
      const updateIdx = database.prepare('UPDATE scenes SET scene_index = ? WHERE id = ?');
      remaining.forEach((row, i) => updateIdx.run([i, row.id]));
      updateIdx.finalize();
    });
  },

  deleteProject: async (id) => {
    await initDb();
    const database = getDb();

    const project = database.prepare('SELECT * FROM projects WHERE id = ?').get([id]);
    if (!project) return null;
    database.prepare('DELETE FROM projects WHERE id = ?').run([id]);
    return project;
  },

  getPhonemeFromCache: async (term) => {
    await initDb();
    const database = getDb();

    const cleanTerm = term.toLowerCase().trim();
    const row = database.prepare(`
      SELECT c.* FROM phoneme_cache c
      LEFT JOIN phoneme_alias a ON a.phoneme_id = c.id
      WHERE LOWER(c.term) = ? OR LOWER(a.alias) = ?
      LIMIT 1
    `).get([cleanTerm, cleanTerm]);
    return row || null;
  },

  savePhonemeToCache: async (item) => {
    if (!item || !item.term || !item.phoneme) return null;
    await initDb();
    const database = getDb();

    const cleanTerm = item.term.toLowerCase().trim();
    const displayTerm = item.display_term || item.term;
    const phoneme = item.phoneme.trim();
    const phonemeFormat = item.phoneme_format || 'CMU';
    const language = item.language || 'en';
    const source = item.source || 'g2p';
    const confidence = item.confidence !== undefined ? parseFloat(item.confidence) : 1.0;
    const manualOverride = item.manual_override ? 1 : 0;
    const reviewRequired = item.review_required || (confidence < 0.8) ? 1 : 0;

    return runTransaction(() => {
      // Insert or update (respect manual_override)
      const existing = database.prepare('SELECT id, manual_override FROM phoneme_cache WHERE term = ?').get([cleanTerm]);

      let phonemeId;
      if (existing) {
        if (!existing.manual_override) {
          database.prepare(`
            UPDATE phoneme_cache
            SET display_term = ?, phoneme = ?, phoneme_format = ?, language = ?, source = ?,
                confidence = ?, review_required = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run([displayTerm, phoneme, phonemeFormat, language, source, confidence, reviewRequired, existing.id]);
        }
        phonemeId = existing.id;
      } else {
        const info = database.prepare(`
          INSERT INTO phoneme_cache (term, display_term, phoneme, phoneme_format, language, source, confidence, manual_override, review_required)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run([cleanTerm, displayTerm, phoneme, phonemeFormat, language, source, confidence, manualOverride, reviewRequired]);
        phonemeId = info.lastInsertRowid;
      }

      // Handle aliases
      if (Array.isArray(item.aliases) && item.aliases.length > 0) {
        database.prepare('DELETE FROM phoneme_alias WHERE phoneme_id = ?').run([phonemeId]);
        const insertAlias = database.prepare('INSERT OR IGNORE INTO phoneme_alias (phoneme_id, alias) VALUES (?, ?)');
        for (const alias of item.aliases) {
          const cleanAlias = alias.toLowerCase().trim();
          if (cleanAlias && cleanAlias !== cleanTerm) {
            insertAlias.run([phonemeId, cleanAlias]);
          }
        }
        insertAlias.finalize();
      }

      return phonemeId;
    });
  },

  accumulateTokens: async (projectId, promptTokens, completionTokens) => {
    if (!projectId || !promptTokens) return;
    try {
      await initDb();
      const database = getDb();

      const project = database.prepare('SELECT config FROM projects WHERE id = ?').get([projectId]);
      if (!project) return;

      const currentConfig = parseJSON(project.config, {});
      const currentUsage = currentConfig.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      const promptCount = (currentUsage.promptTokens || 0) + promptTokens;
      const completionCount = (currentUsage.completionTokens || 0) + completionTokens;
      const totalCount = promptCount + completionCount;

      const updatedConfig = {
        ...currentConfig,
        tokenUsage: { promptTokens: promptCount, completionTokens: completionCount, totalTokens: totalCount }
      };

      database.prepare('UPDATE projects SET config = ? WHERE id = ?').run([JSON.stringify(updatedConfig), projectId]);
      console.log(`[Token Log] Accumulated tokens for project ${projectId}: +${promptTokens} prompt, +${completionTokens} completion. Total: ${totalCount}`);
    } catch (err) {
      console.error("[db.js] Error accumulating tokens:", err.message);
    }
  },

  saveAIGenProject: async (id, title, config, status = 'COMPLETED') => {
    await initDb();
    const database = getDb();

    database.prepare(`
      INSERT INTO projects (id, title, status, config, type)
      VALUES (?, ?, ?, ?, 'AIGEN')
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, config = excluded.config, status = excluded.status
    `).run([id, title, status, JSON.stringify(config)]);

    return database.prepare('SELECT * FROM projects WHERE id = ?').get([id]);
  },

  saveUploadedMedia: async (url) => {
    if (!url) return;
    await initDb();
    const database = getDb();

    try {
      database.prepare('INSERT OR IGNORE INTO uploaded_media (url) VALUES (?)').run([url]);
    } catch (err) {
      console.error("[db.js] Error saving uploaded media:", err.message);
    }
  },

  getUploadedMedia: async () => {
    await initDb();
    const database = getDb();

    try {
      const rows = database.prepare('SELECT url FROM uploaded_media ORDER BY created_at DESC').all();
      return rows.map(r => r.url);
    } catch (err) {
      console.error("[db.js] Error getting uploaded media:", err.message);
      return [];
    }
  },

  getAllCustomPhonemes: async () => {
    await initDb();
    const database = getDb();
    try {
      return database.prepare(`
        SELECT id, term, display_term, phoneme 
        FROM phoneme_cache 
        WHERE manual_override = 1 
        ORDER BY term ASC
      `).all();
    } catch (err) {
      console.error("[db.js] Error getting custom phonemes:", err.message);
      return [];
    }
  },

  deleteCustomPhoneme: async (term) => {
    await initDb();
    const database = getDb();
    const cleanTerm = term.toLowerCase().trim();
    try {
      database.prepare('DELETE FROM phoneme_cache WHERE term = ? AND manual_override = 1').run([cleanTerm]);
    } catch (err) {
      console.error("[db.js] Error deleting custom phoneme:", err.message);
    }
  }
};
