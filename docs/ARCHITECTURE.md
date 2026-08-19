# Technical Architecture & System Design
## Kosmo Feedback Hub & Auto-Organizer Web App

- **System Version**: 2.1.0
- **Architecture Pattern**: Express REST Server with Supabase Storage & PostgreSQL Persistence

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
|  | Storage Abstraction|  | Postgres / DB JSON |  | Native Organizer|  |
|  |    (lib/storage)   |  |      (lib/db)      |  |      Engine     |  |
|  +----------+---------+  +----------+---------+  +--------+--------+  |
+-------------|-----------------------|-------------------|-------------+
              | Upload / Copy         | Query / Save      | Categorize
              v                       v                   v
+------------------------------------+  +-------------------------------+
|          SUPABASE STORAGE          |  |      SUPABASE POSTGRESQL      |
|  [ raw/ ]      [ app/ ]            |  |  (team_users, image_metadata, |
|  [ ui/ ]       [ both/ ]           |  |       problem_clusters)       |
|  [ problems/ ]                     |  +-------------------------------+
+------------------------------------+
```

---

## 2. Directory Structure Layout

```
kosmo-feedback-hub/
├── docs/                           # Documentation Root
│   ├── PRD.md                      # Product Requirements Document
│   ├── ARCHITECTURE.md             # System & Technical Architecture
│   ├── PROJECT_STATUS.md           # Feedback & Problem Status Ledger
│   └── DECISIONS.md                # Architecture Decision Records (ADR)
├── lib/                            # Core Services & Abstractions
│   ├── storage.js                  # Supabase Storage Service with Local Fallback
│   └── db.js                       # PostgreSQL Database Service with Local JSON Fallback
├── scripts/                        # Utility & Migration Engine
│   └── seed.js                     # Storage & DB Cloud Seed Script
├── RAW_IMAGES/                     # Local Dev Raw Image Directory
├── APP/                            # Local Dev APP Category Directory
├── UI/                             # Local Dev UI Category Directory
├── BOTH/                           # Local Dev BOTH Category Directory
├── PROBLEMS/                       # Local Dev PROBLEMS Category Directory
├── organize_feedback.ps1           # PowerShell Categorization Script (Dev Utility)
├── organize_problems.ps1           # Standalone Problem Catalog Builder
├── server.js                       # Express Backend Server (API & Cloud Controller)
├── .env.example                    # Template Environment Config
├── package.json                    # Node.js Project Manifest
└── public/                         # Web UI Assets
    ├── index.html                  # Responsive Dashboard Layout
    ├── styles.css                  # Glassmorphic Styling & Toast System
    └── app.js                      # Client Controller & Auth Engine
```

---

## 3. Backend Component Specification (`server.js`)

### Technology Stack
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Middleware**: `multer` (in-memory file buffer processing), `cors`
- **Cloud Storage**: `@supabase/supabase-js` (Supabase Storage API)
- **Database**: `pg` (PostgreSQL pooled connection via Supabase Transaction Pooler)

### REST API Endpoints

#### 1. `GET /api/stats`
Returns total file counts across `RAW`, `APP`, `UI`, `BOTH`, `PROBLEMS`, and active team members.

#### 2. `GET /api/images`
Returns image list filtered by category parameter (`?category=APP|UI|BOTH|PROBLEMS|RAW`) with user filter and priority sorting.

#### 3. `POST /api/upload`
Accepts multipart file uploads, writing directly to Supabase Storage (or local storage fallback), saving attribution metadata in PostgreSQL.

#### 4. `POST /api/run-organizer`
Triggers native auto-organizer engine to copy objects between category prefixes with zero-gap 1-indexed filenames.

#### 5. `POST /api/open-folder`
Navigates web UI category view tab in cloud production (or opens Windows Explorer in local desktop mode).

#### 6. `GET /api/problems`
Returns catalog of documented problems with image URLs and descriptions.

---

## 4. Security & Authentication

- **Header Authentication**: Requests require `x-team-passcode` matching `TEAM_PASSCODE` env variable.
- **Query String Passcodes Disallowed**: Passcodes passed via URL parameters are rejected to prevent log leaks.
- **Sanitized Inputs**: Filenames sanitized against path traversal vulnerabilities.
