import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../../../public/game-arcade/games/republic-frontier/src/engine.js";
import { MAPS, createMap } from "../../../public/game-arcade/games/republic-frontier/src/maps.js";
import { terrainSpeed, edgeConnected } from "../../../public/game-arcade/games/republic-frontier/src/terrain.js";

test("all eight seats retain connected land routes, level base aprons and reachable starter ore on every map", () => {
  for (const seed of [7, 2026, 4271])
    for (const map of MAPS) {
      const game = new Game({ mapId: map.id, players: 8, seed });
      const from = game.state.starts[0];
      const tank = { type: "tank", owner: 0, x: from.x + 0.5, y: from.y + 0.5 };
      for (const [i, p] of game.state.starts.entries()) {
        assert(p.ore, `${map.id}/${seed} seat ${i} has no starter ore`);
        assert(
          game.findPath(tank, p.x + 0.5, p.y + 0.5).length,
          `${map.id}/${seed}: seat 0 cannot reach ${i}`,
        );
        const miner = { type: "miner", owner: i, x: p.x + 0.5, y: p.y + 0.5 };
        assert(
          game.findPath(miner, p.ore.x + 0.5, p.ore.y + 0.5).length,
          `${map.id}/${seed}: ore inaccessible from ${i}`,
        );
      }
      for (const [i] of game.state.starts.entries()) {
        const mcv = game.state.entities.find(
          (e) => e.owner === i && e.type === "mcv",
        );
        assert(
          game.command({ type: "deploy", ids: [mcv.id], owner: i }).ok,
          `${map.id}/${seed}: seat ${i} cannot deploy`,
        );
      }
    }
});
test("map preview topology does not change when increasing players from two to eight", () => {
  for (const map of MAPS) {
    const a = createMap(map.id, 2),
      b = createMap(map.id, 8);
    assert.deepEqual(a.tiles, b.tiles);
    assert.deepEqual(a.props, b.props);
    assert.deepEqual(a.bridges, b.bridges);
  }
});
test("river crossings really require bridges for ground armor; ships can navigate under sea bridges", () => {
  const g = new Game({ mapId: "river" });
  const tank = { type: "tank", owner: 0, x: 35.5, y: 22.5 };
  const route = g.findPath(tank, 54.5, 22.5);
  assert(route.length);
  assert(route.some((p) => g.tile(p.x, p.y).bridge));
  g.state.tiles.forEach((t) => {
    if (t.bridge) {
      t.kind = "water";
      t.bridge = false;
      t.height = 0;
    }
  });
  assert.equal(
    g.findPath(tank, 54.5, 22.5).length,
    0,
    "A base apron accidentally became another river crossing",
  );
  const sea = new Game({ mapId: "islands" });
  const ship = { type: "destroyer", owner: 0, x: 48.5, y: 4.5 };
  const voyage = sea.findPath(ship, 48.5, 70.5);
  assert(voyage.length);
  assert(voyage.some((p) => sea.tile(p.x, p.y).bridge));
});
test("armor reaches elevated mines through ramps and cannot cross vertical cliff edges or diagonal corners", () => {
  const g = new Game({ mapId: "highland" });
  const tank = { type: "tank", owner: 0, x: 24.5, y: 24.5 };
  const route = g.findPath(tank, 44.5, 23.5);
  assert(route.length);
  assert(route.some((p) => g.tile(p.x, p.y).ramp));
  assert(!g.canTraverse(40, 18, 40, 19, tank));
  assert(!g.canTraverse(36, 18, 37, 19, tank));
  assert(!edgeConnected({ height: 0 }, { height: 3 }, 1, 0));
});
test("the live movement step applies ice, snow and marsh speed, and pathfinding avoids a slow bog", () => {
  function distance(surface) {
    const g = new Game();
    g.state.entities = [];
    g.state.tiles = g.state.tiles.map(() => ({
      kind: "grass",
      height: 0,
      ore: 0,
      explored: true,
      visible: true,
      surface,
    }));
    const e = g.spawn("tank", 0, 10.5, 10.5);
    for (let i = 0; i < 20; i++) g.moveTowards(e, 30.5, 10.5, 0.01);
    return e.x - 10.5;
  }
  const plain = distance(null),
    ice = distance("ice"),
    snow = distance("snow"),
    marsh = distance("marsh");
  assert(Math.abs(ice / plain - 0.72) < 0.02);
  assert(Math.abs(snow / plain - 0.86) < 0.02);
  assert(Math.abs(marsh / plain - 0.55) < 0.02);
  assert(
    terrainSpeed({ surface: "snow" }, "foot") >
      terrainSpeed({ surface: "snow" }, "tracked"),
  );
  const g = new Game();
  g.state.entities = [];
  g.state.tiles = g.state.tiles.map(() => ({
    kind: "grass",
    height: 0,
    ore: 0,
    explored: true,
    visible: true,
  }));
  for (let y = 9; y <= 11; y++)
    for (let x = 14; x <= 24; x++) g.tile(x, y).surface = "marsh";
  const route = g.findPath(
    { type: "tank", owner: 0, x: 10.5, y: 10.5 },
    29.5,
    10.5,
  );
  assert(route.length);
  assert(route.every((p) => g.tile(p.x, p.y).surface !== "marsh"));
});
test("construction rejects slopes, ice, forest trunks and footprints that straddle a cliff", () => {
  const g = new Game({ mapId: "highland" });
  g.state.entities = [];
  g.state.tiles.forEach((t) => (t.explored = true));
  assert(!g.placement("powerPlant", 40, 18, 0).ok);
  assert(!g.placement("powerPlant", 30, 22, 0).ok);
  for (const surface of ["ice", "marsh"]) {
    g.tile(6, 6).surface = surface;
    assert(!g.placement("powerPlant", 6, 6, 0).ok);
  }
  g.tile(6, 6).surface = null;
  g.tile(6, 6).obstacle = true;
  assert(!g.placement("powerPlant", 6, 6, 0).ok);
});
test("terrain, obstacles, scenery and bridge structure survive complete saves; invalid slopes are rejected", () => {
  const g = new Game({ mapId: "frost", players: 8 });
  const restored = Game.restore(g.serialize());
  assert.deepEqual(restored.state, g.state);
  const bad = g.serialize();
  bad.state.tiles.find((t) => t.ramp).ramp.high = Infinity;
  assert.throws(() => Game.restore(bad), /损坏/);
});
