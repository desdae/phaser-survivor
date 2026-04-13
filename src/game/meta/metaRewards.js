export function buildSoulAshBreakdown({
  timeMs = 0,
  eliteKills = 0,
  bossKills = 0,
  chestsOpened = 0,
  discoverySoulAsh = 0
}) {
  return [
    { key: 'time', label: 'Survival Time', soulAsh: Math.floor(timeMs / 30000) },
    { key: 'elites', label: 'Elite Kills', soulAsh: eliteKills * 5 },
    { key: 'bosses', label: 'Boss Kills', soulAsh: bossKills * 20 },
    { key: 'chests', label: 'Chests Opened', soulAsh: chestsOpened * 3 },
    { key: 'discoveries', label: 'First Discoveries', soulAsh: discoverySoulAsh }
  ];
}

export function calculateSoulAshReward(runSummary) {
  const rows = buildSoulAshBreakdown(runSummary);

  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.soulAsh, 0)
  };
}
