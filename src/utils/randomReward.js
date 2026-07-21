function selectReward(rewards) {
  const eligible = rewards.filter(r => r.active && r.inventory > 0);
  if (!eligible.length) return null;

  const totalWeight = eligible.reduce((sum, r) => sum + parseFloat(r.probability), 0);
  if (totalWeight <= 0) return null;

  const rand = Math.random() * totalWeight;
  let cumulative = 0;
  for (const reward of eligible) {
    cumulative += parseFloat(reward.probability);
    if (rand <= cumulative) return reward;
  }
  return eligible[eligible.length - 1];
}

module.exports = { selectReward };
