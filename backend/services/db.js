const { Client, Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
};

let pool = null;

async function initDb() {
  if (pool) return;

  // 1. Ensure the database exists
  const client = new Client({ ...dbConfig, database: 'postgres' });
  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'ai_video_remotion'`);
    if (res.rowCount === 0) {
      console.log("Database 'ai_video_remotion' does not exist. Creating it...");
      // CREATE DATABASE cannot run in a transaction block
      await client.query(`CREATE DATABASE ai_video_remotion`);
      console.log("Database 'ai_video_remotion' created successfully.");
    }
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }

  // 2. Initialize the pool connected to 'ai_video_remotion'
  pool = new Pool({ ...dbConfig, database: 'ai_video_remotion' });

  // 3. Create tables if they do not exist
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'DRAFT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      config JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
      scene_index INTEGER NOT NULL,
      duration DOUBLE PRECISION DEFAULT 6.0,
      layout_family VARCHAR(100),
      visual_layout VARCHAR(100),
      scene_intent JSONB,
      heading VARCHAR(255),
      points JSONB DEFAULT '[]'::jsonb,
      voiceover TEXT,
      voiceover_tts TEXT,
      voiceover_audio_url VARCHAR(500),
      placement VARCHAR(50),
      media_list JSONB DEFAULT '[]'::jsonb,
      selected_media_index INTEGER DEFAULT 0,
      theme VARCHAR(100) DEFAULT 'default',
      accent_color VARCHAR(50) DEFAULT '#FFB7C5',
      voiceover_duration DOUBLE PRECISION,
      subtitles_json JSONB DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS phoneme_cache (
      id BIGSERIAL PRIMARY KEY,
      term VARCHAR(150) NOT NULL UNIQUE,
      display_term VARCHAR(150),
      phoneme TEXT NOT NULL,
      phoneme_format VARCHAR(20) NOT NULL DEFAULT 'CMU',
      language VARCHAR(10) NOT NULL DEFAULT 'en',
      source VARCHAR(30) NOT NULL DEFAULT 'g2p',
      confidence NUMERIC(4,3) DEFAULT 1.000,
      manual_override BOOLEAN DEFAULT FALSE,
      review_required BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS phoneme_alias (
      id BIGSERIAL PRIMARY KEY,
      phoneme_id BIGINT REFERENCES phoneme_cache(id) ON DELETE CASCADE,
      alias VARCHAR(150) NOT NULL,
      UNIQUE(alias)
    );
  `;

  try {
    // Drop old table to clean up the legacy schema
    await pool.query(`DROP TABLE IF EXISTS pronunciation_cache`);
    
    await pool.query(createTablesQuery);
    // Alter existing tables if they don't have the columns
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS theme VARCHAR(100) DEFAULT 'default'`);
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT '#FFB7C5'`);
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS voiceover_tts TEXT`);
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS scene_intent JSONB`);
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS voiceover_duration DOUBLE PRECISION`);
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS subtitles_json JSONB DEFAULT '[]'::jsonb`);

    // Seed standard developer abbreviations and terms to prevent conflicts and incorrect CMU pronunciations
    const seedQueries = [
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
    
    const insertSeedQuery = `
      INSERT INTO phoneme_cache (term, display_term, phoneme, source, confidence, manual_override)
      VALUES ($1, $2, $3, 'system_seed', 1.000, true)
      ON CONFLICT (term) DO NOTHING
    `;
    for (const seed of seedQueries) {
      await pool.query(insertSeedQuery, seed);
    }

    console.log("PostgreSQL tables checked/created and seeded successfully.");
  } catch (err) {
    console.error("Error initializing database tables:", err);
  }
}

