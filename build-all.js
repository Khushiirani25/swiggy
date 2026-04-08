const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function build() {
  const root = process.cwd();
  const dist = path.join(root, 'dist');
  
  // 1. Clean previous dist
  console.log('🧹 Cleaning dist...');
  if (fs.existsSync(dist)) fs.removeSync(dist);
  fs.mkdirSync(dist);

  // 2. Build Apps
  const apps = [
    { name: 'admin', path: 'admin-dashboard', buildCmd: 'npm run build', buildDist: 'dist' },
    { name: 'app', path: 'customer-app', buildCmd: 'npx expo export --platform web', buildDist: 'dist' },
    { name: 'partner', path: 'restaurant-app', buildCmd: 'npx expo export --platform web', buildDist: 'dist' },
    { name: 'driver', path: 'delivery-app', buildCmd: 'npx expo export --platform web', buildDist: 'dist' }
  ];

  for (const app of apps) {
    console.log(`\n🚀 Building ${app.name.toUpperCase()}...`);
    const appDir = path.join(root, app.path);
    
    // Build
    execSync(app.buildCmd, { cwd: appDir, stdio: 'inherit' });
    
    // Copy to dist/
    const sourceDist = path.join(appDir, app.buildDist);
    const destDist = path.join(dist, app.name);
    fs.copySync(sourceDist, destDist);

    // FIX PATHS for sub-folder hosting
    const indexPath = path.join(destDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf8');
      // Prefix all root-level assets with the app name (e.g. /_expo -> /app/_expo)
      html = html.replace(/(href|src)="\/(_expo|assets|static|favicon|manifest|glyphicons)/g, `$1="/${app.name}/$2`);
      fs.writeFileSync(indexPath, html);
      console.log(`🔧 Paths fixed for ${app.name.toUpperCase()}`);
    }

    console.log(`✅ ${app.name.toUpperCase()} build moved to /${app.name}`);
  }

  // 3. Copy Gateway Files to Root
  console.log('\n🏠 Copying Gateway Files...');
  fs.copySync(path.join(root, 'index.html'), path.join(dist, 'index.html'));
  fs.copySync(path.join(root, 'gateway.css'), path.join(dist, 'gateway.css'));

  console.log('\n✨ UNIFIED ECOSYSTEM READY IN /dist');
}

build().catch(err => {
  console.error('❌ Build Failed:', err);
  process.exit(1);
});
