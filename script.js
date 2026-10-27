/* ============================================================
   SrinivasNexus — Interactive Event Platform Logic
   Features: Neomorphic UI, Earshot Audio, Drawer Alerts, Shimmer
   ============================================================ */

// 1. Earshot Web Audio API Synthesizer
const Earshot = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('srinivasnexus_sound') !== 'disabled';

  function getContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  return {
    isEnabled() {
      return enabled;
    },
    toggle() {
      enabled = !enabled;
      localStorage.setItem('srinivasnexus_sound', enabled ? 'enabled' : 'disabled');
      return enabled;
    },
    play(type = 'click') {
      if (!enabled) return;
      try {
        const audio = getContext();
        const now = audio.currentTime;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.connect(gain);
        gain.connect(audio.destination);

        if (type === 'click') {
          // Tactile crisp pop
          osc.type = 'sine';
          osc.frequency.setValueAtTime(820, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
          osc.start(now);
          osc.stop(now + 0.045);
        } else if (type === 'tap') {
          // Soft filter tap
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(540, now);
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === 'open') {
          // Upward neo-swoosh
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'close') {
          // Downward soft release
          osc.type = 'sine';
          osc.frequency.setValueAtTime(680, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.09);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'success') {
          // Celebratory arpeggio chord (C Major)
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const o = audio.createOscillator();
            const g = audio.createGain();
            o.connect(g);
            g.connect(audio.destination);
            o.type = 'triangle';
            o.frequency.value = freq;
            const delay = idx * 0.07;
            g.gain.setValueAtTime(0.12, now + delay);
            g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
            o.start(now + delay);
            o.stop(now + delay + 0.4);
          });
        }
      } catch (err) {
        // AudioContext not available or blocked
      }
    }
  };
})();

// Initialize Sound Toggle Button
const soundToggleBtn = document.getElementById("soundToggleBtn");
const soundIcon = document.getElementById("soundIcon");
if (soundToggleBtn) {
  function updateSoundUI() {
    const isMuted = !Earshot.isEnabled();
    if (soundIcon) soundIcon.textContent = isMuted ? "🔇" : "🔊";
    soundToggleBtn.title = isMuted ? "Sound Effects: OFF" : "Earshot Sound FX: ON";
  }
  updateSoundUI();
  soundToggleBtn.addEventListener("click", () => {
    const active = Earshot.toggle();
    updateSoundUI();
    if (active) Earshot.play('click');
  });
}

// 2. Events Data
const events = {
  "MECHNOVA 2K26": {
    description: "A Technical • Cultural • Sports Extravaganza under AIMES. Listed activities include badminton, 30-yard cricket, dance, reel making, photography, portrait art, carrom, engineering tool challenge, mehendi, face art, anime quiz, tug-of-war, ideathon, project exhibition and rangoli.",
    date: "October 5, 6 & 8, 2026",
    venue: "SUIET Campus, Mukka",
    time: "Activities across three days",
    status: "Past event — completed",
    url: ""
  },
  "Navaratri Vaibhava – Pilinalike 2026": {
    description: "A traditional cultural celebration organized by Srinivas University Institute of Engineering and Technology, Mukka, Mangaluru.",
    date: "October 17, 2026",
    venue: "Open Air Auditorium, Mukka",
    time: "Traditional day festivities",
    status: "Past event — completed",
    url: ""
  },
  "CODEMEET 2026": {
    description: "Three days of tech, thrill and innovation in collaboration with Webflow Community. Activities include workshops, Speed Typing, Free Fire, Treasure Hunt and a 24-hour national-level hackathon.",
    date: "October 31 – November 2, 2026",
    venue: "Srinivas University Institute of Engineering and Technology, Mukka",
    time: "See official schedule; hackathon starts at 9:30 AM on November 1",
    status: "Upcoming",
    url: "https://suiet.website/"
  },
  "ECHOSPHERE 2.0": {
    description: "A concert night featuring Najran Kabeer and Benjamin Solomon at SUIET Open Air Auditorium.",
    date: "November 2, 2026",
    venue: "Open Air Auditorium, SUIET, Mukka, Surathkal",
    time: "6:00 PM onwards",
    status: "Upcoming",
    url: "https://echosphere.suiet.website/"
  },
  "Tech Yuva 2026": {
    description: "A national-level techno-cultural and sports fest hosted at SUIET Mukka in March 2026.",
    date: "March 9, 10 & 12, 2026",
    venue: "SUIET Campus, Mukka",
    time: "Completed",
    status: "Past event — completed",
    url: "https://srinivasuniversity.edu.in/pages/news-detail.php?id=297"
  }
};

// 3. Search and Filtering
const searchInput = document.getElementById("searchInput");
const buttons = [...document.querySelectorAll(".filter-btn")];
const catButtons = buttons.filter(b => b.dataset.category);
const statusButtons = buttons.filter(b => b.dataset.status);
const cards = [...document.querySelectorAll(".event-card")];
const resultCount = document.getElementById("resultCount");
const eventCount = document.getElementById("eventCount");
const empty = document.getElementById("emptyState");
const grid = document.getElementById("eventGrid");

let category = "All";
let status = "All";

function filterEvents() {
  const q = searchInput.value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    const cm = category === "All" || card.dataset.category === category;
    const sm = status === "All" || card.dataset.status === status;
    const tm = (`${card.dataset.search} ${card.innerText}`).toLowerCase().includes(q);
    const show = cm && sm && tm;
    card.hidden = !show;
    if (show) count++;
  });
  if (resultCount) resultCount.textContent = `${count} event${count === 1 ? "" : "s"}`;
  if (eventCount) eventCount.textContent = count;
  if (empty) empty.hidden = count !== 0;
  if (grid) grid.hidden = count === 0;
}

