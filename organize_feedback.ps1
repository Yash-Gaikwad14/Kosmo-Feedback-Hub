$base = "c:\Users\Yashg\Downloads\Kosmo"

# Clear existing contents of all folders
Remove-Item "$base\APP\*" -Force
Remove-Item "$base\UI\*" -Force
Remove-Item "$base\BOTH\*" -Force
Remove-Item "$base\PROBLEMS\*" -Force

Write-Host "Cleared all folders.`n" -ForegroundColor Yellow

# ============================================================
# APP FOLDER - Reordered so same-user images are sequential
# Also removed the axiom0101 duplicate
# ============================================================

$appImages = @(
    # --- Dipak (1 image) ---
    "WhatsApp Image 2026-08-10 at 10.22.02 PM.jpeg",   # APP-1: Dipak

    # --- Masterbossing (3 images, now grouped) ---
    "WhatsApp Image 2026-08-10 at 3.50.59 PM.jpeg",    # APP-2: Masterbossing + No_Discussion_8032
    "WhatsApp Image 2026-08-10 at 4.29.47 PM.jpeg",    # APP-3: Masterbossing "good job amazing"
    "WhatsApp Image 2026-08-10 at 3.58.17 PM.jpeg",    # APP-4: Masterbossing "concept cool, UI clean" (BOTH)

    # --- ekzess (1 image) ---
    "WhatsApp Image 2026-08-10 at 5.08.10 PM.jpeg",    # APP-5: ekzess

    # --- Priyal (1 image) ---
    "WhatsApp Image 2026-08-10 at 7.47.00 PM.jpeg",    # APP-6: Priyal (BOTH)

    # --- App screenshot (1 image) ---
    "WhatsApp Image 2026-08-10 at 8.18.10 PM.jpeg",    # APP-7: App screenshot

    # --- ad_tya.016 (1 image) ---
    "WhatsApp Image 2026-08-10 at 9.37.50 PM.jpeg",    # APP-8: ad_tya.016 (BOTH)

    # --- _ahmed543 (1 image) ---
    "WhatsApp Image 2026-08-11 at 12.14.37 PM.jpeg",   # APP-9: _ahmed543

    # --- OrgReading6784 (1 image) ---
    "WhatsApp Image 2026-08-11 at 6.43.38 PM.jpeg",    # APP-10: OrgReading6784

    # --- AttorneyOk1025 (1 image in APP) ---
    "WhatsApp Image 2026-08-11 at 9.35.25 PM.jpeg",    # APP-11: AttorneyOk1025 (BOTH)

    # --- Urvesh (1 image) ---
    "WhatsApp Image 2026-08-11 at 11.23.57 PM.jpeg",   # APP-12: Urvesh (BOTH)

    # --- Instagram user (1 image) ---
    "WhatsApp Image 2026-08-12 at 11.56.59 AM.jpeg",   # APP-13: Instagram user (BOTH)

    # --- unk9978 (2 images, now grouped) ---
    "WhatsApp Image 2026-08-12 at 2.27.23 AM.jpeg",    # APP-14: unk9978 "better than expected" (BOTH)
    "WhatsApp Image 2026-08-13 at 9.21.55 PM.jpeg",    # APP-15: unk9978 "WELL DONE OMG"

    # --- humblyyourz (1 image) ---
    "WhatsApp Image 2026-08-12 at 2.11.16 PM.jpeg",    # APP-16: humblyyourz

    # --- joppamae (1 image) ---
    "WhatsApp Image 2026-08-12 at 3.30.35 PM.jpeg",    # APP-17: joppamae

    # --- Cinderbella (1 image) ---
    "WhatsApp Image 2026-08-12 at 5.19.21 PM.jpeg",    # APP-18: Cinderbella (BOTH)

    # --- comeandget_tit (1 image) ---
    "WhatsApp Image 2026-08-13 at 12.39.24 AM.jpeg",   # APP-19: comeandget_tit (BOTH)

    # --- Suitable-Benefit8247 (2 images, already sequential) ---
    "WhatsApp Image 2026-08-13 at 12.22.52 PM.jpeg",   # APP-20: Suitable-Benefit8247 "idea sounds good"
    "WhatsApp Image 2026-08-13 at 12.58.02 PM.jpeg",   # APP-21: Suitable-Benefit8247 "working preety well"

    # --- OneJuggernaut1272 (1 image) ---
    "WhatsApp Image 2026-08-13 at 2.09.10 PM.jpeg",    # APP-22: OneJuggernaut1272

    # --- Clueless_Cabbage0 (3 images, now grouped) ---
    "WhatsApp Image 2026-08-13 at 3.23.10 PM.jpeg",    # APP-23: Clueless_Cabbage0 "will give it a try"
    "WhatsApp Image 2026-08-14 at 4.55.53 PM.jpeg",    # APP-24: Clueless_Cabbage0 "like interface, cool app" (BOTH)
    "WhatsApp Image 2026-08-14 at 5.01.50 PM.jpeg",    # APP-25: Clueless_Cabbage0 "great app, spectacular" (BOTH)

    # --- jeezjournal (1 image) ---
    "WhatsApp Image 2026-08-13 at 3.37.43 PM.jpeg",    # APP-26: jeezjournal

    # --- Verification issue user (1 image) ---
    "WhatsApp Image 2026-08-13 at 6.01.03 PM.jpeg",    # APP-27: Verification link issue

    # --- Kunal Paunikar (2 images, already sequential) ---
    "WhatsApp Image 2026-08-13 at 6.17.19 PM.jpeg",    # APP-28: Kunal Paunikar (BOTH)
    "WhatsApp Image 2026-08-13 at 6.20.03 PM.jpeg",    # APP-29: Kunal Paunikar (BOTH)

    # --- Reddit post (1 image) ---
    "WhatsApp Image 2026-08-13 at 7.15.41 PM.jpeg",    # APP-30: Reddit bravwear + comments

    # --- Confident_Use_6122 (1 image) ---
    "WhatsApp Image 2026-08-13 at 7.17.45 PM.jpeg",    # APP-31: Confident_Use_6122 (BOTH)

    # --- Efficient_Contest_87 (1 image) ---
    "WhatsApp Image 2026-08-13 at 8.43.15 PM.jpeg",    # APP-32: Efficient_Contest_87

    # --- No-Technician272 (1 image) ---
    "WhatsApp Image 2026-08-13 at 9.11.15 PM.jpeg",    # APP-33: No-Technician272

    # --- Dependent_Nose9421 (1 image) ---
    "WhatsApp Image 2026-08-13 at 10.20.06 PM.jpeg",   # APP-34: Dependent_Nose9421

    # --- birayan_45 (1 image) ---
    "WhatsApp Image 2026-08-13 at 10.21.46 PM.jpeg",   # APP-35: birayan_45

    # --- madhav00_3 (1 image) ---
    "WhatsApp Image 2026-08-14 at 12.04.13 AM.jpeg",   # APP-36: madhav00_3 (BOTH)

    # --- itzz_aryan_24 (2 images, already sequential) ---
    "WhatsApp Image 2026-08-14 at 1.41.49 AM.jpeg",    # APP-37: itzz_aryan_24 (BOTH)
    "WhatsApp Image 2026-08-14 at 1.44.38 AM.jpeg",    # APP-38: itzz_aryan_24 (BOTH)

    # --- WhatsApp scorecard user (1 image) ---
    "WhatsApp Image 2026-08-14 at 2.25.52 PM.jpeg",    # APP-39: Scorecard (BOTH)

    # --- EconomySerious (1 image) ---
    "WhatsApp Image 2026-08-15 at 12.34.03 AM.jpeg",   # APP-40: EconomySerious

    # --- Wpunza (1 image) ---
    "WhatsApp Image 2026-08-15 at 12.07.24 PM.jpeg",   # APP-41: Wpunza

    # --- IndividualRecipe8533 (2 images, now grouped) ---
    "WhatsApp Image 2026-08-15 at 12.33.34 PM.jpeg",   # APP-42: IndividualRecipe8533 "UI 10/10" (BOTH)
    "WhatsApp Image 2026-08-15 at 2.14.48 PM.jpeg",    # APP-43: IndividualRecipe8533 detailed (BOTH)

    # --- PsychologicalIce8839 (1 image) ---
    "WhatsApp Image 2026-08-15 at 2.11.21 PM.jpeg",    # APP-44: PsychologicalIce8839

    # --- Former_Repair9221 (1 image) ---
    "WhatsApp Image 2026-08-15 at 9.56.09 PM.jpeg",    # APP-45: Former_Repair9221 (BOTH)

    # --- vwllss (1 image) ---
    "WhatsApp Image 2026-08-15 at 10.08.44 PM.jpeg",   # APP-46: vwllss

    # --- masterbutata (1 image) ---
    "WhatsApp Image 2026-08-15 at 10.38.59 PM.jpeg",   # APP-47: masterbutata

    # --- whoisthis5309 (1 image) ---
    "WhatsApp Image 2026-08-15 at 10.55.50 PM.jpeg",   # APP-48: whoisthis5309 (BOTH)

    # --- axiom0101 (1 image - removed duplicate) ---
    "WhatsApp Image 2026-08-16 at 2.06.43 PM.jpeg",    # APP-49: axiom0101 (BOTH)

    # --- MouseHelpful1702 (1 image) ---
    "WhatsApp Image 2026-08-16 at 4.05.19 PM.jpeg",    # APP-50: MouseHelpful1702 (Prompt flow & token usage issue)

    # --- mental8888 (1 image) ---
    "WhatsApp Image 2026-08-16 at 5.54.37 PM.jpeg",    # APP-51: mental8888 (Product utility feedback)

    # --- Own_Drag_5500 (1 image) ---
    "WhatsApp Image 2026-08-16 at 10.51.31 PM.jpeg",    # APP-52: Own_Drag_5500 (BOTH - loves app, design, pricing)

    # --- Ankit Jain (xdankit) (1 image) ---
    "Screenshot_2026-08-13-23-25-03-477_com.instagram.android.jpg", # APP-53: Ankit Jain (BOTH)

    # --- Weary_Atmosphere_839 (1 image) ---
    "WhatsApp Image 2026-08-17 at 10.45.47 AM.jpeg",   # APP-54: Weary_Atmosphere_839 (BOTH - loves vent mode, context issue)

    # --- Shivam__kumar (1 image) ---
    "WhatsApp Image 2026-08-17 at 11.26.35 AM.jpeg",   # APP-55: Shivam__kumar (BOTH - landing page awesome, login issue)

    # --- Ok-Desk7336 (1 image) ---
    "WhatsApp Image 2026-08-17 at 8.57.53 PM.jpeg",    # APP-56: Ok-Desk7336 (BOTH - tool too good, response time slow)

    # --- No-Nerve-7254 (1 image) ---
    "WhatsApp Image 2026-08-17 at 10.18.53 PM.jpeg",   # APP-57: No-Nerve-7254 (Great specific prompts)

    # --- Additional_Winter872 (1 image) ---
    "WhatsApp Image 2026-08-18 at 5.46.24 PM.jpeg",    # APP-58: Additional_Winter872 (BOTH - a bit slow, auto-scroll issue)

    # --- Aggressive-Tax-1006 (1 image) ---
    "WhatsApp Image 2026-08-18 at 8.50.52 PM.jpeg"     # APP-59: Aggressive-Tax-1006 (Works nicely for non-AI users, good time)
)

