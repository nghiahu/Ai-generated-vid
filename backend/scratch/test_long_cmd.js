const { execFile } = require('child_process');

// We use node.exe to exit with code 1
const nodeExe = process.execPath; 
// We build a very long argument list to simulate the long TTS text
const longText = 'a'.repeat(800);
const args = ['-e', 'process.exit(1)', '--text', longText];

execFile(nodeExe, args, (err, stdout, stderr) => {
  if (err) {
    console.log('Error Message:', err.message);
  } else {
    console.log('Success');
  }
});
