import test from "node:test";
import assert from "node:assert/strict";
import { artProgress, waitForArt } from "../../../public/game-arcade/games/republic-frontier/src/assets-ready.js";

test("battle readiness requires every sprite and terrain material, not a menu alone", async () => {
  const renderer = {
    atlas: { status: { expected: 84, loaded: 83, failed: [] } },
    terrainAtlas: { status: { expected: 8, loaded: 8, failed: [] } },
  };
  assert.equal(artProgress(renderer).ready, false);
  const events = [];
  const ready = waitForArt(
    renderer,
    (status) => events.push(status.loaded),
    1000,
  );
  setTimeout(() => {
    renderer.atlas.status.loaded = 84;
  }, 5);
  assert.equal((await ready).ready, true);
  assert.equal(events[0], 91);
  assert.equal(events.at(-1), 92);
});

test("missing imagery is an explicit failure instead of silently accepting fallback graphics", async () => {
  const renderer = {
    atlas: { status: { expected: 2, loaded: 1, failed: ["tank"] } },
    terrainAtlas: { status: { expected: 1, loaded: 1, failed: [] } },
  };
  await assert.rejects(waitForArt(renderer), /未能载入/);
});

test("a stalled image request cannot hold the launch forever", async () => {
  const renderer = {
    atlas: { status: { expected: 2, loaded: 1, failed: [] } },
    terrainAtlas: { status: { expected: 1, loaded: 1, failed: [] } },
  };
  await assert.rejects(
    waitForArt(renderer, () => {}, 0),
    /超时/,
  );
});
