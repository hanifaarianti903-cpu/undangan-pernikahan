'use strict';

//Konfigurasi 
const CONFIG = {
  // Waktu akad (WIB = UTC+7)
  weddingDate: new Date('2026-11-12T08:00:00+07:00'),
  eventTitle: 'Pernikahan Alwy & Anida',
  eventLocation: 'Grand Ballroom Mawar, Jl. Raya Darmo No. 1, Surabaya',
  storageKey: 'wedding_wishes_v1',
  gallerySeeds: ['love1', 'wed2', 'ring3', 'flower4', 'couple5', 'sunset6'],
};

// Helper 
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const pad = (n) => String(n).padStart(2, '0');

function showToast(message) {
  $('#toastMsg').textContent = message;
  bootstrap.Toast.getOrCreateInstance($('#appToast'), { delay: 2500 }).show();
}

// Memutar musik undangan
function mulaiMusik() {
  const music = document.getElementById('weddingMusic');

  if (music) {
    music.play().catch((error) => {
      console.log('Musik gagal diputar:', error);
    });
  }
}

// Mencegah XSS saat menampilkan input pengguna
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Nama tamu dari URL (?to=Nama)
function setGuestName() {
  const to = new URLSearchParams(location.search).get('to');
  if (to) $('#guestName').textContent = to.trim().slice(0, 50);
}

// Buka undangan
function initCover() {
  $('#openBtn').addEventListener('click', () => {
    $('#cover').classList.add('open');
    document.body.classList.remove('locked');
    window.scrollTo({ top: 0, behavior: 'instant' });

    mulaiMusik();

    setTimeout(() => {
      $$('#home .reveal').forEach((el) => el.classList.add('visible'));
    }, 300);
  });
}

// Countdown
function initCountdown() {
  const els = {
    d: $('#cd-days'), h: $('#cd-hours'), m: $('#cd-minutes'), s: $('#cd-seconds'),
  };

  function tick() {
    const diff = CONFIG.weddingDate - new Date();
    if (diff <= 0) {
      $('#countdown').innerHTML = '<p class="h4 script">Hari bahagia telah tiba 🎉</p>';
      clearInterval(timer);
      return;
    }
    els.d.textContent = Math.floor(diff / 86400000);
    els.h.textContent = pad(Math.floor((diff / 3600000) % 24));
    els.m.textContent = pad(Math.floor((diff / 60000) % 60));
    els.s.textContent = pad(Math.floor((diff / 1000) % 60));
  }
  tick();
  const timer = setInterval(tick, 1000);
}

// Tombol Simpan ke Kalender
function initCalendarLink() {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = CONFIG.weddingDate;
  const end = new Date(start.getTime() + 6 * 3600 * 1000); // 08.00 – 14.00
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: CONFIG.eventTitle,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: 'Akad nikah 08.00 WIB, resepsi 11.00 WIB.',
    location: CONFIG.eventLocation,
  });
  $('#calendarBtn').href = `https://calendar.google.com/calendar/render?${params}`;
}



// Galeri
function initGallery() {
  const grid = $('#galleryGrid');

  const galleryPhotos = [
    'images/foto1.jpeg',
    'images/foto2.jpeg',
    'images/foto3.jpeg',
    'images/foto4.jpeg',
    'images/foto5.jpeg',
    'images/foto6.jpeg'
  ];

  grid.innerHTML = galleryPhotos.map((photo, i) => `
    <div class="col-6 col-md-4 reveal">
      <div class="gallery-item ${i % 3 === 1 ? 'tall' : ''}"
           data-photo="${photo}"
           role="button"
           tabindex="0"
           aria-label="Foto ${i + 1}">
        <img loading="lazy"
             alt="Foto galeri ${i + 1}"
             src="${photo}"
             onerror="this.style.display='none'">
      </div>
    </div>
  `).join('');

  // Klik foto untuk memperbesar
  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;

    openLightbox(item.dataset.photo);
  });
}

function openLightbox(src) {
  let modalEl = $('#lightbox');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'lightbox';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content bg-transparent border-0">
          <button type="button" class="btn-close btn-close-white ms-auto mb-2" data-bs-dismiss="modal" aria-label="Tutup"></button>
          <img class="img-fluid rounded-4" alt="Foto diperbesar">
        </div>
      </div>`;
    document.body.appendChild(modalEl);
  }
  $('img', modalEl).src = src;
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// Salin nomor rekening
function initCopy() {
  $$('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = $('#' + btn.dataset.target).textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        showToast('Nomor berhasil disalin: ' + text);
      } catch {
        showToast('Gagal menyalin, silakan salin manual.');
      }
    });
  });
}

// RSVP & Ucapan (localStorage) 
const Wishes = {
  load() {
    try { return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || []; }
    catch { return []; }
  },
  save(list) { localStorage.setItem(CONFIG.storageKey, JSON.stringify(list)); },
};

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

function renderWishes() {
  const list = Wishes.load();
  $('#wishCount').textContent = list.length;
  const box = $('#wishList');

  if (!list.length) {
    box.innerHTML = '<p class="text-muted fst-italic">Belum ada ucapan. Jadilah yang pertama! 💌</p>';
    return;
  }
  const color = { 'Hadir': 'success', 'Tidak Hadir': 'danger', 'Masih Ragu': 'warning' };
  box.innerHTML = list.map((w) => `
    <div class="wish">
      <div class="d-flex justify-content-between align-items-start">
        <span class="who">${escapeHTML(w.name)}</span>
        <span class="badge text-bg-${color[w.attendance] || 'secondary'} badge-att">${escapeHTML(w.attendance)}</span>
      </div>
      <p class="mb-1 mt-1">${escapeHTML(w.message)}</p>
      <span class="time"><i class="bi bi-clock me-1"></i>${timeAgo(w.time)}</span>
    </div>`).join('');
}

function initRSVP() {
  const form = $('#rsvpForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name');
    const attendance = $('#attendance');
    const message = $('#message');

    // Validasi sederhana dengan kelas Bootstrap
    let valid = true;
    [name, attendance, message].forEach((el) => {
      const ok = el.value.trim() !== '';
      el.classList.toggle('is-invalid', !ok);
      el.classList.toggle('is-valid', ok);
      if (!ok) valid = false;
    });
    if (!valid) return;

    const list = Wishes.load();
    list.unshift({
      name: name.value.trim(),
      attendance: attendance.value,
      message: message.value.trim(),
      time: Date.now(),
    });
    Wishes.save(list);

    form.reset();
    $$('.is-valid, .is-invalid', form).forEach((el) => el.classList.remove('is-valid', 'is-invalid'));
    renderWishes();
    showToast('Terima kasih! Ucapan Anda telah terkirim 💛');
  });

  $('#clearWishes').addEventListener('click', () => {
    if (confirm('Hapus semua ucapan di perangkat ini?')) {
      localStorage.removeItem(CONFIG.storageKey);
      renderWishes();
    }
  });

  renderWishes();
  setInterval(renderWishes, 60000); // perbarui "x menit lalu"
}

// Scroll: reveal, nav aktif, tombol ke atas 
function initScrollEffects() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el) => io.observe(el));

  // Highlight menu sesuai section yang terlihat
  const links = $$('.bottom-nav .nav-link');
  const sections = links.map((a) => $(a.getAttribute('href')));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => s && spy.observe(s));

  const toTop = $('#toTop');
  window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 500), { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  setGuestName();
  initCover();
  initCountdown();
  initCalendarLink();
  initGallery();
  initCopy();
  initRSVP();
  initScrollEffects();
});
