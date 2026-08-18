# Product Requirements Document (PRD)
## Kosmo Feedback Hub & Auto-Organizer Web App

- **Version**: 1.0.0
- **Status**: Approved & In Development
- **Owner**: Kosmo Core Team
- **Target Audience**: Kosmo Product Managers, Designers, Developers, and Team Testers

---

## 1. Executive Summary

**Kosmo Feedback Hub** is a centralized web application and backend auto-organizer designed to streamline user feedback collection from multiple channels (Reddit DMs, WhatsApp, Instagram, Discord). Team members can upload raw feedback screenshots, which are automatically categorized, sequentially indexed (`APP-1`, `UI-1`, `BOTH-1`, `PROBLEM-1`), and organized into actionable problem boards and visual feedback galleries.

---

## 2. Goals & Objectives

- **Centralized Uploads**: Provide a single drag-and-drop web portal for all team members to upload raw feedback images into `RAW_IMAGES`.
- **Automated Categorization**: Automatically classify feedback images into four primary domains:
  - `APP`: Product utility, prompt quality, speed, pricing, and general user praise.
  - `UI`: Visual design, contrasts, element shapes, layout ergonomics, animations.
  - `BOTH`: Feedback containing both App utility commentary and UI design feedback.
  - `PROBLEMS`: Actionable bugs, UX friction points, and user complaints.
- **Zero Gaps & Sequential Indexing**: Maintain clean 1-indexed file sequences with zero gaps (`PROBLEM-1.jpeg`, `PROBLEM-2.jpeg`, etc.).
- **Live Team Dashboard**: Offer a high-end visual dashboard displaying real-time metrics, problem resolution tracking, and an execution trigger for the backend scripts.

---

## 3. User Persona & Stories

### User Personas
1. **Team Tester / PM**: Wants to drag & drop customer feedback screenshots from WhatsApp/Reddit and tag the user or issue.
2. **Product Designer**: Wants to filter feedback by `UI` to identify design pain points (e.g. contrast, animations, auto-scroll).
3. **Core Engineer**: Wants a dedicated `PROBLEMS` board to inspect bug reports with linked source screenshots.

### Key User Stories
- **US-1 (Image Upload)**: *As a team member*, I want to drag and drop raw screenshots into a web portal so that my team doesn't lose feedback in chat threads.
- **US-2 (Auto-Organize)**: *As a user*, I want to click a single "Run Auto-Organizer" button to run the backend script and move/copy images into structured category folders.
- **US-3 (Interactive Gallery)**: *As a designer*, I want to filter feedback by category tabs and view full-screen screenshot lightboxes with metadata.
- **US-4 (Problem Tracker)**: *As a developer*, I want to see a numbered list of all reported problems paired with their source image and description.

---

## 4. Feature Specifications

### 4.1 Team Image Upload Portal
- **Supported Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Destination**: Uploaded directly into `c:\Users\Yashg\Downloads\Kosmo\RAW_IMAGES`.
- **User Inputs**: Optional source tag (e.g. `Reddit`, `WhatsApp`, `Instagram`), username, and notes.

### 4.2 Auto-Organizer Backend Script Engine
- **Trigger**: Web API call `POST /api/run-organizer` executing `organize_feedback.ps1`.
- **Behavior**:
  - Clears existing contents of `APP/`, `UI/`, `BOTH/`, `PROBLEMS/`.
  - Sequentially copies and renames raw images into `APP-N`, `UI-N`, `BOTH-N`, `PROBLEM-N`.
  - Groups multi-image submissions from the same user sequentially.

### 4.3 Interactive Gallery & Lightbox
- **Filtering**: `All Feedback`, `Pending Queue (Untracked)`, `APP`, `UI`, `BOTH`, `PROBLEMS`.
- **Lightbox**: Click to open full-resolution preview with zoom, file details, and category tags.

### 4.4 Problems & Bugs Board
- Displays problem index (`PROBLEM-1` through `PROBLEM-25+`), user handle, problem description summary, and direct link to screenshot.

---

## 5. Non-Functional Requirements

- **Performance**: Image list API response < 100ms; backend script execution < 3 seconds.
- **Design Aesthetics**: Dark mode, glassmorphism visual cards, HSL accent badges, smooth CSS transitions.
- **Compatibility**: Windows 10/11, Node.js v20+, modern web browsers (Chrome, Edge, Firefox, Safari).
