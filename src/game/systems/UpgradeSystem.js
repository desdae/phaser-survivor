import { applyUpgrade, getUpgradePool, rollUpgradeChoices } from '../logic/progression.js';

export class UpgradeSystem {
  getChoices(playerStats = {}, metaConfig = {}) {
    return rollUpgradeChoices(getUpgradePool(playerStats, metaConfig));
  }

  apply(player, key) {
    applyUpgrade(player.stats, key);
  }
}
