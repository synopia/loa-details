import { AceBase, DataReference, DataSnapshot } from "acebase";
import { IpcMainEvent } from "electron";
import { MeterData } from "meter-core/data";
import fs, { promises as fsPromises } from "fs";
import { mainFolder, parsedLogFolder } from "app/src-electron/util/directories";
import log from "electron-log";
import path from "path";
import { LogParser } from "loa-details-log-parser";
import { Encounter, EncounterFilter, EncounterRow, EncounterSession } from "app/types";
import { Game } from "loa-details-log-parser/data";
import { createEncounter } from "app/src-electron/log-parser/encounter";
import { randomUUID } from "crypto";

const LOG_PARSER_VERSION = 16;

const db = new AceBase("loa", { logLevel: "warn", storage: { removeVoidProperties: true } });

type FileWorkerOptions = {
  filename: string;
  splitOnPhaseTransition: boolean;
  recordDetailedDamageForEnemies: boolean
  mainFolder: string;
  meterData: MeterData;
};

async function fileParser(options: FileWorkerOptions): Promise<Game[]> {
  try {
    const contents = await fsPromises.readFile(path.join(options.mainFolder, options.filename), "utf-8");
    if (!contents) {
      return [];
    }
    const logParser = new LogParser(options.meterData, false);
    if (options.recordDetailedDamageForEnemies) {
      logParser.recordDetailedDamageForEnemies = true;
    }
    if (options.splitOnPhaseTransition) {
      logParser.splitOnPhaseTransition = true;
    }
    const lines = contents.split("\n").filter((x) => x != null && x != "");
    for (const line of lines) {
      logParser.parseLogLine(line);
    }
    logParser.splitEncounter();

    return logParser.encounters;
  } catch (e) {
    return [];
  }
}

const encounterLogFolder = path.join(mainFolder, "encounter");
if (!fs.existsSync(encounterLogFolder)) {
  fs.mkdirSync(encounterLogFolder);
}

