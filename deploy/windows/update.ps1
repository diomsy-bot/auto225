# Met à jour le site avec la dernière version du code (PowerShell administrateur, depuis C:\auto225).
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

Stop-ScheduledTask -TaskName "AUTO225" -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

git pull
if ($LASTEXITCODE -ne 0) { throw "git pull a échoué" }
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci a échoué" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "La construction du site a échoué" }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "La mise à jour de la base a échoué" }

Start-ScheduledTask -TaskName "AUTO225"
Write-Output "Site mis à jour et relancé."