# ============================================================
# UI FOLDER - Reordered so same-user images are sequential
# ============================================================

$uiImages = @(
    # --- AttorneyOk1025 (2 images, now grouped) ---
    "WhatsApp Image 2026-08-11 at 7.55.39 PM.jpeg",    # UI-1: AttorneyOk1025 "site looks nice, contrast strong"
    "WhatsApp Image 2026-08-11 at 9.35.25 PM.jpeg",    # UI-2: AttorneyOk1025 "functions well, white harsh" (BOTH)

    # --- PhilosopherLoud362 (1 image) ---
    "WhatsApp Image 2026-08-11 at 9.27.26 PM.jpeg",    # UI-3: PhilosopherLoud362 "UI looks good, square elements"

    # --- Obieadz (1 image) ---
    "WhatsApp Image 2026-08-11 at 11.30.31 PM.jpeg",   # UI-4: Obieadz "I like the UI too much"

    # --- Masterbossing (1 image) ---
    "WhatsApp Image 2026-08-10 at 3.58.17 PM.jpeg",    # UI-5: Masterbossing "concept cool, UI clean" (BOTH)

    # --- Priyal (1 image) ---
    "WhatsApp Image 2026-08-10 at 7.47.00 PM.jpeg",    # UI-6: Priyal (BOTH)

    # --- ad_tya.016 (1 image) ---
    "WhatsApp Image 2026-08-10 at 9.37.50 PM.jpeg",    # UI-7: ad_tya.016 (BOTH)

    # --- Urvesh (1 image) ---
    "WhatsApp Image 2026-08-11 at 11.23.57 PM.jpeg",   # UI-8: Urvesh (BOTH)

    # --- Instagram user (1 image) ---
    "WhatsApp Image 2026-08-12 at 11.56.59 AM.jpeg",   # UI-9: Instagram user (BOTH)

    # --- unk9978 (1 image) ---
    "WhatsApp Image 2026-08-12 at 2.27.23 AM.jpeg",    # UI-10: unk9978 (BOTH)

    # --- Cinderbella (1 image) ---
    "WhatsApp Image 2026-08-12 at 5.19.21 PM.jpeg",    # UI-11: Cinderbella (BOTH)

    # --- comeandget_tit (1 image) ---
    "WhatsApp Image 2026-08-13 at 12.39.24 AM.jpeg",   # UI-12: comeandget_tit (BOTH)

    # --- Jumpy_Ad_8636 (1 image) ---
    "WhatsApp Image 2026-08-13 at 3.07.25 PM.jpeg",    # UI-13: Jumpy_Ad_8636 "scrolling on phone"

    # --- Kunal Paunikar (2 images, already sequential) ---
    "WhatsApp Image 2026-08-13 at 6.17.19 PM.jpeg",    # UI-14: Kunal Paunikar (BOTH)
    "WhatsApp Image 2026-08-13 at 6.20.03 PM.jpeg",    # UI-15: Kunal Paunikar (BOTH)

    # --- Confident_Use_6122 (1 image) ---
    "WhatsApp Image 2026-08-13 at 7.17.45 PM.jpeg",    # UI-16: Confident_Use_6122 (BOTH)

    # --- itzz_aryan_24 (2 images, already sequential) ---
    "WhatsApp Image 2026-08-14 at 1.41.49 AM.jpeg",    # UI-17: itzz_aryan_24 (BOTH)
    "WhatsApp Image 2026-08-14 at 1.44.38 AM.jpeg",    # UI-18: itzz_aryan_24 (BOTH)

    # --- madhav00_3 (1 image) ---
    "WhatsApp Image 2026-08-14 at 12.04.13 AM.jpeg",   # UI-19: madhav00_3 (BOTH)

    # --- WhatsApp scorecard (1 image) ---
    "WhatsApp Image 2026-08-14 at 2.25.52 PM.jpeg",    # UI-20: Scorecard (BOTH)

    # --- Clueless_Cabbage0 (2 images, already sequential) ---
    "WhatsApp Image 2026-08-14 at 4.55.53 PM.jpeg",    # UI-21: Clueless_Cabbage0 (BOTH)
    "WhatsApp Image 2026-08-14 at 5.01.50 PM.jpeg",    # UI-22: Clueless_Cabbage0 (BOTH)

    # --- IndividualRecipe8533 (2 images, already sequential) ---
    "WhatsApp Image 2026-08-15 at 12.33.34 PM.jpeg",   # UI-23: IndividualRecipe8533 (BOTH)
    "WhatsApp Image 2026-08-15 at 2.14.48 PM.jpeg",    # UI-24: IndividualRecipe8533 (BOTH)

    # --- Former_Repair9221 (1 image) ---
    "WhatsApp Image 2026-08-15 at 9.56.09 PM.jpeg",    # UI-25: Former_Repair9221 (BOTH)

    # --- whoisthis5309 (1 image) ---
    "WhatsApp Image 2026-08-15 at 10.55.50 PM.jpeg",   # UI-26: whoisthis5309 (BOTH)

    # --- axiom0101 (1 image) ---
    "WhatsApp Image 2026-08-16 at 2.06.43 PM.jpeg",    # UI-27: axiom0101 (BOTH)

    # --- Own_Drag_5500 (1 image) ---
    "WhatsApp Image 2026-08-16 at 10.51.31 PM.jpeg",    # UI-28: Own_Drag_5500 (BOTH - like the design a lot)

    # --- Ankit Jain (xdankit) (1 image) ---
    "Screenshot_2026-08-13-23-25-03-477_com.instagram.android.jpg", # UI-29: Ankit Jain (BOTH - background animation annoying)

    # --- Shivam__kumar (1 image) ---
    "WhatsApp Image 2026-08-17 at 11.26.35 AM.jpeg",   # UI-30: Shivam__kumar (BOTH - landing page awesome, login redirect)

    # --- Additional_Winter872 (1 image) ---
    "WhatsApp Image 2026-08-18 at 5.46.24 PM.jpeg"     # UI-31: Additional_Winter872 (BOTH - no auto-scroll after prompt)
)

