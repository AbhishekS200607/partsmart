const { processNewClaim, getClaimByInvoice } = require('../services/claimService');

async function submitClaim(req, res, next) {
  try {
    const { invoice_number, device_fingerprint } = req.body;

    if (!invoice_number) {
      return res.status(400).json({ success: false, message: 'Missing invoice_number', body: req.body });
    }

    // Check if already claimed
    const existing = await getClaimByInvoice(invoice_number);
    if (existing) {
      return res.json({ success: true, status: 'already_claimed', claim: existing });
    }

    const claim = await processNewClaim(invoice_number, {
      ip: req.ip,
      fingerprint: device_fingerprint || null,
      userAgent: req.headers['user-agent'] || null,
    });

    res.status(201).json({ success: true, status: 'claimed', claim });
  } catch (err) {
    console.error('CLAIM_ERROR', JSON.stringify({ message: err.message, code: err.code, details: err.details, hint: err.hint, status: err.status }));
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}

async function getClaim(req, res, next) {
  try {
    const claim = await getClaimByInvoice(req.params.invoice);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    res.json({ success: true, claim });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitClaim, getClaim };
