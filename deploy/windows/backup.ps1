# Sauvegarde quotidienne : base de données + fichiers (photos et justificatifs).
# À planifier chaque nuit et à copier vers un stockage indépendant du serveur.
param([string]$Dest = "C:\auto225-data\backups")
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")

# Lit DATABASE_URL et STORAGE_DIR dans le fichier .env du site.
$envVars = @{}
foreach ($line in Get-Content (Join-Path $root ".env")) {
    if ($line -match '^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$') { $envVars[$Matches[1]] = $Matches[2] }
}
$pgDump = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\pg_dump.exe" | Sort-Object FullName | Select-Object -Last 1
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

& $pgDump.FullName --format=custom --file (Join-Path $Dest "db-$stamp.dump") --dbname $envVars["DATABASE_URL"]
if ($LASTEXITCODE -ne 0) { throw "pg_dump a échoué" }
Compress-Archive -Path $envVars["STORAGE_DIR"] -DestinationPath (Join-Path $Dest "storage-$stamp.zip")

# Conserve 30 jours de sauvegardes locales.
Get-ChildItem $Dest -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
Write-Output "Sauvegarde terminée : $Dest ($stamp)"
