const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../database.sqlite');

let _sqlJs = null;
let _db = null;

// Load sql.js WASM once
async function getSqlJs() {
  if (_sqlJs) return _sqlJs;
  _sqlJs = await initSqlJs();
  return _sqlJs;
}

// Load or create the SQLite database file
async function getDb() {
  if (_db) return _db;
  const SQL = await getSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
  _db.pragma = (pragma) => _db.run(`PRAGMA ${pragma}`);
  _db.run('PRAGMA foreign_keys = ON');
  return _db;
}

// Save DB to disk after each write
function saveDb() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper: run a query and return all rows as objects
function queryAll(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    return [];
  }
}

// Helper: run a query and return first row as object
function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run a write query
function runQuery(db, sql, params = []) {
  db.run(sql, params);
  saveDb();
}

async function initDb() {
  const db = await getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      type TEXT DEFAULT 'STORYBOARD',
      created_at TEXT DEFAULT (datetime('now')),
      config TEXT NOT NULL DEFAULT '{}'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      scene_index INTEGER NOT NULL,
      duration REAL DEFAULT 6.0,
      layout_family TEXT,
      visual_layout TEXT,
      scene_intent TEXT,
      heading TEXT,
      points TEXT DEFAULT '[]',
      voiceover TEXT,
      voiceover_tts TEXT,
      voiceover_audio_url TEXT,
      placement TEXT,
      media_list TEXT DEFAULT '[]',
      selected_media_index INTEGER DEFAULT 0,
      theme TEXT DEFAULT 'default',
      accent_color TEXT DEFAULT '#FFB7C5',
      voiceover_duration REAL,
      subtitles_json TEXT DEFAULT '[]'
    )
  `);

  db.run(`
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
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS phoneme_alias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phoneme_id INTEGER REFERENCES phoneme_cache(id) ON DELETE CASCADE,
      alias TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS uploaded_media (
      url TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed standard tech abbreviations
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
    ['npm', 'npm', 'EH1 N P IY1 EH1 M'],
  ];
  for (const [term, display, phoneme] of seedData) {
    db.run(
      `INSERT OR IGNORE INTO phoneme_cache (term, display_term, phoneme, source, confidence, manual_override) VALUES (?, ?, ?, 'system_seed', 1.0, 1)`,
      [term, display, phoneme]
    );
  }

  saveDb();
  console.log('SQLite (sql.js) database initialized successfully.');
}

// Helper to map scene row from DB to API object
function mapScene(s) {
  return {
    id: s.id,
    sceneIndex: s.scene_index,
    duration: s.duration,
    layoutFamily: s.layout_family,
    visualLayout: s.visual_layout,
    sceneIntent: JSON.parse(s.scene_intent || 'null'),
    heading: s.heading,
    points: JSON.parse(s.points || '[]'),
    voiceover: s.voiceover,
    voiceoverTts: s.voiceover_tts,
    voiceoverAudioUrl: s.voiceover_audio_url,
    placement: s.placement,
    mediaList: JSON.parse(s.media_list || '[]'),
    selectedMediaIndex: s.selected_media_index,
    theme: s.theme || 'default',
    accentColor: s.accent_color || '#FFB7C5',
    voiceoverDuration: s.voiceover_duration,
    subtitlesJson: JSON.parse(s.subtitles_json || '[]')
  };
}

