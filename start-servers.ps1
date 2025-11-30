# Script PowerShell para iniciar servidores con salida visible
Write-Host "🛑 Deteniendo procesos Node existentes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "🚀 Iniciando servidor backend (puerto 5000)..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node server.js
}

Write-Host "⏳ Esperando 3 segundos para que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "🌐 Iniciando servidor React (puerto 3000)..." -ForegroundColor Green
$reactJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:PORT = "3000"
    npm start
}

Write-Host ""
Write-Host "✅ Servidores iniciados en segundo plano" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver los logs:" -ForegroundColor Yellow
Write-Host "  Get-Job | Receive-Job" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener los servidores:" -ForegroundColor Yellow
Write-Host "  Stop-Job -Job `$backendJob,`$reactJob; Remove-Job -Job `$backendJob,`$reactJob" -ForegroundColor Gray
Write-Host "  Get-Process node | Stop-Process -Force" -ForegroundColor Gray
Write-Host ""

# Esperar un poco y verificar
Start-Sleep -Seconds 5
Write-Host "🔍 Verificando puertos..." -ForegroundColor Yellow
$ports = netstat -ano | Select-String "LISTENING" | Select-String ":3000|:5000"
if ($ports) {
    Write-Host "✅ Puertos activos:" -ForegroundColor Green
    $ports | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠️  No se detectaron puertos activos. Revisa los logs." -ForegroundColor Red
}
