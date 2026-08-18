# Kosmo Feedback Hub - Detailed UI/UX Design Specification & Stitch Prompt Blueprint

- **Document Version**: 1.0.0
- **Target Platform**: Desktop & Mobile Web Application
- **Design Aesthetic**: Premium Glassmorphism Dark Mode with Vibrant HSL Accents

---

## 1. Executive Product Summary

**Kosmo Feedback Hub** is a centralized team dashboard and automated image organization tool for **AskKosmo.com** (AI Prompt Engineer Tool). It aggregates raw user feedback screenshots from Reddit, WhatsApp, Instagram, and Discord, auto-categorizing them into four key functional domains (`APP`, `UI`, `BOTH`, `PROBLEMS`) with zero-gap sequential indexing.

---

## 2. Color Palette & Typography Tokens

### Theme Palette (Dark Mode Base)
- **Background Main**: `#0B0E14` (Deep obsidian dark)
- **Card Glass Surface**: `rgba(20, 26, 38, 0.75)` with `backdrop-filter: blur(16px)`
- **Glass Border Accent**: `rgba(255, 255, 255, 0.08)` / Highlight `rgba(99, 102, 241, 0.4)`

### Functional Accent Colors
- **Indigo Accent** (Primary Brand & Buttons): `#6366F1`
- **Purple Accent** (App Category & Glow): `#8B5CF6`
- **Emerald Accent** (Success / Both Category / Active Status): `#10B981`
- **Rose Accent** (Problems & Bugs): `#EF4444`
- **Slate Gray** (Raw Storage & Neutral Tags): `#64748B`

### Typography
- **Primary Font**: `Outfit` (Clean, geometric modern sans-serif)
- **Code & Console Font**: `JetBrains Mono` or `Fira Code`

---

## 3. Screen-by-Screen UI/UX Architecture

### 🛡️ Screen 1: Team Authentication Shield (Login Modal Overlay)
- **Purpose**: Restrict access strictly to authorized team members.
- **UI Components**:
  - Fullscreen dark glass backdrop overlay with heavy blur.
  - Centered glowing card with Shield Lock Icon.
  - Title: "Kosmo Team Access".
  - Subtitle: "Please enter your Team Passcode to unlock the Feedback Hub".
  - Passcode Input Field (masked password dot characters + key icon).
  - Error Alert Banner (red glass pill with shake animation on invalid entry).
  - Action Button: "🔓 Unlock Dashboard" (Indigo-Purple gradient glow).

---

### 🌐 Screen 2: Header Navigation & Status Bar
- **Purpose**: Top branding, live status, primary execution trigger, and security lock.
- **UI Components**:
  - Rocket Logo + Brand Text: "Kosmo Feedback Hub" (Subtitle: Automated Screenshot & Problem Organizer).
  - "Backend Active" Status Badge (emerald glowing pulse dot).
  - "⚡ Run Auto-Organizer" Action Button (triggers background script).
  - "🔒 Lock Hub" Button (clears session and locks UI).

---

### 📊 Screen 3: Real-Time Analytics Cards Grid
- **Purpose**: Visual metrics summary displaying image counts across categories.
- **UI Components**: 5 Stat Cards with icon badges and hover lift effect:
  1. **Raw Images**: Folder icon, Slate Gray gradient badge, count metric (`63`).
  2. **App Utility**: Cubes icon, Indigo-Blue gradient badge, count metric (`59`).
  3. **UI & Design**: Palette icon, Pink-Magenta gradient badge, count metric (`31`).
  4. **App & UI Both**: Layer-Group icon, Purple-Violet gradient badge, count metric (`29`).
  5. **Tracked Problems**: Bug icon, Red-Rose gradient badge, count metric (`25`).

---

