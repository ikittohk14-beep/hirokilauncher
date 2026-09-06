#!/usr/bin/env bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

echo "Using NPM Mirror for faster Electron downloads..."
npx tsc
npx vite build
npx electron-builder --win
