# Installe le démarrage automatique du site (tâche planifiée) et de Caddy (service Windows).
# À exécuter une fois, dans PowerShell ouvert en administrateur, depuis C:\auto225.
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$startScript = Join-Path $PSScriptRoot "start-app.ps1"
$caddyfile = Join-Path $PSScriptRoot "Caddyfile"

# 1. Site Next.js : tâche planifiée au démarrage, sous le compte SYSTEM, sans limite de durée.
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
Register-ScheduledTask -TaskName "AUTO225" -Action $action -Trigger $trigger -Settings $settings -User "SYSTEM" -RunLevel Highest -Force | Out-Null
Start-ScheduledTask -TaskName "AUTO225"
Write-Output "Site : tâche planifiée AUTO225 installée et démarrée."

# 2. Caddy : service Windows démarré automatiquement.
if (-not (Get-Service -Name "caddy" -ErrorAction SilentlyContinue)) {
    # Chemins sans espaces : pas de guillemets imbriqués à passer à sc.exe.
    sc.exe create caddy start= auto binPath= "C:\caddy\caddy.exe run --config $caddyfile" | Out-Null
}
Start-Service -Name "caddy"
Write-Output "Caddy : service installé et démarré."

# 3. Pare-feu : ouvrir HTTP et HTTPS.
foreach ($port in 80, 443) {
    if (-not (Get-NetFirewallRule -DisplayName "AUTO225 $port" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "AUTO225 $port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
    }
}
Write-Output "Pare-feu : ports 80 et 443 ouverts."
