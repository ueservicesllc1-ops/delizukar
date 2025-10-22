#!/usr/bin/env node

console.log('🚀 Starting production server...');

// Set production environment
process.env.NODE_ENV = 'production';

// Log environment variables (without sensitive data)
console.log('📋 Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT || 'not set');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('- FIREBASE_PROJECT_ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');

try {
  console.log('📦 Loading server...');
  require('./server.js');
} catch (error) {
  console.error('❌ Error starting server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
