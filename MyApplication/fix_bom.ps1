$layoutDir = 'C:\Users\mohamed\AndroidStudioProjects\MyApplication\app\src\main\res\layout'
$files = Get-ChildItem -Path $layoutDir -Filter '*.xml'
foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $noBom = $bytes[3..($bytes.Length - 1)]
        [System.IO.File]::WriteAllBytes($file.FullName, $noBom)
        Write-Host "Fixed BOM: $($file.Name)"
    } else {
        Write-Host "No BOM:    $($file.Name)"
    }
}
Write-Host "Done."
