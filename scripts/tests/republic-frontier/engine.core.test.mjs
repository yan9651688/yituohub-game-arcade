import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../../../public/game-arcade/games/republic-frontier/src/engine.js";
import { BUILDINGS, UNITS, unitDefinition } from "../../../public/game-arcade/games/republic-frontier/src/data.js";
import { MAPS, createMap } from "../../../public/game-arcade/games/republic-frontier/src/maps.js";

const advance = (game, seconds) => {
  for (let t = 0; t < seconds - 1e-7; t += 0.1)
    game.step(Math.min(0.1, seconds - t));
};
function fixture(faction = "allied") {
  const g = new Game({ faction });
  g.state.entities = [];
  g.state.projectiles = [];
  g.state.events = [];
  g.state.nextId = 1;
  g.state.tiles.forEach((t) =>
    Object.assign(t, {
      kind: "grass",
      ore: 0,
      bridge: false,
      height: 0,
      ramp: null,
      surface: null,
      obstacle: false,
      explored: true,
      visible: true,
    }),
  );
  g.state.players.forEach((p) => {
    p.ai = false;
    p.credits = 20000;
  });
  g.spawn("constructionYard", 0, 3, 3);
  g.spawn("constructionYard", 1, 60, 42);
  return g;
}
function place(game, building) {
  const anchor = game.owned(0, (e) => e.type === "constructionYard")[0];
  let best = null,
    score = Infinity;
  for (
    let y = Math.max(0, anchor.y - 12);
    y < Math.min(game.state.height, anchor.y + 15);
    y++
  )
    for (
      let x = Math.max(0, anchor.x - 12);
      x < Math.min(game.state.width, anchor.x + 15);
      x++
    ) {
      const d = Math.hypot(x - anchor.x, y - anchor.y);
      if (d < score && game.canBuild(building, x, y).ok) {
        best = { x, y };
        score = d;
      }
    }
  assert.ok(best, `build position for ${building}`);
  assert.equal(game.command({ type: "build", building, ...best }).ok, true);
  return game.state.entities.at(-1);
}

test("natural command sequence deploys a base, builds economy/factories and produces an army", () => {
  const g = new Game({
    faction: "allied",
    mapId: "frontier",
    difficulty: "easy",
  });
  const mcv = g.owned(0, (e) => e.type === "mcv")[0];
  assert.equal(g.command({ type: "deploy", ids: [mcv.id] }).ok, true);
  place(g, "powerPlant");
  advance(g, 16);
  place(g, "refinery");
  advance(g, 32);
  place(g, "barracks");
  advance(g, 18);
  place(g, "warFactory");
  advance(g, 36);
  assert.equal(g.command({ type: "train", unit: "tank" }).ok, true);
  advance(g, 20);
  assert.ok(g.owned(0, (e) => e.type === "tank").length);
  assert.ok(
    g.state.players[0].income > 0,
    "miners must actually harvest and deliver ore",
  );
  assert.ok(g.state.events.some((e) => e.type === "oreDelivered"));
  assert.ok(
    g.owned(1, (e) => e.type === "refinery" && e.progress === 1).length,
    "AI must establish a real economy",
  );
  assert.ok(g.state.players[1].spent > 0, "AI pays for production");
});

test("fixture: prerequisites, placement, progressive spending and cancel refund are enforced", () => {
  const g = fixture();
  assert.equal(g.canTrain("tank").ok, false);
  assert.equal(g.canBuild("warFactory", 10, 10).ok, false);
  const cash = g.state.players[0].credits,
    building = place(g, "powerPlant");
  assert.equal(
    g.state.players[0].credits,
    cash,
    "construction is paid progressively",
  );
  advance(g, 5);
  assert.ok(building.progress > 0.3 && building.progress < 0.4);
  assert.ok(g.state.players[0].credits < cash);
  assert.equal(
    g.command({ type: "cancelProduction", buildingId: building.id }).ok,
    true,
  );
  assert.ok(Math.abs(g.state.players[0].credits - cash) < 0.001);
  assert.equal(
    g.canBuild("powerPlant", 3, 3).ok,
    false,
    "cannot overlap the yard",
  );
});

test("fixture: money starvation pauses and resumes an existing queue without free units", () => {
  const g = fixture(),
    power = g.spawn("powerPlant", 0, 8, 3),
    barracks = g.spawn("barracks", 0, 11, 3);
  g.state.players[0].credits = 50;
  assert.equal(
    g.command({ type: "train", unit: "infantry", buildingId: barracks.id }).ok,
    true,
  );
  advance(g, 12);
  assert.equal(g.owned(0, (e) => e.type === "infantry").length, 0);
  assert.ok(Math.abs(barracks.queue[0].progress - 0.25) < 0.001);
  g.state.players[0].credits = 200;
  advance(g, 6);
  assert.equal(g.owned(0, (e) => e.type === "infantry").length, 1);
});

