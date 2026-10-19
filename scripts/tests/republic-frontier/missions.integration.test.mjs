import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../../../public/game-arcade/games/republic-frontier/src/engine.js";
import { ALL_MISSIONS } from "../../../public/game-arcade/games/republic-frontier/src/campaigns.js";
import { MISSION_SCENARIOS, validateMissionState } from "../../../public/game-arcade/games/republic-frontier/src/missions.js";
import { BUILDINGS } from "../../../public/game-arcade/games/republic-frontier/src/data.js";

const make = (id) =>
  new Game({
    mode: "campaign",
    missionId: id,
    faction: id[0] === "a" ? "allied" : "china",
    difficulty: "normal",
    seed: 2026,
  });
const living = (e) => e?.hp > 0 && !e.dead;
const role = (game, name) =>
  (game.state.mission.roles[name] || [])
    .map((id) => game.getEntity(id))
    .filter(Boolean);
const ids = (game, name) =>
  role(game, name)
    .filter(living)
    .map((e) => e.id);
function until(game, predicate, seconds = 180) {
  for (
    let i = 0;
    i < seconds * 10 && !predicate() && game.state.status === "playing";
    i++
  )
    game.step(0.1);
  assert.ok(
    predicate(),
    `condition not reached: ${game.state.mission.id} phase ${game.state.mission.stage}, ${game.state.status}: ${JSON.stringify(game.state.objectives)}`,
  );
}

test("all 16 authored missions construct real worlds, expose three phases and do not win from waiting", () => {
  assert.equal(ALL_MISSIONS.length, 16);
  assert.equal(new Set(ALL_MISSIONS.map((m) => m.id)).size, 16);
  for (const definition of ALL_MISSIONS) {
    assert.equal(MISSION_SCENARIOS[definition.id].stages.length, 3);
    const game = make(definition.id);
    assert.equal(game.state.tiles.length, game.state.width * game.state.height);
    assert.ok(game.state.entities.length > 12);
    for (let n = 0; n < 30; n++) game.step(1);
    assert.notEqual(
      game.state.status,
      "won",
      `${definition.id} must require real objectives`,
    );
    assert.equal(game.state.mission.stage, 1);
    assert.equal(game.command({ type: "missionComplete" }).ok, false);
    assert.ok(game.state.objectives.some((o) => !o.optional && !o.done));
  }
});

test("A1 actual player commands complete rescue, captures, combat and evacuation without fixture edits", () => {
  const game = make("a1");
  assert.ok(
    game.command({ type: "attackMove", ids: ids(game, "squad"), x: 21, y: 24 })
      .ok,
  );
  until(game, () => game.state.mission.stage === 2);
  assert.ok(role(game, "guards").every((e) => e.owner === 0));
  game.command({ type: "attackMove", ids: ids(game, "squad"), x: 31, y: 22 });
  until(game, () => role(game, "radarEnemy").every((e) => !living(e)));
  const engineers = ids(game, "engineers");
  assert.ok(
    game.command({
      type: "capture",
      ids: [engineers[0]],
      targetId: role(game, "radar")[0].id,
    }).ok,
  );
  assert.ok(
    game.command({
      type: "capture",
      ids: [engineers[1]],
      targetId: role(game, "power")[0].id,
    }).ok,
  );
  until(game, () => game.state.mission.stage === 3);
  game.command({ type: "attackMove", ids: ids(game, "squad"), x: 49, y: 25 });
  game.command({ type: "move", ids: ids(game, "investigators"), x: 51, y: 27 });
  until(game, () => game.state.status === "won");
  assert.ok(game.state.events.some((e) => e.type === "missionWon"));
  assert.equal(game.state.mission.checkpointRevision, 2);
});

test("C1 actual player commands complete defense, captures and selectable civilian evacuation", () => {
  const game = make("c1");
  game.command({ type: "attackMove", ids: ids(game, "squad"), x: 24, y: 23 });
  until(game, () => game.state.mission.stage === 2);
  const engineers = ids(game, "engineers");
  game.command({
    type: "capture",
    ids: [engineers[0]],
    targetId: role(game, "power")[0].id,
  });
  game.command({
    type: "capture",
    ids: [engineers[1]],
    targetId: role(game, "hospital")[0].id,
  });
  until(game, () => game.state.mission.stage === 3);
  game.command({ type: "attackMove", ids: ids(game, "squad"), x: 48, y: 23 });
  assert.ok(
    game.command({ type: "move", ids: ids(game, "evacuees"), x: 57, y: 27 }).ok,
  );
  until(game, () => game.state.status === "won");
  assert.ok(
    game.state.objectives.filter((o) => !o.optional).every((o) => o.done),
  );
});

test("phase checkpoint event observes the new stable objectives and full world survives serialize/restore", () => {
  const game = make("a1");
  let checkpoint;
  game.onEvent = (event) => {
    if (event.type === "missionStage") checkpoint = game.serialize();
  };
  game.command({ type: "attackMove", ids: ids(game, "squad"), x: 21, y: 24 });
  until(game, () => Boolean(checkpoint));
  assert.equal(checkpoint.state.mission.stage, 2);
  assert.ok(checkpoint.state.objectives.some((o) => o.id === "capture_radar"));
  const restored = Game.restore(checkpoint);
  const control = Game.restore(checkpoint);
  for (let n = 0; n < 100; n++) {
    restored.step(0.1);
    control.step(0.1);
  }
  assert.deepEqual(restored.serialize(), control.serialize());
});

