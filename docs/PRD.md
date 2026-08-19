# Product Requirements Document (PRD)
## Kosmo Feedback Hub & Auto-Organizer Web App

- **Version**: 2.1.0
- **Status**: Production Deployed & Verified
- **Owner**: Kosmo Core Team
- **Target Audience**: Kosmo Product Managers, Designers, Developers, and Team Testers

---

## 1. Executive Summary

**Kosmo Feedback Hub** is a centralized web application and backend auto-organizer designed to streamline user feedback collection from multiple channels (Reddit DMs, WhatsApp, Instagram, Discord). Team members can upload raw feedback screenshots, which are automatically categorized, sequentially indexed (`APP-1`, `UI-1`, `BOTH-1`, `PROBLEM-1`), and organized into actionable problem boards and visual feedback galleries.

---

## 2. Goals & Objectives

- **Centralized Uploads**: Provide a single drag-and-drop web portal for all team members to upload raw feedback images into cloud storage (`RAW_IMAGES`/Supabase Storage).
- **Automated Categorization**: Automatically classify feedback images into four primary domains:
  - `APP`: Product utility, prompt quality, speed, pricing, and general user praise.
  - `UI`: Visual design, contrasts, element shapes, layout ergonomics, animations.
  - `BOTH`: Feedback containing both App utility commentary and UI design feedback.
  - `PROBLEMS`: Actionable bugs, UX friction points, and user complaints.
- **Zero Gaps & Sequential Indexing**: Maintain clean 1-indexed file sequences with zero gaps (`PROBLEM-1.jpeg`, `PROBLEM-2.jpeg`, etc.).
- **Live Team Dashboard**: Offer a high-end visual dashboard displaying real-time metrics, problem resolution tracking, NLP problem cluster widgets, and execution triggers.
- **Stateless Cloud Persistence**: Ensure 100% data persistence across cloud container redeploys and free-tier spin-downs via Supabase Storage and PostgreSQL database integration.

---

## 3. User Persona & Stories

### User Personas
1. **Team Member / PM**: Wants to select their profile from a dropdown, drag & drop customer feedback screenshots, and receive instant upload confirmation toasts.
2. **Product Designer**: Wants to filter feedback by `UI` to identify design pain points (e.g. contrast, animations, auto-scroll).
3. **Core Engineer**: Wants a dedicated `PROBLEMS` board to inspect bug reports with linked source screenshots.

### Key User Stories
- **US-1 (Image Upload & Feedback)**: *As a team member*, I want to select my profile and upload raw screenshots with visual progress bars and toast alerts.
- **US-2 (Auto-Organize)**: *As a user*, I want to click a single "Run Auto-Organizer" button to categorize images into domain folders/buckets.
- **US-3 (Interactive Gallery)**: *As a designer*, I want to filter feedback by category tabs, member attribution, or severity, and view full-screen lightboxes.
- **US-4 (Problem Tracker)**: *As a developer*, I want to see a numbered list of all reported problems paired with their source image and description.

---

## 4. Feature Specifications

### 4.1 Team Image Upload Portal & Attribution
- **Supported Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Destination**: Uploaded directly to Supabase Storage (with local fallback).
- **User Inputs**: Source channel, Team Member profile selector (synced with active user), and notes.

### 4.2 Auto-Organizer Backend Script Engine
- **Trigger**: Web API call `POST /api/run-organizer` executing native Node.js auto-organizer engine.
- **Behavior**:
  - Sequentially copies and renames raw images into `APP-N`, `UI-N`, `BOTH-N`, `PROBLEM-N`.
  - Maintains multi-image user grouping.

### 4.3 Interactive Gallery, Lightbox & Error Recovery
- **Filtering**: `All Feedback`, `RAW Store`, `APP`, `UI`, `BOTH`, `PROBLEMS`, `Bug Board`.
- **Error Recovery**: Automatic Retry error state UI for network resilience.
- **Lightbox**: Click to open full-resolution preview with metadata and download links.

### 4.4 Problems & Bugs Board
- Displays problem index (`PROBLEM-1` through `PROBLEM-25+`), user handle, problem description summary, and direct link to screenshot.

---

## 5. Non-Functional Requirements

- **Performance**: Image list API response < 100ms; backend script execution < 3 seconds.
- **Design Aesthetics**: Dark mode, glassmorphic visual cards, HSL accent badges, animated toast alerts.
- **Compatibility**: Modern web browsers (Chrome, Edge, Firefox, Safari), Linux containers (Render), Windows (local dev).
- **Security**: Restricted team access via `x-team-passcode` header and `TEAM_PASSCODE` environment variable.
