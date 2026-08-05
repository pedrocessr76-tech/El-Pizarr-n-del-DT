# Script para detener las aplicaciones Client y Server mediante Docker Compose

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "  Deteniendo El Pizarrón del DT (Docker Compose)  " -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

$dockerCmd = ""

if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    $dockerCmd = "docker compose"
} elseif (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    $dockerCmd = "docker-compose"
} else {
    Write-Host "[ERROR] Docker / Docker Compose no se encuentra instalado o en el PATH." -ForegroundColor Red
    exit 1
}

Write-Host "`n[-] Ejecutando: $dockerCmd down`n" -ForegroundColor Yellow

Invoke-Expression "$dockerCmd down"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] ¡Servicios detenidos y contenedores eliminados correctamente!" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Ocurrió un error al detener los contenedores." -ForegroundColor Red
}
