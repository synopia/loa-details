import { Settings } from "app/src-electron/util/app-settings";
import { ProgressInfo } from "electron-updater";
import { Game } from "loa-details-log-parser";
import { StatusEffectBuffTypeFlags } from "loa-details-log-parser/src/data";
export type MessageEvent =
  | { message: "download-progress"; value: ProgressInfo }
  | {
      message: string;
      value?: unknown;
      async?: boolean;
    };
export interface MessageApi {
  send(channel: string, data: MessageEvent): void;
  receive(channel: "on-settings-change", func: (value: Settings) => void): void;
  receive(
    channel: "updater-message",
    func: (eventMessage: MessageEvent) => void
  ): void;
  receive(channel: "on-settings-change", func: (value: Settings) => void): void;
  receive(
    channel: "pcap-on-state-change",
    func: (value: Partial<Game>) => void
  ): void;
  receive(channel: "pcap-on-message", func: (value: string) => void): void;
  receive(
    channel: "uploader-message",
    func: (value: { failed: boolean; message: string }) => void
  ): void;
  receive(channel: string, func: (...args: unknown[]) => void): void;
}

export interface WindowControlApi {
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  hide: () => void;
  setIgnoreMouseEvents: (
    ignore: boolean,
    options: Electron.IgnoreMouseEventsOptions
  ) => void;
}
declare global {
  interface Window {
    messageApi: MessageApi;
    windowControlApi: WindowControlApi;
  }
}

export interface ParserStatus {
  completedJobs: number
  totalJobs: number
}
export interface DamageSummary {
  damageDealt: number;
  damageDealtDebuffedBySupport: number;
  damageDealtBuffedBySupport: number;
  damageDealtDebuffedBy: {[id:number]: number};
  damageDealtBuffedBy: {[id:number]: number};
}
export interface HitSummary {
  casts: number;
  total: number;
  crit: number;
  backAttack: number;
  frontAttack: number;
  counter: number;
  hitsDebuffedBySupport: number;
  hitsBuffedBySupport: number;
}
export interface Player {
  name: string
  class: string
  classId: number
  gearScore: number
}
export interface SkillBreakdown {
  timestamp: number;
  damage: number;
  targetEntity: string;
  isCrit: boolean;
  isBackAttack: boolean;
  isFrontAttack: boolean;
  isBuffedBySupport: boolean;
  isDebuffedBySupport: boolean;

}
export interface PlayerSkill {
  [id: number]: {
    name: string
    damage: DamageSummary,
    hits: HitSummary,
    breakdown?: SkillBreakdown[]
  }
}
export interface PlayerState {
  damage: DamageSummary
  hits: HitSummary,

  deaths: number
  isDead: boolean
  deathTime: number

  skills: PlayerSkill
}
export enum StatusEffectTarget {
  OTHER,
  PARTY,
  SELF,
}
export interface StatusEffect {
  target: StatusEffectTarget;
  category: "buff" | "debuff";
  buffcategory: string; //buffshowprioritycategory
  bufftype: number;
  uniquegroup: number;

}
export interface Encounter {
  id: string
  encounterName: string
  encounterImage?: string
  startingMs: number
  durationMs: number
  wipe: boolean
  encounterBars: number

  players: Player[]

  debuffs: {[id: number]: StatusEffect};
  buffs: {[id: number]: StatusEffect};
  damage: DamageSummary
  hits: HitSummary

  playerState: {
    [name: string]: PlayerState
  }
}
