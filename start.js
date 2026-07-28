const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// Helper to check and install node_modules
function ensureNodeModules(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  const packageJsonPath = path.join(dir, 'package.json');
  
  let needInstall = false;

  if (!fs.existsSync(nodeModulesPath)) {
    needInstall = true;
  } else if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      
      // Check if all dependencies exist in node_modules
      for (const dep of [...deps, ...devDeps]) {
        const depPath = path.join(nodeModulesPath, dep);
        if (!fs.existsSync(depPath)) {
          console.log(`\n🔍 Phát hiện thiếu thư viện "${dep}" trong ${name}.`);
          needInstall = true;
          break;
        }
      }
    } catch (e) {
      needInstall = true; // Fallback to install if parsing fails
    }
  }

  if (needInstall) {
    console.log(`\n📦 Đang tự động cập nhật thư viện cho ${name} (npm install)...`);
    try {
      execSync('npm install', { cwd: dir, stdio: 'inherit' });
      console.log(`✅ Cập nhật thư viện cho ${name} hoàn tất!\n`);
    } catch (err) {
      console.error(`❌ Lỗi khi chạy npm install cho ${name}:`, err.message);
      process.exit(1);
    }
  }
}

// Ensure both frontend and backend have node_modules
ensureNodeModules(BACKEND_DIR, 'Backend');
ensureNodeModules(FRONTEND_DIR, 'Frontend');

console.log('\n🚀 Đang khởi động dự án...');

// Color helper
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// Spawn process helper with prefixed output
function spawnProcess(command, args, cwd, name, color) {
  const proc = spawn(command, args, { cwd, shell: true });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line.trim()}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${colors.red}[${name} Error]${colors.reset} ${line.trim()}`);
      }
    });
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]${colors.reset} Tiến trình đã dừng với mã thoát ${code}`);
  });

  return proc;
}

const backendProcess = spawnProcess('npm', ['run', 'dev'], BACKEND_DIR, 'Backend', colors.cyan);
const frontendProcess = spawnProcess('npm', ['run', 'dev'], FRONTEND_DIR, 'Frontend', colors.green);

// Safe kill helper
function killProcess(proc) {
  if (proc && !proc.killed) {
    try {
      proc.kill('SIGINT');
    } catch (e) {}
  }
}

// Graceful shutdown handling
const cleanup = () => {
  console.log('\n🛑 Đang dừng dự án và dọn dẹp các tiến trình chạy ngầm...');
  killProcess(backendProcess);
  killProcess(frontendProcess);
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
