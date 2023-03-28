import { DataSnapshot } from "acebase";
import { Entity, Game } from "loa-details-log-parser/data";
import {
  Damage,
  Encounter, EntityDamage,
  SkillDamage,
  TargetDamage, EncounterDamage
} from "app/types";
import log from "electron-log";
import { MeterData } from "meter-core/data";

import { randomUUID } from "crypto";
import { findZone } from "app/src-electron/log-parser/zones";


export const addUndefined = (one: number | undefined, two: number | undefined) =>
  one !== undefined || two !== undefined ? (one ?? 0) + (two ?? 0) : undefined;

export const scaleUndef = (one: number | undefined, duration: number) =>
  one !== undefined ? Math.round(one / duration) : undefined;

export const addDamage = (one: Damage, two: Damage): Damage => ({
  dps: one.dps + two.dps,
  crit: addUndefined(one.crit, two.crit),
  front: addUndefined(one.front, two.front),
  back: addUndefined(one.back, two.back),
  buffedBySupport: addUndefined(one.buffedBySupport, two.buffedBySupport),
  debuffedBySupport: addUndefined(one.debuffedBySupport, two.debuffedBySupport)
});

function buildDamageTreeInside(one: Entity, two: Entity, start: number, end: number) {
  return Array.from(one.skills.values()).reduce((sum: SkillDamage, skills) => {
    const damage = skills.breakdown
      .filter(b => b.timestamp >= start && b.timestamp < end)
      .filter(b => b.targetEntity === two.id)
      .reduce((sum: Damage, v) => {
        return addDamage(sum, {
          dps: v.damage,
          crit: v.isCrit ? v.damage : undefined,
          front: v.isFrontAttack ? v.damage : undefined,
          back: v.isBackAttack ? v.damage : undefined,
          buffedBySupport: v.isBuffedBySupport ? v.damage : undefined,
          debuffedBySupport: v.isDebuffedBySupport ? v.damage : undefined
        });
      }, { dps: 0 });
    const duration = (end - start) / 1000;
    if (damage.dps > 0 && duration > 0) {
      sum[skills.id] = {
        dps: Math.round(damage.dps / duration),
        crit: scaleUndef(damage.crit, duration),
        front: scaleUndef(damage.front, duration),
        back: scaleUndef(damage.back, duration),
        buffedBySupport: scaleUndef(damage.buffedBySupport, duration),
        debuffedBySupport: scaleUndef(damage.debuffedBySupport, duration)
      };
    }
    return sum;
  }, {});
}

function buildDamageTree(one: Entity[], two: Entity[], start: number, end: number) {
  return one.reduce((encounter: EncounterDamage, left) => {
    const out = two.reduce((target: TargetDamage, right) => {
      const output = buildDamageTreeInside(left, right, start, end);
      const input = buildDamageTreeInside(right, left, start, end);
      const res: EntityDamage = {};
      if (Object.keys(output).length > 0) {
        res.out = {
          total: Object.keys(output).reduce((s: Damage, v) => addDamage(s, output[v]), { dps: 0 }),
          ...output
        };
      }
      if (Object.keys(input).length > 0) {
        res.in = {
          total: Object.keys(input).reduce((s: Damage, v) => addDamage(s, input[v]), { dps: 0 }),
          ...input
        };
      }
      if (Object.keys(res).length > 0) {
        target[right.id] = res;
      }
      return target;
    }, {});
    if (Object.keys(out).length > 0) {
      const totalOut = Object.keys(out).reduce((sum: Damage, v) => addDamage(sum, out[v].out?.total ?? { dps: 0 }), { dps: 0 });
      const totalIn = Object.keys(out).reduce((sum: Damage, v) => addDamage(sum, out[v].in?.total ?? { dps: 0 }), { dps: 0 });
      out.totalOut = totalOut.dps > 0 ? totalOut : undefined;
      out.totalIn = totalIn.dps > 0 ? totalIn : undefined;
      encounter[left.id] = out;
    }
    return encounter;
  }, {});
}

export interface CreateEncounterProps {
  minIntervalSize: number,
  maxIntervalCount: number
  minEncounterDuration: number
  meterData: MeterData
}

export function createEncounter(game: Game, props: CreateEncounterProps): Encounter | undefined {
  const { minEncounterDuration = 1000, meterData } = props;
  const duration = (game.lastCombatPacket - game.fightStartedOn);

  if (duration > minEncounterDuration*1000) {
    const entities = Array.from(game.entities.values()).filter(e => e.id && e.id !== "");
    const enemies = entities.filter(e => !e.isPlayer);
    const bosses = enemies.filter(e => {
      const npc = meterData.npc.get(e.npcId);
      return npc && ["boss", "raid", "epic_raid", "commander"].includes(npc.grade);
    });
    const players = entities.filter(e => e.isPlayer);
    const damage = buildDamageTree(players, bosses, game.fightStartedOn, game.lastCombatPacket);

    const zone = findZone(bosses);

    return {
      id: randomUUID(),
      zone,
      startingMs: game.startedOn,
      durationMs: duration,
      wipe: players.every(p => p.isDead),
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        class: p.class,
        classId: p.classId,
        gearScore: p.gearScore,
        deaths: p.deaths,
        isDead: p.isDead
      })),
      enemies: bosses.map(e => ({
        id: e.id,
        npcId: e.npcId,
        name: e.name,
        deaths: e.deaths,
        isDead: e.isDead
      })),
      damage
    };
  }
}
