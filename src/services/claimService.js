const supabase = require('../config/supabase');
const { selectReward } = require('../utils/randomReward');

async function processNewClaim(invoice_number, meta) {
  // Fetch active rewards with inventory
  const { data: rewards, error: rErr } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .gt('inventory', 0);

  if (rErr) throw rErr;

  const reward = selectReward(rewards);
  if (!reward) throw Object.assign(new Error('No rewards available'), { status: 503 });

  // Insert claim
  const { data: claim, error: cErr } = await supabase
    .from('claims')
    .insert({
      invoice_number,
      reward_id: reward.id,
      ip_address: meta.ip,
      device_fingerprint: meta.fingerprint,
      user_agent: meta.userAgent,
    })
    .select('*, rewards(*)')
    .single();

  if (cErr) throw cErr;

  // Decrement inventory
  await supabase
    .from('rewards')
    .update({ inventory: reward.inventory - 1 })
    .eq('id', reward.id);

  return claim;
}

async function getClaimByInvoice(invoice_number) {
  const { data, error } = await supabase
    .from('claims')
    .select('*, rewards(*)')
    .eq('invoice_number', invoice_number)
    .single();

  if (error) return null;
  return data;
}

module.exports = { processNewClaim, getClaimByInvoice };
