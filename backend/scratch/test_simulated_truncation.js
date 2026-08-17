const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

// We simulate the client's path structure in our scratch directory
const tempDir = path.join(__dirname, 'omnivoice-runtime', 'Python311', 'Scripts');
fs.mkdirSync(tempDir, { recursive: true });

// Copy node.exe to the deep path
const simulatedExe = path.join(tempDir, 'omnivoice-infer.exe');
fs.copyFileSync(process.execPath, simulatedExe);

console.log('Running simulated executable:', simulatedExe);

// Build a long argument list similar to the TTS arguments
const args = ['-e', 'process.exit(1)', '--text', 'hi hục kéo thả từng cái khối hình vuông tròn để vẽ flâu chat mất cả buổi chiều. việc này xưa rồi. giờ chỉ cần 30 giây gõ vài dòng text là có ngay biểu đồ chuẩn xác.'];

execFile(simulatedExe, args, (err, stdout, stderr) => {
  if (err) {
    console.log('\n--- ERROR MESSAGE ---');
    console.log(err.message);
  } else {
    console.log('Success');
  }

  // Cleanup
  try {
    fs.unlinkSync(simulatedExe);
    fs.rmdirSync(tempDir);
    fs.rmdirSync(path.join(__dirname, 'omnivoice-runtime', 'Python311'));
    fs.rmdirSync(path.join(__dirname, 'omnivoice-runtime'));
  } catch (e) {}
});
