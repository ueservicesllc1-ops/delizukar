# Script PowerShell para iniciar servidores de forma independiente y persistente
Write-Host "Deteniendo procesos Node existentes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

Write-Host "Iniciando servidor backend (puerto 5000)..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot

Start-Sleep -Seconds 2

Write-Host "Iniciando servidor React (puerto 3000)..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start" -WorkingDirectory $PSScriptRoot

Write-Host ""
Write-Host "Servidores iniciados correctamente en segundo plano" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detenerlos en cualquier momento: npm run kill-node o taskkill /F /IM node.exe" -ForegroundColor Yellow
