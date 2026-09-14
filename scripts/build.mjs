import { build } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');

async function copyAssets() {
  // Ensure dist exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy manifest
  fs.copyFileSync(
    path.resolve(rootDir, 'src/manifest.json'),
    path.resolve(distDir, 'manifest.json')
  );

  // Copy content css
  fs.copyFileSync(
    path.resolve(rootDir, 'src/content/styles.css'),
    path.resolve(distDir, 'content.css')
  );

  // Copy icons
  const iconsDist = path.resolve(distDir, 'icons');
  if (!fs.existsSync(iconsDist)) {
    fs.mkdirSync(iconsDist, { recursive: true });
  }
  const iconsSrc = path.resolve(rootDir, 'public/icons');
  if (fs.existsSync(iconsSrc)) {
    fs.readdirSync(iconsSrc).forEach((file) => {
      fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDist, file));
    });
  }
}

async function runBuild() {
  console.log('📦 Starting Chrome Extension build...');

  // 1. Build Popup (HTML + CSS + JS)
  console.log('🔨 Building Popup UI...');
  await build({
    configFile: false,
    root: rootDir,
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(rootDir, 'popup.html'),
        },
        output: {
          entryFileNames: 'popup.js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) return 'popup.css';
            return 'assets/[name].[ext]';
          },
        },
      },
    },
  });

  // 2. Build Content Script (IIFE - completely standalone bundle)
  console.log('🔨 Building Content Script...');
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(rootDir, 'src/content/index.ts'),
        formats: ['iife'],
        name: 'GoogleFormsAISolver',
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  });

  // 3. Build Background Service Worker
  console.log('🔨 Building Background Service Worker...');
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(rootDir, 'src/background/index.ts'),
        formats: ['es'],
        fileName: () => 'background.js',
      },
    },
  });

  // 4. Copy assets & Manifest
  console.log('📋 Copying Manifest and static assets...');
  await copyAssets();

  console.log('✅ Chrome Extension build finished successfully in dist/ !');
}

runBuild().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