# ============================================================
# BOTH FOLDER - Same as before
# ============================================================

$bothImages = @(
    "WhatsApp Image 2026-08-10 at 3.58.17 PM.jpeg",
    "WhatsApp Image 2026-08-10 at 7.47.00 PM.jpeg",
    "WhatsApp Image 2026-08-10 at 9.37.50 PM.jpeg",
    "WhatsApp Image 2026-08-11 at 11.23.57 PM.jpeg",
    "WhatsApp Image 2026-08-11 at 9.35.25 PM.jpeg",
    "WhatsApp Image 2026-08-12 at 11.56.59 AM.jpeg",
    "WhatsApp Image 2026-08-12 at 2.27.23 AM.jpeg",
    "WhatsApp Image 2026-08-12 at 5.19.21 PM.jpeg",
    "WhatsApp Image 2026-08-13 at 12.39.24 AM.jpeg",
    "WhatsApp Image 2026-08-13 at 6.17.19 PM.jpeg",
    "WhatsApp Image 2026-08-13 at 6.20.03 PM.jpeg",
    "WhatsApp Image 2026-08-13 at 7.17.45 PM.jpeg",
    "WhatsApp Image 2026-08-14 at 1.41.49 AM.jpeg",
    "WhatsApp Image 2026-08-14 at 1.44.38 AM.jpeg",
    "WhatsApp Image 2026-08-14 at 12.04.13 AM.jpeg",
    "WhatsApp Image 2026-08-14 at 2.25.52 PM.jpeg",
    "WhatsApp Image 2026-08-14 at 4.55.53 PM.jpeg",
    "WhatsApp Image 2026-08-14 at 5.01.50 PM.jpeg",
    "WhatsApp Image 2026-08-15 at 10.55.50 PM.jpeg",
    "WhatsApp Image 2026-08-15 at 12.33.34 PM.jpeg",
    "WhatsApp Image 2026-08-15 at 2.14.48 PM.jpeg",
    "WhatsApp Image 2026-08-15 at 9.56.09 PM.jpeg",
    "WhatsApp Image 2026-08-16 at 2.06.43 PM.jpeg",
    "WhatsApp Image 2026-08-16 at 10.51.31 PM.jpeg",
    "Screenshot_2026-08-13-23-25-03-477_com.instagram.android.jpg",
    "WhatsApp Image 2026-08-17 at 10.45.47 AM.jpeg",
    "WhatsApp Image 2026-08-17 at 11.26.35 AM.jpeg",
    "WhatsApp Image 2026-08-17 at 8.57.53 PM.jpeg",
    "WhatsApp Image 2026-08-18 at 5.46.24 PM.jpeg"
)

