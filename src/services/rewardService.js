const supabase = require('../config/supabase');

async function getAllRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function createReward(payload) {
  const { data, error } = await supabase
    .from('rewards')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateReward(id, payload) {
  const { data, error } = await supabase
    .from('rewards')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteReward(id) {
  const { error } = await supabase.from('rewards').delete().eq('id', id);
  if (error) throw error;
}

module.exports = { getAllRewards, createReward, updateReward, deleteReward };