test("UI command contract: repair toggle, factory rally and yard packing retain usable selection IDs", () => {
  const g = fixture(),
    yard = g.owned(0, (e) => e.type === "constructionYard")[0];
  yard.hp = 600;
  assert.equal(g.command({ type: "repair", ids: [yard.id] }).ok, true);
  advance(g, 1);
  assert.ok(yard.hp > 600);
  g.spawn("powerPlant", 0, 8, 3);
  const barracks = g.spawn("barracks", 0, 11, 3);
  assert.equal(
    g.command({ type: "move", ids: [barracks.id], x: 20, y: 10 }).ok,
    true,
  );
  assert.deepEqual(barracks.rally, { x: 20, y: 10 });
  g.command({ type: "train", unit: "infantry", buildingId: barracks.id });
  advance(g, 16);
  const recruit = g.owned(0, (e) => e.type === "infantry")[0];
  assert.ok(Math.hypot(recruit.x - 20, recruit.y - 10) < 1);
  assert.equal(g.command({ type: "deploy", ids: [yard.id] }).ok, true);
  const packed = g.state.events.filter((e) => e.type === "deployed").at(-1);
  assert.equal(g.getEntity(packed.entityId).type, "mcv");
  assert.equal(packed.previousId, yard.id);
});

test("fixture: loss of power slows production and disables powered defenses", () => {
  const g = fixture();
  g.spawn("barracks", 0, 10, 3);
  const tower = g.spawn("defenseTower", 0, 14, 8);
  const enemy = g.spawn("tank", 1, 19, 8);
  enemy.order = { type: "move", x: 19, y: 8 };
  g.command({ type: "train", unit: "infantry" });
  advance(g, 3);
  assert.equal(g.powered(0), false);
  assert.equal(enemy.hp, enemy.maxHp);
  const queue = g.owned(0, (e) => e.type === "barracks")[0].queue[0];
  assert.ok(queue.progress < 0.25);
  g.spawn("powerPlant", 0, 6, 12);
  advance(g, 2);
  assert.equal(g.powered(0), true);
  assert.ok(enemy.hp < enemy.maxHp);
});

test("fixture: pathfinder navigates a building wall and a bridge without crossing water", () => {
  const g = fixture();
  for (let y = 0; y < g.state.height; y++)
    for (let x = 25; x <= 28; x++)
      Object.assign(g.tile(x, y), {
        kind: y >= 20 && y <= 22 ? "road" : "water",
        bridge: y >= 20 && y <= 22,
      });
  g.spawn("refinery", -1, 15, 18);
  const unit = g.spawn("tank", 0, 12.5, 10.5);
  assert.equal(
    g.command({ type: "move", ids: [unit.id], x: 36.5, y: 10.5 }).ok,
    true,
  );
  for (let n = 0; n < 250; n++) {
    g.step(0.1);
    assert.notEqual(g.tile(unit.x, unit.y).kind, "water");
  }
  assert.ok(Math.hypot(unit.x - 36.5, unit.y - 10.5) < 1);
});

test("fixture: attack-move into an enemy building footprint advances instead of freezing at spawn", () => {
  const g = fixture(),
    enemy = g.owned(1)[0],
    tank = g.spawn("tank", 0, 20, 20);
  g.command({
    type: "attackMove",
    ids: [tank.id],
    x: enemy.x + 1.5,
    y: enemy.y + 1.5,
  });
  advance(g, 25);
  assert.ok(
    tank.x > 45,
    "must leave start and approach the occupied destination",
  );
  assert.ok(
    enemy.hp < enemy.maxHp,
    "must acquire and shoot the destination building",
  );
});

test("fixture: armor classes change damage, projectiles travel, deaths emit provenance tags", () => {
  const g = fixture();
  const rifle = g.spawn("infantry", 0, 20, 20),
    tank = g.spawn("tank", 1, 23, 20, { tags: ["objective"] });
  g.command({ type: "attack", ids: [rifle.id], targetId: tank.id });
  g.step(0.05);
  assert.ok(g.state.projectiles.length);
  const before = tank.hp;
  advance(g, 0.3);
  assert.ok(tank.hp < before);
  assert.ok(before - tank.hp < UNITS.infantry.damage);
  g.damage(tank, 10000, rifle);
  const event = g.state.events.find(
    (e) => e.type === "death" && e.entityId === tank.id,
  );
  assert.deepEqual(event.tags, ["objective"]);
  assert.equal(event.killerOwner, 0);
});

