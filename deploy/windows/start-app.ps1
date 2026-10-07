# Lance le site AUTO225 en continu (relancé automatiquement s'il s'arrête).
# Exécuté au démarrage de Windows par la tâche planifiée « AUTO225 » (voir install-service.ps1).
$ErrorActionPreference = "Continue"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir = "C:\auto225-data\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $root

while ($true) {
    $log = Join-Path $logDir ("app-" + (Get-Date -Format "yyyyMMdd") + ".log")
    Add-Content -Path $log -Value ("--- Démarrage " + (Get-Date -Format "s"))
    & cmd.exe /c "npx next start -p 3000 -H 127.0.0.1 >> `"$log`" 2>&1"
    Add-Content -Path $log -Value ("--- Arrêt (code " + $LASTEXITCODE + "), relance dans 5 s")
    Start-Sleep -Seconds 5
}
