/* Wild kill drops only. Persistence and exactly-once valid-kill handling belong to callers. */
(() => {
  'use strict';
  const rates = Object.freeze({ herb: .06, rare: .002 });
  // Conditional rare weights: premium hybrids together are only 10% of rare finds.
  const rarePool = Object.freeze([
    Object.freeze({ id: 'great-return', weight: 40 }),
    Object.freeze({ id: 'tiger-wine', weight: 25 }),
    Object.freeze({ id: 'guardian-pill', weight: 25 }),
    Object.freeze({ id: 'strength-pill', weight: 5 }),
    Object.freeze({ id: 'vitality-pill', weight: 5 })
  ]);
  function eligible(context) {
    if (!context || typeof context !== 'object') return false;
    if (context.preview || context.replay || context.readOnlyReplay || context.training || context.dojo || context.showcase || context.story) return false;
    const enemy = context.enemy;
    if (!enemy || enemy.boss || enemy.dojoDummy || enemy.kind === 'dummy') return false;
    return context.kind === 'encounter' || (context.kind === 'life' && (context.lifeKind === 'patrol' || context.lifeKind === 'commission'));
  }
  function randomUnit(rng) {
    const value = rng();
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1 ? value : null;
  }
  function roll(context, rng = Math.random) {
    if (!eligible(context) || typeof rng !== 'function') return null;
    const chance = randomUnit(rng);
    if (chance === null) return null;
    if (chance < rates.rare) {
      const selection = randomUnit(rng);
      if (selection === null) return null;
      let cumulative = 0;
      for (const item of rarePool) {
        cumulative += item.weight;
        if (selection < cumulative / 100) return { id: item.id, quantity: 1, rarity: 'rare' };
      }
      return null;
    }
    if (chance < rates.rare + rates.herb) return { id: 'herb', quantity: 1, rarity: 'common' };
    return null;
  }
  window.SevenLoot = Object.freeze({ rates, rarePool, eligible, roll });
})();
