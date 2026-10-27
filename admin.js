/* ============================================================
   SrinivasNexus — Admin Dashboard Controller
   Features: PIN Gate (696969), Real-time Firestore CRUD,
             Registrations Export, DB Inspector
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Audio Synthesizer (Zero-dependency Web Audio API)
const AudioFX = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('srinivasnexus_sound') !== 'disabled';

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  return {
    toggle() {
      enabled = !enabled;
      localStorage.setItem('srinivasnexus_sound', enabled ? 'enabled' : 'disabled');
      return enabled;
    },
    isEnabled: () => enabled,
    play(type = 'click') {
      if (!enabled) return;
      try {
        const audio = getCtx();
        const now = audio.currentTime;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.connect(gain);
        gain.connect(audio.destination);

        if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(750, now);
          osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.04);
        } else if (type === 'success') {
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const o = audio.createOscillator();
            const g = audio.createGain();
            o.connect(g);
            g.connect(audio.destination);
            o.type = 'triangle';
            o.frequency.value = freq;
            const d = i * 0.06;
            g.gain.setValueAtTime(0.1, now + d);
            g.gain.exponentialRampToValueAtTime(0.001, now + d + 0.35);
            o.start(now + d);
            o.stop(now + d + 0.35);
          });
        } else if (type === 'error') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        }
      } catch (e) {}
    }
  };
})();

// Sound toggle UI in admin navbar
const soundToggleAdmin = document.getElementById("soundToggleAdmin");
const adminSoundIcon = document.getElementById("adminSoundIcon");
if (soundToggleAdmin) {
  function updateAdminSoundIcon() {
    if (adminSoundIcon) adminSoundIcon.textContent = AudioFX.isEnabled() ? "🔊" : "🔇";
  }
  updateAdminSoundIcon();
  soundToggleAdmin.addEventListener("click", () => {
    const on = AudioFX.toggle();
    updateAdminSoundIcon();
    if (on) AudioFX.play('click');
  });
}

// ============================================================
// 1. PIN GATE SECURITY (PIN: 696969)
// ============================================================
const REQUIRED_PIN = "696969";
const pinGate = document.getElementById("pinGate");
const adminWrapper = document.getElementById("adminWrapper");
const pinInput = document.getElementById("pinInput");
const pinIndicators = document.querySelectorAll(".pin-dot");
const pinError = document.getElementById("pinError");
let currentPin = "";

function updatePinDots() {
  pinIndicators.forEach((dot, idx) => {
    dot.classList.toggle("filled", idx < currentPin.length);
  });
}

function verifyPin() {
  if (currentPin === REQUIRED_PIN) {
    AudioFX.play('success');
    sessionStorage.setItem("srinivasnexus_admin_pin", REQUIRED_PIN);
    unlockAdmin();
  } else {
    AudioFX.play('error');
    if (pinError) {
      pinError.hidden = false;
      pinError.classList.remove("shake");
      void pinError.offsetWidth; // retrigger reflow
      pinError.classList.add("shake");
    }
    currentPin = "";
    updatePinDots();
    if (pinInput) pinInput.value = "";
    setTimeout(() => {
      if (pinError) pinError.hidden = true;
    }, 2500);
  }
}

function handlePinDigit(digit) {
  if (currentPin.length < 6) {
    currentPin += digit;
    AudioFX.play('click');
    updatePinDots();
    if (currentPin.length === 6) {
      setTimeout(verifyPin, 120);
    }
  }
}

function handlePinBackspace() {
  if (currentPin.length > 0) {
    currentPin = currentPin.slice(0, -1);
    AudioFX.play('click');
    updatePinDots();
  }
}

function handlePinClear() {
  currentPin = "";
  AudioFX.play('click');
  updatePinDots();
  if (pinInput) pinInput.value = "";
}

// On-screen keypad event listeners
document.querySelectorAll(".key-btn[data-val]").forEach(btn => {
  btn.addEventListener("click", () => handlePinDigit(btn.dataset.val));
});

const pinClearBtn = document.getElementById("pinClearBtn");
if (pinClearBtn) pinClearBtn.addEventListener("click", handlePinClear);

const pinBackspaceBtn = document.getElementById("pinBackspaceBtn");
if (pinBackspaceBtn) pinBackspaceBtn.addEventListener("click", handlePinBackspace);

// Physical keyboard listener
document.addEventListener("keydown", e => {
  if (!adminWrapper.hidden) return; // already unlocked
  if (e.key >= "0" && e.key <= "9") {
    handlePinDigit(e.key);
  } else if (e.key === "Backspace") {
    handlePinBackspace();
  } else if (e.key === "Escape") {
    handlePinClear();
  }
});

// Check existing session
if (sessionStorage.getItem("srinivasnexus_admin_pin") === REQUIRED_PIN) {
  unlockAdmin();
} else {
  pinGate.hidden = false;
  adminWrapper.hidden = true;
}

// Lock / Logout button
const lockDashboardBtn = document.getElementById("lockDashboardBtn");
if (lockDashboardBtn) {
  lockDashboardBtn.addEventListener("click", () => {
    AudioFX.play('click');
    sessionStorage.removeItem("srinivasnexus_admin_pin");
    currentPin = "";
    updatePinDots();
    pinGate.hidden = false;
    adminWrapper.hidden = true;
    showToast("Dashboard locked successfully.", "info");
  });
}

function unlockAdmin() {
  pinGate.hidden = true;
  adminWrapper.hidden = false;
  initAdminDashboard();
}

// ============================================================
// 2. FIREBASE & DATA REPOSITORY
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyCb70w-6fEzP2CljWWSmTG2Vw6uhvBp-bI",
  authDomain: "campus-pulse-b1181.firebaseapp.com",
  projectId: "campus-pulse-b1181",
  storageBucket: "campus-pulse-b1181.firebasestorage.app",
  messagingSenderId: "213215309165",
  appId: "1:213215309165:web:93785658491b3d5a81fe64",
  measurementId: "G-JZ9HX594HN" 
};

let db = null;
let eventsData = [];
let registrationsData = [];
let announcementsData = [];
let isInitialized = false;

// Default university events dictionary for seeding if DB is empty
const DEFAULT_EVENTS = [
  {
    title: "MECHNOVA 2K26",
    category: "Sports",
    status: "Past",
    date: "October 5, 6 & 8, 2026",
    time: "Activities across three days",
    venue: "SUIET Campus, Mukka",
    tag: "Multi-event Fest",
    url: "",
    description: "A Technical • Cultural • Sports Extravaganza under AIMES. Listed activities include badminton, cricket, dance, photography, ideathon and project exhibition.",
    keywords: "mechnova aimes technical cultural sports badminton cricket dance photography ideathon"
  },
  {
    title: "Navaratri Vaibhava – Pilinalike 2026",
    category: "Cultural",
    status: "Past",
    date: "October 17, 2026",
    time: "Traditional day festivities",
    venue: "Open Air Auditorium, Mukka",
    tag: "Cultural Celebration",
    url: "",
    description: "A traditional cultural celebration organized by Srinivas University Institute of Engineering and Technology, Mukka, Mangaluru.",
    keywords: "navaratri vaibhava pilinalike cultural traditions open air auditorium mukka"
  },
  {
    title: "CODEMEET 2026",
    category: "Technical",
    status: "Upcoming",
    date: "October 31 – November 2, 2026",
    time: "Hackathon starts 9:30 AM Nov 1",
    venue: "SUIET, Mukka",
    tag: "Hackathon & Tech",
    url: "https://suiet.website/",
    description: "Workshops, competitions and a 24-hour national-level hackathon organized with Webflow Community.",
    keywords: "codemeet webflow workshop speed typing free fire treasure hunt 24 hours hackathon"
  },
  {
    title: "ECHOSPHERE 2.0",
    category: "Cultural",
    status: "Upcoming",
    date: "November 2, 2026",
    time: "6:00 PM onwards",
    venue: "Open Air Auditorium, SUIET, Mukka",
    tag: "Music & Arts",
    url: "https://echosphere.suiet.website/",
    description: "Concert night featuring Najran Kabeer and Benjamin Solomon at SUIET Open Air Auditorium.",
    keywords: "echosphere concert night najran kabeer benjamin solomon open air auditorium suiet"
  },
  {
    title: "Tech Yuva 2026",
    category: "Technical",
    status: "Past",
    date: "March 9, 10 & 12, 2026",
    time: "Completed",
    venue: "SUIET Campus, Mukka",
    tag: "University Fest",
    url: "https://srinivasuniversity.edu.in/pages/news-detail.php?id=297",
    description: "A national-level techno-cultural and sports fest hosted at SUIET Mukka in March 2026.",
    keywords: "tech yuva national level techno cultural sports fest suiet mukka"
  }
];

function initAdminDashboard() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    window.adminDB = db;

    const dbStatusText = document.getElementById("dbStatusText");
    if (dbStatusText) dbStatusText.textContent = "Firestore: campus-pulse-b1181";

    // Setup real-time listeners for all collections
    listenToEvents();
    listenToRegistrations();
    listenToAnnouncements();

    // Tab switching
    setupTabs();

    // Modals & Form submissions
    setupEventModal();
    setupAnnouncementModal();
    setupDeleteModal();
    setupSeeder();
    setupCsvExport();
    setupDbInspector();

    showToast("Admin authenticated. Connected to Firestore.", "success");
  } catch (err) {
    console.error("Firebase init error:", err);
    showToast("Could not connect to Firebase: " + err.message, "error");
  }
}

// ============================================================
// 3. REAL-TIME COLLECTION LISTENERS
// ============================================================
function listenToEvents() {
  const eventsTableBody = document.getElementById("eventsTableBody");
  const metricEventsCount = document.getElementById("metricEventsCount");
  const metricEventsSub = document.getElementById("metricEventsSub");
  const tabEventsCount = document.getElementById("tabEventsCount");

  onSnapshot(collection(db, "events"), (snapshot) => {
    eventsData = [];
    snapshot.forEach(d => {
      eventsData.push({ id: d.id, ...d.data() });
    });

    // Update metrics
    const total = eventsData.length;
    const upcoming = eventsData.filter(e => e.status === "Upcoming").length;
    const past = total - upcoming;

    if (metricEventsCount) metricEventsCount.textContent = total;
    if (metricEventsSub) metricEventsSub.textContent = `${upcoming} upcoming · ${past} past`;
    if (tabEventsCount) tabEventsCount.textContent = total;

    renderEventsTable();
    updateEventDropdowns();
    updateDbInspector();
  }, (err) => {
    console.warn("Events listener error:", err);
    if (eventsTableBody) {
      eventsTableBody.innerHTML = `<tr><td colspan="7" class="table-empty">Error loading events: ${err.message}</td></tr>`;
    }
  });
}

function listenToRegistrations() {
  const registrationsTableBody = document.getElementById("registrationsTableBody");
  const metricRegistrationsCount = document.getElementById("metricRegistrationsCount");
  const tabRegsCount = document.getElementById("tabRegsCount");

  onSnapshot(collection(db, "registrations"), (snapshot) => {
    registrationsData = [];
    snapshot.forEach(d => {
      registrationsData.push({ id: d.id, ...d.data() });
    });

    if (metricRegistrationsCount) metricRegistrationsCount.textContent = registrationsData.length;
    if (tabRegsCount) tabRegsCount.textContent = registrationsData.length;

    renderRegistrationsTable();
    updateDbInspector();
  }, (err) => {
    console.warn("Registrations listener fallback:", err);
    if (registrationsTableBody) {
      registrationsTableBody.innerHTML = `<tr><td colspan="6" class="table-empty">Notice: Registrations collection permissions may be write-only or empty (${err.message}).</td></tr>`;
    }
  });
}

function listenToAnnouncements() {
  const announcementsTableBody = document.getElementById("announcementsTableBody");
  const metricAnnouncementsCount = document.getElementById("metricAnnouncementsCount");
  const tabAnnounceCount = document.getElementById("tabAnnounceCount");

  onSnapshot(collection(db, "announcements"), (snapshot) => {
    announcementsData = [];
    snapshot.forEach(d => {
      announcementsData.push({ id: d.id, ...d.data() });
    });

    if (metricAnnouncementsCount) metricAnnouncementsCount.textContent = announcementsData.length;
    if (tabAnnounceCount) tabAnnounceCount.textContent = announcementsData.length;

    renderAnnouncementsTable();
    updateDbInspector();
  }, (err) => {
    console.warn("Announcements listener error:", err);
    if (announcementsTableBody) {
      announcementsTableBody.innerHTML = `<tr><td colspan="5" class="table-empty">Error loading announcements: ${err.message}</td></tr>`;
    }
  });
}

// ============================================================
// 4. RENDERING TABLES
// ============================================================
function renderEventsTable() {
  const tbody = document.getElementById("eventsTableBody");
  if (!tbody) return;

  const searchQ = (document.getElementById("eventSearch")?.value || "").toLowerCase().trim();
  const catFilter = document.getElementById("eventCategoryFilter")?.value || "All";
  const statusFilter = document.getElementById("eventStatusFilter")?.value || "All";

  const filtered = eventsData.filter(e => {
    const matchCat = catFilter === "All" || e.category === catFilter;
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    const matchSearch = !searchQ || 
      (e.title || "").toLowerCase().includes(searchQ) ||
      (e.venue || "").toLowerCase().includes(searchQ) ||
      (e.tag || "").toLowerCase().includes(searchQ);
    return matchCat && matchStatus && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">
          ${eventsData.length === 0 
            ? 'No events in Firestore yet. Click <strong>"⚡ Seed Default Events"</strong> or <strong>"+ Create New Event"</strong> to add campus events!' 
            : 'No events match your current filter.'}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td>
        <div class="table-event-cell">
          <span class="table-event-title">${escapeHtml(e.title || "Untitled Event")}</span>
          <span class="table-event-tag">${escapeHtml(e.tag || e.category || "Event")}</span>
        </div>
      </td>
      <td>
        <span class="category-pill">${escapeHtml(e.category || "General")}</span>
      </td>
      <td>
        <span class="status-pill ${e.status === 'Upcoming' ? 'up' : 'past'}">
          ${e.status === 'Upcoming' ? 'UPCOMING' : 'COMPLETED'}
        </span>
      </td>
      <td>
        <strong>${escapeHtml(e.date || "TBD")}</strong>
        <div style="font-size:11px;color:var(--muted);">${escapeHtml(e.time || "")}</div>
      </td>
      <td>${escapeHtml(e.venue || "SUIET Mukka")}</td>
      <td>
        ${e.url ? `<a href="${escapeHtml(e.url)}" target="_blank" rel="noopener" style="color:var(--purple);font-size:11.5px;font-weight:600;">Link ↗</a>` : '<span style="color:var(--muted);font-size:11px;">None</span>'}
      </td>
      <td style="text-align:right;">
        <div class="table-action-btns">
          <button class="action-icon-btn edit" data-action="edit-event" data-id="${e.id}" title="Edit Event">✏️</button>
          <button class="action-icon-btn delete" data-action="delete-event" data-id="${e.id}" data-title="${escapeHtml(e.title || '')}" title="Delete Event">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");

  // Re-bind action buttons
  tbody.querySelectorAll('[data-action="edit-event"]').forEach(btn => {
    btn.addEventListener("click", () => openEditEvent(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="delete-event"]').forEach(btn => {
    btn.addEventListener("click", () => promptDelete("events", btn.dataset.id, btn.dataset.title));
  });
}

function renderRegistrationsTable() {
  const tbody = document.getElementById("registrationsTableBody");
  if (!tbody) return;

  const searchQ = (document.getElementById("regSearch")?.value || "").toLowerCase().trim();
  const eventFilter = document.getElementById("regEventFilter")?.value || "All";

  const filtered = registrationsData.filter(r => {
    const matchEvent = eventFilter === "All" || r.eventName === eventFilter;
    const matchSearch = !searchQ ||
      (r.studentName || "").toLowerCase().includes(searchQ) ||
      (r.studentEmail || "").toLowerCase().includes(searchQ) ||
      (r.eventName || "").toLowerCase().includes(searchQ);
    return matchEvent && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${registrationsData.length === 0 ? "No student registrations recorded yet." : "No registrations match your search."}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    let dateStr = "Recent";
    if (r.createdAt?.toDate) {
      dateStr = r.createdAt.toDate().toLocaleString();
    } else if (r.registeredAt) {
      dateStr = new Date(r.registeredAt).toLocaleString();
    }

    return `
      <tr>
        <td><strong>${escapeHtml(r.studentName || "Anonymous")}</strong></td>
        <td><code>${escapeHtml(r.studentEmail || "No email")}</code></td>
        <td><span class="category-pill">${escapeHtml(r.eventName || "Campus Event")}</span></td>
        <td style="font-size:12px;color:var(--muted);">${dateStr}</td>
        <td><code style="font-size:11px;color:#888;">${r.id}</code></td>
        <td style="text-align:right;">
          <button class="action-icon-btn delete" data-action="delete-reg" data-id="${r.id}" data-title="${escapeHtml(r.studentName || 'Registration')}" title="Delete Record">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll('[data-action="delete-reg"]').forEach(btn => {
    btn.addEventListener("click", () => promptDelete("registrations", btn.dataset.id, btn.dataset.title));
  });
}

function renderAnnouncementsTable() {
  const tbody = document.getElementById("announcementsTableBody");
  if (!tbody) return;

  if (announcementsData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No campus announcements posted. Click "+ Post Announcement" to publish one!</td></tr>`;
    return;
  }

  tbody.innerHTML = announcementsData.map(a => `
    <tr>
      <td><strong>${escapeHtml(a.title || "Announcement")}</strong></td>
      <td><span class="category-pill">${escapeHtml(a.category || "General")}</span></td>
      <td style="max-width:340px;line-height:1.4;">${escapeHtml(a.message || "")}</td>
      <td><code style="font-size:11px;color:#888;">${a.id}</code></td>
      <td style="text-align:right;">
        <div class="table-action-btns">
          <button class="action-icon-btn edit" data-action="edit-announce" data-id="${a.id}" title="Edit Announcement">✏️</button>
          <button class="action-icon-btn delete" data-action="delete-announce" data-id="${a.id}" data-title="${escapeHtml(a.title || '')}" title="Delete Announcement">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll('[data-action="edit-announce"]').forEach(btn => {
    btn.addEventListener("click", () => openEditAnnouncement(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="delete-announce"]').forEach(btn => {
    btn.addEventListener("click", () => promptDelete("announcements", btn.dataset.id, btn.dataset.title));
  });
}

// Search and filter input triggers
["eventSearch", "eventCategoryFilter", "eventStatusFilter"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", renderEventsTable);
});

["regSearch", "regEventFilter"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", renderRegistrationsTable);
});

function updateEventDropdowns() {
  const regEventFilter = document.getElementById("regEventFilter");
  if (!regEventFilter) return;

  const uniqueEvents = [...new Set([
    ...eventsData.map(e => e.title),
    ...registrationsData.map(r => r.eventName)
  ])].filter(Boolean);

  const curVal = regEventFilter.value;
  regEventFilter.innerHTML = '<option value="All">All Registered Events</option>' + 
    uniqueEvents.map(title => `<option value="${escapeHtml(title)}">${escapeHtml(title)}</option>`).join("");
  
  if (uniqueEvents.includes(curVal)) {
    regEventFilter.value = curVal;
  }
}

// ============================================================
// 5. TAB SWITCHING
// ============================================================
function setupTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      AudioFX.play('click');
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
}

// ============================================================
// 6. EVENT EDITOR MODAL (CREATE & EDIT)
// ============================================================
const eventModal = document.getElementById("eventEditorModal");
const eventForm = document.getElementById("eventEditorForm");
const eventEditorTitle = document.getElementById("eventEditorTitle");
const saveEventSubmitBtn = document.getElementById("saveEventSubmitBtn");

function openCreateEvent() {
  AudioFX.play('click');
  eventForm.reset();
  document.getElementById("editEventDocId").value = "";
  eventEditorTitle.textContent = "Create New Campus Event";
  saveEventSubmitBtn.textContent = "Save to Firestore";
  eventModal.hidden = false;
}

function openEditEvent(id) {
  AudioFX.play('click');
  const ev = eventsData.find(e => e.id === id);
  if (!ev) return;

  document.getElementById("editEventDocId").value = id;
  document.getElementById("eventFormTitle").value = ev.title || "";
  document.getElementById("eventFormCategory").value = ev.category || "Technical";
  document.getElementById("eventFormStatus").value = ev.status || "Upcoming";
  document.getElementById("eventFormDate").value = ev.date || "";
  document.getElementById("eventFormTime").value = ev.time || "";
  document.getElementById("eventFormVenue").value = ev.venue || "";
  document.getElementById("eventFormTag").value = ev.tag || "";
  document.getElementById("eventFormUrl").value = ev.url || "";
  document.getElementById("eventFormDescription").value = ev.description || "";
  document.getElementById("eventFormKeywords").value = ev.keywords || "";

  eventEditorTitle.textContent = `Edit Event: ${ev.title}`;
  saveEventSubmitBtn.textContent = "Update Event";
  eventModal.hidden = false;
}

function setupEventModal() {
  document.getElementById("openCreateEventBtn")?.addEventListener("click", openCreateEvent);
  document.getElementById("closeEventEditorBtn")?.addEventListener("click", () => {
    eventModal.hidden = true;
  });
  document.getElementById("cancelEventEditorBtn")?.addEventListener("click", () => {
    eventModal.hidden = true;
  });

  eventForm.addEventListener("submit", async e => {
    e.preventDefault();
    const docId = document.getElementById("editEventDocId").value.trim();
    const payload = {
      title: document.getElementById("eventFormTitle").value.trim(),
      category: document.getElementById("eventFormCategory").value,
      status: document.getElementById("eventFormStatus").value,
      date: document.getElementById("eventFormDate").value.trim(),
      time: document.getElementById("eventFormTime").value.trim(),
      venue: document.getElementById("eventFormVenue").value.trim(),
      tag: document.getElementById("eventFormTag").value.trim(),
      url: document.getElementById("eventFormUrl").value.trim(),
      description: document.getElementById("eventFormDescription").value.trim(),
      keywords: document.getElementById("eventFormKeywords").value.trim(),
      updatedAt: serverTimestamp()
    };

    saveEventSubmitBtn.disabled = true;
    saveEventSubmitBtn.textContent = "Saving to Database...";

    try {
      if (docId) {
        await updateDoc(doc(db, "events", docId), payload);
        showToast(`Event "${payload.title}" updated successfully!`, "success");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "events"), payload);
        showToast(`New event "${payload.title}" created successfully!`, "success");
      }
      AudioFX.play('success');
      eventModal.hidden = true;
    } catch (err) {
      console.error("Save event error:", err);
      showToast("Error saving event: " + err.message, "error");
    } finally {
      saveEventSubmitBtn.disabled = false;
      saveEventSubmitBtn.textContent = "Save to Firestore";
    }
  });
}

// ============================================================
// 7. ANNOUNCEMENT EDITOR MODAL
// ============================================================
const announcementModal = document.getElementById("announcementEditorModal");
const announcementForm = document.getElementById("announcementEditorForm");
const announcementEditorTitle = document.getElementById("announcementEditorTitle");
const saveAnnouncementSubmitBtn = document.getElementById("saveAnnouncementSubmitBtn");

function openCreateAnnouncement() {
  AudioFX.play('click');
  announcementForm.reset();
  document.getElementById("editAnnouncementDocId").value = "";
  announcementEditorTitle.textContent = "Post Campus Announcement";
  saveAnnouncementSubmitBtn.textContent = "Publish to Feed";
  announcementModal.hidden = false;
}

function openEditAnnouncement(id) {
  AudioFX.play('click');
  const a = announcementsData.find(item => item.id === id);
  if (!a) return;

  document.getElementById("editAnnouncementDocId").value = id;
  document.getElementById("announcementFormTitle").value = a.title || "";
  document.getElementById("announcementFormCategory").value = a.category || "General";
  document.getElementById("announcementFormMessage").value = a.message || "";

  announcementEditorTitle.textContent = "Edit Campus Announcement";
  saveAnnouncementSubmitBtn.textContent = "Update Announcement";
  announcementModal.hidden = false;
}

function setupAnnouncementModal() {
  document.getElementById("openCreateAnnouncementBtn")?.addEventListener("click", openCreateAnnouncement);
  document.getElementById("closeAnnouncementEditorBtn")?.addEventListener("click", () => {
    announcementModal.hidden = true;
  });
  document.getElementById("cancelAnnouncementEditorBtn")?.addEventListener("click", () => {
    announcementModal.hidden = true;
  });

  announcementForm.addEventListener("submit", async e => {
    e.preventDefault();
    const docId = document.getElementById("editAnnouncementDocId").value.trim();
    const payload = {
      title: document.getElementById("announcementFormTitle").value.trim(),
      category: document.getElementById("announcementFormCategory").value,
      message: document.getElementById("announcementFormMessage").value.trim(),
      updatedAt: serverTimestamp()
    };

    saveAnnouncementSubmitBtn.disabled = true;
    saveAnnouncementSubmitBtn.textContent = "Publishing...";

    try {
      if (docId) {
        await updateDoc(doc(db, "announcements", docId), payload);
        showToast("Announcement updated successfully!", "success");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "announcements"), payload);
        showToast("Campus announcement broadcasted!", "success");
      }
      AudioFX.play('success');
      announcementModal.hidden = true;
    } catch (err) {
      console.error("Save announcement error:", err);
      showToast("Error saving announcement: " + err.message, "error");
    } finally {
      saveAnnouncementSubmitBtn.disabled = false;
      saveAnnouncementSubmitBtn.textContent = "Publish to Feed";
    }
  });
}

// ============================================================
// 8. DELETION CONFIRMATION
// ============================================================
let pendingDeleteTarget = null;
const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const confirmDeleteMessage = document.getElementById("confirmDeleteMessage");
const proceedDeleteBtn = document.getElementById("proceedDeleteBtn");

function promptDelete(colName, docId, label) {
  AudioFX.play('click');
  pendingDeleteTarget = { colName, docId, label };
  if (confirmDeleteMessage) {
    confirmDeleteMessage.innerHTML = `Are you sure you want to permanently delete <strong>${escapeHtml(label || docId)}</strong> from the <code>${colName}</code> collection?`;
  }
  confirmDeleteModal.hidden = false;
}

function setupDeleteModal() {
  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
    confirmDeleteModal.hidden = true;
    pendingDeleteTarget = null;
  });

  proceedDeleteBtn?.addEventListener("click", async () => {
    if (!pendingDeleteTarget) return;
    const { colName, docId, label } = pendingDeleteTarget;

    proceedDeleteBtn.disabled = true;
    proceedDeleteBtn.textContent = "Deleting...";

    try {
      await deleteDoc(doc(db, colName, docId));
      AudioFX.play('success');
      showToast(`Deleted ${escapeHtml(label || docId)} from ${colName}.`, "info");
      confirmDeleteModal.hidden = true;
      pendingDeleteTarget = null;
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Could not delete document: " + err.message, "error");
    } finally {
      proceedDeleteBtn.disabled = false;
      proceedDeleteBtn.textContent = "Permanently Delete";
    }
  });
}

// ============================================================
// 9. DEFAULT EVENT SEEDER
// ============================================================
function setupSeeder() {
  const seedBtn = document.getElementById("seedDefaultsBtn");
  if (!seedBtn) return;

  seedBtn.addEventListener("click", async () => {
    if (!confirm("This will insert any missing default Srinivas University events (MECHNOVA, CODEMEET, ECHOSPHERE, Navaratri, Tech Yuva) into your Firestore database. Proceed?")) {
      return;
    }

    AudioFX.play('click');
    seedBtn.disabled = true;
    seedBtn.innerHTML = '<span>⚡ Seeding events...</span>';

    try {
      let added = 0;
      for (const ev of DEFAULT_EVENTS) {
        const exists = eventsData.some(existing => existing.title?.toLowerCase() === ev.title.toLowerCase());
        if (!exists) {
          await addDoc(collection(db, "events"), {
            ...ev,
            createdAt: serverTimestamp()
          });
          added++;
        }
      }

      AudioFX.play('success');
      showToast(`Seeding complete: ${added} new events inserted into Firestore!`, "success");
    } catch (err) {
      console.error("Seeding error:", err);
      showToast("Seeding failed: " + err.message, "error");
    } finally {
      seedBtn.disabled = false;
      seedBtn.innerHTML = '<span>⚡ Seed Default Events</span>';
    }
  });
}

// ============================================================
// 10. CSV EXPORT
// ============================================================
function setupCsvExport() {
  const exportBtn = document.getElementById("exportRegistrationsCsvBtn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", () => {
    AudioFX.play('click');
    if (registrationsData.length === 0) {
      showToast("No registrations available to export.", "info");
      return;
    }

    const headers = ["Record ID", "Student Name", "College Email", "Event Name", "Registration Date"];
    const rows = registrationsData.map(r => {
      let dateStr = "";
      if (r.createdAt?.toDate) dateStr = r.createdAt.toDate().toISOString();
      else if (r.registeredAt) dateStr = r.registeredAt;
      return [
        `"${r.id}"`,
        `"${(r.studentName || '').replace(/"/g, '""')}"`,
        `"${(r.studentEmail || '').replace(/"/g, '""')}"`,
        `"${(r.eventName || '').replace(/"/g, '""')}"`,
        `"${dateStr}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SrinivasNexus_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Downloaded registrations CSV file!", "success");
  });
}

// ============================================================
// 11. DATABASE INSPECTOR (ALL ROWS & RAW JSON)
// ============================================================
function setupDbInspector() {
  const selector = document.getElementById("dbCollectionSelector");
  const refreshBtn = document.getElementById("refreshDbInspectorBtn");
  const copyBtn = document.getElementById("copyRawJsonBtn");

  if (selector) selector.addEventListener("change", updateDbInspector);
  if (refreshBtn) refreshBtn.addEventListener("click", () => {
    AudioFX.play('click');
    updateDbInspector();
    showToast("Database inspector refreshed.", "info");
  });

  if (copyBtn) copyBtn.addEventListener("click", () => {
    const jsonText = document.getElementById("rawJsonDisplay")?.textContent;
    if (jsonText) {
      navigator.clipboard.writeText(jsonText).then(() => {
        AudioFX.play('click');
        showToast("JSON copied to clipboard!", "success");
      });
    }
  });
}

function updateDbInspector() {
  const selector = document.getElementById("dbCollectionSelector");
  const display = document.getElementById("rawJsonDisplay");
  const countEl = document.getElementById("rawDocCount");
  if (!selector || !display) return;

  const colName = selector.value;
  let targetData = [];

  if (colName === "events") targetData = eventsData;
  else if (colName === "registrations") targetData = registrationsData;
  else if (colName === "announcements") targetData = announcementsData;

  if (countEl) countEl.textContent = `Collection: ${colName} (${targetData.length} documents)`;
  display.textContent = JSON.stringify(targetData, null, 2);
}

// ============================================================
// 12. UTILITIES & TOASTS
// ============================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