module.exports = {
  initDb,

  getProjects: async () => {
    await initDb();
    const db = await getDb();
    const rows = queryAll(db, `
      SELECT * FROM projects
      WHERE type != 'AIGEN'
         OR status = 'COMPLETED'
         OR (
           json_array_length(json_extract(config, '$.scenes')) > 0
           AND json_extract(config, '$.scenes[0].compiledJS') IS NOT NULL
           AND json_extract(config, '$.scenes[0].compiledJS') != ''
         )
      ORDER BY created_at DESC
    `);
    return rows.map(r => ({ ...r, config: JSON.parse(r.config || '{}'), createdAt: r.created_at }));
  },

  getProjectById: async (id) => {
    await initDb();
    const db = await getDb();
    const project = queryOne(db, 'SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return null;
    project.config = JSON.parse(project.config || '{}');

    if (project.type === 'AIGEN') {
      return {
        id: project.id, title: project.title, status: project.status,
        createdAt: project.created_at, type: project.type, config: project.config,
        scenes: project.config?.scenes || []
      };
    }

    const scenes = queryAll(db, 'SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_index ASC', [id]);
    return {
      id: project.id, title: project.title, status: project.status,
      createdAt: project.created_at, type: project.type, config: project.config,
      scenes: scenes.map(mapScene)
    };
  },

  createProject: async (title) => {
    await initDb();
    const db = await getDb();
    const id = `proj_${Math.random().toString(36).substr(2, 9)}`;
    const defaultConfig = {
      length: 'Short (~60s)', language: 'Vietnamese', voice: 'omnivoice_duythanh',
      watermark: { enabled: true, text: 'yupclip.com', position: 'top-right', color: '#000000' },
      backgroundMusic: 'Chill Lofi Beats'
    };
    runQuery(db, `INSERT INTO projects (id, title, status, config) VALUES (?, ?, 'DRAFT', ?)`,
      [id, title, JSON.stringify(defaultConfig)]);
    return { id, title, status: 'DRAFT', createdAt: new Date().toISOString(), config: defaultConfig, scenes: [] };
  },

  updateProjectConfig: async (id, config) => {
    await initDb();
    const db = await getDb();
    const row = queryOne(db, 'SELECT config FROM projects WHERE id = ?', [id]);
    if (!row) return null;
    const merged = { ...JSON.parse(row.config || '{}'), ...config };
    runQuery(db, 'UPDATE projects SET config = ? WHERE id = ?', [JSON.stringify(merged), id]);
    return queryOne(db, 'SELECT * FROM projects WHERE id = ?', [id]);
  },

  updateProjectScenes: async (id, scenes) => {
    await initDb();
    const db = await getDb();
    db.run('DELETE FROM scenes WHERE project_id = ?', [id]);
    for (const s of scenes) {
      db.run(`
        INSERT OR REPLACE INTO scenes (
          id, project_id, scene_index, duration, layout_family, visual_layout, scene_intent,
          heading, points, voiceover, voiceover_tts, voiceover_audio_url, placement,
          media_list, selected_media_index, theme, accent_color, voiceover_duration, subtitles_json
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s.id, id, s.sceneIndex, s.duration,
          s.layoutFamily || null, s.visualLayout || null,
          JSON.stringify(s.sceneIntent || null), s.heading,
          JSON.stringify(s.points), s.voiceover,
          s.voiceoverTts || s.voiceover || '',
          s.voiceoverAudioUrl, s.placement,
          JSON.stringify(s.mediaList), s.selectedMediaIndex,
          s.theme || 'default', s.accentColor || '#FFB7C5',
          s.voiceoverDuration || null,
          JSON.stringify(s.subtitlesJson || [])]);
    }
    saveDb();
    return module.exports.getProjectById(id);
  },

  updateScene: async (projectId, sceneId, sceneData) => {
    await initDb();
    const db = await getDb();
    const columnMap = {
      sceneIndex: 'scene_index', duration: 'duration', layoutFamily: 'layout_family',
      visualLayout: 'visual_layout', sceneIntent: 'scene_intent', heading: 'heading',
      points: 'points', voiceover: 'voiceover', voiceoverTts: 'voiceover_tts',
      voiceoverAudioUrl: 'voiceover_audio_url', placement: 'placement',
      mediaList: 'media_list', selectedMediaIndex: 'selected_media_index',
      theme: 'theme', accentColor: 'accent_color',
      voiceoverDuration: 'voiceover_duration', subtitlesJson: 'subtitles_json'
    };
    const jsonKeys = new Set(['points', 'mediaList', 'subtitlesJson', 'sceneIntent']);
    const sets = [], vals = [];
    for (const [key, col] of Object.entries(columnMap)) {
      if (sceneData[key] !== undefined) {
        sets.push(`${col} = ?`);
        vals.push(jsonKeys.has(key) ? JSON.stringify(sceneData[key]) : sceneData[key]);
      }
    }
    if (sets.length === 0) {
      const s = queryOne(db, 'SELECT * FROM scenes WHERE id = ?', [sceneId]);
      return s ? mapScene(s) : null;
    }
    vals.push(projectId, sceneId);
    runQuery(db, `UPDATE scenes SET ${sets.join(', ')} WHERE project_id = ? AND id = ?`, vals);
    const s = queryOne(db, 'SELECT * FROM scenes WHERE id = ?', [sceneId]);
    return s ? mapScene(s) : null;
  },

  createScene: async (projectId, sceneData) => {
    await initDb();
    const db = await getDb();
    const countRow = queryOne(db, 'SELECT COUNT(*) as cnt FROM scenes WHERE project_id = ?', [projectId]);
    const nextIndex = countRow ? countRow.cnt : 0;
    const id = `scene_${projectId}_${nextIndex}_${Math.random().toString(36).substr(2, 4)}`;
    runQuery(db, `
      INSERT INTO scenes (id, project_id, scene_index, duration, layout_family, visual_layout,
        scene_intent, heading, points, voiceover, voiceover_tts, voiceover_audio_url,
        placement, media_list, selected_media_index, theme, accent_color,
        voiceover_duration, subtitles_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, projectId, nextIndex,
        sceneData.duration || 6.0,
        sceneData.layoutFamily || null, sceneData.visualLayout || null,
        JSON.stringify(sceneData.sceneIntent || { type: 'opening', importance: 'medium', density: 'medium', emotion: 'neutral' }),
        sceneData.heading || 'Tiêu đề phân cảnh mới',
        JSON.stringify(sceneData.points || [{ type: 'card', text: 'Ý chính 1' }, { type: 'card', text: 'Ý chính 2' }]),
        sceneData.voiceover || 'Lời thoại của phân cảnh mới.',
        sceneData.voiceoverTts || sceneData.voiceover || 'Lời thoại của phân cảnh mới.',
        sceneData.voiceoverAudioUrl || '',
        sceneData.placement || 'Full',
        JSON.stringify(sceneData.mediaList || []),
        sceneData.selectedMediaIndex || 0,
        sceneData.theme || 'default',
        sceneData.accentColor || '#FFB7C5',
        sceneData.voiceoverDuration || null,
        JSON.stringify(sceneData.subtitlesJson || [])]);
    const s = queryOne(db, 'SELECT * FROM scenes WHERE id = ?', [id]);
    return s ? mapScene(s) : null;
  },

  deleteScene: async (projectId, sceneId) => {
    await initDb();
    const db = await getDb();
    db.run('DELETE FROM scenes WHERE project_id = ? AND id = ?', [projectId, sceneId]);
    const remaining = queryAll(db, 'SELECT id FROM scenes WHERE project_id = ? ORDER BY scene_index ASC', [projectId]);
    remaining.forEach((r, i) => db.run('UPDATE scenes SET scene_index = ? WHERE id = ?', [i, r.id]));
    saveDb();
  },

  deleteProject: async (id) => {
    await initDb();
    const db = await getDb();
    const row = queryOne(db, 'SELECT * FROM projects WHERE id = ?', [id]);
    if (!row) return null;
    runQuery(db, 'DELETE FROM projects WHERE id = ?', [id]);
    return row;
  },

  getPhonemeFromCache: async (term) => {
    await initDb();
    const db = await getDb();
    const cleanTerm = term.toLowerCase().trim();
    return queryOne(db, `
      SELECT c.* FROM phoneme_cache c
      LEFT JOIN phoneme_alias a ON a.phoneme_id = c.id
      WHERE LOWER(c.term) = ? OR LOWER(a.alias) = ?
      LIMIT 1
    `, [cleanTerm, cleanTerm]) || null;
  },

  savePhonemeToCache: async (item) => {
    if (!item || !item.term || !item.phoneme) return null;
    await initDb();
    const db = await getDb();
    const cleanTerm = item.term.toLowerCase().trim();
    const confidence = item.confidence !== undefined ? parseFloat(item.confidence) : 1.0;
    const manualOverride = item.manual_override ? 1 : 0;
    const reviewRequired = (item.review_required || confidence < 0.8) ? 1 : 0;

    const existing = queryOne(db, 'SELECT id, manual_override FROM phoneme_cache WHERE term = ?', [cleanTerm]);
    let phonemeId;
    if (existing) {
      if (!existing.manual_override) {
        db.run(`UPDATE phoneme_cache SET display_term=?, phoneme=?, phoneme_format=?, language=?,
          source=?, confidence=?, review_required=?, updated_at=datetime('now') WHERE term=?`,
          [item.display_term || item.term, item.phoneme.trim(),
          item.phoneme_format || 'CMU', item.language || 'en',
          item.source || 'g2p', confidence, reviewRequired, cleanTerm]);
      }
      phonemeId = existing.id;
    } else {
      db.run(`INSERT INTO phoneme_cache (term, display_term, phoneme, phoneme_format, language, source, confidence, manual_override, review_required)
        VALUES (?,?,?,?,?,?,?,?,?)`,
        [cleanTerm, item.display_term || item.term, item.phoneme.trim(),
        item.phoneme_format || 'CMU', item.language || 'en',
        item.source || 'g2p', confidence, manualOverride, reviewRequired]);
      const inserted = queryOne(db, 'SELECT id FROM phoneme_cache WHERE term = ?', [cleanTerm]);
      phonemeId = inserted ? inserted.id : null;
    }

    if (phonemeId && Array.isArray(item.aliases) && item.aliases.length > 0) {
      db.run('DELETE FROM phoneme_alias WHERE phoneme_id = ?', [phonemeId]);
      for (const alias of item.aliases) {
        const cleanAlias = alias.toLowerCase().trim();
        if (cleanAlias && cleanAlias !== cleanTerm) {
          db.run('INSERT OR IGNORE INTO phoneme_alias (phoneme_id, alias) VALUES (?, ?)', [phonemeId, cleanAlias]);
        }
      }
    }

    saveDb();
    return phonemeId;
  },

  accumulateTokens: async (projectId, promptTokens, completionTokens) => {
    if (!projectId || (!promptTokens && !completionTokens)) return;
    try {
      await initDb();
      const db = await getDb();
      const row = queryOne(db, 'SELECT config FROM projects WHERE id = ?', [projectId]);
      if (!row) return;
      const currentConfig = JSON.parse(row.config || '{}');
      const cur = currentConfig.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      const pCount = (cur.promptTokens || 0) + (promptTokens || 0);
      const cCount = (cur.completionTokens || 0) + (completionTokens || 0);
      const total = pCount + cCount;
      currentConfig.tokenUsage = { promptTokens: pCount, completionTokens: cCount, totalTokens: total };
      runQuery(db, 'UPDATE projects SET config = ? WHERE id = ?', [JSON.stringify(currentConfig), projectId]);
      console.log(`[Token Log] ✅ Accumulated tokens for project ${projectId}: +${promptTokens} prompt, +${completionTokens} completion. Total: ${total}`);
    } catch (err) {
      console.error('[db.js] Error accumulating tokens:', err.message);
    }
  },

  saveAIGenProject: async (id, title, config, status = 'COMPLETED') => {
    await initDb();
    const db = await getDb();
    let finalConfig = config;
    const existing = queryOne(db, 'SELECT config FROM projects WHERE id = ?', [id]);
    if (existing) {
      const existingConfig = JSON.parse(existing.config || '{}');
      const existingUsage = existingConfig.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      const newUsage = config.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      finalConfig = {
        ...existingConfig, ...config,
        tokenUsage: {
          promptTokens: Math.max(existingUsage.promptTokens || 0, newUsage.promptTokens || 0),
          completionTokens: Math.max(existingUsage.completionTokens || 0, newUsage.completionTokens || 0),
          totalTokens: Math.max(existingUsage.totalTokens || 0, newUsage.totalTokens || 0)
        }
      };
      runQuery(db, 'UPDATE projects SET title=?, config=?, status=? WHERE id=?',
        [title, JSON.stringify(finalConfig), status, id]);
    } else {
      runQuery(db, `INSERT INTO projects (id, title, status, config, type) VALUES (?,?,?,?,'AIGEN')`,
        [id, title, status, JSON.stringify(finalConfig)]);
    }
    return queryOne(db, 'SELECT * FROM projects WHERE id = ?', [id]);
  },

  saveUploadedMedia: async (url) => {
    if (!url) return;
    try {
      await initDb();
      const db = await getDb();
      runQuery(db, 'INSERT OR IGNORE INTO uploaded_media (url) VALUES (?)', [url]);
    } catch (err) {
      console.error('[db.js] Error saving uploaded media:', err.message);
    }
  },

  getUploadedMedia: async () => {
    try {
      await initDb();
      const db = await getDb();
      return queryAll(db, 'SELECT url FROM uploaded_media ORDER BY created_at DESC').map(r => r.url);
    } catch (err) {
      console.error('[db.js] Error getting uploaded media:', err.message);
      return [];
    }
  }
};
