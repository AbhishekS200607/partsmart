const rewardService = require('../services/rewardService');

async function listRewards(req, res, next) {
  try {
    const rewards = await rewardService.getAllRewards();
    res.json({ success: true, rewards });
  } catch (err) { next(err); }
}

async function addReward(req, res, next) {
  try {
    const { title, description, image, probability, inventory, active } = req.body;
    const reward = await rewardService.createReward({ title, description, image, probability, inventory, active: active ?? true });
    res.status(201).json({ success: true, reward });
  } catch (err) { next(err); }
}

async function updateReward(req, res, next) {
  try {
    const allowed = ['title', 'description', 'image', 'probability', 'inventory', 'active'];
    const payload = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const reward = await rewardService.updateReward(req.params.id, payload);
    res.json({ success: true, reward });
  } catch (err) { next(err); }
}

async function deleteReward(req, res, next) {
  try {
    await rewardService.deleteReward(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { listRewards, addReward, updateReward, deleteReward };
