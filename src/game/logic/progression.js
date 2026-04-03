export const UPGRADE_DEFINITIONS = [
  {
    key: 'damage',
    label: 'Sharpened Shots',
    description: '+8 projectile damage',
    apply(player) {
      player.projectileDamage += 8;
    }
  },
  {
    key: 'fireRate',
    label: 'Rapid Trigger',
    description: '-60ms fire cooldown',
    apply(player) {
      player.fireCooldownMs = Math.max(160, player.fireCooldownMs - 60);
    }
  },
  {
    key: 'projectileSpeed',
    label: 'Hot Lead',
    description: '+80 projectile speed',
    apply(player) {
      player.projectileSpeed += 80;
    }
  },
  {
    key: 'maxHealth',
    label: 'Iron Skin',
    description: '+20 max health and heal 20',
    apply(player) {
      player.maxHealth += 20;
      player.health = Math.min(player.maxHealth, player.health + 20);
    }
  },
  {
    key: 'heal',
    label: 'Field Medicine',
    description: 'Restore 30 health',
    apply(player) {
      player.health = Math.min(player.maxHealth, player.health + 30);
    }
  },
  {
    key: 'pickupRadius',
    label: 'Vacuum Grip',
    description: '+24 pickup radius',
    apply(player) {
      player.pickupRadius += 24;
    }
  }
];

export function getXpToNextLevel(level) {
  return 10 + (level - 1) * 6;
}

export function awardXp(state, amount) {
  let level = state.level;
  let xp = state.xp + amount;
  let xpToNext = getXpToNextLevel(level);
  let leveledUp = false;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = getXpToNextLevel(level);
    leveledUp = true;
  }

  return {
    level,
    xp,
    xpToNext,
    leveledUp
  };
}

export function rollUpgradeChoices(pool, rng = Math.random, count = 3) {
  const bag = [...pool];
  const picks = [];

  while (bag.length > 0 && picks.length < count) {
    const index = Math.floor(rng() * bag.length);
    picks.push(...bag.splice(index, 1));
  }

  return picks;
}

export function applyUpgrade(player, key) {
  const upgrade = UPGRADE_DEFINITIONS.find((entry) => entry.key === key);

  if (!upgrade) {
    throw new Error(`Unknown upgrade: ${key}`);
  }

  upgrade.apply(player);
}
