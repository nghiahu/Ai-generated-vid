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
    if (res.rowCount === 0) {
      console.log('No projects found in DB.');
      return;
    }
    const project = res.rows[0];
    console.log('Latest Project:', project.title, 'ID:', project.id);
    const scenes = project.config.scenes || [];
    console.log('Scenes count:', scenes.length);
    scenes.forEach((sc, idx) => {
      console.log(`\n================ Scene ${idx + 1} ================`);
      console.log('Visual Pattern:', sc.visualPattern);
      console.log('Heading:', sc.heading);
      console.log('tsxCode length:', sc.tsxCode?.length);
      console.log('tsxCode excerpt:', sc.tsxCode?.substring(0, 400));
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
