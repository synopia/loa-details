import { Entity } from "loa-details-log-parser/data";
import { Zone } from "app/types";


const zones : Zone[] = [
  {
    id: "argos1",
    name: "Argos P1",
    image: "argos.png",
    enemies: [
      634000
    ],
  },
  {
    id: "argos2",
    name: "Argos P2",
    image: "argos.png",
    enemies: [
      634010
    ],
  },
  {
    id: "argos3",
    name: "Argos P3",
    image: "argos.png",
    enemies: [
      634020
    ],
  },
  {
    id: "aira_nm",
    name: "Airas Oculus (NM)",
    enemies: [
      494206, 494207
    ],
  },
  {
    id: "aira_hm",
    name: "Airas Oculus (HM)",
    enemies: [
      494209, 494210
    ],
  },
  {
    id: "oreha_nm",
    name: "Oreha Prevaza (NM)",
    enemies: [
      494407, 494408
    ],
  },
  {
    id: "oreha_hm",
    name: "Oreha Prevaza (HM)",
    enemies: [
      494415, 494416
    ],
  },
  {
    id: "valtan1",
    name: "Valtan G1",
    image: "valtan.png",
    enemies: [
      480005, 480006, 480009, 480010, 480011
    ],
  },
  {
    id: "valtan2",
    name: "Valtan G2",
    image: "valtan.png",
    enemies: [
      480007, 480008, 42060070
    ],
  },
  {
    id: "vykas1",
    name: "Vykas G1",
    image: "vykas.png",
    enemies: [
      480208, 480209
    ],
  },
  {
    id: "vykas2",
    name: "Vykas G2",
    image: "vykas.png",
    enemies: [
      480210
    ],
  },
  {
    id: "vykas3",
    name: "Vykas G3",
    image: "vykas.png",
    enemies: [
      480211
    ],
  },
  {
    id: "kakul1",
    name: "Kakul-Saydon G1",
    image: "Kakul-Saydon.png",
    enemies: [
      480601, 480691
    ],
  },
  {
    id: "kakul2",
    name: "Kakul-Saydon G2",
    image: "Kakul-Saydon.png",
    enemies: [
      480611, 480651, 480696, 480621
    ],
  },
  {
    id: "kakul3",
    name: "Kakul-Saydon G3",
    image: "Kakul-Saydon.png",
    enemies: [
      480631, 480635
    ],
  },
  {
    id: "brel0",
    name: "Brelshaza G0",
    image: "Brelshaza.png",
    enemies: [
      480815
    ],
  },
  {
    id: "brel1",
    name: "Brelshaza G1",
    image: "Brelshaza.png",
    enemies: [
      480805, 480874, 480875, 480876, 480806, 480807, 480877, 480878, 480803, 480804, 480802
    ],
  },
  {
    id: "brel2",
    name: "Brelshaza G2",
    image: "Brelshaza.png",
    enemies: [
      480808, 480809
    ],
  },
  {
    id: "brel3",
    name: "Brelshaza G3",
    image: "Brelshaza.png",
    enemies: [
      480810
    ],
  },
  {
    id: "brel4",
    name: "Brelshaza G4",
    image: "Brelshaza.png",
    enemies: [
      480811
    ],
  },
  {
    id: "brel5",
    name: "Brelshaza G5",
    image: "Brelshaza.png",
    enemies: [
      480813
    ],
  },
  {
    id: "brel6",
    name: "Brelshaza G6",
    image: "Brelshaza.png",
    enemies: [
      480814
    ],
  },
  {
    id: "Vertus",
    name: "Vertus",
    image: "vertus.png",
    enemies: [509006, 512015, 620010, 622080, 630210, 632910, 633410, 634140]
  },
  {
    id: "Dark Legoros",
    name: "Dark Legoros",
    image: "dark_legoros.png",
    enemies: [512002, 620050, 620051, 620052, 622040, 622110, 624020, 630530, 630810, 632730, 633720],
  },
  {
    id: "Lumerus",
    name: "Lumerus",
    image: "lumerus.png",
    enemies:  [512004, 512014, 620210, 622010, 624010, 632830, 633230, 633620, 720011],
  },
  {
    id: "Ur'nil",
    name: "Ur'nil",
    image: "urnil.png",
    enemies:  [512006, 512013, 620200, 622020, 632630, 633820],
  },
  {
    id: "Icy Legoros",
    name: "Icy Legoros",
    image: "icy_legoros.png",
    enemies:  [512017, 620060, 620061, 622030, 622100, 624021, 630820, 632930, 633430, 633630],
  },
  {
    id: "Icy Legoros+",
    name: "Icy Legoros+",
    image: "icy_legoros.png",
    enemies:  [512008, 634130],
  },
  {
    id: "Dark Legoros+",
    name: "Dark Legoros+",
    image: "dark_legoros.png",
    enemies:  [512009, 634190],
  },
  {
    id: "Lumerus+",
    name: "Lumerus+",
    image: "lumerus.png",
    enemies:  [512011, 634120],
  },
  {
    id: "Ur'nil+",
    name: "Ur'nil+",
    image: "urnil.png",
    enemies:  [512012, 634110],
  },
  {
    id: "Frost Helgaia",
    name: "Frost Helgaia",
    image: "frost_helgaia.png",
    enemies: [512016, 620040, 622160, 630110, 630830, 632810, 633210, 633610, 634220],
  },
  {
    id: "Flame Fox Yoho",
    name: "Flame Fox Yoho",
    image: "flame_fox_yoho.png",
    enemies:[512019, 620190, 622150, 630320, 631820, 632710, 633520, 634170],
  },
  {
    id: "Helgaia",
    name: "Helgaia",
    image: "helgaia.png",
    enemies:[512020, 620020, 622070, 630310, 630510, 631830, 633530, 634200],
  },
  {
    id: "Chromanium",
    name: "Chromanium",
    image: "chromanium.png",
    enemies:[512022, 620030, 622050, 630330, 630930, 633330, 634150],
  },
  {
    id: "Nacrasena",
    name: "Nacrasena",
    image: "nacrasena.png",
    enemies:[512023, 620070, 620071, 622060, 630520, 630920, 632620, 633320, 634160],
  },
  {
    id: "Tytalos",
    name: "Tytalos",
    image: "tytalos.png",
    enemies:[512025, 620150, 622170, 630610, 633840, 634180],
  },
  {
    id: "Night Fox Yoho",
    name: "Night Fox Yoho",
    image: "night_fox_yoho.png",
    enemies:[512027, 620180, 622200, 630020, 633710, 634210],
  },
  {
    id: "Deskaluda",
    name: "Deskaluda",
    image: "deskaluda.png",
    enemies: [593007, 593017, 620260],
  },
  {
    id: "Levanos",
    name: "Levanos",
    image: "levanos.png",
    enemies:  [620080, 622090, 630420, 630910, 632720, 633310, 634240],
  },
  {
    id: "Armored Nacrasena",
    name: "Armored Nacrasena",
    image: "armored_nacrasena.png",
    enemies:[620100, 622140, 630220, 632820, 633220, 633730, 634250],
  },
  {
    id: "Lava Chromanium",
    name: "Lava Chromanium",
    image: "lava_chromanium.png",
    enemies:[620110, 622130, 630620, 631810, 632610, 633510, 634230],
  },
  {
    id: "Achates",
    name: "Achates",
    image: "achates.png",
    enemies: [620140, 620145, 620146, 624140],
  },
  {
    id: "Caliligos",
    name: "Caliligos",
    image: "Caliligos.png",
    enemies: [620160, 620250, 620270, 622210, 630030],
  },
  {
    id: "Calventus",
    name: "Calventus",
    image: "calventus.png",
    enemies: [620170, 622120, 623070, 630120, 630410, 632920, 633420, 633830],
  },
  {
    id: "Velganos",
    name: "Velganos",
    image: "velganos.png",
    enemies:  [620220, 622190, 623031, 624030, 633810],
  },
  {
    id: "Igrexion",
    name: "Igrexion",
    image: "igrexion.png",
    enemies:  [620230, 620237, 620238],
  },
  {
    id: "Alberhastic",
    name: "Alberhastic",
    image: "alberhastic.png",
    enemies:  [620240, 620241, 620242],
  },
  {
    id: "Kungelanium",
    name: "Kungelanium",
    image: "kungelanium.png",
    enemies:  [620290, 620295],
  },

]

export function findZone(enemy: Entity[]): Zone|undefined {
  const enemies = enemy.map(e=>e.npcId)
  return  zones.find(zone=>zone.enemies.some((v)=>enemies.includes(v)))
}
