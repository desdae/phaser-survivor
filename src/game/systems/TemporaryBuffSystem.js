import {
  buildPowerupSummaryRows,
  createPowerupStack,
  getEffectiveStats,
  pruneExpiredStacks
} from '../logic/temporaryPowerups.js';

export class TemporaryBuffSystem {
  constructor() {
    this.stacks = [];
  }

  addStack(buffKey, now) {
    const stack = createPowerupStack(buffKey, now);
    this.stacks.push(stack);
    return stack;
  }

  update(now) {
    this.stacks = pruneExpiredStacks(this.stacks, now);
    return this.stacks;
  }

  getEffectiveStats(baseStats, now) {
    return getEffectiveStats(baseStats, this.stacks, now);
  }

  getSummaryRows(now) {
    return buildPowerupSummaryRows(this.stacks, now);
  }

  clear() {
    this.stacks = [];
  }
}
