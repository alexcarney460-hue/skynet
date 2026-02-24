param(
    [string]$Script = ""
)

$envFile = Join-Path $PSScriptRoot '..\.env.local'
if (-not (Test-Path $envFile)) {
    Write-Error ".env.local not found"
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*$' -or $_ -match '^\s*#') { return }
    $parts = $_ -split '=', 2
    if ($parts.Length -ne 2) { return }
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    if ($name) {
        Set-Item -Path Env:$name -Value $value
    }
}

if (-not [string]::IsNullOrWhiteSpace($Script)) {
    Invoke-Expression $Script
}
