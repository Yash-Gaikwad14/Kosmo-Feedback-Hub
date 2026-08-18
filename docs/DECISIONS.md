# Architecture Decision Records (ADRs)
## Kosmo Feedback Hub & Auto-Organizer

- **Document Version**: 2.0.0
- **Status**: Active
- **Last Updated**: 2026-08-19

---

## ADR-001: Hybrid Node.js Express & PowerShell Architecture

### Status
**ACCEPTED**

### Context
The feedback organization logic was originally authored in PowerShell scripts (`organize_feedback.ps1`, `fix_sequence.ps1`). The team now requires a Web application for team image uploads and gallery viewing.

### Decision
We choose a **Hybrid Architecture** where a lightweight Node.js Express server acts as the web backend and REST API layer, while delegating heavy file sorting/copying/renaming tasks to `organize_feedback.ps1` via Node `child_process.exec()`.

### Consequences
- **Pros**:
  - Leverages existing PowerShell script logic without rewriting sequence rules.
  - Express server handles file uploads (`multer`), web UI static serving, and REST endpoints efficiently.
  - Simple setup.

---

## ADR-002: Dedicated `RAW_IMAGES/` Storage Folder

### Status
**ACCEPTED**

### Context
Initially, raw feedback screenshots were placed loose in the project root directory. As project files grow, mixing raw images in the root folder creates clutter.

### Decision
Establish `c:\Users\Yashg\Downloads\Kosmo\RAW_IMAGES` as the designated raw image repository. All new uploads from the web app land in `RAW_IMAGES/`.

---

## ADR-003: Multi-Category Tagging & Non-Destructive Copying

### Status
**ACCEPTED**

### Context
Certain user feedback contains both UI critiques and general App utility feedback or bugs.

### Decision
Implement **Non-Destructive Copying (`Copy-Item -Force`)** where a single raw screenshot can be placed into multiple domain folders (`APP`, `UI`, `BOTH`, `PROBLEMS`) under separate 1-indexed filenames.

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
The user requested that the web application must be restricted strictly to team members (no open public access).

### Decision
Implement **Team Passcode Authentication Middleware (`authenticateTeam`)** in `server.js` guarding all REST API routes (`/api/*`) and image static paths (`/images/*`). Requests without `x-team-passcode` header or query string parameter return HTTP `401 Unauthorized`. Frontend displays a glassmorphic login modal overlay prompting for the Team Passcode (`kosmo2026`).

---

## ADR-006: Render Cloud Deployment & Cross-Platform Native Organizer Engine

### Status
**ACCEPTED**

### Context
When deploying to cloud container platforms like Render (Linux/Debian containers), PowerShell binaries (`powershell`) might not be pre-installed in standard Node.js base images.

### Decision
Add a **Native Node.js Fallback Organizer Engine (`runNativeNodeOrganizer`)** in `server.js`. If `exec('powershell ...')` fails or is unavailable on Linux, `server.js` seamlessly parses array targets in `organize_feedback.ps1`, clears destination folders, and executes zero-gap copy/renaming logic using native Node `fs` methods.

---

## ADR-007: Team Member User Profiles & Upload Attribution Ledger (`config/db.json`)

### Status
**ACCEPTED**

### Context
The user requested "who added what" tracking so the team can see which team member submitted which feedback screenshot.

### Decision
Implement a persistent JSON file database at [`config/db.json`](file:///c:/Users/Yashg/Downloads/Kosmo/config/db.json) storing user profile definitions (`Yash`, `Priyal`, `Dipak`, `Ankit`, `Kunal`), metadata mappings (`uploadedBy`, `channel`, `userHandle`, `severity`, `topic`, `notes`, `uploadedAt`), and dynamic user addition via `POST /api/add-user`.

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
Implement **Common Problem Finder NLP Cluster Engine** in `GET /api/common-problems`. The server aggregates recurring problem reports into frequency clusters with user attribution samples and severity indicators, rendered visually as progress bar widgets on the web UI dashboard.
