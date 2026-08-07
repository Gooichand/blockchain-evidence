# EVID-DGC server watchdog — keeps the API running on port 10000.
# If the node process ever exits (crash/kill), it restarts automatically.
# Logs go to server.out.log / server.err.log.
param([switch]$NoRestart)

$ErrorActionPreference = 'Stop'
$workdir = 'D:\MY-Project\blockchain-evidence'
$port = 10000

function Stop-PortOwner {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        Write-Host "[watchdog] Stopping existing process on port $port (PID $($conn.OwningProcess))"
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

Write-Host "[watchdog] Starting EVID-DGC API watch-loop on port $port (Ctrl+C to stop)"

while ($true) {
    if ($NoRestart) { break }
    Stop-PortOwner

    $proc = Start-Process node -ArgumentList 'server.js' -WorkingDirectory $workdir -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $workdir 'server.out.log') `
        -RedirectStandardError (Join-Path $workdir 'server.err.log') -PassThru

    # Wait until health responds (max 30s)
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        try {
            $r = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$port/api/health" -TimeoutSec 3
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch { }
        if ($proc.HasExited) { break }
    }

    if ($ready) {
        Write-Host "[watchdog] Server UP on port $port (PID $($proc.Id)). Monitoring..."
    } else {
        Write-Host "[watchdog] Server did not become healthy. Restarting..."
    }

    # Block until the process exits
    try { Wait-Process -Id $proc.Id -ErrorAction Stop } catch { }

    Write-Host "[watchdog] Server process exited. Restarting in 3s..."
    Start-Sleep -Seconds 3
}