const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Helper to run commands
function runCmd(cmd, cwd) {
  console.log(`Executing: ${cmd} in ${cwd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// Custom recursive copy with filters
function copyFolder(src, dest, excludes = [], excludeExtensions = []) {
  if (!fs.existsSync(src)) return;
  
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const base = path.basename(src);
    if (excludes.includes(base)) return;
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    for (const file of files) {
      copyFolder(path.join(src, file), path.join(dest, file), excludes, excludeExtensions);
    }
  } else {
    const ext = path.extname(src).toLowerCase();
    if (excludeExtensions.includes(ext)) return;
    
    // Copy file
    fs.copyFileSync(src, dest);
  }
}

async function build() {
  try {
    // 1. Build Frontend
    console.log('[1/5] Building React frontend...');
    runCmd('npm run build', path.join(ROOT, 'frontend'));
    
    // 2. Install Electron dependencies
    console.log('\n[2/5] Installing Electron dependencies...');
    runCmd('npm install', __dirname);
    
    // 3. Sync resources
    console.log('\n[3/5] Syncing resources to local temp folder...');
    const tempDir = path.join(__dirname, 'temp-resources');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Copy Frontend Dist -> renderer
    console.log('  - Copying frontend dist...');
    copyFolder(
      path.join(ROOT, 'frontend', 'dist'),
      path.join(tempDir, 'renderer')
    );
    
    // Copy Backend -> backend (exclude dev nodes, cache, database, and generated assets)
    console.log('  - Copying backend...');
    copyFolder(
      path.join(ROOT, 'backend'),
      path.join(tempDir, 'backend'),
      ['node_modules', '.git', '.idea', 'scratch', '.cache', '.remotion', 'downloads', 'tts'],
      ['.sqlite', '.log', '.wav']
    );
    
    // Copy Remotion my-video -> my-video
    console.log('  - Copying my-video...');
    copyFolder(
      path.join(ROOT, 'my-video'),
      path.join(tempDir, 'my-video'),
      ['node_modules', '.git', '.idea', 'build', '.cache', '.remotion', 'downloads', 'tts'],
      ['.mp4', '.png', '.gif']
    );
    
    // Copy voice files
    console.log('  - Copying voice MP3s...');
    copyFolder(
      path.join(ROOT, 'mp3'),
      path.join(tempDir, 'mp3')
    );

    // Copy omnivoice-runtime.zip
    console.log('  - Copying omnivoice-runtime.zip...');
    const zipSrc = path.join(__dirname, 'runtimes', 'omnivoice-runtime.zip');
    const zipDest = path.join(tempDir, 'omnivoice-runtime.zip');
    const runtimesDir = path.dirname(zipSrc);
    if (!fs.existsSync(runtimesDir)) {
      fs.mkdirSync(runtimesDir, { recursive: true });
    }
    if (fs.existsSync(zipSrc)) {
      fs.copyFileSync(zipSrc, zipDest);
    } else {
      console.warn('  ⚠️ WARNING: electron/runtimes/omnivoice-runtime.zip not found! Build will package without it.');
    }
    
    // Re-install production dependencies inside copy folders to prevent carrying dev bloat
    console.log('  - Installing production node_modules in backend temp...');
    runCmd('npm install --omit=dev --no-audit --no-fund', path.join(tempDir, 'backend'));
    
    console.log('  - Installing production node_modules in my-video temp...');
    runCmd('npm install --omit=dev --no-audit --no-fund', path.join(tempDir, 'my-video'));
    
    // 4. Check assets
    console.log('\n[4/5] Checking assets...');
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir);
    }
    
    // 5. Package Electron app
    console.log('\n[5/5] Packaging Electron app...');
    // Detect OS and set build target
    const isMac = process.platform === 'darwin';
    const isDir = process.argv.includes('--dir');
    let targetFlag = isMac ? '--mac' : '--win --x64';
    if (isDir) {
      targetFlag += ' --dir';
    }
    
    runCmd(`npx electron-builder ${targetFlag}`, __dirname);
    
    // Clean up
    console.log('Cleaning up temporary resources...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log('\n================================================');
    console.log('   BUILD SUCCESSFUL!');
    console.log('================================================');
    if (isMac) {
      console.log('Output: electron/dist/ (Look for .dmg or .app file)');
    } else {
      console.log('Output: electron/dist/ (Look for .exe file)');
    }
  } catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
  }
}

build();
