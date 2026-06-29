const assert = require('assert');

// Hàm parse logs đơn giản để test trước khi implement vào render.js
// Ở đây chúng ta giả lập hàm parse mà chúng ta định viết
function parseLogLine(text) {
  let progress = 0.0;
  let renderedFrames = 0;
  let totalFrames = 0;

  const frameMatch = text.match(/frame (\d+)\/(\d+)/i);
  if (frameMatch) {
    renderedFrames = parseInt(frameMatch[1], 10);
    totalFrames = parseInt(frameMatch[2], 10);
  }

  const percentMatch = text.match(/\((\d+)%\)/);
  if (percentMatch) {
    progress = parseInt(percentMatch[1], 10) / 100;
  }
  
  return {
    progress,
    renderedFrames,
    totalFrames
  };
}

// Chạy thử với log Remotion thực tế
const sampleLog = "[Remotion CLI]: Rendered frame 45/300 (15%)";
const result = parseLogLine(sampleLog);

console.log("Chạy test thử nghiệm parser cũ...");
try {
  assert.strictEqual(result.progress, 0.15);
  console.log("✓ Parse progress thành công.");
  
  assert.strictEqual(result.renderedFrames, 45); // Sẽ lỗi vì phiên bản cũ trả về 0
  assert.strictEqual(result.totalFrames, 300);    // Sẽ lỗi vì phiên bản cũ trả về 0
  console.log("✓ Parse frames thành công.");
  // Test Mock API Response structure
  const renderStatusMock = {
    status: 'rendering',
    progress: result.progress,
    renderedFrames: result.renderedFrames,
    totalFrames: result.totalFrames,
    videoUrl: null
  };
  assert.strictEqual(renderStatusMock.renderedFrames, 45);
  assert.strictEqual(renderStatusMock.totalFrames, 300);
  console.log("✓ API Response structure checked successfully.");
  console.log("PASS: Test thành công!");
} catch (err) {
  console.log("FAIL: Test thất bại!");
  console.error(err.message);
  process.exit(1);
}
