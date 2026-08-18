# Technical Architecture & System Design
## Kosmo Feedback Hub & Auto-Organizer Web App

- **System Version**: 1.0.0
- **Architecture Pattern**: Client-Server with Native PowerShell Script Engine Integration

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------+
|                             WEB BROWSER                               |
|   +-------------------+  +-------------------+  +-----------------+   |
|   | Team Upload Portal|  | Feedback Gallery  |  | Problem Tracker |   |
|   +---------+---------+  +---------+---------+  +--------+--------+   |
+-------------|----------------------|-------------------|--------------+
              | HTTP REST API        | Static Assets     | Run Script
              v                      v                   v
+-----------------------------------------------------------------------+
|                         NODE.JS EXPRESS SERVER                        |
|                                (server.js)                            |
|                                                                       |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | Multer File Upload |  | Static Image Serve |  | Script Executor |  |
|  +----------+---------+  +----------+---------+  +--------+--------+  |
+-------------|-----------------------|-------------------|-------------+
              | Raw Save              | Read              | exec()
              v                       v                   v
+-----------------------------------------------------------------------+
|                          LOCAL FILE SYSTEM                            |
|                                                                       |
|  [ RAW_IMAGES/ ] -----> [ organize_feedback.ps1 ] -----> [ APP/ ]     |
|  (Raw Screenshots)      [ organize_problems.ps1 ]      [ UI/ ]      |
|                                                         [ BOTH/ ]    |
|                                                         [ PROBLEMS/ ]|
+-----------------------------------------------------------------------+
```

---

## 2. Directory Structure Layout

```
c:\Users\Yashg\Downloads\Kosmo\
├── docs/                           # Documentation Root
│   ├── PRD.md                      # Product Requirements Document
│   ├── ARCHITECTURE.md             # System & Technical Architecture
│   ├── PROJECT_STATUS.md           # Feedback & Problem Status Ledger
│   └── DECISIONS.md                # Architecture Decision Records (ADR)
├── RAW_IMAGES/                     # Team Raw Image Upload Destination (63+ files)
├── APP/                            # Categorized APP images (APP-1.jpeg .. APP-59.jpeg)
├── UI/                             # Categorized UI images (UI-1.jpeg .. UI-31.jpeg)
├── BOTH/                           # Categorized BOTH images (BOTH-1.jpeg .. BOTH-29.jpeg)
├── PROBLEMS/                       # Categorized PROBLEMS images (PROBLEM-1.jpeg .. PROBLEM-25.jpeg)
├── organize_feedback.ps1           # Primary backend categorization & sequence engine
├── organize_problems.ps1           # Standalone problem directory builder
├── fix_sequence.ps1                # Zero-gap sequence repair utility
├── server.js                       # Express Backend Server (API & Script Runner)
├── package.json                    # Node.js project manifest
└── public/                         # Web UI Assets
    ├── index.html                  # Responsive Dashboard Page Layout
    ├── styles.css                  # Dark Mode Glassmorphic Styling System
    └── app.js                      # Client-side UI & REST API Controller
```

---

## 3. Backend Component Specification (`server.js`)

### Technology Stack
- **Runtime**: Node.js v24.15.0+
- **Framework**: Express.js
- **Middleware**: `multer` (multipart/form-data upload), `cors` (Cross-Origin Resource Sharing)
- **Execution Bridge**: `child_process.exec` for running PowerShell scripts

### REST API Endpoints

#### 1. `GET /api/stats`
Returns total file counts across `RAW_IMAGES`, `APP`, `UI`, `BOTH`, `PROBLEMS`, and untracked root images.
```json
{
  "rawCount": 63,
  "appCount": 59,
  "uiCount": 31,
  "bothCount": 29,
  "problemCount": 25,
  "untrackedCount": 0
}
```

#### 2. `GET /api/images`
Returns image list filtered by category parameter (`?category=APP|UI|BOTH|PROBLEMS|RAW|UNTRACKED`).
```json
[
  {
    "filename": "APP-1.jpeg",
    "category": "APP",
    "url": "/images/APP/APP-1.jpeg",
    "size": 40738,
    "lastModified": "2026-08-16T14:52:04.000Z"
  }
]
```

#### 3. `POST /api/upload`
Accepts single or multiple files uploaded by team members, writing them to `RAW_IMAGES/`.

#### 4. `POST /api/run-organizer`
Triggers `powershell -ExecutionPolicy Bypass -File organize_feedback.ps1` asynchronously, returning output logs and execution status.

#### 5. `GET /api/problems`
Returns structured catalog of all 25 identified problems with description and image path.

---

## 4. Frontend Component Specification (`public/`)

### Architecture
- Pure Vanilla JS / ES6 Modules + Glassmorphic CSS Design Tokens (No heavy framework dependencies required for high speed and instant load times).
- Real-time polling or refresh after script execution.
- Image modal viewer with keyboard navigation (`Esc`, `ArrowLeft`, `ArrowRight`).

---

## 5. Security & File Safety

- **Path Traversal Protection**: Inputs are sanitized using Node `path.basename()`.
- **File Extension Whitelist**: Only `.jpg`, `.jpeg`, `.png`, `.webp` allowed.
- **Non-Destructive Processing**: Backend scripts use `Copy-Item -Force` rather than moving/deleting raw files, ensuring raw screenshots are permanently preserved in `RAW_IMAGES/`.
