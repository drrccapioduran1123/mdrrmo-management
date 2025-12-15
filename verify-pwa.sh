#!/bin/bash
# PWA Verification Script
# Run this script to verify all PWA files and configurations

set -e

echo "🔍 PWA Implementation Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1"; then
        echo -e "${GREEN}✓${NC} $1 contains: $2"
        return 0
    else
        echo -e "${RED}✗${NC} $1 missing: $2"
        return 1
    fi
}

echo "📁 Checking PWA Files..."
check_file "client/public/manifest.json" || exit 1
check_file "client/src/service-worker.ts" || exit 1
check_file "client/src/hooks/use-pwa.ts" || exit 1
check_file "client/src/components/pwa-status.tsx" || exit 1
check_file "PWA_IMPLEMENTATION.md" || exit 1
check_file "PWA_SUMMARY.md" || exit 1
echo ""

echo "📝 Checking HTML Integration..."
check_content "client/index.html" "rel=\"manifest\"" || exit 1
check_content "client/index.html" "theme-color" || exit 1
check_content "client/index.html" "apple-mobile-web-app-capable" || exit 1
echo ""

echo "⚙️  Checking Main Entry Point..."
check_content "client/src/main.tsx" "usePWA" || exit 1
check_content "client/src/main.tsx" "serviceWorker" || exit 1
echo ""

echo "🔧 Checking Vite Configuration..."
check_content "vite.config.ts" "service-worker" || exit 1
check_content "vite.config.ts" "service-worker.js" || exit 1
echo ""

echo "📋 Checking Service Worker Content..."
check_content "client/src/service-worker.ts" "CACHE_NAME" || exit 1
check_content "client/src/service-worker.ts" "addEventListener.*install" || exit 1
check_content "client/src/service-worker.ts" "addEventListener.*fetch" || exit 1
check_content "client/src/service-worker.ts" "/api/" || exit 1
echo ""

echo "🪝 Checking PWA Hooks..."
check_content "client/src/hooks/use-pwa.ts" "usePWA" || exit 1
check_content "client/src/hooks/use-pwa.ts" "useOnlineStatus" || exit 1
check_content "client/src/hooks/use-pwa.ts" "register.*service-worker.js" || exit 1
echo ""

echo "📦 Checking Manifest Content..."
check_content "client/public/manifest.json" "\"name\"" || exit 1
check_content "client/public/manifest.json" "\"display\": \"standalone\"" || exit 1
check_content "client/public/manifest.json" "\"icons\"" || exit 1
check_content "client/public/manifest.json" "\"shortcuts\"" || exit 1
echo ""

echo "✅ Checking TypeScript Compilation..."
if npm run check > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} TypeScript: 0 errors"
else
    echo -e "${RED}✗${NC} TypeScript compilation failed"
    exit 1
fi
echo ""

echo "🌐 Checking Server (localhost:5000)..."
if curl -s http://localhost:5000/manifest.json > /dev/null; then
    echo -e "${GREEN}✓${NC} manifest.json is accessible"
else
    echo -e "${YELLOW}⚠${NC} Server not responding (is 'npm run dev' running?)"
fi

if curl -s http://localhost:5000/src/service-worker.ts > /dev/null; then
    echo -e "${GREEN}✓${NC} service-worker.ts is accessible"
fi
echo ""

echo "📊 Build Artifacts..."
if [ -d "dist/public" ]; then
    echo -e "${GREEN}✓${NC} dist/public directory exists"
    if [ -f "dist/public/service-worker.js" ]; then
        SIZE=$(du -h "dist/public/service-worker.js" | cut -f1)
        echo -e "${GREEN}✓${NC} dist/public/service-worker.js ($SIZE)"
    fi
    if [ -f "dist/public/manifest.json" ]; then
        SIZE=$(du -h "dist/public/manifest.json" | cut -f1)
        echo -e "${GREEN}✓${NC} dist/public/manifest.json ($SIZE)"
    fi
else
    echo -e "${YELLOW}⚠${NC} dist/public not found (run 'npm run build')"
fi
echo ""

echo "=================================="
echo -e "${GREEN}✅ PWA Implementation Verified!${NC}"
echo ""
echo "Next Steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:5000"
echo "3. Test in DevTools → Application → Service Workers"
echo "4. Build for production: npm run build"
echo "5. Deploy dist/public/ directory"
echo ""
