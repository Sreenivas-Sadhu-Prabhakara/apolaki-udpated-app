#!/bin/bash
# Step 1.2: Replace @netlify/neon with @neondatabase/serverless
set -euo pipefail

SVC_DIR="/Users/macstudio/Documents/Code/apolaki-udpated-app/middleware/netlify-db-service"
cd "$SVC_DIR"

echo "=== Step 1.2: Swap @netlify/neon → @neondatabase/serverless ==="
echo ""

# Use node to safely edit package.json (sed is fragile with @ and / in package names)
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove @netlify/neon
if (pkg.dependencies['@netlify/neon']) {
  delete pkg.dependencies['@netlify/neon'];
  console.log('Removed: @netlify/neon');
} else {
  console.log('@netlify/neon not found (already removed)');
}

// Add @neondatabase/serverless
pkg.dependencies['@neondatabase/serverless'] = '^0.10.0';
console.log('Added: @neondatabase/serverless ^0.10.0');

// Update description
pkg.description = 'Apolaki Solar Platform - DB Service using Neon Serverless PostgreSQL';

// Keep pg as-is (it's the standard fallback)
console.log('Kept: pg ' + pkg.dependencies['pg']);

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated');
"

echo ""
echo "Running npm install..."
npm install 2>&1 | tail -5

echo ""
# Verify
if [ -d "node_modules/@neondatabase/serverless" ]; then
  echo "✅ @neondatabase/serverless installed"
else
  echo "STEP_RESULT: FAILED: @neondatabase/serverless not found in node_modules"
  exit 1
fi

if [ ! -d "node_modules/@netlify/neon" ]; then
  echo "✅ @netlify/neon removed"
else
  echo "⚠️  @netlify/neon still present (may be a transitive dep)"
fi

echo ""
echo "STEP_RESULT: SUCCESS"