test("fixture: attack-move preserves mission capture objectives but an explicit attack remains possible", () => {
  const g = fixture(),
    target = g.spawn("radar", 1, 20, 15, { missionCaptureOnly: true }),
    unit = g.spawn("tank", 0, 16, 15);
  g.command({ type: "attackMove", ids: [unit.id], x: 25, y: 15 });
  advance(g, 8);
  assert.equal(target.hp, target.maxHp);
  assert.equal(
    g.command({ type: "attack", ids: [unit.id], targetId: target.id }).ok,
    true,
  );
  advance(g, 3);
  assert.ok(target.hp < target.maxHp);
});

test("malformed command type names fail cleanly instead of resolving object prototypes", () => {
  const g = fixture();
  assert.equal(g.canBuild("constructor", 20, 20).ok, false);
  assert.equal(g.canTrain("__proto__").ok, false);
  assert.equal(g.getDefinition("toString"), undefined);
});

test("fixture: engineers physically reach and capture neutral structures and repair owned assets", () => {
  const g = fixture();
  const oil = g.spawn("oilDerrick", -1, 18, 12),
    eng = g.spawn("engineer", 0, 12, 12);
  assert.equal(
    g.command({ type: "capture", ids: [eng.id], targetId: oil.id }).ok,
    true,
  );
  advance(g, 7);
  assert.equal(oil.owner, 0);
  assert.equal(eng.dead, true);
  const eng2 = g.spawn("engineer", 0, 13, 12);
  oil.hp = 400;
  g.command({ type: "repair", ids: [eng2.id], targetId: oil.id });
  advance(g, 6);
  assert.ok(oil.hp > 400);
});

test("fixture: a near-edge engineer completes capture when its grid centre is already in reach", () => {
  const g = fixture(),
    hospital = g.spawn("hospital", -1, 26, 17),
    engineer = g.spawn("engineer", 0, 25, 18);
  assert.equal(
    g.command({ type: "capture", ids: [engineer.id], targetId: hospital.id })
      .ok,
    true,
  );
  advance(g, 2);
  assert.equal(hospital.owner, 0);
  assert.equal(engineer.dead, true);
});

test("fixture: transport boarding, movement and unloading preserve passengers as real entities", () => {
  const g = fixture(),
    carrier = g.spawn("apc", 0, 15, 15),
    infantry = g.spawn("infantry", 0, 12, 15);
  assert.equal(
    g.command({ type: "garrison", ids: [infantry.id], targetId: carrier.id })
      .ok,
    true,
  );
  advance(g, 3);
  assert.equal(infantry.carrierId, carrier.id);
  assert.deepEqual(carrier.passengers, [infantry.id]);
  g.command({ type: "move", ids: [carrier.id], x: 25, y: 15 });
  advance(g, 5);
  assert.equal(g.command({ type: "unload", ids: [carrier.id] }).ok, true);
  assert.equal(infantry.carrierId, null);
  assert.ok(infantry.x > 20);
  assert.ok(infantry.hp > 0);
});

test("fixture: coastal shipyard produces a ship which stays on water while navigating", () => {
  const g = fixture();
  for (let y = 15; y < 35; y++)
    for (let x = 12; x < 40; x++) g.tile(x, y).kind = "water";
  g.spawn("powerPlant", 0, 7, 3);
  g.spawn("refinery", 0, 7, 7);
  const yard = g.spawn("shipyard", 0, 14, 15);
  assert.equal(
    g.command({ type: "train", unit: "destroyer", buildingId: yard.id }).ok,
    true,
  );
  advance(g, 36);
  const ship = g.owned(0, (e) => e.type === "destroyer")[0];
  assert.ok(ship);
  assert.equal(g.tile(ship.x, ship.y).kind, "water");
  g.command({ type: "move", ids: [ship.id], x: 32, y: 28 });
  for (let t = 0; t < 150; t++) {
    g.step(0.1);
    assert.equal(g.tile(ship.x, ship.y).kind, "water");
  }
  assert.ok(Math.hypot(ship.x - 32, ship.y - 28) < 1);
});

