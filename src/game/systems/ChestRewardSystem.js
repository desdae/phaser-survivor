import { applyChestReward, getChestRewardPool, rollChestChoices } from '../logic/chestRewards.js';

export class ChestRewardSystem {
  getChoices(playerStats = {}) {
    return rollChestChoices(getChestRewardPool(playerStats));
  }

  apply(player, reward, pickupManager) {
    applyChestReward(player, reward, pickupManager);
  }
}
