const fs = require('fs');
const path = require('path');

function setup() {
  const examplePath = path.join(process.cwd(), '.env.example');
  const envPath = path.join(process.cwd(), 'apps', 'web', '.env.local');

  if (fs.existsSync(envPath)) {
    console.log("⚠️  apps/web/.env.local already exists — skipping. Fill in values manually.");
    return;
  }

  if (!fs.existsSync(examplePath)) {
    console.error("❌ .env.example not found. Cannot create .env.local.");
    process.exit(1);
  }

  fs.copyFileSync(examplePath, envPath);
  console.log("✅ Created apps/web/.env.local from .env.example");
  console.log("👉 Open apps/web/.env.local and fill in your Firebase config and API keys.");
}

setup();
