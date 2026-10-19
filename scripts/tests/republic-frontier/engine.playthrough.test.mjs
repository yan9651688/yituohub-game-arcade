/** Ordinary skirmish. The command bot changes the game ONLY through command/step.
 * It knows the chosen map's spawn layout, but attacks explicit entities only after
 * their tiles have been explored. No spawn(), damage(), credits, HP or timer edits. */
import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../../../public/game-arcade/games/republic-frontier/src/engine.js";
import { BUILDINGS, UNITS } from "../../../public/game-arcade/games/republic-frontier/src/data.js";

for (const mapId of (process.env.REPUBLIC_PLAYTHROUGH_MAPS || "frontier").split(
  ",",
))
  test(
    `command-only normal skirmish (${mapId}): deploy, build, mine, train, scout and defeat a live AI`,
    { timeout: 120000 },
    () => {
      const g = new Game({
        mode: "skirmish",
        faction: "china",
        mapId,
        difficulty: "normal",
        players: 2,
        seed: 2026,
        credits: 10000,
      });
      const commandCounts = {},
        transitions = [],
        started = Date.now();
      let nextPlan = 0,
        nextAttack = 155,
        nextDefense = 0,
        lastType = "";
      const rallied = new Set();
      const command = (c) => {
        const r = g.command(c);
        if (r.ok) commandCounts[c.type] = (commandCounts[c.type] || 0) + 1;
        return r.ok;
      };
      const own = () => g.owned(0),
        complete = (t) => own().filter((e) => e.type === t && e.progress >= 1);
      const build = (type) => {
        const anchors = own().filter(
          (e) =>
            e.kind === "building" &&
            e.progress >= 1 &&
            !BUILDINGS[e.type].neutralOnly,
        );
        for (const anchor of anchors) {
          const points = [];
          for (let dy = -10; dy <= 10; dy++)
            for (let dx = -10; dx <= 10; dx++)
              points.push({
                x: Math.floor(anchor.x + dx),
                y: Math.floor(anchor.y + dy),
                distance: BUILDINGS[type].range
                  ? Math.hypot(
                      anchor.x + dx - (g.state.starts[0].x + 5),
                      anchor.y + dy - (g.state.starts[0].y - 5),
                    )
                  : Math.abs(dx) + Math.abs(dy),
              });
          points.sort((a, b) => a.distance - b.distance);
          for (const p of points)
            if (g.canBuild(type, p.x, p.y).ok)
              return command({ type: "build", building: type, x: p.x, y: p.y });
        }
        return false;
      };
      command({
        type: "deploy",
        ids: [own().find((e) => e.type === "mcv").id],
      });
      command({
        type: "move",
        ids: [own().find((e) => e.type === "infantry").id],
        ...g.state.starts[1],
      });
      for (let n = 0; n < 12000 && g.state.status === "playing"; n++) {
        const s = g.state;
        if (s.time >= nextPlan) {
          nextPlan = s.time + 2;
          const list = own(),
            player = s.players[0],
            count = (t) => list.filter((e) => e.type === t).length;
          if (!list.some((e) => e.kind === "building" && e.progress < 1)) {
            let wanted;
            if (!count("powerPlant") || player.power < player.demand + 70)
              wanted = "powerPlant";
            else if (!count("refinery")) wanted = "refinery";
            else if (!count("barracks")) wanted = "barracks";
            else if (!count("warFactory")) wanted = "warFactory";
            else if (count("barracks") < 2) wanted = "barracks";
            else if (count("pillbox") < 2) wanted = "pillbox";
            else if (!count("radar")) wanted = "radar";
            else if (!count("airDefense")) wanted = "airDefense";
            else if (count("defenseTower") < 2) wanted = "defenseTower";
            else if (count("warFactory") < 3) wanted = "warFactory";
            else if (!count("techLab")) wanted = "techLab";
            else if (!count("superweapon")) wanted = "superweapon";
            else if (!count("pillbox")) wanted = "pillbox";
            else if (!count("repairDepot")) wanted = "repairDepot";
            if (wanted && player.credits > BUILDINGS[wanted].cost * 0.8)
              build(wanted);
          }
          for (const factory of list.filter(
            (e) =>
              e.kind === "building" && e.progress >= 1 && e.queue.length < 2,
          )) {
            if (BUILDINGS[factory.type]?.factory && !rallied.has(factory.id)) {
              if (
                command({
                  type: "move",
                  ids: [factory.id],
                  x: s.starts[0].x + 4,
                  y: s.starts[0].y - 4,
                })
              )
                rallied.add(factory.id);
            }
            let unit;
            if (factory.type === "barracks" && count("infantry") < 36)
              unit = "infantry";
            if (factory.type === "warFactory")
              unit =
                count("miner") < 3
                  ? "miner"
                  : count("antiAir") < 2
                    ? "antiAir"
                    : complete("techLab").length && count("tank") >= 5
                      ? count("mammoth") >= 4 && count("antiAir") < 3
                        ? "antiAir"
                        : "mammoth"
                      : count("tank") >= 4 && count("antiAir") < 1
                        ? "antiAir"
                        : "tank";
            if (
              unit &&
              player.credits > g.getDefinition(unit).cost * 0.8 &&
              g.canTrain(unit).ok &&
              list.filter((e) => e.kind === "unit").length < 65
            )
              command({ type: "train", unit, buildingId: factory.id });
          }
          for (const b of list.filter(
            (e) =>
              e.kind === "building" &&
              e.hp < e.maxHp * 0.85 &&
              !e.repairEnabled &&
              player.credits > 500,
          ))
            command({ type: "repair", ids: [b.id] });
          const enemy = s.entities.filter(
            (e) =>
              e.owner === 1 &&
              e.hp > 0 &&
              !e.carrierId &&
              g.tile(e.x, e.y)?.explored,
          );
          const army = list.filter(
            (e) =>
              e.kind === "unit" &&
              !e.carrierId &&
              !["miner", "mcv", "engineer", "spy"].includes(e.type),
          );
          const superweapon = list.find(
            (e) =>
              e.type === "superweapon" &&
              e.charge >= BUILDINGS.superweapon.chargeTime,
          );
          const home = s.starts[0];
          const threats = enemy
            .filter((e) => Math.hypot(e.x - home.x, e.y - home.y) < 19)
            .sort(
              (a, b) =>
                (UNITS[b.type]?.movement === "air") -
                  (UNITS[a.type]?.movement === "air") ||
                Math.hypot(a.x - home.x, a.y - home.y) -
                  Math.hypot(b.x - home.x, b.y - home.y),
            );
          if (
            threats.some((e) => Math.hypot(e.x - home.x, e.y - home.y) < 10) &&
            s.time >= nextDefense
          ) {
            nextDefense = s.time + 6;
            const target = threats[0],
              guards = army.filter(
                (e) =>
                  Math.hypot(e.x - home.x, e.y - home.y) < 24 &&
                  g.canTarget(e, target, false, true),
              );
            if (guards.length)
              command({
                type: "attack",
                ids: guards.map((e) => e.id),
                targetId: target.id,
              });
          }
          if (superweapon) {
            const priorityTarget =
              enemy.find((e) => e.type === "constructionYard") ||
              enemy.find((e) => e.type === "warFactory") ||
              enemy[0];
            if (priorityTarget)
              command({
                type: "superweapon",
                id: superweapon.id,
                x:
                  priorityTarget.x +
                  (BUILDINGS[priorityTarget.type]?.w || 0) / 2,
                y:
                  priorityTarget.y +
                  (BUILDINGS[priorityTarget.type]?.h || 0) / 2,
              });
          }
          if (
            s.time >= nextAttack &&
            !threats.length &&
            army.length &&
            ((army.length >= 8 &&
              (count("tank") >= 4 || count("mammoth") >= 2 || s.time > 450)) ||
              (s.time > 500 && enemy.length <= 3))
          ) {
            nextAttack = s.time + 14;
            const priority = (e) =>
              e.type === "constructionYard"
                ? 0
                : e.type === "warFactory"
                  ? 1
                  : e.type === "superweapon"
                    ? 2
                    : e.type === "barracks"
                      ? 3
                      : e.kind === "building"
                        ? 4
                        : 5;
            const target = enemy.sort(
              (a, b) => priority(a) - priority(b) || a.hp - b.hp,
            )[0];
            if (target) {
              const capable = army.filter((e) =>
                g.canTarget(e, target, false, true),
              );
              if (capable.length) {
                const point = {
                  x: target.x + (BUILDINGS[target.type]?.w || 0) / 2,
                  y: target.y + (BUILDINGS[target.type]?.h || 0) / 2,
                };
                // Cross bridges and forest corridors with weapons free. A direct
                // attack on a distant building ignores enemies ambushing the column.
                if (
                  target.kind === "building" &&
                  capable.some(
                    (e) => Math.hypot(e.x - point.x, e.y - point.y) > 10,
                  )
                )
                  command({
                    type: "attackMove",
                    ids: capable.map((e) => e.id),
                    ...point,
                  });
                else
                  command({
                    type: "attack",
                    ids: capable.map((e) => e.id),
                    targetId: target.id,
                  });
              }
            } else {
              const destination = s.starts[1];
              command({
                type: "attackMove",
                ids: army.map((e) => e.id),
                x: destination.x,
                y: destination.y,
              });
            }
          }
          const stage = `${count("warFactory")}/${count("mammoth")}/${s.players[1].lost}`;
          if (stage !== lastType && transitions.length < 30) {
            transitions.push({
              time: Math.round(s.time),
              factories: count("warFactory"),
              mammoths: count("mammoth"),
              enemyLosses: s.players[1].lost,
            });
            lastType = stage;
          }
        }
        g.step(0.1);
        if (n % 1200 === 1199)
          console.log(
            "SKIRMISH_PROGRESS",
            JSON.stringify({
              time: Math.round(s.time),
              wallMs: Date.now() - started,
              human: own().length,
              enemy: g.owned(1).length,
              credits: Math.round(s.players[0].credits),
              buildings: own()
                .filter((e) => e.kind === "building")
                .map((e) => e.type),
              enemyLost: s.players[1].lost,
            }),
          );
        if (Date.now() - started > 110000) break;
      }
      const report = {
        mode: g.state.status,
        mapId,
        simulationSeconds: Math.round(g.state.time),
        wallMs: Date.now() - started,
        commandCounts,
        human: {
          mined: Math.round(g.state.players[0].income),
          spent: Math.round(g.state.players[0].spent),
          kills: g.state.players[0].kills,
          lost: g.state.players[0].lost,
        },
        ai: {
          mined: Math.round(g.state.players[1].income),
          spent: Math.round(g.state.players[1].spent),
          kills: g.state.players[1].kills,
          lost: g.state.players[1].lost,
        },
        remainingEnemy: g.owned(1).map((e) => ({
          type: e.type,
          x: +e.x.toFixed(1),
          y: +e.y.toFixed(1),
          hp: Math.round(e.hp),
        })),
        transitions,
      };
      console.log("COMMAND_ONLY_SKIRMISH", JSON.stringify(report));
      assert.equal(
        g.state.status,
        "won",
        "ordinary command-only skirmish must finish in victory",
      );
      assert.ok(
        report.human.mined > 0 && report.ai.mined > 0 && report.ai.spent > 0,
      );
      assert.ok(
        commandCounts.build >= 7 &&
          commandCounts.train >= 10 &&
          commandCounts.attack > 0,
      );
    },
  );
