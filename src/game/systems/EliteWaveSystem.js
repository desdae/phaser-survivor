import {
  advanceEliteWaveState,
  consumePendingElite,
  createEliteState
} from '../logic/eliteWaves.js';

export class EliteWaveSystem {
  constructor() {
    this.state = createEliteState();
  }

  update(elapsedMs) {
    this.state = advanceEliteWaveState(this.state, elapsedMs);
    return this.state;
  }

  consumeSpawn() {
    consumePendingElite(this.state);
  }

  isWarningActive(nowMs) {
    return nowMs <= this.state.warningUntilMs;
  }
}
