export const META_SHOP_DEFINITIONS = [
  {
    key: 'maxHealth',
    profileKey: 'maxHealthLevel',
    maxLevel: 5,
    costs: [20, 40, 75, 125, 200]
  },
  {
    key: 'pickupRadius',
    profileKey: 'pickupRadiusLevel',
    maxLevel: 5,
    costs: [20, 40, 75, 125, 200]
  },
  {
    key: 'moveSpeed',
    profileKey: 'moveSpeedLevel',
    maxLevel: 5,
    costs: [20, 40, 75, 125, 200]
  },
  {
    key: 'startingXp',
    profileKey: 'startingXpLevel',
    maxLevel: 4,
    costs: [20, 40, 75, 125]
  },
  {
    key: 'reroll',
    profileKey: 'rerollLevel',
    maxLevel: 2,
    costs: [60, 120]
  },
  {
    key: 'revive',
    profileKey: 'reviveUnlocked',
    maxLevel: 1,
    costs: [250]
  }
];

export function getMetaShopDefinition(key) {
  return META_SHOP_DEFINITIONS.find((entry) => entry.key === key) ?? null;
}
