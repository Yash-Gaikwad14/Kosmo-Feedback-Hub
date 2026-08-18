$base = "c:\Users\Yashg\Downloads\Kosmo"
$folders = @("APP", "UI", "BOTH", "PROBLEMS")

foreach ($folderName in $folders) {
    $folderPath = Join-Path $base $folderName
    if (-not (Test-Path $folderPath)) { continue }

    $prefix = switch ($folderName) {
        "APP"      { "APP" }
        "UI"       { "UI" }
        "BOTH"     { "BOTH" }
        "PROBLEMS" { "PROBLEM" }
    }

    # Get all jpeg files in folder
    $files = Get-ChildItem -Path $folderPath -Filter "*.jpeg" | 
             Sort-Object { [int]($_.BaseName -replace '[^\d]', '') }

    Write-Host "Re-sequencing $folderName ($($files.Count) files existing)..." -ForegroundColor Cyan

    # Step 1: Rename to temporary names to avoid collision
    $tempList = @()
    $i = 1
    foreach ($file in $files) {
        $tempName = "temp_$i$($file.Extension)"
        $tempPath = Join-Path $folderPath $tempName
        Rename-Item -Path $file.FullName -NewName $tempName -Force
        $tempList += $tempPath
        $i++
    }

    # Step 2: Rename from temp to sequential prefix-N
    $i = 1
    foreach ($tempPath in $tempList) {
        $finalName = "$prefix-$i.jpeg"
        Rename-Item -Path $tempPath -NewName $finalName -Force
        Write-Host "  $prefix-$i.jpeg" -ForegroundColor Green
        $i++
    }
}

Write-Host "`nAll folders re-sequenced successfully with zero gaps!" -ForegroundColor Yellow
