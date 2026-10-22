param(
  [Parameter(Mandatory = $true)][string]$Installer,
  [string]$ReportDirectory = "$env:RUNNER_TEMP\file-association-report"
)

# Run only on a disposable Windows test machine: this installs the app and
# exercises the test user's file associations through Windows Shell.
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $ReportDirectory | Out-Null
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Drawing
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--force-renderer-accessibility'
$installDirectory = Join-Path $env:LOCALAPPDATA 'AI Doc QuickLook Smoke Test'
$executable = Join-Path $installDirectory 'md-quicklook.exe'
$testDirectory = Join-Path $env:TEMP 'Markdown smoke tests 中文 空格'
New-Item -ItemType Directory -Force -Path $testDirectory | Out-Null

function Stop-TestApp {
  Get-Process -Name 'md-quicklook' -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Milliseconds 500
}

function Get-AppText {
  $process = Get-Process -Name 'md-quicklook' -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if (-not $process) { return '' }
  $root = [System.Windows.Automation.AutomationElement]::FromHandle($process.MainWindowHandle)
  $nodes = $root.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    [System.Windows.Automation.Condition]::TrueCondition
  )
  return ($nodes | ForEach-Object { $_.Current.Name }) -join "`n"
}

function Save-Diagnostics([string]$Scenario) {
  Get-CimInstance Win32_Process -Filter "Name = 'md-quicklook.exe'" |
    Select-Object ProcessId, ExecutablePath, CommandLine |
    ConvertTo-Json | Set-Content (Join-Path $ReportDirectory "$Scenario-processes.json")
  Get-AppText | Set-Content (Join-Path $ReportDirectory "$Scenario-ui.txt")
  $screen = [System.Drawing.Bitmap]::new(1920, 1080)
  $graphics = [System.Drawing.Graphics]::FromImage($screen)
  try {
    $graphics.CopyFromScreen(0, 0, 0, 0, $screen.Size)
    $screen.Save((Join-Path $ReportDirectory "$Scenario.png"))
  } finally {
    $graphics.Dispose()
    $screen.Dispose()
  }
}

function Wait-ForDocument([string]$Scenario, [string]$Marker) {
  $deadline = (Get-Date).AddSeconds(45)
  do {
    try {
      if ((Get-AppText).Contains($Marker)) {
        Write-Host "PASS: $Scenario displayed $Marker"
        Save-Diagnostics $Scenario
        return
      }
    } catch {
      # UI Automation can briefly lose the WebView tree while it initializes.
    }
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)
  Save-Diagnostics $Scenario
  throw "$Scenario did not display the Markdown document within 45 seconds."
}

try {
  Stop-TestApp
  $installation = Start-Process -FilePath (Resolve-Path $Installer) `
    -ArgumentList "/S /D=$installDirectory" -Wait -PassThru
  if ($installation.ExitCode -ne 0 -or -not (Test-Path $executable)) {
    throw "Installer failed: exit $($installation.ExitCode)"
  }

  $associations = foreach ($extension in @('.md', '.markdown')) {
    $key = Get-Item "Registry::HKEY_CLASSES_ROOT\$extension"
    $progId = $key.GetValue('')
    $command = (Get-Item "Registry::HKEY_CLASSES_ROOT\$progId\shell\open\command").GetValue('')
    [pscustomobject]@{ Extension = $extension; ProgId = $progId; Command = $command }
  }
  $associations | ConvertTo-Json | Set-Content (Join-Path $ReportDirectory 'associations.json')
  $associations | Format-Table | Out-String | Write-Host

  $first = Join-Path $testDirectory '冷启动 文档.md'
  $second = Join-Path $testDirectory '运行中 文档.markdown'
  Set-Content -Encoding utf8 -Path $first -Value "# Cold launch marker 712839`n`n正文 Chinese content."
  Set-Content -Encoding utf8 -Path $second -Value "# Warm launch marker 394751`n`n第二份文档。"

  Start-Process -FilePath $first
  Wait-ForDocument 'shell-cold-launch' 'Cold launch marker 712839'
  Start-Process -FilePath $second
  Wait-ForDocument 'shell-warm-launch' 'Warm launch marker 394751'

  Stop-TestApp
  Start-Process -FilePath $executable -ArgumentList ('"{0}"' -f $first)
  Wait-ForDocument 'direct-cli-launch' 'Cold launch marker 712839'

  Write-Host 'All installed-app file association tests passed.'
} finally {
  Stop-TestApp
}
