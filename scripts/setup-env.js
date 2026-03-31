const fs = require('fs');
const path = require('path');

const envContent = `NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCDs8p2RUR2onilqWdf6UoT1YxHvlf-TzE"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="gist-6062f.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="gist-6062f"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="gist-6062f.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="618311058705"
NEXT_PUBLIC_FIREBASE_APP_ID="1:618311058705:web:8c3622fefb2b9c5ebff8b0"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-DSZ7FQB1KD"
`;

const firebasercContent = `{
  "projects": {
    "default": "gist-6062f"
  }
}
`;

const firebaseJsonContent = `{
  "hosting": {
    "source": "apps/web",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "frameworksBackend": {
      "region": "us-central1"
    }
  }
}
`;

function setup() {
  console.log("Setting up deployment environments...");
  
  // 1. Create `.env.local` securely inside apps/web
  const envPath = path.join(process.cwd(), 'apps', 'web', '.env.local');
  fs.writeFileSync(envPath, envContent);
  console.log("✅ Created " + envPath);

  // 2. Create `.firebaserc`
  const rcPath = path.join(process.cwd(), '.firebaserc');
  fs.writeFileSync(rcPath, firebasercContent);
  console.log("✅ Created " + rcPath);

  // 3. Create `firebase.json` 
  const jsonPath = path.join(process.cwd(), 'firebase.json');
  fs.writeFileSync(jsonPath, firebaseJsonContent);
  console.log("✅ Created " + jsonPath);

  console.log("\\nEnvironment configured successfully!");
}

setup();
