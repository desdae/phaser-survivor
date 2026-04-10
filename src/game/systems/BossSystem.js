import {
  advanceBossEncounterState,
  consumeBossSpawn,
  createBossEncounterState,
  markBossDefeated
} from '../logic/bossEncounters.js';

export class BossSystem {
  constructor() {
    this.state = createBossEncounterState();
  }

  update(elapsedMs) {
    this.state = advanceBossEncounterState(this.state, elapsedMs);
    return this.state;
  }

  consumeSpawn() {
    consumeBossSpawn(this.state);
  }

  markDefeated() {
    markBossDefeated(this.state);
  }

  isWarningActive(nowMs) {
    return nowMs <= this.state.warningUntilMs;
  }
}
