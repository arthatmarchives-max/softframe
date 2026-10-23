// ---------- Template config ----------
// Output size is 1080x1920 (Instagram story). Templates are 736x1308,
// so window coordinates (measured on the 736x1308 originals) get scaled.
const OUT_W = 1080, OUT_H = 1920;
const S = OUT_W / 736;

const TEMPLATES = [
  { id: 'butter-yellow', name: 'Butter yellow', src: 'templates/butter-yellow.jpg', win: { x: 216, y: 404, w: 262, h: 349, r: 0 },  cap: '#5a4a1a' },
  { id: 'pastel-pink',   name: 'Pastel pink',   src: 'templates/pastel-pink.jpg',   win: { x: 207, y: 394, w: 336, h: 507, r: 0 },  cap: '#7a3a4a' },
  { id: 'dreamy-white',  name: 'Dreamy white',  src: 'templates/dreamy-white.jpg',  win: { x: 200, y: 348, w: 405, h: 405, r: 0 },  cap: '#555555' },
  { id: 'pastel-blue',   name: 'Pastel blue',   src: 'templates/pastel-blue.jpg',   win: { x: 182, y: 350, w: 376, h: 440, r: 34 }, cap: '#2f4560' },
  { id: 'creamy-green',  name: 'Creamy green',  src: 'templates/creamy-green.jpg',  win: { x: 206, y: 466, w: 330, h: 431, r: 0 },  cap: '#3d5a38' },
];

// ---------- State ----------
const state = { tpl: TEMPLATES[0], photo: null, zoom: 1, panX: 0, panY: 0, caption: '' };
const images = {}; // template id -> loaded Image

// ---------- Elements ----------
const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');
const fileInput = $('file');

// ---------- Setup ----------
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

function buildThumbs() {
  const wrap = $('thumbs');
  TEMPLATES.forEach((t, idx) => {
    const b = document.createElement('button');
    b.className = 'thumb'; b.type = 'button'; b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', t.name); b.title = t.name;
    b.setAttribute('aria-checked', idx === 0 ? 'true' : 'false');
    b.innerHTML = `<img src="${t.src}" alt="" loading="lazy">`;
    b.onclick = () => {
      state.tpl = t;
      wrap.querySelectorAll('.thumb').forEach(x => x.setAttribute('aria-checked', 'false'));
      b.setAttribute('aria-checked', 'true');
      resetPan(); render();
    };
    wrap.appendChild(b);
  });
}

function winRect() {
  const w = state.tpl.win;
  return { x: w.x * S, y: w.y * S, w: w.w * S, h: w.h * S, r: w.r * S };
}

function baseScale() {
  const { w, h } = winRect();
  return Math.max(w / state.photo.width, h / state.photo.height);
}

function clampPan() {
  if (!state.photo) return;
  const { w, h } = winRect();
  const sc = baseScale() * state.zoom;
  const maxX = Math.max(0, (state.photo.width * sc - w) / 2);
  const maxY = Math.max(0, (state.photo.height * sc - h) / 2);
  state.panX = Math.min(maxX, Math.max(-maxX, state.panX));
  state.panY = Math.min(maxY, Math.max(-maxY, state.panY));
}

function resetPan() { state.panX = 0; state.panY = 0; clampPan(); }

// ---------- Rendering ----------
function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  if (r > 0) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

function render() {
  const img = images[state.tpl.id];
  if (!img) return;
  ctx.clearRect(0, 0, OUT_W, OUT_H);
  ctx.drawImage(img, 0, 0, OUT_W, OUT_H);

  if (!state.photo) return;
  const { x, y, w, h, r } = winRect();
  const sc = baseScale() * state.zoom;
  const pw = state.photo.width * sc, ph = state.photo.height * sc;

  ctx.save();
  roundRectPath(x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(state.photo, x + (w - pw) / 2 + state.panX, y + (h - ph) / 2 + state.panY, pw, ph);

  const text = state.caption.trim();
  if (text) {
    const size = Math.round(w * 0.11);
    ctx.font = `600 ${size}px Caveat, "Segoe Script", cursive`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = Math.min(ctx.measureText(text).width, w * 0.86);
    const padX = size * 0.6, bh = size * 1.5;
    const bx = x + w / 2 - tw / 2 - padX, by = y + h - bh - size * 0.45;
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.beginPath(); ctx.roundRect(bx, by, tw + padX * 2, bh, bh / 2); ctx.fill();
    ctx.fillStyle = state.tpl.cap;
    ctx.fillText(text, x + w / 2, by + bh / 2 + size * 0.04, w * 0.86);
  }
  ctx.restore();
}

// ---------- Photo loading ----------
function setPhoto(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.photo = img; state.zoom = 1; $('zoom').value = 1; resetPan();
    $('pickOverlay').hidden = true;
    $('controls').hidden = false;
    $('changePhoto').hidden = false;
    $('download').disabled = false; $('share').disabled = false;
    canvas.classList.add('draggable');
    render();
  };
  img.onerror = () => alert('Could not open that image. Try a JPG or PNG.');
  img.src = url; // browsers apply EXIF rotation automatically
}

// ---------- Dragging ----------
let drag = null;
canvas.addEventListener('pointerdown', e => {
  if (!state.photo) return;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, px: state.panX, py: state.panY };
});
canvas.addEventListener('pointermove', e => {
  if (!drag) return;
  const k = OUT_W / canvas.getBoundingClientRect().width; // screen px -> canvas px
  state.panX = drag.px + (e.clientX - drag.x) * k;
  state.panY = drag.py + (e.clientY - drag.y) * k;
  clampPan(); render();
});
['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, () => { drag = null; }));

// ---------- Export / share ----------
function toBlob() { return new Promise(res => canvas.toBlob(res, 'image/png')); }

async function download() {
  const blob = await toBlob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `softframe-${state.tpl.id}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function share() {
  const blob = await toBlob();
  const file = new File([blob], `softframe-${state.tpl.id}.png`, { type: 'image/png' });
  try { await navigator.share({ files: [file] }); } catch (e) { /* user cancelled */ }
}

// ---------- Wire up ----------
$('pickOverlay').onclick = () => fileInput.click();
$('changePhoto').onclick = () => fileInput.click();
fileInput.onchange = e => { setPhoto(e.target.files[0]); fileInput.value = ''; };
$('zoom').oninput = e => { state.zoom = +e.target.value; clampPan(); render(); };
$('caption').oninput = e => { state.caption = e.target.value; render(); };
$('download').onclick = download;
$('share').onclick = share;

// Show Share only if the browser can share files (most phones)
try {
  const probe = new File([''], 'x.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [probe] })) $('share').hidden = false;
} catch (e) {}

(async function init() {
  buildThumbs();
  await Promise.all(TEMPLATES.map(async t => { images[t.id] = await loadImage(t.src); }));
  if (document.fonts) { try { await document.fonts.load('600 40px Caveat'); } catch (e) {} }
  render();
})();