// Database helper functions
module.exports = {
  initDb,
  getProjects: async () => {
    await initDb();
    const res = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    return res.rows.map(row => ({
      ...row,
      createdAt: row.created_at
    }));
  },
  getProjectById: async (id) => {
    await initDb();
    const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectRes.rowCount === 0) return null;

    const project = projectRes.rows[0];
    const scenesRes = await pool.query('SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_index ASC', [id]);

    return {
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.created_at,
      config: project.config,
      scenes: scenesRes.rows.map(s => ({
        id: s.id,
        sceneIndex: s.scene_index,
        duration: s.duration,
        layoutFamily: s.layout_family,
        visualLayout: s.visual_layout,
        sceneIntent: s.scene_intent,
        heading: s.heading,
        points: s.points,
        voiceover: s.voiceover,
        voiceoverTts: s.voiceover_tts,
        voiceoverAudioUrl: s.voiceover_audio_url,
        placement: s.placement,
        mediaList: s.media_list,
        selectedMediaIndex: s.selected_media_index,
        theme: s.theme || 'default',
        accentColor: s.accent_color || '#FFB7C5',
        voiceoverDuration: s.voiceover_duration,
        subtitlesJson: s.subtitles_json
      }))
    };
  },
  createProject: async (title) => {
    await initDb();
    const id = `proj_${Math.random().toString(36).substr(2, 9)}`;
    const defaultConfig = {
      length: "Short (~60s)",
      language: "Vietnamese",
      voice: "omnivoice_duythanh",
      watermark: { enabled: true, text: "yupclip.com", position: "top-right", color: "#000000" },
      backgroundMusic: "Chill Lofi Beats"
    };

    const insertQuery = `
      INSERT INTO projects (id, title, status, config) 
      VALUES ($1, $2, 'DRAFT', $3) 
      RETURNING *
    `;
    const res = await pool.query(insertQuery, [id, title, JSON.stringify(defaultConfig)]);
    const row = res.rows[0];
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      createdAt: row.created_at,
      config: row.config,
      scenes: []
    };
  },
  updateProjectConfig: async (id, config) => {
    await initDb();
    // Get existing config first to merge it
    const projectRes = await pool.query('SELECT config FROM projects WHERE id = $1', [id]);
    if (projectRes.rowCount === 0) return null;

    const currentConfig = projectRes.rows[0].config;
    const mergedConfig = { ...currentConfig, ...config };

    const updateQuery = 'UPDATE projects SET config = $1 WHERE id = $2 RETURNING *';
    const res = await pool.query(updateQuery, [JSON.stringify(mergedConfig), id]);
    if (res.rowCount === 0) return null;

    return res.rows[0];
  },
  updateProjectScenes: async (id, scenes) => {
    await initDb();
    // Use a transaction to delete old scenes and insert new ones
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM scenes WHERE project_id = $1', [id]);

      const insertSceneQuery = `
        INSERT INTO scenes (
          id, project_id, scene_index, duration, layout_family, visual_layout, scene_intent,
          heading, points, voiceover, voiceover_tts, voiceover_audio_url, placement, media_list, selected_media_index,
          theme, accent_color, voiceover_duration, subtitles_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `;

      for (const scene of scenes) {
        await client.query(insertSceneQuery, [
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
          scene.theme || 'default',
          scene.accentColor || '#FFB7C5',
          scene.voiceoverDuration || null,
          JSON.stringify(scene.subtitlesJson || [])
        ]);
      }

      await client.query('COMMIT');
      
      // Fetch and return the updated project
      const updatedProject = await module.exports.getProjectById(id);
      return updatedProject;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  updateScene: async (projectId, sceneId, sceneData) => {
    await initDb();
    
    // Find keys to update
    const fields = [];
    const values = [];
    let placeholderIndex = 1;

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
      theme: 'theme',
      accentColor: 'accent_color',
      voiceoverDuration: 'voiceover_duration',
      subtitlesJson: 'subtitles_json'
    };

    for (const [key, dbCol] of Object.entries(columnMapping)) {
      if (sceneData[key] !== undefined) {
        fields.push(`${dbCol} = $${placeholderIndex}`);
        let val = sceneData[key];
        if (key === 'points' || key === 'mediaList' || key === 'subtitlesJson' || key === 'sceneIntent') {
          val = JSON.stringify(val);
        }
        values.push(val);
        placeholderIndex++;
      }
    }

    if (fields.length === 0) return null;

    values.push(projectId);
    const projPlaceholder = `$${placeholderIndex}`;
    placeholderIndex++;

    values.push(sceneId);
    const scenePlaceholder = `$${placeholderIndex}`;

    const updateQuery = `
      UPDATE scenes 
      SET ${fields.join(', ')} 
      WHERE project_id = ${projPlaceholder} AND id = ${scenePlaceholder} 
      RETURNING *
    `;

    const res = await pool.query(updateQuery, values);
    if (res.rowCount === 0) return null;

    const s = res.rows[0];
    return {
      id: s.id,
      sceneIndex: s.scene_index,
      duration: s.duration,
      layoutFamily: s.layout_family,
      visualLayout: s.visual_layout,
      sceneIntent: s.scene_intent,
      heading: s.heading,
      points: s.points,
      voiceover: s.voiceover,
      voiceoverTts: s.voiceover_tts,
      voiceoverAudioUrl: s.voiceover_audio_url,
      placement: s.placement,
      mediaList: s.media_list,
      selectedMediaIndex: s.selected_media_index,
      theme: s.theme || 'default',
      accentColor: s.accent_color || '#FFB7C5',
      voiceoverDuration: s.voiceover_duration,
      subtitlesJson: s.subtitles_json
    };
  },
  createScene: async (projectId, sceneData) => {
    await initDb();
    
    // Find next scene index
    const countRes = await pool.query('SELECT COUNT(*) FROM scenes WHERE project_id = $1', [projectId]);
    const nextIndex = parseInt(countRes.rows[0].count, 10);
    
    const id = `scene_${projectId}_${nextIndex}_${Math.random().toString(36).substr(2, 4)}`;
    
    const insertQuery = `
      INSERT INTO scenes (
        id, project_id, scene_index, duration, layout_family, visual_layout, scene_intent,
        heading, points, voiceover, voiceover_tts, voiceover_audio_url, placement, media_list, selected_media_index,
        theme, accent_color, voiceover_duration, subtitles_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;
    
    const res = await pool.query(insertQuery, [
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
    
    const s = res.rows[0];
    return {
      id: s.id,
      sceneIndex: s.scene_index,
      duration: s.duration,
      layoutFamily: s.layout_family,
      visualLayout: s.visual_layout,
      sceneIntent: s.scene_intent,
      heading: s.heading,
      points: s.points,
      voiceover: s.voiceover,
      voiceoverTts: s.voiceover_tts,
      voiceoverAudioUrl: s.voiceover_audio_url,
      placement: s.placement,
      mediaList: s.media_list,
      selectedMediaIndex: s.selected_media_index,
      theme: s.theme || 'default',
      accentColor: s.accent_color || '#FFB7C5',
      voiceoverDuration: s.voiceover_duration,
      subtitlesJson: s.subtitles_json
    };
  },
  deleteScene: async (projectId, sceneId) => {
    await initDb();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete the scene
      await client.query('DELETE FROM scenes WHERE project_id = $1 AND id = $2', [projectId, sceneId]);
      
      // Re-index remaining scenes sequentially
      const scenesRes = await client.query('SELECT id FROM scenes WHERE project_id = $1 ORDER BY scene_index ASC', [projectId]);
      const updateIndexQuery = 'UPDATE scenes SET scene_index = $1 WHERE id = $2';
      for (let i = 0; i < scenesRes.rows.length; i++) {
        await client.query(updateIndexQuery, [i, scenesRes.rows[i].id]);
      }
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  deleteProject: async (id) => {
    await initDb();
    const deleteQuery = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const res = await pool.query(deleteQuery, [id]);
    if (res.rowCount === 0) return null;
    return res.rows[0];
  },
  getPhonemeFromCache: async (term) => {
    await initDb();
    const cleanTerm = term.toLowerCase().trim();
    const query = `
      SELECT c.* FROM phoneme_cache c
      LEFT JOIN phoneme_alias a ON a.phoneme_id = c.id
      WHERE LOWER(c.term) = $1 OR LOWER(a.alias) = $1
      LIMIT 1
    `;
    const res = await pool.query(query, [cleanTerm]);
    return res.rowCount > 0 ? res.rows[0] : null;
  },
  savePhonemeToCache: async (item) => {
    if (!item || !item.term || !item.phoneme) return null;
    await initDb();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const cleanTerm = item.term.toLowerCase().trim();
      const displayTerm = item.display_term || item.term;
      const phoneme = item.phoneme.trim();
      const phonemeFormat = item.phoneme_format || 'CMU';
      const language = item.language || 'en';
      const source = item.source || 'g2p';
      const confidence = item.confidence !== undefined ? parseFloat(item.confidence) : 1.0;
      const manualOverride = item.manual_override || false;
      const reviewRequired = item.review_required || (confidence < 0.8);

      // Insert or update cache entry (manual_override check)
      const insertCacheQuery = `
        INSERT INTO phoneme_cache (term, display_term, phoneme, phoneme_format, language, source, confidence, manual_override, review_required, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (term) DO UPDATE SET
          display_term = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.display_term ELSE EXCLUDED.display_term END,
          phoneme = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.phoneme ELSE EXCLUDED.phoneme END,
          phoneme_format = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.phoneme_format ELSE EXCLUDED.phoneme_format END,
          language = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.language ELSE EXCLUDED.language END,
          source = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.source ELSE EXCLUDED.source END,
          confidence = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.confidence ELSE EXCLUDED.confidence END,
          review_required = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.review_required ELSE EXCLUDED.review_required END,
          updated_at = CASE WHEN phoneme_cache.manual_override = TRUE THEN phoneme_cache.updated_at ELSE NOW() END
        RETURNING id
      `;

      const cacheRes = await client.query(insertCacheQuery, [
        cleanTerm,
        displayTerm,
        phoneme,
        phonemeFormat,
        language,
        source,
        confidence,
        manualOverride,
        reviewRequired
      ]);

      const phonemeId = cacheRes.rows[0].id;

      // Handle aliases if present
      if (Array.isArray(item.aliases) && item.aliases.length > 0) {
        // Drop old aliases for this phoneme_id to prevent duplicates
        await client.query('DELETE FROM phoneme_alias WHERE phoneme_id = $1', [phonemeId]);
        
        const insertAliasQuery = `
          INSERT INTO phoneme_alias (phoneme_id, alias)
          VALUES ($1, $2)
          ON CONFLICT (alias) DO NOTHING
        `;
        for (const alias of item.aliases) {
          const cleanAlias = alias.toLowerCase().trim();
          if (cleanAlias && cleanAlias !== cleanTerm) {
            await client.query(insertAliasQuery, [phonemeId, cleanAlias]);
          }
        }
      }

      await client.query('COMMIT');
      return phonemeId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("[db.js] Error saving phoneme cache:", err);
      throw err;
    } finally {
      client.release();
    }
  },
  accumulateTokens: async (projectId, promptTokens, completionTokens) => {
    if (!projectId || !promptTokens) return;
    try {
      await initDb();
      const projectRes = await pool.query('SELECT config FROM projects WHERE id = $1', [projectId]);
      if (projectRes.rowCount === 0) return;

      const currentConfig = projectRes.rows[0].config || {};
      const currentUsage = currentConfig.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      
      const promptCount = (currentUsage.promptTokens || 0) + promptTokens;
      const completionCount = (currentUsage.completionTokens || 0) + completionTokens;
      const totalCount = promptCount + completionCount;

      const updatedConfig = {
        ...currentConfig,
        tokenUsage: {
          promptTokens: promptCount,
          completionTokens: completionCount,
          totalTokens: totalCount
        }
      };

      await pool.query('UPDATE projects SET config = $1 WHERE id = $2', [JSON.stringify(updatedConfig), projectId]);
      console.log(`[Token Log] Accumulated tokens for project ${projectId}: +${promptTokens} prompt, +${completionTokens} completion. Total: ${totalCount}`);
    } catch (err) {
      console.error("[db.js] Error accumulating tokens:", err.message);
    }
  }
};

