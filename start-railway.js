#!/usr/bin/env node

console.log('🚀 Starting Railway deployment...');

// Set environment variables for Railway
process.env.NODE_ENV = 'production';
process.env.CI = 'false';

console.log('📦 Building React application...');

const { execSync } = require('child_process');

try {
  // Build the React app
  console.log('🔨 Running npm run build...');
  execSync('CI=false npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
  
  // Start the server
  console.log('🌐 Starting server...');
  require('./server.js');
  
} catch (error) {
  console.error('❌ Error during startup:', error);
  process.exit(1);
}
