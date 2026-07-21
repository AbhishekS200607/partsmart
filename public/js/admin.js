const GIFT_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`;
const GIFT_SVG_LG = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`;

let currentTab = 'overview';
let claimsPage = 0;
const PAGE_SIZE = 20;
let claimsSearch = '';

// ── Auth ──────────────────────────────────────
async function checkAuth() {
  const token = localStorage.getItem('ps_token');
  if (!token) {
    document.getElementById('loginPage').style.display = 'flex';
    return;
  }

  // Verify token is still valid
  const { ok, data } = await api('/api/admin/dashboard');
  if (!ok) {
    localStorage.removeItem('ps_token');
    localStorage.removeItem('ps_admin');
    document.getElementById('loginPage').style.display = 'flex';
    return;
  }
  showDashboard();
  renderStats(data.stats);
  renderRewardChart(data.distribution);
  renderRecentClaims(data.recent);
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  setLoading('loginBtn', 'loginText', 'loginSpinner', true);
  errEl.classList.remove('show');

  try {
    const { ok, data } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!ok) {
      errEl.textContent = data.message || 'Invalid credentials';
      errEl.classList.add('show');
      return;
    }

    localStorage.setItem('ps_token', data.token);
    localStorage.setItem('ps_admin', JSON.stringify(data.admin));
    showDashboard();
    loadOverview();
  } catch {
    errEl.textContent = 'Network error. Please try again.';
    errEl.classList.add('show');
  } finally {
    setLoading('loginBtn', 'loginText', 'loginSpinner', false);
  }
});

function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('dashboardPage').classList.remove('hidden');
  const admin = JSON.parse(localStorage.getItem('ps_admin') || '{}');
  document.getElementById('adminAvatar').textContent = (admin.email || 'A')[0].toUpperCase();
}

function logout() {
  localStorage.removeItem('ps_token');
  localStorage.removeItem('ps_admin');
  document.getElementById('dashboardPage').classList.add('hidden');
  document.getElementById('loginPage').style.display = 'flex';
}

// ── Navigation ────────────────────────────────
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  btn.classList.add('active');

  const titles = { overview: 'Overview', claims: 'Claims', rewards: 'Rewards', analytics: 'Analytics', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[tab] || tab;

  closeSidebar();

  if (tab === 'claims') loadClaims();
  else if (tab === 'rewards') loadRewards();
  else if (tab === 'analytics') loadAnalytics();
  else if (tab === 'settings') loadSettings();
}

