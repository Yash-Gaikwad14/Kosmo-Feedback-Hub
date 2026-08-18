# Architecture Decision Records (ADRs)
## Kosmo Feedback Hub & Auto-Organizer

- **Document Version**: 1.0.0
- **Status**: Active

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
  - Simple local setup with zero external database requirements.
- **Cons**:
  - Requires Windows PowerShell environment (which matches user's native Windows OS).

---

## ADR-002: Dedicated `RAW_IMAGES/` Storage Folder

### Status
**ACCEPTED**

### Context
Initially, raw feedback screenshots were placed loose in the project root directory (`c:\Users\Yashg\Downloads\Kosmo`). As project files (scripts, docs, node packages) grow, mixing raw images in the root folder creates clutter.

### Decision
Establish `c:\Users\Yashg\Downloads\Kosmo\RAW_IMAGES` as the designated raw image repository. All new uploads from the web app will land in `RAW_IMAGES/`. Backend scripts will read from both `RAW_IMAGES/` and root for backward compatibility.

### Consequences
- **Pros**:
  - Clean project root directory.
  - Team members have a clear single location for raw assets.
  - Raw images are permanently preserved before processing into `APP`, `UI`, `BOTH`, `PROBLEMS`.

---

## ADR-003: Multi-Category Tagging & Non-Destructive Copying

### Status
**ACCEPTED**

### Context
Certain user feedback (e.g. `Additional_Winter872`, `Ankit Jain`, `AttorneyOk1025`) contains both UI critiques and general App utility feedback or bugs. Moving a file to only one folder would obscure relevant feedback for other teams.

### Decision
Implement **Non-Destructive Copying (`Copy-Item -Force`)** where a single raw screenshot can be placed into multiple domain folders (`APP`, `UI`, `BOTH`, `PROBLEMS`) under separate 1-indexed filenames (e.g. `APP-53.jpeg`, `UI-29.jpeg`, `BOTH-25.jpeg`, `PROBLEM-21.jpeg`).

### Consequences
- **Pros**:
  - Complete feedback coverage across all functional domains.
  - Each folder maintains independent, zero-gap sequential numbering (`1..N`).
- **Cons**:
  - Disk storage is multiplied across copies (negligible for image files ~100KB each).

---

## ADR-004: Pure Vanilla Web UI with Custom Glassmorphic Aesthetics

### Status
**ACCEPTED**

### Context
The Web UI needs to be fast, responsive, wowed at first glance, and easy to run without heavy build steps (e.g. Webpack/Next.js complex setup).

### Decision
Use vanilla HTML5, CSS3 with custom variables/glassmorphism, and ES6 JavaScript.

### Consequences
- **Pros**:
  - Instant page load speed (< 50ms).
  - No build pipeline failures or node_modules bloat for frontend assets.
  - Rich visual aesthetics with custom dark theme, gradient cards, and smooth CSS transitions.
