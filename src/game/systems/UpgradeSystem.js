import { UPGRADE_DEFINITIONS, applyUpgrade, rollUpgradeChoices } from '../logic/progression.js';

export class UpgradeSystem {
  constructor() {
    this.pool = UPGRADE_DEFINITIONS;
  }

  getChoices() {
    return rollUpgradeChoices(this.pool);
  }

  apply(player, key) {
    applyUpgrade(player.stats, key);
  }
}