# ============================================================
# PROBLEMS FOLDER - Reordered so same-user images are sequential
# ============================================================

$problemImages = @(
    # --- Masterbossing + No_Discussion_8032 (1 image) ---
    "WhatsApp Image 2026-08-10 at 3.50.59 PM.jpeg",    # PROBLEM-1: "Not Secure" warning

    # --- ekzess (1 image) ---
    "WhatsApp Image 2026-08-10 at 5.08.10 PM.jpeg",    # PROBLEM-2: Prompt structuring critique

    # --- AttorneyOk1025 (2 images, now grouped) ---
    "WhatsApp Image 2026-08-11 at 7.55.39 PM.jpeg",    # PROBLEM-3: Contrast too strong
    "WhatsApp Image 2026-08-11 at 9.35.25 PM.jpeg",    # PROBLEM-4: White appearance too harsh

    # --- PhilosopherLoud362 (1 image) ---
    "WhatsApp Image 2026-08-11 at 9.27.26 PM.jpeg",    # PROBLEM-5: Square elements

    # --- unk9978 (1 image) ---
    "WhatsApp Image 2026-08-12 at 2.27.23 AM.jpeg",    # PROBLEM-6: Black background

    # --- Dependent_Nose9421 (1 image) ---
    "WhatsApp Image 2026-08-13 at 10.20.06 PM.jpeg",   # PROBLEM-7: Prompt too big

    # --- Jumpy_Ad_8636 (1 image) ---
    "WhatsApp Image 2026-08-13 at 3.07.25 PM.jpeg",    # PROBLEM-8: Too much scrolling

    # --- Verification issue user (1 image) ---
    "WhatsApp Image 2026-08-13 at 6.01.03 PM.jpeg",    # PROBLEM-9: Verification link invalid

    # --- Kunal Paunikar (1 image) ---
    "WhatsApp Image 2026-08-13 at 6.17.19 PM.jpeg",    # PROBLEM-10: Prompt too lengthy

    # --- Confident_Use_6122 (1 image) ---
    "WhatsApp Image 2026-08-13 at 7.17.45 PM.jpeg",    # PROBLEM-11: Annoying confirmation

    # --- itzz_aryan_24 (2 images, already sequential) ---
    "WhatsApp Image 2026-08-14 at 1.41.49 AM.jpeg",    # PROBLEM-12: UI distracting
    "WhatsApp Image 2026-08-14 at 1.44.38 AM.jpeg",    # PROBLEM-13: Chatbot slow

    # --- madhav00_3 (1 image) ---
    "WhatsApp Image 2026-08-14 at 12.04.13 AM.jpeg",   # PROBLEM-14: Output didn't match

    # --- Clueless_Cabbage0 (2 images, already sequential) ---
    "WhatsApp Image 2026-08-14 at 4.55.53 PM.jpeg",    # PROBLEM-15: No auto-scroll
    "WhatsApp Image 2026-08-14 at 5.01.50 PM.jpeg",    # PROBLEM-16: Can't differentiate

    # --- vwllss (1 image) ---
    "WhatsApp Image 2026-08-15 at 10.08.44 PM.jpeg",   # PROBLEM-17: User friction

    # --- Wpunza (1 image) ---
    "WhatsApp Image 2026-08-15 at 12.07.24 PM.jpeg",   # PROBLEM-18: Auto-assumes info

    # --- IndividualRecipe8533 (1 image) ---
    "WhatsApp Image 2026-08-15 at 2.14.48 PM.jpeg",    # PROBLEM-19: Multiple bugs

    # --- MouseHelpful1702 (1 image) ---
    "WhatsApp Image 2026-08-16 at 4.05.19 PM.jpeg",    # PROBLEM-20: Jump page, repeat questions, token usage

    # --- Ankit Jain (xdankit) (1 image) ---
    "Screenshot_2026-08-13-23-25-03-477_com.instagram.android.jpg", # PROBLEM-21: Background animation annoying, prompt quota confusion

    # --- Weary_Atmosphere_839 (1 image) ---
    "WhatsApp Image 2026-08-17 at 10.45.47 AM.jpeg",   # PROBLEM-22: Context loss on subsequent messages

    # --- Shivam__kumar (1 image) ---
    "WhatsApp Image 2026-08-17 at 11.26.35 AM.jpeg",   # PROBLEM-23: Cannot see landing page after login

    # --- Ok-Desk7336 (1 image) ---
    "WhatsApp Image 2026-08-17 at 8.57.53 PM.jpeg",    # PROBLEM-24: Slow reply generation speed

    # --- Additional_Winter872 (1 image) ---
    "WhatsApp Image 2026-08-18 at 5.46.24 PM.jpeg"     # PROBLEM-25: Slow speed, no auto-scroll after prompt
)


