$base = "c:\Users\Yashg\Downloads\Kosmo"

# Create PROBLEMS directory
New-Item -ItemType Directory -Force -Path "$base\PROBLEMS" | Out-Null

# Images where users stated specific problems/bugs/issues
$problems = @(
    # 1. "Not secure" warning when accessing the site
    "WhatsApp Image 2026-08-10 at 3.50.59 PM.jpeg",
    # 2. ekzess: prompt structuring critique - prompts not well structured enough
    "WhatsApp Image 2026-08-10 at 5.08.10 PM.jpeg",
    # 3. AttorneyOk1025: black-white contrast too strong on site
    "WhatsApp Image 2026-08-11 at 7.55.39 PM.jpeg",
    # 4. PhilosopherLoud362: doesn't like square elements in UI
    "WhatsApp Image 2026-08-11 at 9.27.26 PM.jpeg",
    # 5. AttorneyOk1025: white appearance too harsh, UI suggestions
    "WhatsApp Image 2026-08-11 at 9.35.25 PM.jpeg",
    # 6. unk9978: doesn't like the black background
    "WhatsApp Image 2026-08-12 at 2.27.23 AM.jpeg",
    # 7. Dependent_Nose9421: prompt too big for free tier, ate up all tokens
    "WhatsApp Image 2026-08-13 at 10.20.06 PM.jpeg",
    # 8. Jumpy_Ad_8636: website too much scrolling on phone, can cut redundant parts
    "WhatsApp Image 2026-08-13 at 3.07.25 PM.jpeg",
    # 9. Verification link invalid when opened in different browser/device
    "WhatsApp Image 2026-08-13 at 6.01.03 PM.jpeg",
    # 10. Kunal: prompt thoda lengthy, thoda samajhne mai dikkat (hard to understand)
    "WhatsApp Image 2026-08-13 at 6.17.19 PM.jpeg",
    # 11. Confident_Use_6122: annoying confirmation paragraph, UI too complex, output in single big paragraph
    "WhatsApp Image 2026-08-13 at 7.17.45 PM.jpeg",
    # 12. itzz_aryan_24: UI kinda distracting, glowing lines issue
    "WhatsApp Image 2026-08-14 at 1.41.49 AM.jpeg",
    # 13. itzz_aryan_24: chatbot response feels slow
    "WhatsApp Image 2026-08-14 at 1.44.38 AM.jpeg",
    # 14. madhav00_3: output didn't match request, shifted tech stack, backend requirements missing
    "WhatsApp Image 2026-08-14 at 12.04.13 AM.jpeg",
    # 15. Clueless_Cabbage0: doesn't auto-scroll, chat boxes confusing, not attention-friendly
    "WhatsApp Image 2026-08-14 at 4.55.53 PM.jpeg",
    # 16. Clueless_Cabbage0: needs colour/opacity change to differentiate chat elements
    "WhatsApp Image 2026-08-14 at 5.01.50 PM.jpeg",
    # 17. vwllss: user friction concern, splash screen issue
    "WhatsApp Image 2026-08-15 at 10.08.44 PM.jpeg",
    # 18. Wpunza: tool assumes info (auto-put NEET exam), should rely on user input only
    "WhatsApp Image 2026-08-15 at 12.07.24 PM.jpeg",
    # 19. IndividualRecipe8533: compiles remaining not working, continuous thing stopped, homepage UI issue
    "WhatsApp Image 2026-08-15 at 2.14.48 PM.jpeg",
    # 20. MouseHelpful1702: page jumps, repeat questions on get prompt, tokens consumed for simple replies
    "WhatsApp Image 2026-08-16 at 4.05.19 PM.jpeg",
    # 21. Ankit Jain (xdankit): background animation annoying, prompt quota counter confusion (19/20)
    "Screenshot_2026-08-13-23-25-03-477_com.instagram.android.jpg",
    # 22. Weary_Atmosphere_839: loses context on subsequent messages, starts assuming context
    "WhatsApp Image 2026-08-17 at 10.45.47 AM.jpeg",
    # 23. Shivam__kumar: after login cannot view/access landing page
    "WhatsApp Image 2026-08-17 at 11.26.35 AM.jpeg",
    # 24. Ok-Desk7336: generation/reply response time too slow
    "WhatsApp Image 2026-08-17 at 8.57.53 PM.jpeg",
    # 25. Additional_Winter872: a bit slow, page doesn't scroll down automatically after prompt
    "WhatsApp Image 2026-08-18 at 5.46.24 PM.jpeg"
)

$counter = 1
foreach ($img in $problems) {
    $src = Join-Path $base $img
    if (Test-Path $src) {
        $ext = [System.IO.Path]::GetExtension($img)
        $dest = Join-Path "$base\PROBLEMS" "PROBLEM-$counter$ext"
        Copy-Item $src $dest -Force
        Write-Host "PROBLEM-$counter <- $img"
        $counter++
    } else {
        Write-Host "MISSING: $img" -ForegroundColor Red
    }
}

Write-Host "`n========== SUMMARY ==========" -ForegroundColor Cyan
Write-Host "PROBLEMS folder: $($counter - 1) images" -ForegroundColor Green
