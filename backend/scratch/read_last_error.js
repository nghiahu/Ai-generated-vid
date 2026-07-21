const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "../error.log");
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, "utf8");
  const blocks = content.split("--- [");
  console.log("Total error blocks:", blocks.length);
  if (blocks.length > 1) {
    console.log("Last block:");
    console.log("--- [" + blocks[blocks.length - 1]);
  }
} else {
  console.log("error.log does not exist");
}
