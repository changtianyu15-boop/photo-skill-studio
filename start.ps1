$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectDir

if (-not (Test-Path -LiteralPath (Join-Path $projectDir 'node_modules'))) {
  Write-Host '首次运行，正在安装依赖...'
  npm install
}

npm start
