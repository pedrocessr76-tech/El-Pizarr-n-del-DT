# Script para construir e iniciar las aplicaciones Client y Server mediante Docker Compose

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Iniciando El Pizarrón del DT (Docker Compose)   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$dockerCmd = ""

if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    $dockerCmd = "docker compose"
} elseif (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    $dockerCmd = "docker-compose"
} else {
    Write-Host "[ERROR] Docker / Docker Compose no se encuentra instalado o en el PATH." -ForegroundColor Red
    exit 1
}

Write-Host "`n[+] Ejecutando: $dockerCmd up --build -d`n" -ForegroundColor Yellow

Invoke-Expression "$dockerCmd up --build -d"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] ¡Servicios iniciados con éxito!" -ForegroundColor Green
    Write-Host "--------------------------------------------------" -ForegroundColor Gray
    Write-Host " App Client (Frontend): http://localhost:5173" -ForegroundColor Green
    Write-Host " App Server (Backend):  http://localhost:3001" -ForegroundColor Green
    Write-Host " Documentación Swagger: http://localhost:3001/docs" -ForegroundColor Green
    Write-Host "--------------------------------------------------" -ForegroundColor Gray
} else {
    Write-Host "`n[ERROR] Ocurrió un error al iniciar los contenedores." -ForegroundColor Red
}