function openSidebar() {
  document.getElementById('adminSidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ── Overview ──────────────────────────────────
async function loadOverview() {
  try {
    const { ok, data } = await api('/api/admin/dashboard');
    if (!ok) { handleAuthError(data); return; }

    renderStats(data.stats);
    renderRewardChart(data.distribution);
    renderRecentClaims(data.recent);
  } catch {
    showToast('Failed to load dashboard', 'error');
  }
}

function renderStats(stats) {
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card animate-fade">
      <div class="stat-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <div class="stat-card-value">${stats.total}</div>
      <div class="stat-card-label">Total Claims</div>
    </div>
    <div class="stat-card animate-fade" style="animation-delay:0.1s">
      <div class="stat-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div class="stat-card-value">${stats.today}</div>
      <div class="stat-card-label">Claimed Today</div>
    </div>
    <div class="stat-card animate-fade" style="animation-delay:0.2s">
      <div class="stat-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="stat-card-value">${stats.pending}</div>
      <div class="stat-card-label">Pending</div>
    </div>
  `;
}

function renderRewardChart(distribution) {
  const chart = document.getElementById('rewardChart');
  if (!distribution || !distribution.length) {
    chart.innerHTML = '<p style="color:var(--teal);font-size:0.875rem;text-align:center;padding:20px;">No data yet</p>';
    return;
  }
  const max = Math.max(...distribution.map(d => d.count));
  chart.innerHTML = distribution.map(d => `
    <div class="bar-item">
      <div class="bar-label">
        <span>${d.title}</span>
        <span>${d.count}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${max ? (d.count / max * 100) : 0}%"></div>
      </div>
    </div>
  `).join('');
}

function renderRecentClaims(claims) {
  const el = document.getElementById('recentClaimsList');
  if (!claims || !claims.length) {
    el.innerHTML = '<p style="color:var(--teal);font-size:0.875rem;text-align:center;padding:20px;">No claims yet</p>';
    return;
  }
  el.innerHTML = claims.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--sky);">
      <div>
        <div style="font-size:0.875rem;font-weight:600;color:var(--navy);">${c.invoice_number}</div>
        <div style="font-size:0.75rem;color:var(--teal);display:flex;align-items:center;gap:4px;">${GIFT_SVG} ${c.rewards?.title || '—'}</div>
      </div>
      <div style="text-align:right;">
        <span class="badge badge-${c.status === 'redeemed' ? 'success' : c.status === 'expired' ? 'error' : 'warning'}">${c.status}</span>
        <div style="font-size:0.72rem;color:var(--teal);margin-top:4px;">${formatDateShort(c.claimed_at)}</div>
      </div>
    </div>
  `).join('');
}

// ── Claims ────────────────────────────────────
async function loadClaims() {
  document.getElementById('claimsTableBody').innerHTML = '<tr><td colspan="6" class="table-empty">Loading...</td></tr>';
  try {
    const { ok, data } = await api(`/api/admin/claims?limit=${PAGE_SIZE}&offset=${claimsPage * PAGE_SIZE}&search=${encodeURIComponent(claimsSearch)}`);
    if (!ok) { handleAuthError(data); showToast(data.message || 'Failed to load claims', 'error'); return; }
    renderClaimsTable(data.data, data.count);
  } catch (e) {
    showToast('Failed to load claims: ' + e.message, 'error');
  }
}

function renderClaimsTable(claims, total) {
  const tbody = document.getElementById('claimsTableBody');
  if (!claims || !claims.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No claims found</td></tr>';
    document.getElementById('claimsPagination').innerHTML = '';
    return;
  }
  tbody.innerHTML = claims.map(c => `
    <tr>
      <td><span style="font-family:monospace;font-weight:600;">${c.invoice_number}</span></td>
      <td>${c.rewards?.title || '—'}</td>
      <td><span class="badge badge-${c.status === 'redeemed' ? 'success' : c.status === 'expired' ? 'error' : 'warning'}">${c.status}</span></td>
      <td>${formatDateShort(c.claimed_at)}</td>
      <td style="color:var(--teal);font-size:0.8rem;">${c.ip_address || '—'}</td>
      <td>
        <select data-invoice="${c.invoice_number}" style="padding:6px 10px;border-radius:8px;border:1px solid var(--sky);font-size:0.8rem;background:var(--beige);color:var(--navy);cursor:pointer;">
          <option value="pending" ${c.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="redeemed" ${c.status === 'redeemed' ? 'selected' : ''}>Redeemed</option>
          <option value="expired" ${c.status === 'expired' ? 'selected' : ''}>Expired</option>
        </select>
      </td>
    </tr>
  `).join('');

  // Status change via event delegation
  tbody.querySelectorAll('select[data-invoice]').forEach(sel => {
    sel.addEventListener('change', () => updateStatus(sel.dataset.invoice, sel.value));
  });


  // Pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pag = document.getElementById('claimsPagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  pag.innerHTML = `
    <button class="page-btn" id="prevPage" ${claimsPage === 0 ? 'disabled' : ''}>←</button>
    <span style="font-size:0.875rem;color:var(--teal);">Page ${claimsPage + 1} of ${totalPages}</span>
    <button class="page-btn" id="nextPage" ${claimsPage >= totalPages - 1 ? 'disabled' : ''}>→</button>
  `;
  document.getElementById('prevPage')?.addEventListener('click', () => changePage(-1));
  document.getElementById('nextPage')?.addEventListener('click', () => changePage(1));
}

function changePage(dir) {
  claimsPage = Math.max(0, claimsPage + dir);
  loadClaims();
}

let searchTimeout;
function searchClaims(val) {
  claimsSearch = val;
  claimsPage = 0;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadClaims, 400);
}

async function updateStatus(invoice, status) {
  try {
    const { ok, data } = await api('/api/admin/claim-status', {
      method: 'POST',
      body: JSON.stringify({ invoice_number: invoice, status })
    });
    if (ok) showToast(`Status updated to ${status}`, 'success');
    else showToast(data.message || 'Update failed', 'error');
  } catch {
    showToast('Network error', 'error');
  }
}

async function exportCSV() {
  const token = localStorage.getItem('ps_token');
  const a = document.createElement('a');
  a.href = '/api/admin/export';
  a.download = 'partsmart-claims.csv';
  // Fetch with auth
  const res = await fetch('/api/admin/export', { headers: { Authorization: `Bearer ${token}` } });
  const blob = await res.blob();
  a.href = URL.createObjectURL(blob);
  a.click();
}

// ── Rewards ───────────────────────────────────
async function loadRewards() {
  document.getElementById('rewardsGrid').innerHTML = '<div class="reward-manage-card skeleton" style="height:200px;"></div>'.repeat(3);
  try {
    const { ok, data } = await api('/api/rewards');
    if (!ok) { handleAuthError(data); showToast(data.message || 'Failed to load rewards', 'error'); return; }
    renderRewardsGrid(data.rewards);
  } catch (e) {
    showToast('Failed to load rewards: ' + e.message, 'error');
  }
}

function renderRewardsGrid(rewards) {
  const grid = document.getElementById('rewardsGrid');
  if (!rewards || !rewards.length) {
    grid.innerHTML = '<p style="color:var(--teal);grid-column:1/-1;text-align:center;padding:40px;">No rewards yet. Add one!</p>';
    return;
  }
  grid.innerHTML = rewards.map((r, i) => `
    <div class="reward-manage-card" data-idx="${i}">
      <div class="reward-manage-icon">${GIFT_SVG_LG}</div>
      <div class="reward-manage-title">${r.title}</div>
      <div class="reward-manage-desc">${r.description || ''}</div>
      <div class="reward-manage-meta">
        <span class="badge badge-info">${r.probability}%</span>
        <span class="badge badge-${r.inventory > 10 ? 'success' : r.inventory > 0 ? 'warning' : 'error'}">${r.inventory} left</span>
      </div>
      <div class="reward-manage-actions" style="justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:8px;">
          <button class="btn btn-icon btn-edit" data-action="edit" data-idx="${i}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-icon btn-delete" data-action="delete" data-id="${r.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
        <label class="toggle-switch" title="${r.active ? 'Active' : 'Inactive'}">
          <input type="checkbox" data-action="toggle" data-id="${r.id}" ${r.active ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `).join('');

  // Event delegation — no inline handlers
  grid.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (editBtn) editReward(rewards[parseInt(editBtn.dataset.idx)]);
    if (deleteBtn) deleteReward(deleteBtn.dataset.id);
  });
  grid.addEventListener('change', e => {
    const toggle = e.target.closest('[data-action="toggle"]');
    if (toggle) toggleReward(toggle.dataset.id, toggle.checked);
  });
}

function openRewardModal(reward = null) {
  document.getElementById('modalTitle').textContent = reward ? 'Edit Reward' : 'Add Reward';
  document.getElementById('editRewardId').value = reward?.id || '';
  document.getElementById('rewardTitle').value = reward?.title || '';
  document.getElementById('rewardDescription').value = reward?.description || '';
  document.getElementById('rewardImage').value = reward?.image || '';
  document.getElementById('rewardProbability').value = reward?.probability || '';
  document.getElementById('rewardInventory').value = reward?.inventory || '';
  document.getElementById('rewardModal').classList.add('open');
}

function editReward(reward) { openRewardModal(reward); }
function closeRewardModal() { document.getElementById('rewardModal').classList.remove('open'); }

async function saveReward() {
  const id = document.getElementById('editRewardId').value;
  const payload = {
    title: document.getElementById('rewardTitle').value.trim(),
    description: document.getElementById('rewardDescription').value.trim(),
    image: document.getElementById('rewardImage').value.trim() || '',
    probability: parseFloat(document.getElementById('rewardProbability').value),
    inventory: parseInt(document.getElementById('rewardInventory').value),
    active: true
  };

  if (!payload.title || isNaN(payload.probability) || isNaN(payload.inventory)) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  const saveBtn = document.getElementById('saveRewardText');
  const saveSpinner = document.getElementById('saveRewardSpinner');
  saveBtn.classList.add('hidden');
  saveSpinner.classList.remove('hidden');

  try {
    const { ok, data } = await api(id ? `/api/rewards/${id}` : '/api/rewards', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    if (ok) {
      showToast(id ? 'Reward updated!' : 'Reward added!', 'success');
      closeRewardModal();
      loadRewards();
    } else {
      showToast(data.errors?.[0]?.msg || data.message || 'Save failed', 'error');
    }
  } catch (e) {
    showToast('Network error: ' + e.message, 'error');
  } finally {
    saveBtn.classList.remove('hidden');
    saveSpinner.classList.add('hidden');
  }
}

async function deleteReward(id) {
  if (!confirm('Delete this reward? This cannot be undone.')) return;
  try {
    const { ok, data } = await api(`/api/rewards/${id}`, { method: 'DELETE' });
    if (ok) { showToast('Reward deleted', 'success'); loadRewards(); }
    else showToast(data.message || 'Delete failed', 'error');
  } catch (e) {
    showToast('Network error: ' + e.message, 'error');
  }
}

async function toggleReward(id, active) {
  try {
    const { ok, data } = await api(`/api/rewards/${id}`, { method: 'PUT', body: JSON.stringify({ active }) });
    if (ok) showToast(`Reward ${active ? 'activated' : 'deactivated'}`, 'success');
    else showToast(data.message || 'Update failed', 'error');
  } catch (e) {
    showToast('Network error: ' + e.message, 'error');
  }
}

// ── Analytics ─────────────────────────────────
async function loadAnalytics() {
  try {
    const [dashRes, rewardsRes] = await Promise.all([
      api('/api/admin/dashboard'),
      api('/api/rewards')
    ]);
    if (!dashRes.ok) { handleAuthError(dashRes.data); showToast('Failed to load analytics', 'error'); return; }
    renderRewardChart2(dashRes.data.distribution);
    if (rewardsRes.ok) renderInventoryChart(rewardsRes.data.rewards);
  } catch (e) {
    showToast('Failed to load analytics: ' + e.message, 'error');
  }
}

function renderRewardChart2(distribution) {
  const chart = document.getElementById('analyticsChart');
  if (!distribution || !distribution.length) {
    chart.innerHTML = '<p style="color:var(--teal);font-size:0.875rem;text-align:center;padding:20px;">No data yet</p>';
    return;
  }
  const max = Math.max(...distribution.map(d => d.count));
  chart.innerHTML = distribution.map(d => `
    <div class="bar-item">
      <div class="bar-label"><span>${d.title}</span><span>${d.count} claims</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${max ? (d.count / max * 100) : 0}%"></div></div>
    </div>
  `).join('');
}

function renderInventoryChart(rewards) {
  const chart = document.getElementById('inventoryChart');
  if (!rewards || !rewards.length) {
    chart.innerHTML = '<p style="color:var(--teal);font-size:0.875rem;text-align:center;padding:20px;">No rewards</p>';
    return;
  }
  const max = Math.max(...rewards.map(r => r.inventory));
  chart.innerHTML = rewards.map(r => `
    <div class="bar-item">
      <div class="bar-label">
        <span style="display:flex;align-items:center;gap:6px;">${GIFT_SVG} ${r.title}</span>
        <span style="color:${r.inventory === 0 ? '#dc2626' : r.inventory < 10 ? '#d97706' : '#16a34a'}">${r.inventory} left</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${max ? (r.inventory / max * 100) : 0}%;background:${r.inventory === 0 ? '#ef4444' : r.inventory < 10 ? '#f59e0b' : 'linear-gradient(90deg,var(--navy),var(--teal))'}"></div>
      </div>
    </div>
  `).join('');
}

// ── Settings ──────────────────────────────────
async function loadSettings() {
  try {
    const { ok, data } = await api('/api/admin/settings');
    if (!ok) { handleAuthError(data); showToast(data.message || 'Failed to load settings', 'error'); return; }
    document.getElementById('settingShopName').value = data.settings.shop_name || '';
    document.getElementById('settingPromoStatus').value = data.settings.promotion_status || 'active';
  } catch (e) {
    showToast('Failed to load settings: ' + e.message, 'error');
  }
}

async function saveSettings() {
  const settings = {
    shop_name: document.getElementById('settingShopName').value.trim(),
    promotion_status: document.getElementById('settingPromoStatus').value
  };
  try {
    const { ok } = await api('/api/admin/settings', { method: 'POST', body: JSON.stringify(settings) });
    if (ok) showToast('Settings saved!', 'success');
    else showToast('Save failed', 'error');
  } catch {
    showToast('Network error', 'error');
  }
}

async function deleteClaims(filter) {
  const labels = { redeemed: 'redeemed claims', expired: 'expired claims', all: 'ALL claims' };
  if (!confirm(`Are you sure you want to permanently delete ${labels[filter]}? This cannot be undone.`)) return;
  try {
    const { ok, data } = await api('/api/admin/claims', {
      method: 'DELETE',
      body: JSON.stringify({ filter })
    });
    if (ok) { showToast(`Deleted ${labels[filter]} successfully`, 'success'); loadOverview(); }
    else showToast(data.message || 'Delete failed', 'error');
  } catch (e) {
    showToast('Network error: ' + e.message, 'error');
  }
}

// ── Helpers ───────────────────────────────────
function handleAuthError(data) {
  if (data?.message === 'Unauthorized' || data?.message === 'Invalid or expired token') {
    localStorage.removeItem('ps_token');
    localStorage.removeItem('ps_admin');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'flex';
    showToast('Session expired. Please log in again.', 'error');
  }
}

// ── Init ──────────────────────────────────────
document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
document.getElementById('deleteRedeemedBtn').addEventListener('click', () => deleteClaims('redeemed'));
document.getElementById('deleteExpiredBtn').addEventListener('click', () => deleteClaims('expired'));
document.getElementById('deleteAllClaimsBtn').addEventListener('click', () => deleteClaims('all'));
document.getElementById('claimSearch').addEventListener('input', e => searchClaims(e.target.value));
checkAuth();
