# 🛑 Cómo Matar Todos los Procesos de Node.js en Windows

Esta guía explica cómo detener todos los procesos de Node.js que están ejecutándose en Windows.

## 🚀 Método 1: Usar el Script Automático (Recomendado)

El proyecto incluye un script que automáticamente encuentra y mata todos los procesos de Node.js:

```bash
node kill-all-node.js
```

Este script:
- ✅ Busca todos los procesos de `node.exe`
- ✅ Muestra los PIDs encontrados
- ✅ Mata todos los procesos automáticamente
- ✅ Muestra un resumen al finalizar

## 🔧 Método 2: Comando Manual en PowerShell

### Opción A: Matar todos los procesos de Node.js directamente

```powershell
taskkill /F /IM node.exe
```

Este comando:
- `/F` = Fuerza el cierre (force)
- `/IM` = Especifica el nombre de la imagen (imagename)
- `node.exe` = Todos los procesos de Node.js

### Opción B: Ver procesos primero, luego matarlos

1. **Ver todos los procesos de Node.js:**
   ```powershell
   tasklist /FI "IMAGENAME eq node.exe"
   ```

2. **Matar un proceso específico por PID:**
   ```powershell
   taskkill /PID <número_pid> /F
   ```

3. **Matar todos los procesos de Node.js:**
   ```powershell
   taskkill /F /IM node.exe
   ```

## 🔍 Método 3: Matar Procesos en un Puerto Específico

Si solo quieres matar procesos que están usando un puerto específico (por ejemplo, puerto 3000 o 5000):

### Paso 1: Encontrar qué proceso usa el puerto
```powershell
netstat -ano | findstr :3000
```

Esto mostrará algo como:
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234
```

El último número (1234) es el PID.

### Paso 2: Matar el proceso por PID
```powershell
taskkill /PID 1234 /F
```

### Script completo para un puerto específico:
```powershell
# Para puerto 3000
netstat -ano | findstr :3000 | ForEach-Object { 
    $pid = ($_ -split '\s+')[-1]
    if ($pid -and $pid -ne '0') {
        taskkill /PID $pid /F
    }
}

# Para puerto 5000
netstat -ano | findstr :5000 | ForEach-Object { 
    $pid = ($_ -split '\s+')[-1]
    if ($pid -and $pid -ne '0') {
        taskkill /PID $pid /F
    }
}
```

## 📋 Método 4: Usar el Administrador de Tareas

1. Presiona `Ctrl + Shift + Esc` para abrir el Administrador de Tareas
2. Ve a la pestaña "Detalles"
3. Busca todos los procesos llamados `node.exe`
4. Selecciónalos (usa `Ctrl + Click` para seleccionar múltiples)
5. Haz clic derecho → "Finalizar tarea"

## 🎯 Casos de Uso Comunes

### Reiniciar el servidor de desarrollo
```bash
# 1. Matar todos los procesos
node kill-all-node.js

# 2. Reiniciar
npm run dev
```

### Liberar puertos ocupados
```bash
# Matar procesos en puerto 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Matar procesos en puerto 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Limpiar antes de iniciar
```bash
# Script de limpieza completa
node kill-all-node.js
npm run dev
```

## ⚠️ Advertencias Importantes

1. **Pérdida de datos**: Matar procesos de forma forzada puede causar pérdida de datos no guardados
2. **Otros proyectos**: El comando `taskkill /F /IM node.exe` mata TODOS los procesos de Node.js, incluyendo otros proyectos que puedas tener abiertos
3. **Permisos**: Algunos procesos pueden requerir permisos de administrador

## 🔐 Si Necesitas Permisos de Administrador

Si recibes un error de permisos, ejecuta PowerShell como administrador:

1. Busca "PowerShell" en el menú de inicio
2. Haz clic derecho → "Ejecutar como administrador"
3. Ejecuta el comando nuevamente

## 📝 Resumen de Comandos Rápidos

| Acción | Comando |
|--------|---------|
| Matar todos los procesos Node.js | `taskkill /F /IM node.exe` |
| Ver procesos Node.js | `tasklist /FI "IMAGENAME eq node.exe"` |
| Ver qué usa puerto 3000 | `netstat -ano \| findstr :3000` |
| Matar proceso por PID | `taskkill /PID <pid> /F` |
| Usar script automático | `node kill-all-node.js` |

## 🆘 Solución de Problemas

### Error: "No se pudo matar el proceso"
- Ejecuta PowerShell como administrador
- Verifica que el PID sea correcto
- Algunos procesos del sistema no se pueden matar

### Error: "El proceso no se encontró"
- El proceso ya fue terminado
- Verifica con `tasklist` que el proceso existe

### Los puertos siguen ocupados
- Espera unos segundos después de matar el proceso
- Reinicia tu terminal/IDE
- Reinicia tu computadora si es necesario

---

**💡 Tip**: Agrega el script `kill-all-node.js` a tu `package.json` para acceso rápido:

```json
{
  "scripts": {
    "kill-node": "node kill-all-node.js"
  }
}
```

Luego puedes usar: `npm run kill-node`


