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
import { findZone, finishedZone } from "app/src-electron/log-parser/zones";


export const addUndefined = (one: number | undefined, two: number | undefined) =>
  one !== undefined || two !== undefined ? (one ?? 0) + (two ?? 0) : undefined;

export const scaleUndef = (one: number | undefined, duration: number) =>
  one !== undefined ? Math.round(100*one / duration)/100 : undefined;

export const addDamage = (one: Damage, two: Damage): Damage => ({
  dps: one.dps + two.dps,
  stagger: addUndefined(one.stagger, two.stagger),
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
          stagger: v.stagger>0 ? v.stagger: undefined,
          crit: v.isCrit ? v.damage : undefined,
          front: v.isFrontAttack ? v.damage : undefined,
          back: v.isBackAttack ? v.damage : undefined,
          buffedBySupport: v.isBuffedBySupport ? v.damage : undefined,
          debuffedBySupport: v.isDebuffedBySupport ? v.damage : undefined
        });
      }, {dps: 0});
    const duration = (end - start) / 1000;
    if (damage.dps > 0 && duration > 0) {
      sum[skills.id] = {
        dps: Math.round(damage.dps / duration),
        stagger: scaleUndef(damage.stagger, duration),
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
  let allOut: Damage = {dps: 0}
  let allIn: Damage = {dps: 0}
  const result = one.reduce((encounter: EncounterDamage, left) => {
    const out = two.reduce((target: TargetDamage, right) => {
      const output = buildDamageTreeInside(left, right, start, end);
      const input = buildDamageTreeInside(right, left, start, end);
      const res: EntityDamage = {};
      if (Object.keys(output).length > 0) {
        res.out = {
          total: Object.keys(output).reduce((s: Damage, v) => addDamage(s, output[v]), {dps: 0}),
          ...output
        };
      }
      if (Object.keys(input).length > 0) {
        res.in = {
          total: Object.keys(input).reduce((s: Damage, v) => addDamage(s, input[v]), {dps: 0}),
          ...input
        };
      }
      if (Object.keys(res).length > 0) {
        target[right.id] = res;
      }
      return target;
    }, {});
    if (Object.keys(out).length > 0) {
      const totalOut = Object.keys(out).reduce((sum: Damage, v) => addDamage(sum, out[v].out?.total ?? {dps: 0}), {dps: 0});
      const totalIn = Object.keys(out).reduce((sum: Damage, v) => addDamage(sum, out[v].in?.total ?? {dps: 0}), {dps: 0});
      out.totalOut = totalOut.dps > 0 ? totalOut : undefined;
      out.totalIn = totalIn.dps > 0 ? totalIn : undefined;
      allOut = addDamage(allOut, totalOut)
      allIn = addDamage(allIn, totalIn)
      encounter[left.id] = out;
    }
    return encounter;
  }, {});

  if (allOut.dps > 0) {
    result.totalOut = allOut
  }
  if (allIn.dps > 0) {
    result.totalIn = allIn
  }

  return result
}

export interface CreateEncounterProps {
  includeSidereals: boolean
  skipUnknownZones: boolean
  // minIntervalSize: number,
  // maxIntervalCount: number
  meterData: MeterData
  game: Game
  namesToId: (name: string)=>Promise<string>
}

export async function createEncounter(props: CreateEncounterProps ): Promise<Encounter|undefined> {
  const {game, meterData, includeSidereals, namesToId, skipUnknownZones} = props
  const duration = (game.lastCombatPacket - game.fightStartedOn);

  const entities = Array.from(game.entities.values()).filter(e => e.id && e.id !== "");
  const enemies: Entity[] = []
  const players: Entity[] = []
  for (const e of entities) {
    if (e.isPlayer) {
      players.push({
        ...e,
        id: await namesToId(e.name)
      })
    } else {
      const npc = meterData.npc.get(e.npcId);
      if (npc) {
        if( includeSidereals && npc.name.startsWith("투명") ) {
          players.push(e)
        } else if (["boss", "raid", "epic_raid", "commander"].includes(npc.grade)) {
          enemies.push(e)
        }else {
          enemies.push(e)
        }
      }
    }
  }

  const damage = buildDamageTree(players, enemies, game.fightStartedOn, game.lastCombatPacket);
  const zone = findZone(enemies);
  if( !zone && skipUnknownZones ){
    return undefined
  }
  const finished = zone ? finishedZone(zone, enemies) : false
  return {
    id: randomUUID(),
    zone: zone?.name ?? "unknown",
    startingMs: game.fightStartedOn,
    durationMs: duration,
    wipe: players.every(p => p.npcId || p.isDead),
    finished,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      class: p.class,
      classId: p.classId,
      gearScore: p.gearScore,
      deaths: p.deaths,
      isDead: p.isDead,
      currentHp: p.currentHp,
      maxHp: p.maxHp,
      damageDealt: p.damageDealt,
      damageTaken: p.damageTaken,
      staggerDealt: p.staggerDealt,
      staggerTaken: p.staggerTaken
    })),
    enemies: enemies.map(e => ({
      id: e.id,
      npcId: e.npcId,
      name: e.name,
      deaths: e.deaths,
      isDead: e.isDead,
      currentHp: e.currentHp,
      maxHp: e.maxHp,
      damageDealt: e.damageDealt,
      damageTaken: e.damageTaken,
      staggerDealt: e.staggerDealt,
      staggerTaken: e.staggerTaken

    })),
    damage,
  };
}
