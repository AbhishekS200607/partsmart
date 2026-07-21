const supabase = require('../config/supabase');

async function getDashboard(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRes, todayRes, pendingRes, recentRes, allClaimsRes] = await Promise.all([
      supabase.from('claims').select('*', { count: 'exact', head: true }),
      supabase.from('claims').select('*', { count: 'exact', head: true }).gte('claimed_at', today.toISOString()),
      supabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('claims').select('*, rewards(title, image)').order('claimed_at', { ascending: false }).limit(10),
      supabase.from('claims').select('reward_id, rewards(title)'),
    ]);

    // Build distribution from all claims
    const distMap = {};
    (allClaimsRes.data || []).forEach(c => {
      if (!c.reward_id) return;
      const title = c.rewards?.title || 'Unknown';
      distMap[title] = (distMap[title] || 0) + 1;
    });
    const distribution = Object.entries(distMap)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      stats: {
        total: totalRes.count || 0,
        today: todayRes.count || 0,
        pending: pendingRes.count || 0,
      },
      distribution,
      recent: recentRes.data || [],
    });
  } catch (err) { next(err); }
}

async function getClaims(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search?.trim() || '';

    let query = supabase
      .from('claims')
      .select('*, rewards(title, image)', { count: 'exact' })
      .order('claimed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike('invoice_number', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data, count });
  } catch (err) { next(err); }
}

async function exportCSV(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('claims')
      .select('invoice_number, status, claimed_at, ip_address, rewards(title)')
      .order('claimed_at', { ascending: false });

    if (error) throw error;

    const header = 'Invoice Number,Reward,Status,Date,IP Address\n';
    const rows = data.map(c =>
      [c.invoice_number, c.rewards?.title || '', c.status, c.claimed_at, c.ip_address || ''].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="partsmart-claims.csv"');
    res.send(header + rows);
  } catch (err) { next(err); }
}

async function getSettings(req, res, next) {
  try {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) throw error;

    const settings = Object.fromEntries(data.map(s => [s.key, s.value]));
    res.json({ success: true, settings });
  } catch (err) { next(err); }
}

async function updateSettings(req, res, next) {
  try {
    const allowed = ['shop_name', 'promotion_status', 'logo'];
    const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));

    await Promise.all(entries.map(([key, value]) =>
      supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    ));

    res.json({ success: true });
  } catch (err) { next(err); }
}

async function updateClaimStatus(req, res, next) {
  try {
    const { invoice_number, status } = req.body;
    const validStatuses = ['pending', 'redeemed', 'expired'];

    if (!invoice_number || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice or status' });
    }

    const { error } = await supabase
      .from('claims')
      .update({ status })
      .eq('invoice_number', invoice_number);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function deleteClaims(req, res, next) {
  try {
    const { filter } = req.body; // 'all' | 'redeemed' | 'expired'
    const valid = ['all', 'redeemed', 'expired'];
    if (!valid.includes(filter)) {
      return res.status(400).json({ success: false, message: 'Invalid filter' });
    }

    let query = supabase.from('claims').delete();
    if (filter !== 'all') query = query.eq('status', filter);
    else query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

    const { error, count } = await query;
    if (error) throw error;

    res.json({ success: true, deleted: count });
  } catch (err) { next(err); }
}

module.exports = { getDashboard, getClaims, exportCSV, getSettings, updateSettings, updateClaimStatus, deleteClaims };