test("fixture: fighter expends ammunition then returns to a powered airfield to reload", () => {
  const g = fixture();
  g.spawn("powerPlant", 0, 8, 3);
  g.spawn("airfield", 0, 10, 5);
  const plane = g.spawn("fighter", 0, 15, 8),
    target = g.spawn("constructionYard", 1, 22, 8);
  g.command({ type: "attack", ids: [plane.id], targetId: target.id });
  advance(g, 7);
  assert.ok(plane.rearming || plane.ammo < 3);
  g.command({ type: "stop", ids: [plane.id] });
  advance(g, 15);
  assert.equal(plane.ammo, 3);
  assert.equal(plane.rearming, false);
});

test("fixture: superweapon needs power and full charge, then damages its real target", () => {
  const g = fixture("china");
  g.spawn("powerPlant", 0, 8, 3);
  g.spawn("powerPlant", 0, 11, 3);
  const weapon = g.spawn("superweapon", 0, 12, 10),
    target = g.spawn("tank", 1, 24, 18);
  assert.equal(
    g.command({ type: "superweapon", id: weapon.id, x: 24, y: 18 }).ok,
    false,
  );
  weapon.charge = BUILDINGS.superweapon.chargeTime;
  g.updateVisibility();
  g.tile(24, 18).explored = true;
  assert.equal(
    g.command({ type: "superweapon", id: weapon.id, x: 24, y: 18 }).ok,
    true,
  );
  advance(g, 5.2);
  assert.equal(target.hp, 0);
  assert.ok(weapon.charge < 6);
});

test("fixture: a captured silo retains its original weapon family and visual identity", () => {
  const g = fixture("allied");
  g.spawn("powerPlant", 0, 7, 3);
  g.spawn("powerPlant", 0, 10, 3);
  const silo = g.spawn("superweapon", 1, 15, 10),
    engineer = g.spawn("engineer", 0, 12, 10);
  assert.equal(silo.createdFaction, "soviet");
  assert.equal(
    g.command({ type: "capture", ids: [engineer.id], targetId: silo.id }).ok,
    true,
  );
  advance(g, 8);
  assert.equal(silo.owner, 0);
  assert.equal(silo.createdFaction, "soviet");
  silo.charge = BUILDINGS.superweapon.chargeTime;
  g.tile(24, 18).explored = true;
  assert.equal(
    g.command({ type: "superweapon", id: silo.id, x: 24, y: 18 }).ok,
    true,
  );
  assert.equal(g.state.projectiles.at(-1).kind, "nuclear");
  const restored = Game.restore(g.serialize());
  assert.equal(restored.getEntity(silo.id).createdFaction, "soviet");
});

test("fixture: the campaign weather station launches a real storm despite enemy faction ownership", () => {
  const g = fixture();
  g.spawn("powerPlant", 1, 32, 7);
  g.spawn("powerPlant", 1, 36, 7);
  const station = g.spawn("superweapon", 1, 32, 11, {
    missionRole: "weather",
    missionControlled: true,
  });
  station.charge = BUILDINGS.superweapon.chargeTime;
  const target = g.spawn("tank", 0, 14, 14);
  assert.equal(
    g.command({
      type: "superweapon",
      owner: 1,
      id: station.id,
      x: 14,
      y: 14,
      missionLaunch: true,
    }).ok,
    true,
  );
  assert.equal(g.state.projectiles.at(-1).kind, "storm");
  advance(g, 5.2);
  assert.equal(target.hp, 0);
  assert.ok(g.state.effects.some((e) => e.kind === "storm"));
});

test("fixture: scenario-controlled superweapon rejects ordinary launch commands", () => {
  const g = fixture();
  g.spawn("powerPlant", 0, 8, 3);
  g.spawn("powerPlant", 0, 11, 3);
  const node = g.spawn("superweapon", 0, 15, 8, {
    missionControlled: true,
    charge: 180,
  });
  assert.equal(
    g.command({ type: "superweapon", id: node.id, x: 30, y: 20 }).ok,
    false,
  );
  assert.equal(
    g.command({
      type: "superweapon",
      id: node.id,
      x: 30,
      y: 20,
      missionLaunch: true,
    }).ok,
    true,
  );
});

test("fixture: faction variants change actual economy, deployment and armour", () => {
  assert.equal(unitDefinition("infantry", "china").hp, 200);
  assert.equal(unitDefinition("infantry", "soviet").cost, 100);
  assert.equal(unitDefinition("mammoth", "china").hp, 2000);
  assert.equal(unitDefinition("mammoth", "soviet").hp, 800);
  const g = fixture("allied"),
    ref = g.spawn("refinery", 0, 12, 8),
    miner = g.spawn("miner", 0, 35, 15, { cargo: 700 });
  advance(g, 2);
  assert.ok(miner.x < 18);
  assert.ok(g.state.events.some((e) => e.type === "chronoReturn"));
  const sov = fixture("soviet"),
    soldier = sov.spawn("infantry", 0, 20, 20);
  assert.equal(sov.command({ type: "deploy", ids: [soldier.id] }).ok, false);
});

