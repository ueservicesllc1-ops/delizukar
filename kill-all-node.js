#!/usr/bin/env node

/**
 * Script para matar TODOS los procesos de Node.js en Windows
 * 
 * Uso:
 *   node kill-all-node.js
 */

const { exec } = require('child_process');

console.log('🔍 Buscando todos los procesos de Node.js...\n');

// En Windows, usamos tasklist para encontrar procesos de node.exe
exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error buscando procesos:', error.message);
    return;
  }

  if (!stdout || stdout.trim().length === 0 || stdout.includes('INFO: No tasks')) {
    console.log('✅ No se encontraron procesos de Node.js ejecutándose.');
    return;
  }

  // Parsear la salida CSV
  const lines = stdout.trim().split('\n');
  const processes = [];
  
  // Saltar la primera línea (encabezado)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // CSV format: "node.exe","1234","Session Name","Session#","Mem Usage"
      const match = line.match(/"node\.exe","(\d+)"/);
      if (match) {
        processes.push(match[1]);
      }
    }
  }

  if (processes.length === 0) {
    console.log('✅ No se encontraron procesos de Node.js ejecutándose.');
    return;
  }

  console.log(`📋 Se encontraron ${processes.length} proceso(s) de Node.js:\n`);
  processes.forEach(pid => {
    console.log(`   - PID: ${pid}`);
  });

  console.log('\n🛑 Matando todos los procesos de Node.js...\n');

  // Matar cada proceso
  let killed = 0;
  let errors = 0;

  processes.forEach((pid, index) => {
    exec(`taskkill /PID ${pid} /F`, (err, out) => {
      if (err) {
        console.log(`⚠️  No se pudo matar el proceso ${pid}: ${err.message}`);
        errors++;
      } else {
        console.log(`✅ Proceso ${pid} terminado correctamente`);
        killed++;
      }

      // Cuando terminamos de procesar todos
      if (killed + errors === processes.length) {
        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Procesos terminados: ${killed}`);
        if (errors > 0) {
          console.log(`   ⚠️  Errores: ${errors}`);
        }
        console.log('\n✨ ¡Listo! Todos los procesos de Node.js han sido terminados.');
      }
    });
  });
});