### 📤 Screen 4: Team Image Upload Portal (Dropzone)
- **Purpose**: Allow team members to drag & drop raw feedback screenshots.
- **UI Components**:
  - Dashed border glass dropzone box.
  - Drag-and-drop file drop trigger with upload cloud icon.
  - Channel Tag Dropdown (`WhatsApp`, `Reddit DM`, `Instagram`, `Discord`).
  - Uploader Name Input Field.
  - Upload Chip Preview Pills showing selected file names.
  - Action Button: "Upload Raw Images" with spinner loading state.

---

### 💻 Screen 5: Terminal Execution Console
- **Purpose**: Live terminal window streaming output logs of `organize_feedback.ps1`.
- **UI Components**:
  - Mac/Linux style window header with red, yellow, green control dots.
  - Window title: `powershell -File organize_feedback.ps1`.
  - JetBrains Mono green text stream inside scrollable dark terminal box.

---

### 🖼️ Screen 6: Interactive Feedback Gallery Grid
- **Purpose**: Filterable visual grid displaying image thumbnails with metadata.
- **UI Components**:
  - Filter Tabs Bar: `ALL`, `RAW STORE`, `APP`, `UI`, `BOTH`, `PROBLEMS`, `BUG BOARD`.
  - Search Input Box: Real-time text filter by filename, user, or category tag.
  - Image Cards:
    - High-res thumbnail preview with top object-fit alignment.
    - Hover Zoom Overlay with expand icon.
    - Title: File Name (e.g. `APP-1.jpeg` or `WhatsApp Image...`).
    - Metadata Row: Category Badge (`APP`, `UI`, `BOTH`, `PROBLEMS`) + File Size (e.g., `115.4 KB`).

---

### 🐞 Screen 7: Documented Bug & Problem Board
- **Purpose**: List view of all 25 identified user problems/bugs.
- **UI Components**:
  - Structured Card Row:
    - Problem ID Badge (`PROBLEM-1` through `PROBLEM-25`).
    - Issue Description Text (e.g., "Chat does not auto-scroll down", "Black & white contrast too harsh").
    - Thumbnail image preview pill linking directly to source screenshot.

---

### 🔍 Screen 8: Fullscreen Lightbox & Inspector
- **Purpose**: Inspect screenshots in full resolution.
- **UI Components**:
  - Dark backdrop overlay.
  - Left Panel: Full resolution image with zoom/pan.
  - Right Sidebar: Inspector panel showing Category badge, Filename code block, File Size, Modification Timestamp, and "Download Original Image" button.
  - Keyboard Controls: `Esc` to exit, `ArrowLeft` / `ArrowRight` to navigate.

---

## 4. Prompt Template for Stitch / AI UI Generators

When pasting into Stitch or AI UI tools, use this structured prompt:

```text
Create a modern, high-end Dark Mode Web Application Dashboard called "Kosmo Feedback Hub".
The UI should feature glassmorphism card surfaces (rgba(20, 26, 38, 0.75) with blur), dark obsidian background (#0B0E14), and vibrant HSL accent badges (Indigo, Purple, Emerald, Rose).

Include the following sections:
1. Top Sticky Header with logo, green pulsing status badge "Backend Active", a primary glowing button "Run Auto-Organizer", and a "Lock Hub" button.
2. Analytics Section with 5 glowing metric cards (Raw Images: 63, App Utility: 59, UI & Design: 31, App & UI: 29, Tracked Problems: 25).
3. Two-Column Layout:
   - Left Column: Drag & Drop Image Upload Card with channel dropdown (WhatsApp, Reddit, Instagram, Discord) and uploader name field.
   - Right Column: Terminal Console window with red/yellow/green dots streaming green PowerShell log output.
4. Filterable Gallery Section:
   - Category Tabs (All, Raw Store, APP, UI, BOTH, PROBLEMS, Bug Board).
   - Search bar.
   - 4-column responsive Image Grid displaying screenshot cards with category pill badges and zoom hover overlays.
5. Modal Overlay: A Glassmorphic Team Login Shield with passcode input and unlock button.
```