test("fixture: spy infiltrates power and archive, survives, and dogs reveal disguise", () => {
  const g = fixture(),
    power = g.spawn("powerPlant", 1, 18, 15),
    spy = g.spawn("spy", 0, 13, 15);
  const guard = g.spawn("infantry", 1, 15, 17);
  assert.equal(g.canTarget(guard, spy), false);
  assert.equal(
    g.command({ type: "infiltrate", ids: [spy.id], targetId: power.id }).ok,
    true,
  );
  advance(g, 5);
  assert.equal(spy.lastInfiltratedId, power.id);
  assert.ok(spy.hp > 0);
  assert.equal(g.powered(1), false);
  assert.ok(g.state.events.some((e) => e.type === "infiltrate"));
  const dog = g.spawn("dog", 1, spy.x + 2, spy.y);
  advance(g, 0.1);
  assert.ok(spy.revealedUntil > g.state.time);
  assert.equal(g.canTarget(guard, spy), true);
});

test("complete JSON snapshot resumes queues, cargo, passengers, AI, random state and future outcomes", () => {
  const g = fixture();
  g.spawn("powerPlant", 0, 8, 3);
  const b = g.spawn("barracks", 0, 11, 3);
  g.command({ type: "train", unit: "infantry", buildingId: b.id });
  advance(g, 2);
  const carrier = g.spawn("apc", 0, 24, 18),
    passenger = g.spawn("engineer", 0, 24, 18, { carrierId: carrier.id });
  carrier.passengers.push(passenger.id);
  carrier.order = { type: "move", x: 30, y: 20 };
  g.spawn("miner", 0, 22, 12, { cargo: 234, harvestState: "return" });
  g.state.players[1].ai = true;
  const restored = Game.restore(JSON.parse(JSON.stringify(g.serialize())));
  advance(g, 5);
  advance(restored, 5);
  assert.deepEqual(restored.serialize(), g.serialize());
  const broken = g.serialize();
  broken.state.entities[0].hp = null;
  assert.throws(() => Game.restore(broken), /损坏/);
});

test("campaign options use the real campaign faction after restore and reject mismatched restart settings", () => {
  const g = new Game({ mode: "campaign", missionId: "c1", difficulty: "easy" });
  assert.equal(g.state.options.faction, "china");
  assert.equal(g.state.difficulty, "easy");
  const restored = Game.restore(g.serialize());
  assert.deepEqual(restored.options, restored.state.options);
  const broken = g.serialize();
  broken.state.options.mode = "skirmish";
  assert.throws(() => Game.restore(broken), /不一致/);
});

test("eight deterministic maps provide all eight starts with local resources and genuine sea/bridge terrain", () => {
  assert.equal(MAPS.length, 8);
  for (const map of MAPS) {
    const a = createMap(map.id, 8, 7),
      b = createMap(map.id, 8, 7);
    assert.deepEqual(a, b);
    assert.equal(a.starts.length, 8);
    assert.ok(a.tiles.some((t) => t.ore > 0));
    for (const p of a.starts)
      assert.notEqual(
        a.tiles[Math.floor(p.y) * a.width + Math.floor(p.x)].kind,
        "water",
      );
  }
  assert.ok(createMap("islands").tiles.some((t) => t.kind === "water"));
  assert.ok(createMap("river").tiles.some((t) => t.bridge));
});

test("fixture: real combat orders and projectiles produce both victory and defeat", () => {
  const winning = fixture();
  const enemyYard = winning.owned(1)[0],
    army = [];
  for (let i = 0; i < 8; i++)
    army.push(winning.spawn("tank", 0, 48 + (i % 4), 35 + Math.floor(i / 4)));
  winning.command({
    type: "attack",
    ids: army.map((e) => e.id),
    targetId: enemyYard.id,
  });
  advance(winning, 60);
  assert.equal(winning.state.status, "won");
  const losing = fixture(),
    humanYard = losing.owned(0)[0],
    foes = [];
  for (let i = 0; i < 5; i++) foes.push(losing.spawn("tank", 1, 13, 4 + i));
  losing.command({
    type: "attack",
    owner: 1,
    ids: foes.map((e) => e.id),
    targetId: humanYard.id,
  });
  advance(losing, 60);
  assert.equal(losing.state.status, "lost");
});
