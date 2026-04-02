'use strict';

// ============================================================
// STATE
// ============================================================
let allStudents = [];
let activeFilter = 'all';

// ============================================================
// HELPERS
// ============================================================
function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
  return parts[0][0];
}

// Determine sport category for filtering from tags
const SPORT_CATEGORIES = ['basketball', 'football', 'hockey', 'soccer', 'golf', 'baseball'];

function getSportCategory(tags) {
  if (!tags) return 'other';
  const lower = tags.map(t => t.toLowerCase());
  for (const sport of SPORT_CATEGORIES) {
    if (lower.includes(sport)) return sport;
  }
  return 'other';
}

// Pick the best display label from tags (e.g. "NBA", "WNBA", "LPGA")
const LEAGUE_LABELS = ['NBA', 'WNBA', 'NHL', 'NFL', 'MLB', 'MLS', 'NWSL', 'LPGA', 'PGA', 'EPL', 'NCAA'];

function getSportLabel(tags) {
  if (!tags || !tags.length) return 'Sport Management';
  // Find first league match
  for (const tag of tags) {
    const upper = tag.toUpperCase();
    if (LEAGUE_LABELS.includes(upper)) return upper;
  }
  // Fall back to first tag title-cased
  return tags[0].charAt(0).toUpperCase() + tags[0].slice(1);
}

// ============================================================
// NAV SCROLL EFFECT
// ============================================================
function initNav() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ============================================================
// SCROLL REVEAL
// ============================================================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ============================================================
// COUNTER ANIMATION
// ============================================================
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.count;
    if (!target) return;
    let current = 0;
    const inc = target / 40;
    const t = setInterval(() => {
      current += inc;
      if (current >= target) { el.textContent = target; clearInterval(t); }
      else el.textContent = Math.ceil(current);
    }, 40);
  });
}

// ============================================================
// BUILD FILTER BUTTONS
// ============================================================
function buildFilters(students) {
  const bar = document.getElementById('filter-bar');
  const sportsFound = new Set();
  students.forEach(s => {
    const cat = getSportCategory(s.tags);
    if (cat !== 'other') sportsFound.add(cat);
  });

  const sorted = [...sportsFound].sort();
  sorted.forEach(sport => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.filter = sport;
    btn.textContent = sport.charAt(0).toUpperCase() + sport.slice(1);
    bar.appendChild(btn);
  });

  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderCards();
    });
  });
}

// ============================================================
// RENDER CARDS
// ============================================================
function renderCards() {
  const grid = document.getElementById('cards-grid');
  const noResults = document.getElementById('no-results');

  const list = activeFilter === 'all'
    ? allStudents
    : allStudents.filter(s => getSportCategory(s.tags) === activeFilter);

  if (list.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  grid.innerHTML = list.map((s, i) => {
    const initials = getInitials(s.name);
    const sportLabel = getSportLabel(s.tags);
    const titleText = s.title === 'Coming Soon'
      ? '<em style="color:#999">Research title coming soon</em>'
      : s.title;

    const photoHtml = s.photo
      ? `<img src="${s.photo}" alt="${s.name}" loading="lazy" data-initials="${initials}" class="card-img">`
      : `<div class="card-photo-placeholder">${initials}</div>`;

    const tagsHtml = s.tags && s.tags.length
      ? s.tags.map(t => `<span class="keyword-tag">${t}</span>`).join('')
      : '';

    return `
      <div class="student-card reveal" style="transition-delay:${(i % 4) * 0.06}s" onclick="openModal(${s.id})">
        <div class="card-photo">
          ${photoHtml}
          <span class="card-sport-tag">${sportLabel}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${s.name}</div>
          <div class="card-degree">Sport Management, B.A. · Class of 2026</div>
          <div class="card-title">${titleText}</div>
          ${tagsHtml ? `<div class="card-keywords">${tagsHtml}</div>` : ''}
        </div>
        <div class="card-footer">
          <span class="card-email">${s.email}</span>
          <span class="card-cta">View Profile →</span>
        </div>
      </div>`;
  }).join('');

  // Fallback for broken card images
  grid.querySelectorAll('img.card-img').forEach(img => {
    img.addEventListener('error', function() {
      const initials = this.dataset.initials || '?';
      this.parentElement.innerHTML = `<div class="card-photo-placeholder">${initials}</div>`;
    });
  });

  // Observe new cards for scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  grid.querySelectorAll('.student-card').forEach(el => observer.observe(el));
}

// ============================================================
// MODAL
// ============================================================
function openModal(id) {
  const s = allStudents.find(s => s.id === id);
  if (!s) return;

  const initials = getInitials(s.name);
  const sportLabel = getSportLabel(s.tags);

  const photoHtml = s.photo
    ? `<img src="${s.photo}" alt="${s.name}" data-initials="${initials}" class="modal-img">`
    : `<div class="modal-photo-placeholder">${initials}</div>`;

  const tagsHtml = s.tags && s.tags.length
    ? s.tags.map(t => `<span class="keyword-tag">${t}</span>`).join('')
    : '';

  const abstractBtn = s.abstractUrl
    ? `<button class="modal-btn" onclick="window.open('${s.abstractUrl}','_blank')">📄 View Abstract</button>`
    : '';

  const resumeBtn = s.resumeUrl
    ? `<button class="modal-btn" onclick="window.open('${s.resumeUrl}','_blank')">⬇ Download Resume</button>`
    : '';

  const videoBtn = s.videoUrl
    ? `<button class="modal-btn video-btn" onclick="window.open('${s.videoUrl}','_blank')">▶ Watch Presentation</button>`
    : `<button class="modal-btn video-btn disabled" disabled title="Presentation coming soon">▶ Watch Presentation</button>`;

  const projectSection = s.title && s.title !== 'Coming Soon'
    ? `<div class="modal-project-title">${s.title}</div>`
    : '';

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-photo">${photoHtml}</div>
    <div class="modal-body">
      <span class="modal-sport-tag">${sportLabel}</span>
      <div class="modal-name">${s.name}</div>
      <div class="modal-degree">Sport Management, B.A. · Arcadia University · Class of 2026</div>
      <p class="modal-bio">${s.bio}</p>
      ${projectSection}
      ${tagsHtml ? `<div class="modal-keywords">${tagsHtml}</div>` : ''}
      <div class="modal-actions">
        <button class="modal-btn primary" onclick="window.open('mailto:${s.email}')">✉ Contact</button>
        ${videoBtn}
        ${resumeBtn}
        ${abstractBtn}
      </div>
    </div>`;

  // Fallback for broken modal image
  const modalImg = document.querySelector('.modal-img');
  if (modalImg) {
    modalImg.addEventListener('error', function() {
      const initials = this.dataset.initials || '?';
      this.parentElement.innerHTML = `<div class="modal-photo-placeholder">${initials}</div>`;
    });
  }

  document.getElementById('modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
window.openModal = openModal;

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================================
// INIT
// ============================================================
async function init() {
  initNav();

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  try {
    const res = await fetch('students.json');
    if (!res.ok) throw new Error('Failed to load students.json');
    allStudents = await res.json();
    buildFilters(allStudents);
    renderCards();
    initScrollReveal();
    setTimeout(animateCounters, 900);
  } catch (err) {
    document.getElementById('cards-grid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999">
        <p>Could not load student data. Please use a local server:<br><code>python3 -m http.server 8080</code></p>
      </div>`;
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
