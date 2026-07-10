const phoneme = require("./services/phoneme");
const db = require("./services/db");

async function test() {
  await db.initDb();
  const text = "Bạn có thể cắm thử một MCP server có sẵn — ví dụ cho AI đọc thư mục dự án của bạn — và tận mắt thấy nó truy cập";
  console.log("Original:", text);
  const optimized = await phoneme.optimizeTextForPhonemes(text);
  console.log("Optimized:", optimized);
  process.exit(0);
}

test();
