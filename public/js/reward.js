/* ============================================
   PARTSMART - Reward Page JS
   ============================================ */

async function loadReward() {
  const params = new URLSearchParams(window.location.search);
  const invoice = params.get('invoice');

  if (!invoice) {
    window.location.href = '/scratch';
    return;
  }

  try {
    const { ok, data } = await api(`/api/claim/${encodeURIComponent(invoice)}`);

    if (!ok || !data.claim) {
      window.location.href = '/scratch';
      return;
    }

    const claim = data.claim;
    const reward = claim.rewards;

    // Populate reward card
    document.getElementById('rewardIcon').textContent = reward?.image || '🎁';
    document.getElementById('rewardTitle').textContent = reward?.title || 'Special Reward';
    document.getElementById('rewardDesc').textContent = reward?.description || '';
    document.getElementById('metaInvoice').textContent = claim.invoice_number;
    document.getElementById('metaDate').textContent = formatDateShort(claim.claimed_at);
    document.getElementById('metaId').textContent = claim.id?.slice(0, 8).toUpperCase() || '—';
    document.getElementById('metaStatus').textContent =
      claim.status === 'redeemed' ? 'Redeemed ✓' :
      claim.status === 'expired' ? 'Expired' : 'Pending';

    // Show content
    document.getElementById('loadingState').style.display = 'none';
    const content = document.getElementById('rewardContent');
    content.classList.remove('hidden');
    content.style.display = 'flex';

    // Launch confetti
    launchConfetti();

  } catch {
    showToast('Failed to load reward. Please try again.', 'error');
    setTimeout(() => window.location.href = '/scratch', 2000);
  }
}

loadReward();
