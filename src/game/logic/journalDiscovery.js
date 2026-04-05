export function createJournalDiscoveryState() {
  return {
    enemies: new Set(),
    abilities: new Set()
  };
}

export function discoverEnemy(state, key) {
  state?.enemies?.add?.(key);
}

export function discoverAbility(state, key) {
  state?.abilities?.add?.(key);
}

export function isEnemyDiscovered(state, key) {
  return Boolean(state?.enemies?.has?.(key));
}

export function isAbilityDiscovered(state, key) {
  return Boolean(state?.abilities?.has?.(key));
}
