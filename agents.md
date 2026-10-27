# SrinivasNexus — Project Analysis

**SrinivasNexus** is a lightweight, responsive web portal designed for **Srinivas University Institute of Engineering and Technology (SUIET), Mukka, Mangaluru**. It provides students with a hub to discover campus events, fests, hackathons, concerts, and announcements.

---

## 1. Architecture & Tech Stack

| Layer | Implementation | Details |
|---|---|---|
| **Frontend Core** | HTML5, CSS3, Vanilla JS (ES6+ Modules) | Zero external framework dependencies, fast load time |
| **Typography & UI** | Google Fonts (`DM Sans`, `Manrope`), CSS Variables | Modern gradient cards, typographic hierarchy, responsive grid |
| **Cloud & Backend** | **Firebase Hosting** & **Cloud Firestore** (`v13.1.0`) | Project ID: `campus-pulse-b1181` |
| **State & Filtering** | Client-side DOM filtering & in-memory event dictionary | Real-time category, status, and text search |

---

## 2. File Structure & Responsibilities

- **`index.html`**:
  - **Hero Section**: University branding, dynamic event counter, CSS-animated orbital poster illustration.
  - **Announcements Section**: Container populated asynchronously via Firestore.
  - **Events Catalog**: Pre-rendered event cards (`MECHNOVA 2K26`, `Navaratri Vaibhava`, `CODEMEET 2026`, `ECHOSPHERE 2.0`, `Tech Yuva 2026`).
  - **Interactive Modal**: Details popup with registration form and official event links.
  - **Firebase Initialization Script**: Connects to Firestore and loads the `announcements` collection.
- **`script.js`**:
  - Client-side search and category/status filter algorithms.
  - Modal lifecycle management (`open`, `close`, `Escape` key listener, background click).
  - Form submission handling (demo state).
- **`style.css`**:
  - Responsive design rules (media queries at `950px` and `650px`).
  - Custom geometric artwork for event cards (sunburst, disc, rhythm rings, code shapes).
- **`firebase.json` & `.firebaserc`**:
  - Firebase Hosting configuration pointing to project `campus-pulse-b1181`.
- **`404.html`**:
  - Standard Firebase fallback error page.

---

## 3. Findings & Resolution Status

### ✅ Resolved Issues & Implemented Features
1. **Missing `dark-theme.css` (404 error in browser)**:
   - **Resolved**: Removed dead link `<link rel="stylesheet" href="dark-theme.css">` from `index.html`.
2. **Text Contrast Issue in Announcements**:
   - **Resolved**: Updated `.announcements-section` and `#announcementsList` in `style.css` with a high-contrast container, purple left-border accent cards, dark heading typography (`--ink`), and clean spacing.
3. **Past Event Registration**:
   - **Resolved**: For past events, the registration form is strictly hidden, and an informative "Event Concluded: Registrations are closed" notice banner is displayed.
4. **Cloud Firestore Registration**:
   - **Resolved**: Connected modal registration form to Firestore `registrations` collection via `addDoc` and `serverTimestamp`, with button loading state and confirmation message.
5. **Mobile Search Icon Navigation**:
   - **Resolved**: Replaced text navigation ("Find an Event" / "Explore Events") with a search icon on mobile viewports (`@media (max-width: 650px)`), which smooth-scrolls and auto-focuses the search bar.
6. **Announcements Sidebar Alert Drawer**:
   - **Resolved**: Removed announcements from the top flow and transformed into an interactive Neomorphic Slide-out Drawer (`#announcementsDrawer`), triggered via the navbar bell button and floating side alert pill (`#floatingAlertBtn`).
7. **Neomorphic Themed Overhaul & Micro-Animations**:
   - **Resolved**: Built a complete soft-UI neo-morphic design system with elevated cards, inset pressed states, cosmic gradients, smooth spring transitions, and interactive floating widgets.
8. **Earshot Audio Synthesizer**:
   - **Resolved**: Integrated a zero-dependency Web Audio API sound effects engine (`Earshot`) providing tactile pops on clicks/taps, smooth swooshes for drawer/modal openings, celebration fanfare on signups, and a navbar mute toggle.
9. **Shimmer Skeleton Loaders**:
   - **Resolved**: Added animated shimmer skeletons for announcements loading state and modal submission feedback.
10. **Multi-layer Caching & PWA**:
    - **Resolved**: Added `manifest.json`, `sw.js` (Service Worker), app icons, `localStorage` fast-path Firestore caching, and HTTP `Cache-Control` headers in `firebase.json`.
11. **Git Repository Initialization**:
    - **Resolved**: Initialized Git repository on `main` branch with granular commits per feature.

---

## 4. Future Enhancements

1. **Dynamic Event Loading**: Migrate hardcoded events to Firestore so organizers can add new events without modifying source code.
2. **User Authentication**: Add Firebase Authentication for organizers/admins to manage announcements and events from a dashboard.

