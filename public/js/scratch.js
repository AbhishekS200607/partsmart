/* ============================================
   PARTSMART - Scratch Page JS
   ============================================ */

let currentClaim = null;
let scratchRevealed = false;

// ── Invoice Form ──────────────────────────────
const invoiceForm = document.getElementById('invoiceForm');
const invoiceInput = document.getElementById('invoiceInput');
const invoiceError = document.getElementById('invoiceError');

invoiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const invoice = invoiceInput.value.trim().toUpperCase();

  // Client-side validation
  if (!invoice || !/^[A-Za-z0-9\-\/]{4,50}$/.test(invoice)) {
    showError('Please enter a valid invoice number (4–50 characters, letters/numbers/hyphens).');
    return;
  }

  hideError();
  setLoading('submitBtn', 'submitText', 'submitSpinner', true);

  try {
    const { ok, data } = await api('/api/claim', {
      method: 'POST',
      body: JSON.stringify({ invoice_number: invoice, device_fingerprint: getDeviceFingerprint() })
    });

    if (!ok) {
      showError(data.errors?.[0]?.msg || data.message || 'Something went wrong.');
      return;
    }

    if (data.status === 'already_claimed') {
      window.location.href = `/claimed?invoice=${encodeURIComponent(invoice)}`;
      return;
    }

    // New claim — show scratch card
    currentClaim = data.claim;
    showScratchCard(data.claim);

  } catch {
    showError('Network error. Please check your connection and try again.');
  } finally {
    setLoading('submitBtn', 'submitText', 'submitSpinner', false);
  }
});

function showError(msg) {
  invoiceError.textContent = msg;
  invoiceError.style.display = 'block';
  invoiceInput.style.borderColor = '#ef4444';
}
function hideError() {
  invoiceError.style.display = 'none';
  invoiceInput.style.borderColor = '';
}

// ── Scratch Card ──────────────────────────────
function showScratchCard(claim) {
  document.getElementById('invoiceSection').style.display = 'none';
  const section = document.getElementById('scratchSection');
  section.classList.add('active');

  // Set reward info underneath
  const reward = claim.rewards;
  document.getElementById('revealIcon').textContent = reward?.image || '🎁';
  document.getElementById('revealTitle').textContent = reward?.title || 'Special Reward';

  initScratchCanvas();
}

// ── Canvas Scratch Logic ──────────────────────
function initScratchCanvas() {
  const wrapper = document.getElementById('scratchCardWrapper');
  const canvas = document.getElementById('scratchCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = wrapper.offsetWidth;
  canvas.height = wrapper.offsetHeight;

  // Draw silver scratch layer
  drawScratchLayer(ctx, canvas.width, canvas.height);

  let isScratching = false;
  let totalPixels = canvas.width * canvas.height;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function scratch(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    checkProgress();
  }

  function checkProgress() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) cleared++;
    }
    const pct = Math.round((cleared / totalPixels) * 100);
    updateProgress(pct);
    if (pct >= 60 && !scratchRevealed) revealReward();
  }

  // Mouse events
  canvas.addEventListener('mousedown', (e) => { isScratching = true; scratch(...Object.values(getPos(e))); });
  canvas.addEventListener('mousemove', (e) => { if (isScratching) scratch(...Object.values(getPos(e))); });
  canvas.addEventListener('mouseup', () => isScratching = false);
  canvas.addEventListener('mouseleave', () => isScratching = false);

  // Touch events
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isScratching = true; scratch(...Object.values(getPos(e))); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (isScratching) scratch(...Object.values(getPos(e))); }, { passive: false });
  canvas.addEventListener('touchend', () => isScratching = false);
}

function drawScratchLayer(ctx, w, h) {
  // Silver gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#c0c0c0');
  grad.addColorStop(0.3, '#e8e8e8');
  grad.addColorStop(0.6, '#a8a8a8');
  grad.addColorStop(1, '#d0d0d0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Texture pattern
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < w; i += 4) {
    for (let j = 0; j < h; j += 4) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(i, j, 2, 2);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Scratch text
  ctx.fillStyle = '#888';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';
  ctx.fillText('✦  SCRATCH HERE  ✦', w / 2, h / 2);
}

function updateProgress(pct) {
  document.getElementById('progressFill').style.width = `${Math.min(pct, 100)}%`;
  document.getElementById('progressPct').textContent = `${Math.min(pct, 100)}%`;
}

function revealReward() {
  scratchRevealed = true;
  const canvas = document.getElementById('scratchCanvas');
  const ctx = canvas.getContext('2d');

  // Animate full clear
  let alpha = 1;
  function fadeOut() {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.08;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    alpha -= 0.08;
    if (alpha > 0) requestAnimationFrame(fadeOut);
    else {
      canvas.style.display = 'none';
      onRewardRevealed();
    }
  }
  fadeOut();
}

function onRewardRevealed() {
  document.getElementById('scratchTip').innerHTML = '🎉 <span>You revealed your reward!</span>';
  updateProgress(100);
  launchConfetti();

  // Redirect to reward page after short delay
  setTimeout(() => {
    if (currentClaim) {
      window.location.href = `/reward?invoice=${encodeURIComponent(currentClaim.invoice_number)}`;
    }
  }, 2500);
}
