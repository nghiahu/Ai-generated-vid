const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { Pool } = require("pg");

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'ai_video_remotion',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

async function main() {
  const pool = new Pool(dbConfig);
  try {
    const projRes = await pool.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT 1');
    if (projRes.rowCount === 0) {
      console.log("No projects found.");
      return;
    }

    const proj = projRes.rows[0];
    console.log("=== PROJECT DETAILS ===");
    console.log(`ID: ${proj.id}`);
    console.log(`Title: ${proj.title}`);
    console.log(`Type: ${proj.type}`);
    console.log(`Status: ${proj.status}`);
    console.log("Config JSON:\n", JSON.stringify(proj.config, null, 2));

    // Check scenes table
    const scenesRes = await pool.query('SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_index', [proj.id]);
    console.log(`\nScenes Table Count: ${scenesRes.rowCount}`);
    scenesRes.rows.forEach((s, idx) => {
      console.log(`  - Scene ${idx}: ID=${s.id}, heading="${s.heading}", visualLayout="${s.visual_layout}", theme="${s.theme}"`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
