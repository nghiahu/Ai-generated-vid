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
      heading VARCHAR(255),
      points JSONB DEFAULT '[]'::jsonb,
      voiceover TEXT,
      voiceover_audio_url VARCHAR(500),
      placement VARCHAR(50),
      media_list JSONB DEFAULT '[]'::jsonb,
      selected_media_index INTEGER DEFAULT 0,
      theme VARCHAR(100) DEFAULT 'default',
      accent_color VARCHAR(50) DEFAULT '#FFB7C5'
    );
  `;

  try {
    await pool.query(createTablesQuery);
    // Alter existing tables if they don't have the columns
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS theme VARCHAR(100) DEFAULT 'default'`);
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT '#FFB7C5'`);
    console.log("PostgreSQL tables checked/created successfully.");
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
        heading: s.heading,
        points: s.points,
        voiceover: s.voiceover,
        voiceoverAudioUrl: s.voiceover_audio_url,
        placement: s.placement,
        mediaList: s.media_list,
        selectedMediaIndex: s.selected_media_index,
        theme: s.theme || 'default',
        accentColor: s.accent_color || '#FFB7C5'
      }))
    };
  },
  createProject: async (title) => {
    await initDb();
    const id = `proj_${Math.random().toString(36).substr(2, 9)}`;
    const defaultConfig = {
      length: "Short (~60s)",
      language: "Vietnamese",
      voice: "rachel",
      watermark: { enabled: true, text: "yupclip.com", position: "top-right", color: "#000000" },
      ending: { enabled: true, logoText: "YupVid", website: "yupvid.com" },
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
          id, project_id, scene_index, duration, layout_family, visual_layout, 
          heading, points, voiceover, voiceover_audio_url, placement, media_list, selected_media_index,
          theme, accent_color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      for (const scene of scenes) {
        await client.query(insertSceneQuery, [
          scene.id,
          id,
          scene.sceneIndex,
          scene.duration,
          scene.layoutFamily,
          scene.visualLayout,
          scene.heading,
          JSON.stringify(scene.points),
          scene.voiceover,
          scene.voiceoverAudioUrl,
          scene.placement,
          JSON.stringify(scene.mediaList),
          scene.selectedMediaIndex,
          scene.theme || 'default',
          scene.accentColor || '#FFB7C5'
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
      heading: 'heading',
      points: 'points',
      voiceover: 'voiceover',
      voiceoverAudioUrl: 'voiceover_audio_url',
      placement: 'placement',
      mediaList: 'media_list',
      selectedMediaIndex: 'selected_media_index',
      theme: 'theme',
      accentColor: 'accent_color'
    };

    for (const [key, dbCol] of Object.entries(columnMapping)) {
      if (sceneData[key] !== undefined) {
        fields.push(`${dbCol} = $${placeholderIndex}`);
        let val = sceneData[key];
        if (key === 'points' || key === 'mediaList') {
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
      heading: s.heading,
      points: s.points,
      voiceover: s.voiceover,
      voiceoverAudioUrl: s.voiceover_audio_url,
      placement: s.placement,
      mediaList: s.media_list,
      selectedMediaIndex: s.selected_media_index,
      theme: s.theme || 'default',
      accentColor: s.accent_color || '#FFB7C5'
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
        id, project_id, scene_index, duration, layout_family, visual_layout, 
        heading, points, voiceover, voiceover_audio_url, placement, media_list, selected_media_index,
        theme, accent_color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const res = await pool.query(insertQuery, [
      id,
      projectId,
      nextIndex,
      sceneData.duration || 6.0,
      sceneData.layoutFamily || "Opening / Headline",
      sceneData.visualLayout || "Intro Profile",
      sceneData.heading || "Tiêu đề phân cảnh mới",
      JSON.stringify(sceneData.points || ["Ý chính 1", "Ý chính 2"]),
      sceneData.voiceover || "Lời thoại của phân cảnh mới.",
      sceneData.voiceoverAudioUrl || "",
      sceneData.placement || "Full",
      JSON.stringify(sceneData.mediaList || []),
      sceneData.selectedMediaIndex || 0,
      sceneData.theme || "default",
      sceneData.accentColor || "#FFB7C5"
    ]);
    
    const s = res.rows[0];
    return {
      id: s.id,
      sceneIndex: s.scene_index,
      duration: s.duration,
      layoutFamily: s.layout_family,
      visualLayout: s.visual_layout,
      heading: s.heading,
      points: s.points,
      voiceover: s.voiceover,
      voiceoverAudioUrl: s.voiceover_audio_url,
      placement: s.placement,
      mediaList: s.media_list,
      selectedMediaIndex: s.selected_media_index,
      theme: s.theme || 'default',
      accentColor: s.accent_color || '#FFB7C5'
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
  }
};
