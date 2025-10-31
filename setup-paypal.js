#!/usr/bin/env node

/**
 * Script de configuración de PayPal para Delizukar
 * Este script ayuda a configurar PayPal en tu aplicación
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎉 ¡Bienvenido al configurador de PayPal para Delizukar!');
console.log('================================================\n');

console.log('Este script te ayudará a configurar PayPal en tu aplicación.');
console.log('Necesitarás tener una cuenta de PayPal Developer.\n');

console.log('📋 Pasos previos:');
console.log('1. Ve a https://developer.paypal.com/');
console.log('2. Inicia sesión con tu cuenta de PayPal');
console.log('3. Ve a "My Apps & Credentials"');
console.log('4. Crea una nueva aplicación o usa una existente');
console.log('5. Copia el Client ID y Client Secret\n');

const questions = [
  {
    key: 'clientId',
    question: '🔑 Ingresa tu PayPal Client ID (sandbox): ',
    required: true
  },
  {
    key: 'clientSecret',
    question: '🔐 Ingresa tu PayPal Client Secret (sandbox): ',
    required: true
  },
  {
    key: 'environment',
    question: '🌍 Entorno (sandbox/production) [sandbox]: ',
    default: 'sandbox'
  },
  {
    key: 'currency',
    question: '💰 Moneda (USD/EUR/GBP) [USD]: ',
    default: 'USD'
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    generateEnvFile();
    return;
  }

  const q = questions[index];
  const prompt = q.default ? `${q.question}[${q.default}] ` : q.question;
  
  rl.question(prompt, (answer) => {
    const value = answer.trim() || q.default || '';
    
    if (q.required && !value) {
      console.log('❌ Este campo es requerido. Inténtalo de nuevo.\n');
      askQuestion(index);
      return;
    }
    
    answers[q.key] = value;
    console.log(`✅ ${q.key}: ${value}\n`);
    askQuestion(index + 1);
  });
}

function generateEnvFile() {
  console.log('📝 Generando archivo de configuración...\n');
  
  const envContent = `# PayPal Configuration for Delizukar
# Generated on ${new Date().toISOString()}

REACT_APP_PAYPAL_CLIENT_ID=${answers.clientId}
PAYPAL_CLIENT_SECRET=${answers.clientSecret}
REACT_APP_PAYPAL_ENVIRONMENT=${answers.environment}
REACT_APP_PAYPAL_CURRENCY=${answers.currency}
REACT_APP_PAYPAL_INTENT=capture

# ==================== INSTRUCCIONES ====================
# 1. Este archivo contiene tu configuración de PayPal
# 2. NO compartas este archivo públicamente
# 3. Para producción, cambia REACT_APP_PAYPAL_ENVIRONMENT a "production"
# 4. Usa credenciales de producción para pagos reales
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env.local creado exitosamente!');
    console.log(`📁 Ubicación: ${envPath}\n`);
    
    console.log('🚀 Próximos pasos:');
    console.log('1. Reinicia tu servidor de desarrollo (npm start)');
    console.log('2. Prueba los pagos con PayPal en tu aplicación');
    console.log('3. Para producción, actualiza las credenciales\n');
    
    console.log('🔧 Comandos útiles:');
    console.log('- npm start (iniciar desarrollo)');
    console.log('- npm run build (construir para producción)');
    console.log('- npm run test-paypal (probar integración)\n');
    
  } catch (error) {
    console.error('❌ Error al crear el archivo:', error.message);
  }
  
  rl.close();
}

// Verificar si ya existe un archivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  rl.question('⚠️  Ya existe un archivo .env.local. ¿Deseas sobrescribirlo? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      askQuestion(0);
    } else {
      console.log('Configuración cancelada.');
      rl.close();
    }
  });
} else {
  askQuestion(0);
}








