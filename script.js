// ===== Settings =====
const BIRTH_YEAR = 1995;
const BDAY_MONTH = 9;   // October (month 0 se start hota hai)
const BDAY_DAY   = 13;
const DAY = 24 * 60 * 60 * 1000;
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');

// 13 Oct 00:00 KST = 12 Oct 15:00 UTC
const kstMidnightUTC = y => Date.UTC(y, BDAY_MONTH, BDAY_DAY - 1, 15, 0, 0);

let forcePreview = false;

function getTarget(now) {
  const y = new Date(now).getUTCFullYear();
  let t = kstMidnightUTC(y);
  if (now >= t + DAY) t = kstMidnightUTC(y + 1);
  return t;
}

function tick() {
  const now = Date.now();
  const target = getTarget(now);
  const targetYear = new Date(target + 9 * 3600 * 1000).getUTCFullYear();
  const age = targetYear - BIRTH_YEAR;
  const isBirthday = forcePreview || (now >= target && now < target + DAY);

  if (isBirthday) {
    if (!document.body.classList.contains('bday')) {
      document.body.classList.add('bday');
      launchConfetti();
    }
    $('headline').textContent = `Happy Birthday Jimin! 💜 ${age} today`;
    $('sub').textContent = '생일 축하해, 지민. Thank you for everything.';
    return;
  }

  document.body.classList.remove('bday');
  $('headline').textContent = `Jimin turns ${age} in`;
  const diff = Math.max(0, target - now);
  $('d').textContent = pad(Math.floor(diff / DAY));
  $('h').textContent = pad(Math.floor(diff % DAY / 3600000));
  $('m').textContent = pad(Math.floor(diff % 3600000 / 60000));
  $('s').textContent = pad(Math.floor(diff % 60000 / 1000));

  const local = new Date(target).toLocaleString([], {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit'
  });
  $('sub').innerHTML = `Counting to 13 October, 12:00 AM Korea time (KST).<br><span>In your time: ${local}</span>`;
}

// ===== Confetti =====
function launchConfetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('confetti'), ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const colors = ['#f7b6d2', '#c9b6f2', '#ffcfa8', '#fff6fb', '#a78bfa'];
  const bits = Array.from({ length: 140 }, () => ({
    x: Math.random() * c.width, y: -Math.random() * c.height,
    r: 6 + Math.random() * 8, vy: 1.5 + Math.random() * 2.5, vx: -1 + Math.random() * 2,
    rot: Math.random() * 6, vr: -.05 + Math.random() * .1,
    col: colors[Math.floor(Math.random() * colors.length)], heart: Math.random() > .5
  }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const b of bits) {
      b.x += b.vx; b.y += b.vy; b.rot += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.col;
      if (b.heart) { ctx.font = `${b.r * 2}px serif`; ctx.fillText('♥', -b.r, b.r); }
      else { ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r / 2, 0, 0, 6.3); ctx.fill(); }
      ctx.restore();
    }
    if (t - t0 < 7000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
  })(t0);
}

// ===== Storage helpers =====
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ===== Background =====
if (CONFIG.background) {
  document.documentElement.style.setProperty('--bg', `url("${CONFIG.background}")`);
}

// ===== Photo board (Pinterest style) =====
const photos = CONFIG.photos.map(p => typeof p === 'string' ? { src: p, caption: '' } : p);
const hearts = new Set(read('jimin-hearts', []));

function buildBoard() {
  const pins = $('pins');
  pins.innerHTML = '';

  if (!photos.length) {
    // placeholders, jab tak real photos nahi aati
    ['a','b','c','d','b','a','d','c','a'].forEach(cls => {
      const d = document.createElement('div');
      d.className = 'pin';
      d.innerHTML = `<div class="ph ${cls}">Jimin's photo goes here 💜</div>`;
      pins.append(d);
    });
    return;
  }

  photos.forEach((p, i) => {
    const pin = document.createElement('div');
    pin.className = 'pin';

    const img = document.createElement('img');
    img.src = p.src; img.loading = 'lazy';
    img.alt = p.caption || `Jimin photo ${i + 1}`;
    img.addEventListener('click', () => openLb(i));

    const heart = document.createElement('button');
    heart.type = 'button';
    heart.className = 'heart' + (hearts.has(p.src) ? ' on' : '');
    heart.textContent = '♥';
    heart.setAttribute('aria-label', 'Like this photo');
    heart.addEventListener('click', () => {
      hearts.has(p.src) ? hearts.delete(p.src) : hearts.add(p.src);
      heart.classList.toggle('on');
      write('jimin-hearts', [...hearts]);
    });

    pin.append(img, heart);
    if (p.caption) {
      const cap = document.createElement('div');
      cap.className = 'cap'; cap.textContent = p.caption;
      pin.append(cap);
    }
    pins.append(pin);
  });
}

