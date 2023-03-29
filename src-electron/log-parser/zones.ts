import { Entity } from "loa-details-log-parser/data";
import { Zone } from "app/types";


const zones : Zone[] = [
  {
    name: "Argos P1",
    image: "argos.png",
    enemies: [
      634000
    ],
  },
  {
    name: "Argos P2",
    image: "argos.png",
    enemies: [
      634010
    ],
  },
  {
    name: "Argos P3",
    image: "argos.png",
    enemies: [
      634020
    ],
  },
  {
    name: "Airas Oculus (NM)",
    enemies: [
      494206, 494207
    ],
  },
  {
    name: "Airas Oculus (HM)",
    enemies: [
      494209, 494210
    ],
  },
  {
    name: "Oreha Prevaza (NM)",
    enemies: [
      494407, 494408
    ],
  },
  {
    name: "Oreha Prevaza (HM)",
    enemies: [
      494415, 494416
    ],
  },
  {
    name: "Valtan G0",
    image: "valtan.png",
    enemies: [
      480001, 480002, 480012, 480013
    ],
  },
  {
    name: "Valtan G1",
    image: "valtan.png",
    enemies: [
      480005, 480006, 480009
    ],
    finished: (enemies)=>enemies.get(480009)===1
  },
  {
    name: "Valtan G2",
    image: "valtan.png",
    enemies: [
      42060070, 42060000, 42063041
    ],
    finished: (enemies)=>enemies.get(42063041)===2&&enemies.get(42060070)===1
  },
  {
    name: "Vykas G0",
    image: "vykas.png",
    enemies: [
      480202, 480201, 480203, 480205, 480206, 480207, 480204
    ],
  },
  {
    name: "Vykas G1",
    image: "vykas.png",
    enemies: [
      480208, 480209
    ],
    finished:(enemies)=>enemies.get(480208)===1 && enemies.get(480209)===1
  },
  {
    name: "Vykas G2",
    image: "vykas.png",
    enemies: [
      480210
    ],
    finished:(enemies)=>enemies.get(480210)===1
  },
  {
    name: "Vykas G3",
    image: "vykas.png",
    enemies: [
      480211
    ],
    finished:(enemies)=>enemies.get(480211)===1
  },
  {
    name: "Kakul-Saydon G0",
    image: "Kakul-Saydon.png",
    enemies: [
      480601
    ],
    finished:()=>true
  },
  {
    name: "Kakul-Saydon G1",
    image: "Kakul-Saydon.png",
    enemies: [
      480691
    ],
    finished: (enemies)=>enemies.get(480691)===1
  },
  {
    name: "Kakul-Saydon G2",
    image: "Kakul-Saydon.png",
    enemies: [
      480696, 480621,480611
    ],
    finished: (enemies)=>enemies.get(480611)===1
  },
  {
    name: "Kakul-Saydon G3",
    image: "Kakul-Saydon.png",
    enemies: [
      480631, 480635
    ],
  },
  {
    name: "Brelshaza G0",
    image: "Brelshaza.png",
    enemies: [
      480815
    ],
    finished: (enemies)=>enemies.get(480815)===1

  },
  {
    name: "Brelshaza G1",
    image: "Brelshaza.png",
    enemies: [
      480805, 480874, 480875, 480876, 480806, 480807, 480877, 480878, 480803, 480804, 480802
    ],
    finished: (enemies)=>enemies.get(480802)===1

  },
  {
    name: "Brelshaza G2",
    image: "Brelshaza.png",
    enemies: [
      480808, 480809, 4221692, 422361508, 422362404
    ],
    finished: (enemies)=>(enemies.get("Prokel's Spiritual Echo")??0)>0 &&
      (enemies.get(480808)??1)===1

  },
  {
    name: "Brelshaza G3",
    image: "Brelshaza.png",
    enemies: [
      480810
    ],
  },
  {
    name: "Brelshaza G4",
    image: "Brelshaza.png",
    enemies: [
      480811
    ],
  },
  {
    name: "Brelshaza G5",
    image: "Brelshaza.png",
    enemies: [
      480813
    ],
  },
  {
    name: "Brelshaza G6",
    image: "Brelshaza.png",
    enemies: [
      480814
    ],
  },
  {
    name: "Vertus",
    image: "vertus.png",
    enemies: [509006, 512015, 620010, 622080, 630210, 632910, 633410, 634140]
  },
  {
    name: "Dark Legoros",
    image: "dark_legoros.png",
    enemies: [512002, 620050, 620051, 620052, 622040, 622110, 624020, 630530, 630810, 632730, 633720],
  },
  {
    name: "Lumerus",
    image: "lumerus.png",
    enemies:  [512004, 512014, 620210, 622010, 624010, 632830, 633230, 633620, 720011],
  },
  {
    name: "Ur'nil",
    image: "urnil.png",
    enemies:  [512006, 512013, 620200, 622020, 632630, 633820],
  },
  {
    name: "Icy Legoros",
    image: "icy_legoros.png",
    enemies:  [512017, 620060, 620061, 622030, 622100, 624021, 630820, 632930, 633430, 633630],
  },
  {
    name: "Icy Legoros+",
    image: "icy_legoros.png",
    enemies:  [512008, 634130],
  },
  {
    name: "Dark Legoros+",
    image: "dark_legoros.png",
    enemies:  [512009, 634190],
  },
  {
    name: "Lumerus+",
    image: "lumerus.png",
    enemies:  [512011, 634120],
  },
  {
    name: "Ur'nil+",
    image: "urnil.png",
    enemies:  [512012, 634110],
  },
  {
    name: "Frost Helgaia",
    image: "frost_helgaia.png",
    enemies: [512016, 620040, 622160, 630110, 630830, 632810, 633210, 633610, 634220],
  },
  {
    name: "Flame Fox Yoho",
    image: "flame_fox_yoho.png",
    enemies:[512019, 620190, 622150, 630320, 631820, 632710, 633520, 634170],
  },
  {
    name: "Helgaia",
    image: "helgaia.png",
    enemies:[512020, 620020, 622070, 630310, 630510, 631830, 633530, 634200],
  },
  {
    name: "Chromanium",
    image: "chromanium.png",
    enemies:[512022, 620030, 622050, 630330, 630930, 633330, 634150],
  },
  {
    name: "Nacrasena",
    image: "nacrasena.png",
    enemies:[512023, 620070, 620071, 622060, 630520, 630920, 632620, 633320, 634160],
  },
  {
    name: "Tytalos",
    image: "tytalos.png",
    enemies:[512025, 620150, 622170, 630610, 633840, 634180],
  },
  {
    name: "Night Fox Yoho",
    image: "night_fox_yoho.png",
    enemies:[512027, 620180, 622200, 630020, 633710, 634210],
  },
  {
    name: "Deskaluda",
    image: "deskaluda.png",
    enemies: [593007, 593017, 620260],
  },
  {
    name: "Levanos",
    image: "levanos.png",
    enemies:  [620080, 622090, 630420, 630910, 632720, 633310, 634240],
  },
  {
    name: "Armored Nacrasena",
    image: "armored_nacrasena.png",
    enemies:[620100, 622140, 630220, 632820, 633220, 633730, 634250],
  },
  {
    name: "Lava Chromanium",
    image: "lava_chromanium.png",
    enemies:[620110, 622130, 630620, 631810, 632610, 633510, 634230],
  },
  {
    name: "Achates",
    image: "achates.png",
    enemies: [620140, 620145, 620146, 624140],
  },
  {
    name: "Caliligos",
    image: "Caliligos.png",
    enemies: [620160, 620250, 620270, 622210, 630030],
  },
  {
    name: "Calventus",
    image: "calventus.png",
    enemies: [620170, 622120, 623070, 630120, 630410, 632920, 633420, 633830],
  },
  {
    name: "Velganos",
    image: "velganos.png",
    enemies:  [620220, 622190, 623031, 624030, 633810],
  },
  {
    name: "Igrexion",
    image: "igrexion.png",
    enemies:  [620230, 620237, 620238],
  },
  {
    name: "Alberhastic",
    image: "alberhastic.png",
    enemies:  [620240, 620241, 620242],
  },
  {
    name: "Kungelanium",
    image: "kungelanium.png",
    enemies:  [620290, 620295],
  },

]

export function finishedZone(zone: Zone, enemy: Entity[]): boolean {
  if( zone.finished ) {
    const deadIds:[number|string, number][] = enemy.map(e=>[e.npcId, e.deaths])
    const names:[number|string, number][] = enemy.map(e=>[e.name, e.deaths])
    return zone.finished(new Map(deadIds.concat(names)))
  }
  return !!zone.enemies.find(e=>enemy.find(i=>i.npcId===e)?.isDead ?? false)
}

export function findZone(enemy: Entity[]): Zone|undefined {
  const enemies = enemy.map(e=>e.npcId)
  return  zones.find(zone=>zone.enemies.some((v)=>enemies.includes(v)))
}
