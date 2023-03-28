import { AceBase } from "acebase";
import { IpcMainEvent } from "electron";
import { MeterData } from "meter-core/data";
import fs, { promises as fsPromises } from "fs";
import { mainFolder } from "app/src-electron/util/directories";
import log from "electron-log";
import path from "path";
import { LogParser } from "loa-details-log-parser";
import { DamageSummary, Encounter } from "app/types";
import { Game } from "loa-details-log-parser/data";
import { createEncounter } from "app/src-electron/log-parser/encounter";

const LOG_PARSER_VERSION = 16;

const db = new AceBase("loa", { logLevel: "warn", storage: { removeVoidProperties: true } });

type FileWorkerOptions = {
  filename: string;
  splitOnPhaseTransition: boolean;
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
  event.reply("log-parser-status", {
    completedJobs: 0,
    totalJobs: 1
  });
  const unparsedLogs = await fsPromises.readdir(mainFolder);
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
        log.info("removing old log", filenameSlice);
        await db.ref(`logStates/${filenameSlice}`).set(null);
      } else {
        log.info("log already parsed and valid, skipping it", filenameSlice);
        continue;
      }
    }

    log.info("parsing log", filenameSlice);
    const result = await fileParser({
      filename,
      splitOnPhaseTransition,
      mainFolder,
      meterData
    });
    for await (const game of result) {
      const encounter = createEncounter(game)
      if( encounter ) {
        await db.ref(`encounter/${encounter.id}`).set(encounter);
      }
    }
    await db.ref(`logStates/${filenameSlice}`).set({
      mtime: logStats.mtime,
      logParserVersion: LOG_PARSER_VERSION
    });
  }
  event.reply("log-parser-status", {
    completedJobs: 1,
    totalJobs: 1
  });
}

async function getEncounters(filter: string | null): Promise<Encounter[]> {
  const encounters: Encounter[] = [];
  await db.ready();
  await db.query("encounter").take(5).forEach(enc => {
    const game = enc.val() as Encounter;
    encounters.push(game)
  });

  return encounters;
}

async function getEncounterOptions(): Promise<string[]> {
  const options: string[] = [];
  // const games = await db.query("games").get({include: ['currentBoss']})

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