# ============================================================
# COPY FUNCTION
# ============================================================

function Copy-Renamed {
    param($images, $folder, $prefix)
    $counter = 1
    foreach ($img in $images) {
        $src = Join-Path $base $img
        if (Test-Path $src) {
            $ext = [System.IO.Path]::GetExtension($img)
            $dest = Join-Path "$base\$folder" "$prefix-$counter$ext"
            Copy-Item $src $dest -Force
            Write-Host "$prefix-$counter <- $img"
            $counter++
        } else {
            Write-Host "MISSING: $img" -ForegroundColor Red
        }
    }
    return ($counter - 1)
}

Write-Host "===== APP FOLDER =====" -ForegroundColor Cyan
$appCount = Copy-Renamed $appImages "APP" "APP"

Write-Host "`n===== UI FOLDER =====" -ForegroundColor Cyan
$uiCount = Copy-Renamed $uiImages "UI" "UI"

Write-Host "`n===== BOTH FOLDER =====" -ForegroundColor Cyan
$bothCount = Copy-Renamed $bothImages "BOTH" "BOTH"

Write-Host "`n===== PROBLEMS FOLDER =====" -ForegroundColor Cyan
$probCount = Copy-Renamed $problemImages "PROBLEMS" "PROBLEM"

Write-Host "`n========== SUMMARY ==========" -ForegroundColor Cyan
Write-Host "APP folder: $appCount images" -ForegroundColor Green
Write-Host "UI folder: $uiCount images" -ForegroundColor Green
Write-Host "BOTH folder: $bothCount images" -ForegroundColor Green
Write-Host "PROBLEMS folder: $probCount images" -ForegroundColor Green

Write-Host "`n===== MULTI-IMAGE USERS (now sequential) =====" -ForegroundColor Magenta
Write-Host "Masterbossing     -> APP-2, APP-3, APP-4"
Write-Host "unk9978           -> APP-14, APP-15"
Write-Host "Suitable-Benefit  -> APP-20, APP-21"
Write-Host "Clueless_Cabbage0 -> APP-23, APP-24, APP-25"
Write-Host "Kunal Paunikar    -> APP-28, APP-29"
Write-Host "itzz_aryan_24     -> APP-37, APP-38"
Write-Host "IndividualRecipe  -> APP-42, APP-43"
Write-Host "AttorneyOk1025    -> UI-1, UI-2 | PROBLEM-3, PROBLEM-4"
Write-Host "Clueless_Cabbage0 -> UI-21, UI-22 | PROBLEM-15, PROBLEM-16"
Write-Host "itzz_aryan_24     -> UI-17, UI-18 | PROBLEM-12, PROBLEM-13"
