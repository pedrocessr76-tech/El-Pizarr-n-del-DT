if (-not $env:RENDER_API_KEY) {
  throw 'RENDER_API_KEY no está definida.'
}

$headers = @{ Authorization = "Bearer $env:RENDER_API_KEY" }
$services = Invoke-RestMethod -Method Get -Uri 'https://api.render.com/v1/services' -Headers $headers

$services | Select-Object id, name, type, serviceDetails | ConvertTo-Json -Depth 5
