const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../services/db');

async function main() {
  await db.initDb();
  const media = await db.getUploadedMedia();
  console.log("=== UPLOADED MEDIA ===");
  console.log(`Total items: ${media.length}`);
  media.forEach((m, i) => {
    console.log(`${i}: ${m}`);
  });
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
