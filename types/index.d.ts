import { Settings } from "app/src-electron/util/app-settings";
import { ProgressInfo } from "electron-updater";
import { Game } from "loa-details-log-parser";
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

export type Damage = {
  dps: number,
  crit?: number,
  front?: number,
  back?: number
  buffedBySupport?: number
  debuffedBySupport?: number
}

export type SkillDamage = {
  [id: string]: Damage
} & {
  total?: Damage
}
export type EntityDamage = {
  out?:SkillDamage
  in?:SkillDamage

}
export type TargetDamage = {
  [id: string]: EntityDamage
} & {
  totalOut?: Damage
  totalIn?: Damage
}
export type EncounterDamage = {
  [id:string]:TargetDamage
}

  // damageDealtDebuffedBy: {[id:number]: number};
  // damageDealtBuffedBy: {[id:number]: number};

export interface Zone {
  id: string
  name: string
  image?: string
  enemies: number[]
}

export interface Enemy {
  id: string
  npcId: number
  name: string
  deaths: number
  isDead: boolean
}
export interface Player {
  id: string
  name: string
  class: string
  classId: number
  gearScore: number

  deaths: number
  isDead: boolean
}

export interface Encounter {
  id: string
  zone?: Zone

  startingMs: number
  durationMs: number
  wipe: boolean

  players: Player[]
  enemies: Enemy[]

  damage: EncounterDamage

}
