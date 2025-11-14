#!/bin/bash
set -e

echo "🔨 Building Suno Music App for Cloudflare Pages..."

# Build Next.js
pnpm build

# Copier les fichiers statiques nécessaires
echo "📦 Preparing static files..."
cp -r public/* .next/standalone/public/ 2>/dev/null || true

echo "✅ Build completed!"
