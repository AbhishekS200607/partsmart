const { randomBytes } = require('crypto');

/**
 * Weighted random reward selection using cryptographically secure randomness.
 * Skips rewards with zero inventory or inactive status.
 */
function selectReward(rewards) {
  const eligible = rewards.filter(r => r.active && r.inventory > 0);
  if (!eligible.length) return null;

  const totalWeight = eligible.reduce((sum, r) => sum + parseFloat(r.probability), 0);
  if (totalWeight <= 0) return null;

  // Cryptographically secure random number in [0, totalWeight)
  const randBuffer = randomBytes(4);
  const randInt = randBuffer.readUInt32BE(0);
  const rand = (randInt / 0xFFFFFFFF) * totalWeight;

  let cumulative = 0;
  for (const reward of eligible) {
    cumulative += parseFloat(reward.probability);
    if (rand <= cumulative) return reward;
  }

  return eligible[eligible.length - 1];
}

module.exports = { selectReward };
