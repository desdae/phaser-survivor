import { canLearnAbility } from './abilityRoster.js';

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
    key: 'regen',
    label: 'Blood Renewal',
    description: '+0.1 health regenerated per second',
    apply(player) {
      player.healthRegenPerSec = (player.healthRegenPerSec ?? 0) + 0.1;
    }
  },
  {
    key: 'guard',
    label: 'Grim Ward',
    description: '-10% damage taken multiplicatively',
    apply(player) {
      player.damageTakenMultiplier = (player.damageTakenMultiplier ?? 1) * 0.9;
    }
  },
  {
    key: 'unlockBlade',
    label: 'Orbiting Blade',
    description: 'Unlock a blade that circles you and cuts nearby enemies.',
    isAvailable: (player) => canLearnAbility(player, 'bladeUnlocked'),
    apply(player) {
      player.bladeUnlocked = true;
      player.bladeCount = Math.max(player.bladeCount, 1);
      player.bladeDamage = Math.max(player.bladeDamage, 16);
      player.bladeOrbitRadius = Math.max(player.bladeOrbitRadius, 74);
      player.bladeOrbitSpeed = Math.max(player.bladeOrbitSpeed, 1.7);
    }
  },
  {
    key: 'unlockChain',
    label: 'Storm Lash',
    description: 'Unlock chain lightning that jumps across nearby enemies.',
    isAvailable: (player) => canLearnAbility(player, 'chainUnlocked'),
    apply(player) {
      player.chainUnlocked = true;
      player.chainDamage = Math.max(player.chainDamage, 16);
      player.chainLinks = Math.max(player.chainLinks, 3);
      player.chainRange = Math.max(player.chainRange, 90);
      player.chainCooldownMs = Math.max(player.chainCooldownMs, 0) || 1400;
    }
  },
  {
    key: 'chainDamage',
    label: 'Volt Surge',
    description: '+8 chain lightning damage',
    isAvailable: (player) => player.chainUnlocked,
    apply(player) {
      player.chainDamage += 8;
    }
  },
  {
    key: 'chainLinks',
    label: 'Forked Current',
    description: '+1 lightning jump',
    isAvailable: (player) => player.chainUnlocked,
    apply(player) {
      player.chainLinks += 1;
    }
  },
  {
    key: 'chainRange',
    label: 'Long Arc',
    description: '+30 chain range',
    isAvailable: (player) => player.chainUnlocked,
    apply(player) {
      player.chainRange += 30;
    }
  },
  {
    key: 'chainRate',
    label: 'Storm Relay',
    description: '-170ms chain cooldown',
    isAvailable: (player) => player.chainUnlocked,
    apply(player) {
      player.chainCooldownMs = Math.max(650, player.chainCooldownMs - 170);
    }
  },
  {
    key: 'unlockNova',
    label: 'Pulse Engine',
    description: 'Unlock a close-range nova that erupts in repeating bursts.',
    isAvailable: (player) => canLearnAbility(player, 'novaUnlocked'),
    apply(player) {
      player.novaUnlocked = true;
      player.novaDamage = Math.max(player.novaDamage, 12);
      player.novaRadius = Math.max(player.novaRadius, 96);
      player.novaCooldownMs = Math.max(player.novaCooldownMs, 0) || 2200;
      player.novaEchoCount = Math.max(player.novaEchoCount, 2);
    }
  },
  {
    key: 'novaDamage',
    label: 'Aftershock Core',
    description: '+6 nova damage',
    isAvailable: (player) => player.novaUnlocked,
    apply(player) {
      player.novaDamage += 6;
    }
  },
  {
    key: 'novaRadius',
    label: 'Wide Pulse',
    description: '+18 nova radius',
    isAvailable: (player) => player.novaUnlocked,
    apply(player) {
      player.novaRadius += 18;
    }
  },
  {
    key: 'novaEcho',
    label: 'Echo Chamber',
    description: '+1 repeating nova burst',
    isAvailable: (player) => player.novaUnlocked,
    apply(player) {
      player.novaEchoCount += 1;
    }
  },
  {
    key: 'novaRate',
    label: 'Pulse Capacitor',
    description: '-220ms nova cooldown',
    isAvailable: (player) => player.novaUnlocked,
    apply(player) {
      player.novaCooldownMs = Math.max(900, player.novaCooldownMs - 220);
    }
  },
  {
    key: 'unlockBoomerang',
    label: 'Razor Boomerang',
    description: 'Unlock a thrown blade that sweeps out and returns to you.',
    isAvailable: (player) => canLearnAbility(player, 'boomerangUnlocked'),
    apply(player) {
      player.boomerangUnlocked = true;
      player.boomerangCount = Math.max(player.boomerangCount, 1);
      player.boomerangDamage = Math.max(player.boomerangDamage, 18);
      player.boomerangRange = Math.max(player.boomerangRange, 150);
      player.boomerangCooldownMs = Math.max(player.boomerangCooldownMs, 0) || 1500;
    }
  },
  {
    key: 'boomerangDamage',
    label: 'Saw Teeth',
    description: '+7 boomerang damage',
    isAvailable: (player) => player.boomerangUnlocked,
    apply(player) {
      player.boomerangDamage += 7;
    }
  },
  {
    key: 'boomerangCount',
    label: 'Twin Return',
    description: '+1 boomerang',
    isAvailable: (player) => player.boomerangUnlocked,
    apply(player) {
      player.boomerangCount += 1;
    }
  },
  {
    key: 'boomerangRange',
    label: 'Long Flight',
    description: '+35 boomerang range',
    isAvailable: (player) => player.boomerangUnlocked,
    apply(player) {
      player.boomerangRange += 35;
    }
  },
  {
    key: 'boomerangRate',
    label: 'Quick Catch',
    description: '-160ms boomerang cooldown',
    isAvailable: (player) => player.boomerangUnlocked,
    apply(player) {
      player.boomerangCooldownMs = Math.max(700, player.boomerangCooldownMs - 160);
    }
  },
  {
    key: 'unlockMeteor',
    label: 'Starcall',
    description: 'Unlock delayed meteor strikes that punish packed enemies.',
    isAvailable: (player) => canLearnAbility(player, 'meteorUnlocked'),
    apply(player) {
      player.meteorUnlocked = true;
      player.meteorCount = Math.max(player.meteorCount, 1);
      player.meteorDamage = Math.max(player.meteorDamage, 28);
      player.meteorRadius = Math.max(player.meteorRadius, 52);
      player.meteorCooldownMs = Math.max(player.meteorCooldownMs, 0) || 2600;
    }
  },
  {
    key: 'unlockBurstRifle',
    label: 'Burst Rifle',
    description: 'Unlock a mouse-aimed rifle that spits rapid shots at your cursor.',
    isAvailable: (player) => canLearnAbility(player, 'burstRifleUnlocked'),
    apply(player) {
      player.burstRifleUnlocked = true;
      player.burstRifleDamage = Math.max(player.burstRifleDamage, 9);
      player.burstRifleCooldownMs = Math.max(player.burstRifleCooldownMs, 0) || 180;
      player.burstRifleProjectileSpeed = Math.max(player.burstRifleProjectileSpeed, 640);
      player.burstRifleBurstCount = Math.max(player.burstRifleBurstCount, 1);
      player.burstRifleSpreadDeg = Math.max(player.burstRifleSpreadDeg, 0);
    }
  },
  {
    key: 'burstRifleDamage',
    label: 'Hot Magazine',
    description: '+4 burst rifle damage',
    isAvailable: (player) => player.burstRifleUnlocked,
    apply(player) {
      player.burstRifleDamage += 4;
    }
  },
  {
    key: 'burstRifleRate',
    label: 'Hair Trigger',
    description: '-20ms burst rifle cooldown',
    isAvailable: (player) => player.burstRifleUnlocked,
    apply(player) {
      player.burstRifleCooldownMs = Math.max(80, player.burstRifleCooldownMs - 20);
    }
  },
  {
    key: 'burstRifleBurst',
    label: 'Twin Burst',
    description: '+1 burst rifle projectile',
    isAvailable: (player) => player.burstRifleUnlocked,
    apply(player) {
      player.burstRifleBurstCount += 1;
      player.burstRifleSpreadDeg = Math.max(0, player.burstRifleSpreadDeg - 1);
    }
  },
  {
    key: 'unlockLance',
    label: 'Piercing Lance',
    description: 'Unlock a mouse-aimed lance that tears through enemies in a line.',
    isAvailable: (player) => canLearnAbility(player, 'lanceUnlocked'),
    apply(player) {
      player.lanceUnlocked = true;
      player.lanceDamage = Math.max(player.lanceDamage, 20);
      player.lanceCooldownMs = Math.max(player.lanceCooldownMs, 0) || 900;
      player.lanceLength = Math.max(player.lanceLength, 220);
      player.lanceWidth = Math.max(player.lanceWidth, 18);
    }
  },
  {
    key: 'unlockFlamethrower',
    label: 'Flamethrower',
    description: 'Unlock a short mouse-aimed cone that melts enemies in front of you.',
    isAvailable: (player) => canLearnAbility(player, 'flamethrowerUnlocked'),
    apply(player) {
      player.flamethrowerUnlocked = true;
      player.flamethrowerDamage = Math.max(player.flamethrowerDamage, 4);
      player.flamethrowerRange = Math.max(player.flamethrowerRange, 90);
      player.flamethrowerCooldownMs = Math.max(player.flamethrowerCooldownMs, 0) || 140;
      player.flamethrowerArcDeg = Math.max(player.flamethrowerArcDeg, 60);
    }
  },
  {
    key: 'flamethrowerDamage',
    label: 'Cinder Breath',
    description: '+2 flamethrower damage',
    isAvailable: (player) => player.flamethrowerUnlocked,
    apply(player) {
      player.flamethrowerDamage += 2;
    }
  },
  {
    key: 'flamethrowerRange',
    label: 'Long Burn',
    description: '+18 flamethrower range',
    isAvailable: (player) => player.flamethrowerUnlocked,
    apply(player) {
      player.flamethrowerRange += 18;
    }
  },
  {
    key: 'flamethrowerRate',
    label: 'Bellows',
    description: '-12ms flamethrower cooldown',
    isAvailable: (player) => player.flamethrowerUnlocked,
    apply(player) {
      player.flamethrowerCooldownMs = Math.max(70, player.flamethrowerCooldownMs - 12);
    }
  },
  {
    key: 'unlockRuneTrap',
    label: 'Rune Trap',
    description: 'Unlock delayed rune traps that arm at your cursor and detonate on contact.',
    isAvailable: (player) => canLearnAbility(player, 'runeTrapUnlocked'),
    apply(player) {
      player.runeTrapUnlocked = true;
      player.runeTrapDamage = Math.max(player.runeTrapDamage, 22);
      player.runeTrapArmMs = Math.max(player.runeTrapArmMs, 0) || 400;
      player.runeTrapRadius = Math.max(player.runeTrapRadius, 40);
      player.runeTrapCharges = Math.max(player.runeTrapCharges, 1);
      player.runeTrapCooldownMs = Math.max(player.runeTrapCooldownMs, 0) || 900;
    }
  },
  {
    key: 'unlockArcMine',
    label: 'Arc Mine',
    description: 'Unlock a cursor-triggered mine that jumps lightning through nearby enemies.',
    isAvailable: (player) => canLearnAbility(player, 'arcMineUnlocked'),
    apply(player) {
      player.arcMineUnlocked = true;
      player.arcMineDamage = Math.max(player.arcMineDamage, 16);
      player.arcMineChains = Math.max(player.arcMineChains, 2);
      player.arcMineTriggerRadius = Math.max(player.arcMineTriggerRadius, 20);
      player.arcMineChainRange = Math.max(player.arcMineChainRange, 32);
      player.arcMineCooldownMs = Math.max(player.arcMineCooldownMs, 0) || 900;
    }
  },
  {
    key: 'arcMineDamage',
    label: 'Storm Core',
    description: '+6 arc mine damage',
    isAvailable: (player) => player.arcMineUnlocked,
    apply(player) {
      player.arcMineDamage += 6;
    }
  },
  {
    key: 'arcMineChains',
    label: 'Jump Circuit',
    description: '+1 arc mine chain',
    isAvailable: (player) => player.arcMineUnlocked,
    apply(player) {
      player.arcMineChains += 1;
    }
  },
  {
    key: 'arcMineRadius',
    label: 'Seeking Charge',
    description: '+8 arc mine trigger radius',
    isAvailable: (player) => player.arcMineUnlocked,
    apply(player) {
      player.arcMineTriggerRadius += 8;
      player.arcMineChainRange += 8;
    }
  },
  {
    key: 'unlockSpearBarrage',
    label: 'Spear Barrage',
    description: 'Unlock a falling cursor barrage that rains spears onto a target area.',
    isAvailable: (player) => canLearnAbility(player, 'spearBarrageUnlocked'),
    apply(player) {
      player.spearBarrageUnlocked = true;
      player.spearBarrageDamage = Math.max(player.spearBarrageDamage, 18);
      player.spearBarrageCount = Math.max(player.spearBarrageCount, 2);
      player.spearBarrageRadius = Math.max(player.spearBarrageRadius, 30);
      player.spearBarrageCooldownMs = Math.max(player.spearBarrageCooldownMs, 0) || 1200;
    }
  },
  {
    key: 'spearBarrageDamage',
    label: 'Skyfall Steel',
    description: '+7 spear barrage damage',
    isAvailable: (player) => player.spearBarrageUnlocked,
    apply(player) {
      player.spearBarrageDamage += 7;
    }
  },
  {
    key: 'spearBarrageCount',
    label: 'Phalanx Rain',
    description: '+1 falling spear',
    isAvailable: (player) => player.spearBarrageUnlocked,
    apply(player) {
      player.spearBarrageCount += 1;
    }
  },
  {
    key: 'spearBarrageRadius',
    label: 'Impaling Circle',
    description: '+8 spear impact radius',
    isAvailable: (player) => player.spearBarrageUnlocked,
    apply(player) {
      player.spearBarrageRadius += 8;
    }
  },
  {
    key: 'runeTrapDamage',
    label: 'Sigil Ruin',
    description: '+8 rune trap damage',
    isAvailable: (player) => player.runeTrapUnlocked,
    apply(player) {
      player.runeTrapDamage += 8;
    }
  },
  {
    key: 'runeTrapRadius',
    label: 'Wide Glyph',
    description: '+10 rune trap radius',
    isAvailable: (player) => player.runeTrapUnlocked,
    apply(player) {
      player.runeTrapRadius += 10;
    }
  },
  {
    key: 'runeTrapCharges',
    label: 'Prepared Circle',
    description: '+1 rune trap charge',
    isAvailable: (player) => player.runeTrapUnlocked,
    apply(player) {
      player.runeTrapCharges += 1;
    }
  },
  {
    key: 'lanceDamage',
    label: 'Moonsteel Tip',
    description: '+8 lance damage',
    isAvailable: (player) => player.lanceUnlocked,
    apply(player) {
      player.lanceDamage += 8;
    }
  },
  {
    key: 'lanceLength',
    label: 'Extended Reach',
    description: '+35 lance length',
    isAvailable: (player) => player.lanceUnlocked,
    apply(player) {
      player.lanceLength += 35;
    }
  },
  {
    key: 'lanceRate',
    label: 'Quick Draw Lance',
    description: '-120ms lance cooldown',
    isAvailable: (player) => player.lanceUnlocked,
    apply(player) {
      player.lanceCooldownMs = Math.max(420, player.lanceCooldownMs - 120);
    }
  },
  {
    key: 'meteorDamage',
    label: 'Falling Wrath',
    description: '+10 meteor damage',
    isAvailable: (player) => player.meteorUnlocked,
    apply(player) {
      player.meteorDamage += 10;
    }
  },
  {
    key: 'meteorRadius',
    label: 'Crater Bloom',
    description: '+16 meteor radius',
    isAvailable: (player) => player.meteorUnlocked,
    apply(player) {
      player.meteorRadius += 16;
    }
  },
  {
    key: 'meteorCount',
    label: 'Twin Impact',
    description: '+1 meteor target',
    isAvailable: (player) => player.meteorUnlocked,
    apply(player) {
      player.meteorCount += 1;
    }
  },
  {
    key: 'meteorRate',
    label: 'Sky Furnace',
    description: '-240ms meteor cooldown',
    isAvailable: (player) => player.meteorUnlocked,
    apply(player) {
      player.meteorCooldownMs = Math.max(1100, player.meteorCooldownMs - 240);
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

const EARLY_LEVEL_XP = [10, 15, 21];
const XP_GROWTH_START = EARLY_LEVEL_XP.at(-1);
const XP_GROWTH_RATE = 1.16;

export function getXpToNextLevel(level) {
  if (level <= EARLY_LEVEL_XP.length) {
    return EARLY_LEVEL_XP[level - 1];
  }

  return Math.round(XP_GROWTH_START * XP_GROWTH_RATE ** (level - EARLY_LEVEL_XP.length));
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
