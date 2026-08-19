# Architecture Decision Records (ADRs)
## Kosmo Feedback Hub & Auto-Organizer

- **Document Version**: 2.2.0
- **Status**: Active
- **Last Updated**: 2026-08-19

---

## ADR-001: Hybrid Node.js Express Architecture

### Status
**ACCEPTED**

### Context
The feedback organization logic was originally authored in PowerShell scripts (`organize_feedback.ps1`). The team requires a Web application for team image uploads and gallery viewing.

### Decision
We choose a **Hybrid Architecture** where a lightweight Node.js Express server acts as the web backend and REST API layer, with a native Node.js auto-organizer engine for cloud execution and script compatibility.

---

## ADR-002: Dedicated `RAW_IMAGES/` Storage Folder & Cloud Object Storage

### Status
**ACCEPTED**

### Context
Initially, raw feedback screenshots were placed loose in the project root directory.

### Decision
Establish `RAW_IMAGES/` as the local raw image repository, with cloud object storage integration for persistent production deployment.

---

## ADR-003: Multi-Category Tagging & Non-Destructive Copying

### Status
**ACCEPTED**

### Context
Certain user feedback contains both UI critiques and general App utility feedback or bugs.

### Decision
Implement **Non-Destructive Copying** where a single raw screenshot can be placed into multiple domain category buckets (`APP`, `UI`, `BOTH`, `PROBLEMS`) under separate 1-indexed filenames.

---

## ADR-004: Pure Vanilla Web UI with Custom Glassmorphic Aesthetics

### Status
**ACCEPTED**

### Decision
Use vanilla HTML5, CSS3 with custom variables/glassmorphism, and ES6 JavaScript.

---

## ADR-005: Team Access Passcode Authentication Middleware

### Status
**ACCEPTED**

### Context
The web application must be restricted strictly to team members (no open public access).

### Decision
Implement **Team Passcode Authentication Middleware (`authenticateTeam`)** in `server.js` guarding all REST API routes (`/api/*`) and image static paths (`/images/*`). Passcode is configured via environment variable `TEAM_PASSCODE` with header-only validation (`x-team-passcode`).

---

## ADR-006: Render Cloud Deployment & Cross-Platform Native Organizer Engine

### Status
**ACCEPTED**

### Context
When deploying to cloud container platforms like Render (Linux containers), PowerShell binaries (`powershell`) might not be pre-installed in standard Node.js base images.

### Decision
Add a **Native Node.js Fallback Organizer Engine (`runNativeAutoOrganizer`)** in `server.js`.

---

## ADR-007: Team Member User Profiles & Upload Attribution Ledger

### Status
**ACCEPTED**

### Context
The user requested "who added what" tracking so the team can see which team member submitted which feedback screenshot.

### Decision
Implement a persistent database abstraction (`lib/db.js`) supporting PostgreSQL (`DATABASE_URL`) with local `config/db.json` fallback, storing user profile definitions, metadata mappings (`uploadedBy`, `channel`, `userHandle`, `severity`, `topic`, `notes`, `uploadedAt`), and dynamic user addition via `POST /api/add-user`.

---

## ADR-008: Content-Based Smart Sorting Algorithm

### Status
**ACCEPTED**

### Context
Sorting feedback items by file names (`WhatsApp Image...`) provides zero context on bug severity or feedback topic relevance.

### Decision
Implement a **Content-Based Smart Sorting Algorithm** in `GET /api/images`:
- `sort=severity`: Orders items by priority (`CRITICAL` -> `HIGH` -> `MEDIUM` -> `LOW`).
- `sort=topic`: Groups items by functional issue domain (Response Speed, Auto-Scroll, Dark Mode, etc.).
- `sort=user`: Filters and sorts items by team member profile.

---

## ADR-009: Common Problem Finder NLP Clustering Engine

### Status
**ACCEPTED**

### Context
Product managers need an aggregated view of top recurring user complaints across all feedback screenshots.

### Decision
Implement **Common Problem Finder NLP Cluster Engine** in `GET /api/common-problems`. The server aggregates recurring problem reports into frequency clusters rendered visually as progress bar widgets on the web UI dashboard.

---

## ADR-010: Hosted PostgreSQL Database Migration for Render Free Tier

### Status
**ACCEPTED**

### Context
Render's free tier has no persistent disk support, and free tier services spin down after ~15 minutes of inactivity, wiping local disk files.

### Decision
Integrate `pg` for PostgreSQL database persistence storing team member profiles, upload attributions, and problem clusters.

---

## ADR-011: Supabase Storage Backend Switch (Replacing Cloudflare R2)

### Status
**ACCEPTED**

### Context
Cloudflare R2 requires a credit card on file even for its free tier tier. Supabase provides both a free-tier PostgreSQL database and 1GB free Supabase Storage without requiring credit card registration on file.

### Decision
Switch object storage integration from `@aws-sdk/client-s3` (Cloudflare R2) to `@supabase/supabase-js` (Supabase Storage API):
- All raw uploads and categorized screenshots stream to a public Supabase Storage Bucket (`kosmo-feedback`).
- Single unified provider (Supabase) handles both PostgreSQL database (`DATABASE_URL`) and file storage (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`).
- Preserves local disk fallback when environment variables are not set.
