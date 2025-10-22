#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🔄 Reiniciando servidor Stripe...');

// Matar procesos en puerto 5000
exec('netstat -ano | findstr :5000', (error, stdout, stderr) => {
  if (stdout) {
    console.log('🔍 Procesos encontrados en puerto 5000:');
    console.log(stdout);
    
    // Extraer PID y matar proceso
    const lines = stdout.split('\n');
    lines.forEach(line => {
      if (line.includes(':5000')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          console.log(`🛑 Matando proceso ${pid}...`);
          exec(`taskkill /PID ${pid} /F`, (err, out) => {
            if (err) {
              console.log('⚠️ No se pudo matar el proceso:', err.message);
            } else {
              console.log('✅ Proceso terminado');
            }
          });
        }
      }
    });
  }
  
  // Esperar un momento y reiniciar
  setTimeout(() => {
    console.log('🚀 Iniciando nuevo servidor...');
    const { spawn } = require('child_process');
    const server = spawn('node', ['simple-stripe-server.js'], {
      stdio: 'inherit'
    });
    
    server.on('error', (err) => {
      console.error('❌ Error iniciando servidor:', err);
    });
    
    console.log('✅ Servidor reiniciado en puerto 5000');
  }, 2000);
});