// ===== Photo viewer =====
let cur = 0;
function showLb() {
  const p = photos[cur];
  $('lbImg').src = p.src; $('lbImg').alt = p.caption || '';
  $('lbCap').textContent = p.caption || '';
}
function openLb(i) { cur = i; showLb(); $('lb').hidden = false; $('lbClose').focus(); }
function closeLb() { $('lb').hidden = true; }
const step = d => { cur = (cur + d + photos.length) % photos.length; showLb(); };
$('lbClose').addEventListener('click', closeLb);
$('lbPrev').addEventListener('click', () => step(-1));
$('lbNext').addEventListener('click', () => step(1));
$('lb').addEventListener('click', e => { if (e.target === $('lb')) closeLb(); });
addEventListener('keydown', e => {
  if ($('lb').hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

// ===== Music (Spotify / YouTube playlist) =====
function toEmbed(url) {
  let m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track)\/([A-Za-z0-9]+)/);
  if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, h: m[1] === 'track' ? 152 : 352 };
  m = url.match(/[?&]list=([\w-]+)/);
  if (m) return { src: `https://www.youtube.com/embed/videoseries?list=${m[1]}`, h: 215 };
  m = url.match(/(?:youtu\.be\/|[?&]v=)([\w-]{11})/);
  if (m) return { src: `https://www.youtube.com/embed/${m[1]}`, h: 215 };
  return null;
}

const embed = CONFIG.playlist ? toEmbed(CONFIG.playlist) : null;
if (embed) {
  $('musicBtn').hidden = false;
  $('musicBtn').addEventListener('click', () => {
    const panel = $('musicPanel');
    const open = panel.hidden;
    panel.hidden = !open;
    $('musicBtn').setAttribute('aria-expanded', String(open));
    if (open && !panel.firstChild) {
      const f = document.createElement('iframe');
      f.src = embed.src; f.height = embed.h; f.title = 'Jimin playlist';
      f.allow = 'autoplay; encrypted-media; fullscreen; clipboard-write';
      f.loading = 'lazy';
      panel.append(f);
    }
  });
}

// ===== Wishes (is browser mein save hoti hain) =====
function renderWishes() {
  const list = read('jimin-bday-wishes', []);
  const wall = $('wall');
  wall.innerHTML = '';
  list.slice().reverse().forEach(w => {
    const n = document.createElement('div'); n.className = 'pin note';
    const t = document.createElement('div'); t.className = 'text'; t.textContent = w.msg;
    const b = document.createElement('div'); b.className = 'by';   b.textContent = w.who;
    n.append(t, b); wall.append(n);
  });
  $('empty').style.display = list.length ? 'none' : 'block';
}
$('msg').addEventListener('input', e => { $('count').textContent = `${e.target.value.length} / 200`; });
$('send').addEventListener('click', () => {
  const msg = $('msg').value.trim();
  const who = $('who').value.trim() || 'ARMY';
  if (!msg) { $('msg').focus(); return; }
  const list = read('jimin-bday-wishes', []);
  list.push({ who, msg });
  write('jimin-bday-wishes', list);
  $('msg').value = ''; $('count').textContent = '0 / 200';
  renderWishes();
});

$('preview').addEventListener('click', () => {
  forcePreview = !forcePreview;
  $('preview').textContent = forcePreview ? 'Back to countdown' : 'Preview birthday mode';
  document.body.classList.remove('bday');
  tick();
  if (forcePreview) scrollTo({ top: 0 });
});

buildBoard();
renderWishes();
tick();
setInterval(tick, 1000);