async function parseLogs(
  event: IpcMainEvent,
  splitOnPhaseTransition: boolean,
  meterData: MeterData
) {
  await db.ready();
  await db.schema.set("logStates/$filename", {
    mtime: "Date",
    logParserVersion: "number"
  });
  const unparsedLogs = await fsPromises.readdir(mainFolder);
  let i = 0;
  event.reply("log-parser-status", {
    completedJobs: i,
    totalJobs: unparsedLogs.length
  });

  for await (const filename of unparsedLogs) {
    // Check if filename fits the format "LostArk_2020-01-01-00-00-00.log"
    if (!filename.match(/^LostArk_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}.log$/))
      continue;

    const filenameSlice = filename.slice(0, -4);
    const logStats = await fsPromises.stat(path.join(mainFolder, filename));
    const logState = await db.ref(`logStates/${filenameSlice}`).get();
    if (logState.exists()) {
      const value = logState.val() as { mtime: Date, logParserVersion: number };
      if (
        value.mtime.getTime() < logStats.mtime.getTime() ||
        value.logParserVersion < LOG_PARSER_VERSION
      ) {
        console.info("removing old log", filenameSlice);
        await db.ref(`logStates/${filenameSlice}`).set(null);
      } else {
        console.info("log already parsed and valid, skipping it", filenameSlice);
        continue;
      }
    }

    console.info("parsing log", filenameSlice);
    const result = await fileParser({
      filename,
      splitOnPhaseTransition,
      mainFolder,
      meterData,
      recordDetailedDamageForEnemies: true
    });
    const storeEncounter = async (encounter: Encounter) => {
      const date = new Date(encounter.startingMs);
      const filename = path.join(encounterLogFolder, `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}_${encounter.zone}.json`);
      fs.writeFileSync(filename, JSON.stringify(encounter, (k, v) => v, 2));
      await db.ref(`encounter/${encounter.id}`).set(encounter);

    };
    let lastEncounter: Encounter | undefined = undefined;
    await db.indexes.create("players", "name");
    for await (const game of result) {

      const encounter = await createEncounter({
        meterData,
        game,
        skipUnknownZones: true,
        includeSidereals: false,
        namesToId: async (name) => {
          const res = await db.query("players").filter("name", "==", name).take(1).get();
          const player = res[0]?.val() as { name: string, id: string } | undefined;
          if (player) {
            return player.id;
          }
          const id = randomUUID();
          await db.ref(`players/${id}`).set({ name, id });
          return id;
        }
      });
      if (!encounter) {
        continue;
      }

      if (encounter.durationMs === 0 && lastEncounter) {
        for (const enemy of encounter.enemies) {
          const index = lastEncounter.enemies.findIndex(e => e.id === enemy.id);
          if (index !== -1) {
            const old = lastEncounter.enemies[index];
            lastEncounter.enemies[index] = {
              ...enemy,
              deaths: enemy.deaths + old.deaths,
              damageDealt: enemy.damageDealt + old.damageDealt,
              damageTaken: enemy.damageTaken + old.damageTaken,
              staggerDealt: enemy.staggerDealt + old.staggerDealt,
              staggerTaken: enemy.staggerTaken + old.staggerTaken
            };
          }
        }
      }
      if (lastEncounter) {
        await storeEncounter(lastEncounter);
      }
      if (Object.keys(encounter.damage).length) {
        lastEncounter = encounter;
      } else {
        lastEncounter = undefined;
      }
    }
    if (lastEncounter) {
      await storeEncounter(lastEncounter);
    }

    await db.ref(`logStates/${filenameSlice}`).set({
      mtime: logStats.mtime,
      logParserVersion: LOG_PARSER_VERSION
    });

    i++;
    event.reply("log-parser-status", {
      completedJobs: i,
      totalJobs: unparsedLogs.length
    });

  }
  event.reply("log-parser-status", {
    completedJobs: unparsedLogs.length,
    totalJobs: unparsedLogs.length
  });
}

async function getEncounters(filter: EncounterFilter): Promise<EncounterSession> {
  const {zones, limit=5, start=0} = filter
  const rows: EncounterRow[] = [];
  let row: EncounterRow|undefined = undefined
  let players = ""
  await db.ready();
  await db.indexes.create("encounter", "zone")
  await db.indexes.create("encounter", "startingMs")
  let q = db.query("encounter");
  if (zones && zones.length > 0) {
    q = q.filter("zone", "in", zones);
  }
  let next = start
  await q.sort("startingMs", false)
    .skip(start).take(40).forEach(enc => {
      const game = enc.val() as Encounter;
      next++

      if( row ) {
        const p = game.players.map(p => p.id).join(",")
        if (p === players) {
          row.attempts.push(game)
          row.finished = game.finished
          row.durationMs += game.durationMs
          return true
        } else {
          rows.push(row)
          row = undefined
          players = ""
        }
      }
      if( !row ) {
        row = {
          index: rows.length+1,
          startingMs: game.startingMs,
          durationMs: game.durationMs,
          players: game.players,
          attempts: [game],
          finished: game.finished,
          raid: game.zone,
          image: ""
        }
        players = game.players.map(p => p.id).join(",")
      }

      return rows.length < limit;
    });

  console.log(rows.length, next)
  return {
    rows,
    next,
  };
}

async function getEncounterOptions(): Promise<string[]> {
  const options: string[] = [];
  const encounters = await db.query("encounter").take(50).get({ include: ["zone"] });
  encounters.forEach((e: DataReference | DataSnapshot) => {
    if (e instanceof DataSnapshot) {
      const zone = e.val() as { zone: string };
      if (!options.includes(zone.zone)) {
        options.push(zone.zone);
      }
    }
  });

  return options;
}

export function createAceLogService() {
  return {
    db,
    parseLogs,
    getEncounters,
    getEncounterOptions
  };
}
