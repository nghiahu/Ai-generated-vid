const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../services/db');

async function main() {
  const pool = require('../services/db').getPool?.() || new (require('pg').Pool)({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: 'ai_video_remotion'
  });

  try {
    const res = await pool.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT 1');
    const project = res.rows[0];
    const scenes = project.config.scenes || [];
    const scene3 = scenes[2]; // Scene 3 is index 2
    console.log('Scene 3 tsxCode:');
    console.log(scene3.tsxCode);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
