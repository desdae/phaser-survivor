import { applyUpgrade, getUpgradePool, rollUpgradeChoices } from '../logic/progression.js';

export class UpgradeSystem {
  getChoices(playerStats = {}) {
    return rollUpgradeChoices(getUpgradePool(playerStats));
  }

  apply(player, key) {
    applyUpgrade(player.stats, key);
  }
}