test("paused mission does not advance objective clocks, waves or stage", () => {
  const game = make("a1");
  game.command({ type: "pause" });
  const before = game.serialize();
  for (let n = 0; n < 10; n++) game.step(2);
  assert.deepEqual(game.serialize(), before);
});

test("fixture: destruction of a mandatory future capture target fails explicitly instead of softlocking", () => {
  const game = make("a1"),
    target = role(game, "radar")[0];
  assert.equal(target.missionCaptureOnly, true);
  game.damage(target, target.maxHp * 2, role(game, "squad")[0]);
  game.step(0.1);
  assert.equal(game.state.status, "lost");
  assert.match(game.state.mission.failureReason, /必须占领/);
});

test("fixture: C2 carried engineers do not satisfy unloaded arrival evidence", () => {
  const game = make("c2"),
    zone = MISSION_SCENARIOS.c2.zones.rear;
  for (const carrier of role(game, "supplyConvoy")) {
    carrier.x = zone.x;
    carrier.y = zone.y;
  }
  game.step(0.1);
  for (const passenger of role(game, "supplyCrew"))
    assert.equal(game.state.mission.visits[`rear:${passenger.id}`], undefined);
  game.command({ type: "unload", ids: ids(game, "supplyConvoy") });
  game.step(0.1);
  assert.ok(
    role(game, "supplyCrew").some(
      (e) => !e.carrierId && game.state.mission.visits[`rear:${e.id}`],
    ),
  );
});

test("fixture: MCV deployment preserves critical mission identity and does not cause a false failure", () => {
  const game = make("c2"),
    vehicle = role(game, "mobileBase")[0];
  vehicle.x = 49;
  vehicle.y = 24;
  game.updateVisibility();
  const result = game.command({ type: "deploy", ids: [vehicle.id] });
  assert.ok(result.ok, result.reason);
  game.step(0.1);
  assert.equal(game.state.status, "playing");
  assert.ok(
    role(game, "mobileBase").some(
      (e) => living(e) && e.type === "constructionYard",
    ),
  );
  const restored = Game.restore(game.serialize());
  restored.step(0.1);
  assert.equal(restored.state.status, "playing");
});

test("fixture: C7 bridge ownership changes actual terrain while a bypass remains passable", () => {
  const game = make("c7");
  assert.equal(game.tile(31, 22).kind, "water");
  assert.equal(game.tile(31, 9).kind, "road");
  for (const enemy of role(game, "patrol"))
    game.damage(enemy, enemy.maxHp * 2, role(game, "squad")[0]);
  const bridge = role(game, "bridgeControl")[0];
  const engineer = game.spawn("engineer", 0, bridge.x - 1, bridge.y + 1);
  game.command({ type: "capture", ids: [engineer.id], targetId: bridge.id });
  until(game, () => bridge.owner === 0);
  assert.equal(game.tile(31, 22).kind, "road");
  assert.equal(game.tile(31, 22).bridge, true);
});

test("campaign terrain variants are materially different and semantic landmarks are named", () => {
  const signatures = ["a1", "c1", "a3", "a5", "a6", "c8", "c2", "a2"].map(
    (id) => {
      const game = make(id);
      return JSON.stringify(
        game.state.tiles.map(
          (tile) => `${tile.kind}:${tile.surface || ""}:${tile.height}`,
        ),
      );
    },
  );
  assert.equal(new Set(signatures).size, signatures.length);
  assert.match(role(make("a1"), "dock")[0].missionName, /撤离/);
  assert.match(role(make("c1"), "station")[0].missionName, /调度/);
});

test("land campaign primary capture targets have terrain routes from initial forces, including mountain passages", () => {
  for (const definition of ALL_MISSIONS) {
    const game = make(definition.id),
      config = MISSION_SCENARIOS[definition.id],
      state = game.state;
    if (config.terrain === "naval") continue; // Naval missions intentionally require transports.
    const start = state.entities.find(
      (e) => e.owner === 0 && e.kind === "unit",
    );
    const queue = [[Math.floor(start.x), Math.floor(start.y)]],
      seen = new Set();
    for (let index = 0; index < queue.length; index++) {
      const [x, y] = queue[index],
        key = y * state.width + x;
      if (
        seen.has(key) ||
        x < 0 ||
        y < 0 ||
        x >= state.width ||
        y >= state.height ||
        ["water", "rock"].includes(state.tiles[key].kind)
      )
        continue;
      seen.add(key);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        queue.push([x + dx, y + dy]);
    }
    for (const stage of config.stages)
      for (const objective of stage.goals.filter((o) => o.kind === "capture")) {
        for (const entity of role(game, objective.role)) {
          const d = BUILDINGS[entity.type];
          let reachable = false;
          for (let y = Math.floor(entity.y) - 1; y <= entity.y + d.h; y++)
            for (let x = Math.floor(entity.x) - 1; x <= entity.x + d.w; x++)
              if (seen.has(y * state.width + x)) reachable = true;
          assert.ok(
            reachable,
            `${definition.id}/${objective.role} lacks terrain access`,
          );
        }
      }
  }
});

