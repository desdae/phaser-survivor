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
  },
  {
    key: 'unlockBlade',
    label: 'Orbiting Blade',
    description: 'Unlock a blade that circles you and cuts nearby enemies.',
    isAvailable: (player) => !player.bladeUnlocked,
    apply(player) {
      player.bladeUnlocked = true;
      player.bladeCount = Math.max(player.bladeCount, 1);
      player.bladeDamage = Math.max(player.bladeDamage, 16);
      player.bladeOrbitRadius = Math.max(player.bladeOrbitRadius, 74);
      player.bladeOrbitSpeed = Math.max(player.bladeOrbitSpeed, 1.7);
    }
  },
  {
    key: 'bladeCount',
    label: 'Twin Edges',
    description: '+1 orbiting blade',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeCount += 1;
    }
  },
  {
    key: 'bladeDamage',
    label: 'Honed Steel',
    description: '+8 blade damage',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeDamage += 8;
    }
  },
  {
    key: 'bladeSpeed',
    label: 'Whirling Edge',
    description: '+0.3 blade orbit speed',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeOrbitSpeed += 0.3;
    }
  },
  {
    key: 'bladeRadius',
    label: 'Wider Arc',
    description: '+10 blade orbit radius',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeOrbitRadius += 10;
    }
  },
  {
    key: 'multiShot',
    label: 'Split Barrel',
    description: '+1 projectile per shot',
    isAvailable: () => true,
    apply(player) {
      player.projectileCount += 1;
    }
  },
  {
    key: 'pierce',
    label: 'Drill Rounds',
    description: '+1 projectile pierce',
    isAvailable: () => true,
    apply(player) {
      player.projectilePierce += 1;
    }
  },
  {
    key: 'ricochet',
    label: 'Bank Shot',
    description: '+1 ricochet bounce',
    isAvailable: () => true,
    apply(player) {
      player.projectileRicochet += 1;
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

export function getUpgradePool(player) {
  return UPGRADE_DEFINITIONS.filter((entry) => (entry.isAvailable ? entry.isAvailable(player) : true));
}

export function applyUpgrade(player, key) {
  const upgrade = getUpgradePool(player).find((entry) => entry.key === key);

  if (!upgrade) {
    throw new Error(`Unknown upgrade: ${key}`);
  }

  upgrade.apply(player);
}
