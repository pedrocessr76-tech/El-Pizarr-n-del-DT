param(
  [string]$OutputDirectory = "./backups"
)

$required = @("B2B_DB_HOST", "B2B_DB_PORT", "B2B_DB_USER", "B2B_DB_PASSWORD", "B2B_DB_NAME")
foreach ($name in $required) {
  if (-not (Get-Item "Env:$name" -ErrorAction SilentlyContinue)) {
    throw "Falta la variable de entorno $name"
  }
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump no está instalado o no está disponible en PATH"
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$file = Join-Path $OutputDirectory "sistema_canchas_$stamp.dump"
$env:PGPASSWORD = $env:B2B_DB_PASSWORD

pg_dump --format=custom --no-owner --no-privileges `
  --host=$env:B2B_DB_HOST --port=$env:B2B_DB_PORT `
  --username=$env:B2B_DB_USER --dbname=$env:B2B_DB_NAME `
  --file=$file

if ($LASTEXITCODE -ne 0) {
  throw "pg_dump falló con código $LASTEXITCODE"
}

Write-Host "Backup B2B creado en $file" -ForegroundColor Green