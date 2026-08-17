const { execFile } = require('child_process');
const path = require('path');

const longPath = 'C:\\Users\\haudinh\\AppData\\Roaming\\ai-video-app\\omnivoice-runtime\\Python311\\Scripts\\omnivoice-infer.exe';

execFile(longPath, ['--some-argument'], (err, stdout, stderr) => {
  if (err) {
    console.log('Error Message:', err.message);
  } else {
    console.log('Success');
  }
});