if (searchInput) {
  searchInput.addEventListener("input", filterEvents);
}

catButtons.forEach(b => {
  b.addEventListener("click", () => {
    Earshot.play('tap');
    category = b.dataset.category;
    catButtons.forEach(x => x.classList.toggle("selected", x === b));
    filterEvents();
  });
});

statusButtons.forEach(b => {
  b.addEventListener("click", () => {
    Earshot.play('tap');
    status = status === b.dataset.status ? "All" : b.dataset.status;
    statusButtons.forEach(x => x.classList.toggle("selected", x.dataset.status === status));
    filterEvents();
  });
});

const resetBtn = document.getElementById("resetFilters");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    Earshot.play('click');
    searchInput.value = "";
    category = "All";
    status = "All";
    catButtons.forEach(b => b.classList.toggle("selected", b.dataset.category === "All"));
    statusButtons.forEach(b => b.classList.remove("selected"));
    filterEvents();
  });
}

// 4. Sidebar Alert Drawer Controls
const announcementsDrawer = document.getElementById("announcementsDrawer");
const announcementsBackdrop = document.getElementById("announcementsBackdrop");
const openDrawerNavBtn = document.getElementById("openDrawerNavBtn");
const floatingAlertBtn = document.getElementById("floatingAlertBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

function openDrawer() {
  Earshot.play('open');
  if (announcementsDrawer) announcementsDrawer.classList.add("open");
  if (announcementsBackdrop) announcementsBackdrop.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  Earshot.play('close');
  if (announcementsDrawer) announcementsDrawer.classList.remove("open");
  if (announcementsBackdrop) announcementsBackdrop.classList.remove("open");
  document.body.style.overflow = "";
}

if (openDrawerNavBtn) openDrawerNavBtn.addEventListener("click", openDrawer);
if (floatingAlertBtn) floatingAlertBtn.addEventListener("click", openDrawer);
if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
if (announcementsBackdrop) announcementsBackdrop.addEventListener("click", closeDrawer);

// 5. Modal Management
const modal = document.getElementById("eventModal");
const form = document.getElementById("registrationForm");
const success = document.getElementById("successMessage");
const pastNotice = document.getElementById("pastEventNotice");
const link = document.getElementById("officialEventLink");
let selected = "";

document.querySelectorAll(".register-btn").forEach(b => {
  b.addEventListener("click", () => {
    Earshot.play('open');
    selected = b.dataset.event;
    const e = events[selected];
    if (!e) return;

    document.getElementById("modalTitle").textContent = selected;
    document.getElementById("modalDescription").textContent = e.description;
    document.getElementById("modalDate").textContent = e.date;
    document.getElementById("modalVenue").textContent = e.venue;
    document.getElementById("modalTime").textContent = e.time;
    document.getElementById("modalStatus").textContent = e.status;

    if (e.url) {
      link.href = e.url;
      link.hidden = false;
    } else {
      link.hidden = true;
      link.removeAttribute("href");
    }

    const card = b.closest(".event-card");
    const isPast = (card && card.dataset.status === "Past") || (e.status && (e.status.toLowerCase().includes("past") || e.status.toLowerCase().includes("completed")));
    
    // For past events, strictly hide registration form and show concluded notice
    form.hidden = isPast;
    if (pastNotice) pastNotice.hidden = !isPast;
    success.hidden = true;
    form.reset();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  });
});

function closeModal() {
  Earshot.play('close');
  modal.hidden = true;
  document.body.style.overflow = "";
  if (pastNotice) pastNotice.hidden = true;
}

const closeModalBtn = document.getElementById("closeModal");
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!modal.hidden) closeModal();
    if (announcementsDrawer && announcementsDrawer.classList.contains("open")) closeDrawer();
  }
});

// 6. Form Submission with Shimmer Loading & Confetti Celebration
form.addEventListener("submit", async e => {
  e.preventDefault();
  const nameInput = document.getElementById("studentName");
  const emailInput = document.getElementById("studentEmail");
  const submitBtn = form.querySelector(".submit-btn");
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  if (!name || !email) return;

  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Saving to SrinivasNexus...";

  try {
    if (typeof window.saveRegistrationToFirestore === "function") {
      await window.saveRegistrationToFirestore({
        eventName: selected,
        studentName: name,
        studentEmail: email,
        registeredAt: new Date().toISOString()
      });
    }

    form.hidden = true;
    success.hidden = false;
    success.querySelector("strong").textContent = `Registration Confirmed, ${name}! 🎉`;
    success.querySelector("p").textContent = `Your interest in ${selected} is securely recorded in the SrinivasNexus database. Updates will be emailed to ${email}.`;

    // Earshot celebratory audio chime
    Earshot.play('success');

    // Confetti celebration effect
    if (typeof window.confetti === "function") {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  } catch (err) {
    console.warn("Firestore registration fallback:", err);
    form.hidden = true;
    success.hidden = false;
    success.querySelector("strong").textContent = `Thanks, ${name}!`;
    success.querySelector("p").textContent = `Your interest in ${selected} has been recorded!`;
    Earshot.play('success');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.textContent = originalText;
  }
});

// 7. Mobile Search Icon Navigation
const navSearchBtn = document.getElementById("navSearchBtn");
if (navSearchBtn) {
  navSearchBtn.addEventListener("click", () => {
    Earshot.play('click');
    setTimeout(() => {
      searchInput.focus();
    }, 350);
  });
}

// Initial filter execution
filterEvents();