function fixtureAdvanceC8ToSilos() {
  const game = make("c8");
  // Isolate world-state/clock integration. This fixture is not a player playthrough.
  for (const enemy of game.state.entities.filter(
    (e) => e.owner === 1 && e.kind === "unit",
  ))
    game.damage(enemy, enemy.maxHp * 2, role(game, "squad")[0]);
  role(game, "squad")
    .slice(0, 3)
    .forEach((e, n) => {
      e.x = 29 + n * 0.6;
      e.y = 25;
    });
  const target = role(game, "forwardBase")[0],
    engineer = game.spawn("engineer", 0, 26.5, 23.5);
  game.command({ type: "capture", ids: [engineer.id], targetId: target.id });
  until(game, () => game.state.mission.stage === 2);
  game.step(0.1);
  return game;
}

test("fixture: C8 actual enemy power loss pauses launch clocks; restoring power resumes; saving preserves remaining time", () => {
  let game = fixtureAdvanceC8ToSilos();
  assert.equal(game.state.mission.siloTimers.length, 3);
  const first = game.state.mission.siloTimers[0].remaining;
  game.step(2);
  assert.ok(game.state.mission.siloTimers[0].remaining < first - 1.8);
  const plant = role(game, "siloPower")[0];
  game.damage(plant, plant.maxHp * 2, role(game, "squad")[0]);
  game.step(1);
  const stopped = game.state.mission.siloTimers.map((timer) => timer.remaining);
  game = Game.restore(game.serialize());
  for (let n = 0; n < 5; n++) game.step(1);
  assert.deepEqual(
    game.state.mission.siloTimers.map((timer) => timer.remaining),
    stopped,
  );
  assert.ok(game.state.mission.siloTimers.every((timer) => timer.paused));
  game.spawn("powerPlant", 1, 59, 3);
  game.step(2);
  assert.ok(game.state.mission.siloTimers[0].remaining < stopped[0] - 1.8);
  assert.equal(game.state.status, "playing");
});

test("fixture: C8 expired announced timer invokes the real superweapon command and fails, never wins", () => {
  const game = fixtureAdvanceC8ToSilos();
  game.state.mission.siloTimers[0].remaining = 0.1;
  game.step(0.2);
  assert.equal(game.state.status, "lost");
  assert.ok(
    game.state.events.some(
      (event) => event.type === "superweapon" && event.owner === 1,
    ),
  );
  assert.ok(
    game.state.events.some((event) => event.type === "missionNuclearLaunch"),
  );
});

test("mission save validator rejects missing critical roles and impossible stage numbers", () => {
  const game = make("a1");
  assert.equal(validateMissionState(game.state), true);
  const invalidStage = structuredClone(game.state);
  invalidStage.mission.stage = 4;
  assert.throws(() => validateMissionState(invalidStage), /战役存档/);
  const missingCritical = structuredClone(game.state);
  delete missingCritical.mission.roles.investigators;
  assert.throws(() => validateMissionState(missingCritical), /战役存档/);
});

test("fixture: A7 assault losses remain recoverable through real production, muster and teleport commands", () => {
  const game = make("a7");
  for (const vehicle of role(game, "assaultVehicles"))
    game.damage(vehicle, vehicle.maxHp * 2, role(game, "squad")[0]);
  game.step(0.1);
  assert.equal(
    game.state.status,
    "playing",
    "a working base must allow the approved replenishment path",
  );
  const existing = new Set(game.state.entities.map((entity) => entity.id));
  const factory = role(game, "homeFactory")[0];
  assert.ok(
    game.command({ type: "train", unit: "tank", buildingId: factory.id }).ok,
  );
  assert.ok(
    game.command({ type: "train", unit: "tank", buildingId: factory.id }).ok,
  );
  const replacements = () =>
    game.state.entities.filter(
      (entity) =>
        !existing.has(entity.id) &&
        entity.owner === 0 &&
        entity.type === "tank" &&
        living(entity),
    );
  until(game, () => replacements().length >= 2, 90);
  const replacementIds = replacements().map((entity) => entity.id);
  game.command({ type: "move", ids: replacementIds, x: 23, y: 27 });
  until(game, () => game.state.mission.flags.chronoTransferred, 90);
  assert.ok(
    replacementIds.every((id) =>
      game.state.mission.roles.assaultVehicles.includes(id),
    ),
  );
  assert.ok(
    replacementIds.every((id) =>
      game.state.mission.flags.chronoVehicleIds.includes(id),
    ),
  );
});

test("C4 evacuation vehicles start outside the transit objective so phase two requires movement", () => {
  const game = make("c4"),
    zone = MISSION_SCENARIOS.c4.zones.route;
  assert.ok(
    role(game, "evacuees").every(
      (entity) =>
        Math.hypot(entity.x - zone.x, entity.y - zone.y) > zone.radius,
    ),
  );
});
