# Read-only diagnostic. Does not change defaults, launch files or read documents.
param([string]$OutputPath = (Join-Path ([Environment]::GetFolderPath('Desktop')) 'AI-Doc-QuickLook-file-association.json'))

$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class MarkdownAssociationQuery {
  [DllImport("shlwapi.dll", CharSet = CharSet.Unicode)]
  static extern uint AssocQueryString(uint flags, uint str, string assoc, string extra, StringBuilder output, ref uint length);
  public static string Command(string extension) {
    uint length = 32768;
    var buffer = new StringBuilder((int)length);
    uint result = AssocQueryString(0, 1, extension, "open", buffer, ref length);
    return result == 0 ? buffer.ToString() : "Unavailable (HRESULT " + result.ToString("X8") + ")";
  }
}
'@

function Read-DefaultValue([string]$Path) {
  if (Test-Path $Path) { return (Get-Item $Path).GetValue('') }
  return $null
}

$extensions = foreach ($extension in @('.md', '.markdown')) {
  $choicePath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\$extension\UserChoice"
  $choice = Get-ItemProperty $choicePath -ErrorAction SilentlyContinue
  [pscustomobject]@{
    Extension = $extension
    UserChoiceProgId = $choice.ProgId
    ClassesProgId = Read-DefaultValue "Registry::HKEY_CLASSES_ROOT\$extension"
    EffectiveOpenCommand = [MarkdownAssociationQuery]::Command($extension)
  }
}
$commands = foreach ($progId in @('Markdown', 'com.mdquicklook.desktop.Markdown', 'Applications\md-quicklook.exe')) {
  [pscustomobject]@{
    ProgId = $progId
    OpenCommand = Read-DefaultValue "Registry::HKEY_CLASSES_ROOT\$progId\shell\open\command"
  }
}
$uninstall = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\md-quicklook' -ErrorAction SilentlyContinue
$report = [ordered]@{
  WindowsVersion = [Environment]::OSVersion.VersionString
  InstalledVersion = $uninstall.DisplayVersion
  InstalledLocation = $uninstall.InstallLocation
  Extensions = @($extensions)
  Commands = @($commands)
}
$report | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $OutputPath
Write-Host "Saved read-only association report: $OutputPath"
Write-Host 'The report contains application paths, not document contents or account credentials.'
