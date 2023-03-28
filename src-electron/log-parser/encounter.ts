import { DataSnapshot } from "acebase";
import { Entity, Game } from "loa-details-log-parser/data";
import { DamageSummary, Encounter, HitSummary, PlayerSkill, PlayerState, StatusEffect } from "app/types";
import log from "electron-log";
import { randomUUID } from "crypto";
import { findZone } from "app/src-electron/log-parser/zones";


export function createEncounter(game: Game, includeBreakdown = false): Encounter | undefined {
  const duration = game.lastCombatPacket - game.fightStartedOn;

  if (duration > 0) {
    let players: Entity[] = [];
    const enemies: Entity[] = [];
    let wipe = true;
    const debuffs: {[id: number]: StatusEffect} = Array.from(game.damageStatistics.debuffs.entries()).reduce((obj, k)=>{
      obj[k[0]] = k[1]
      return obj
    }, {});
    const buffs: {[id: number]: StatusEffect} = Array.from(game.damageStatistics.buffs.entries()).reduce((obj, k)=>{
      obj[k[0]] = k[1]
      return obj
    }, {});
    const damage : DamageSummary = {
      damageDealt: 0,
      damageDealtBuffedBySupport: 0,
      damageDealtDebuffedBySupport: 0,
      damageDealtBuffedBy: {},
      damageDealtDebuffedBy: {}
    }
    const hits: HitSummary = {
      casts: 0,
      total: 0,
      crit: 0,
      backAttack: 0,
      frontAttack: 0,
      counter: 0,
      hitsBuffedBySupport: 0,
      hitsDebuffedBySupport: 0
    }
    game.entities.forEach((entity) => {
      if (!entity.isPlayer) {
        enemies.push(entity);
      }
      if (entity.isPlayer) {
        players.push(entity);
        damage.damageDealt += entity.damageDealt;
        damage.damageDealtDebuffedBySupport += entity.damageDealtDebuffedBySupport
        damage.damageDealtBuffedBySupport += entity.damageDealtBuffedBySupport
        entity.damageDealtDebuffedBy.forEach((k,v)=>{
          damage.damageDealtDebuffedBy[k] = (damage.damageDealtDebuffedBy[k] ?? 0) + v
        })
        entity.damageDealtBuffedBy.forEach((k,v)=>{
          damage.damageDealtBuffedBy[k] = (damage.damageDealtBuffedBy[k]??0) + v
        })

        hits.casts += entity.hits.casts
        hits.total += entity.hits.total
        hits.crit += entity.hits.crit
        hits.backAttack += entity.hits.backAttack
        hits.frontAttack += entity.hits.frontAttack
        hits.counter += entity.hits.counter
        hits.hitsDebuffedBySupport += entity.hits.hitsDebuffedBySupport
        hits.hitsBuffedBySupport += entity.hits.hitsBuffedBySupport
        if (!entity.isDead) {
          wipe = false;
        }
      }
    });

    if (!enemies.length || !players.length) {
      return;
    }
    enemies.sort((a, b) => b.lastUpdate - a.lastUpdate);
    players.sort((a, b) => b.damageDealt - a.damageDealt);

    const zone = findZone(enemies[0]);

    if (zone) {
      const enemyNames = enemies[0].id;
      let encounterBars = enemies[0].currentHp / enemies[0].maxHp * 100;
      encounterBars = encounterBars < 5 ? 0 : encounterBars;
      players = players.filter(p => {
        let hitEnemy = false;
        p.skills.forEach(skill => {
          if (skill.breakdown.find(b => enemyNames === b.targetEntity)) {
            hitEnemy = true;
          }
        });
        return hitEnemy;
      });
      return {
        id: randomUUID().replace("-", ""),
        encounterName: zone.name,
        encounterImage: zone.image,
        encounterBars,
        startingMs: game.startedOn,
        durationMs: duration,
        wipe,
        players: players.map(p => ({
          name: p.name,
          class: p.class,
          classId: p.classId,
          gearScore: p.gearScore
        })),
        playerState: players.reduce((obj: { [name: string]: PlayerState }, p) => {
          obj[p.name] = {
            isDead: p.isDead,
            deaths: p.deaths,
            deathTime: p.deathTime,
            damage: {
              damageDealt: p.damageDealt,
              damageDealtBuffedBySupport: p.damageDealtBuffedBySupport,
              damageDealtDebuffedBySupport: p.damageDealtDebuffedBySupport,
              damageDealtDebuffedBy: Array.from(p.damageDealtDebuffedBy.entries()).reduce((obj:any,entry)=>{
                obj[entry[0]] = entry[1]
                return obj
              }, {}),
              damageDealtBuffedBy: Array.from(p.damageDealtBuffedBy.entries()).reduce((obj:any,entry)=>{
                obj[entry[0]] = entry[1]
                return obj
              }, {}),

            },
            hits: {
              casts: p.hits.casts,
              total: p.hits.total,
              crit: p.hits.crit,
              backAttack: p.hits.backAttack,
              frontAttack: p.hits.frontAttack,
              counter: p.hits.counter,
              hitsDebuffedBySupport: p.hits.hitsDebuffedBySupport,
              hitsBuffedBySupport: p.hits.hitsBuffedBySupport
            },
            skills: Array.from(p.skills.values()).reduce((obj:PlayerSkill, skill)=>{
              obj[skill.id] = {
                name: skill.name,
                damage:{
                  damageDealt: skill.damageDealt,
                  damageDealtDebuffedBySupport: skill.damageDealtDebuffedBySupport,
                  damageDealtBuffedBySupport: skill.damageDealtBuffedBySupport,
                  damageDealtDebuffedBy: Array.from(skill.damageDealtDebuffedBy.entries()).reduce((obj:any,entry)=>{
                    obj[entry[0]] = entry[1]
                    return obj
                  }, {}),
                  damageDealtBuffedBy: Array.from(skill.damageDealtBuffedBy.entries()).reduce((obj:any,entry)=>{
                    obj[entry[0]] = entry[1]
                    return obj
                  }, {}),
                },
                hits: {
                  casts: skill.hits.casts,
                  total: skill.hits.total,
                  crit: skill.hits.crit,
                  backAttack: skill.hits.backAttack,
                  frontAttack: skill.hits.frontAttack,
                  counter: skill.hits.counter,
                  hitsDebuffedBySupport: skill.hits.hitsDebuffedBySupport,
                  hitsBuffedBySupport: skill.hits.hitsBuffedBySupport
                },
                breakdown: includeBreakdown ? skill.breakdown.map(b=>({
                  timestamp: b.timestamp,
                  damage: b.damage,
                  targetEntity: b.targetEntity,
                  isCrit: b.isCrit,
                  isBackAttack: b.isBackAttack,
                  isFrontAttack: b.isFrontAttack,
                  isBuffedBySupport: b.isBuffedBySupport,
                  isDebuffedBySupport: b.isDebuffedBySupport,
                  debuffedBy: b.debuffedBy,
                  buffedBy: b.buffedBy
                })) : undefined
              }
              return obj
            }, {})
          };
          return obj;
        }, {}),
        damage, hits, debuffs, buffs
      };
    }
  }
}
