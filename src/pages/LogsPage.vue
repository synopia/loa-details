<template>
  <q-scroll-area
    ref="scrollArea"
    style="height: calc(100vh - 4px - 32px - 66px)"
  >
    <div class="flex justify-start column">
      <div
        v-if="
          logViewerStore.viewerState === 'loading' ||
          logViewerStore.viewerState === 'no-data'
        "
        class="flex column items-center justify-center spinner"
      >
        <img
          v-if="logViewerStore.viewerState === 'loading'"
          class="loader-img"
          :src="loaderImg"
        />

        <span>
          {{
            logViewerStore.viewerState === "loading"
              ? "Parsing logs"
              : "No data found"
          }}
        </span>

        <q-btn
          v-if="logViewerStore.viewerState === 'no-data'"
          style="margin-top: 8px"
          unelevated
          color="primary"
          label="Refresh"
          @click="getLogfiles"
        />

        <div v-if="isReceivingParserStatus" style="text-align: center">
          <q-linear-progress
            :value="parserStatus.completedJobs / parserStatus.totalJobs"
            class="q-mt-md"
            style="width: 128px"
          />
          <div style="margin-top: 8px">
            {{ parserStatus.completedJobs }} / {{ parserStatus.totalJobs }}
          </div>
        </div>
      </div>

      <div v-else class="logs-page">
        <div class="flex logs-top-bar">
          <q-btn
            v-if="logViewerStore.viewerState === 'viewing-encounter'"
            icon="arrow_back"
            unelevated
            color="primary"
            label="BACK"
            @click="changeLogViewerStoreState('none')"
          />

          <q-select
            v-if="logViewerStore.viewerState === 'none'"
            filled
            v-model="logViewerStore.encounterFilter"
            @update:model-value="computedLogFileList()"
            multiple
            clearable
            :options="logViewerStore.encounterOptions"
            label="Filter encounters"
            style="width: 256px"
          />

          <q-space />

          <div v-if="logViewerStore.viewerState === 'none'">
            <q-btn
              unelevated
              color="primary"
              label="Open Folder"
              @click="openLogDirectory"
            />
            <q-btn
              style="margin-left: 16px"
              unelevated
              color="red"
              label="Wipe Parsed Log Cache"
              @click="wipeParsedLogs"
            />
            <q-btn
              style="margin-left: 16px"
              unelevated
              color="primary"
              label="Refresh"
              @click="getLogfiles"
            />
          </div>

          <q-btn-dropdown
            v-else-if="logViewerStore.viewerState === 'viewing-encounter'"
            split
            unelevated
            icon="screenshot_monitor"
            color="primary"
            label="Screenshot Log"
            @click="$refs.logView.takeScreenshot()"
            style="margin-left: auto"
          >
            <q-list>
              <q-item
                clickable
                v-close-popup
                @click="$refs.logView.takeScreenshot((hideNames = false))"
              >
                <q-item-section>
                  <q-item-label>Screenshot With Names</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <div v-if="logViewerStore.viewerState === 'none'">
          <q-page-sticky
            position="bottom-left"
            :offset="[32, 32]"
            style="z-index: 1000000"
          >
            <q-btn
              fab
              icon="arrow_back"
              color="primary"
              @click="changeLogViewerStoreState('none')"
            />
          </q-page-sticky>
          <q-timeline dark color="secondary">
            <q-timeline-entry
              v-if="encounterRows.length === 0"
              style="font-size: 24px; font-family: 'questrial'"
            >
              No encounter found based on filter and options.
            </q-timeline-entry>

            <q-timeline-entry
              v-for="encounter in encounterRows"
              :key="encounter.zone?.name"
              :title="
                encounter.zone?.name +
                ' | ' +
                encounter.attempts.length +
                ' attempt(s)'
              "
              :subtitle="
                millisToHourMinuteSeconds(encounter.startingMs) +
                ' - ' +
                millisToHourMinuteSeconds(
                  encounter.startingMs + encounter.durationMs
                )
              "
            >
              <q-scroll-area
                style="width: calc(100vw - 96px - 12px)"
                :style="{ height: encounter.image ? '272px' : '96px' }"
              >
                <div class="row no-wrap">
                  <q-card
                    dark
                    class="my-card q-mr-md"
                    style="width: 256px"
                  >
                    <img v-if="encounter.image" :src="encounter.image" />

                    <q-card-section>
                      <div class="text-subtitle2">DPS</div>
                    </q-card-section>
                  </q-card>
                  <q-card
                    v-for="(attempt, index) in encounter.attempts"
                    :key="attempt.startingMs"
                    dark
                    class="my-card q-mr-md"
                    style="width: 256px"
                    @click="onEncounterClick(attempt)"
                  >
                    <q-card-section>
                      <div class="text-h6">Attempt {{ index + 1 }}</div>
                      <div class="text-subtitle2" style="display: flex;align-items: flex-start" :key="player.name" v-for="(player) in attempt.players"><img width="16" height="16" :src="getClassImage(player.classId)" />{{player.name}}</div>
                    </q-card-section>
                  </q-card>
                </div>
              </q-scroll-area>
            </q-timeline-entry>
          </q-timeline>
        </div>
      </div>

      <div
        v-if="
          logViewerStore.viewerState === 'viewing-encounter'
        "
        class="logs-page"
      >
        <LogView ref="logView" :log-data="logViewerStore.currentEncounter" />
      </div>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import {
  millisToMinutesAndSeconds,
  millisToHourMinuteSeconds, abbreviateNumber
} from "src/util/number-helpers";

import LogView from "src/components/LogView.vue";
import PCData from "app/meter-data/databases/PCData.json";

import { useSettingsStore } from "src/stores/settings";
import { Encounter, useLogViewerStore } from "src/stores/log-viewer";
import { sleep } from "src/util/sleep";

import { encounters } from "src/constants/encounters";

import relativeTime from "dayjs/plugin/relativeTime";
import { ParserStatus } from "app/types";

dayjs.extend(relativeTime);

const settingsStore = useSettingsStore();
const logViewerStore = useLogViewerStore();

const loaderImg = new URL("../assets/images/loader.gif", import.meta.url).href;

const scrollArea = ref(null);

function changeLogViewerStoreState(newState: any) {
  logViewerStore.viewerState = newState;
  if (scrollArea.value) scrollArea.value.setScrollPosition("vertical", 0);
}
function abbrNumber(v) {
  const a = abbreviateNumber(v)
  return `${a[0]}${a[1]}`
}

/*

const sessionPagination = ref({
  sortBy: "desc",
  descending: false,
  page: 1,
  rowsPerPage: 5,
});

function onSessionPagination(newPagination) {
  sessionPagination.value = newPagination;
}
*/

type EncounterRow = Encounter & {
  image: string
  attempts: Encounter[]
}
const encounterRows = ref<EncounterRow[]>([]);

function onEncounterClick(encounter: Encounter) {
  changeLogViewerStoreState("viewing-encounter");

  window.messageApi.send("window-to-main", {
    message: "get-encounter",
    value: encounter.startingMs
  });
}

/* End session table */


function calculateEncounters(encounters: Encounter[]) {
  logViewerStore.resetState();
  logViewerStore.encounters = encounters;
  const rows: EncounterRow[] = [];

  logViewerStore.encounters.forEach((encounter) => {

    // if (
    //   encounter.durationMs <=
    //   settingsStore.settings.logs.minimumEncounterDurationInMinutes *
    //   60 *
    //   1000
    // ) {
    //   return;
    // }

    const players = Array.from(encounter.players).sort((a,b)=>a.name.localeCompare(b.name))

    // const {image} = Object.values(encounters).find((e) => e.encounterNames.includes(encounter.encounterName)) ?? {}
    const image = new URL('../assets/images/encounters/'+encounter.zone?.image, import.meta.url).href
    if (
      rows.length > 0 &&
      rows[rows.length - 1].zone?.id === encounter.zone?.id &&
      rows[rows.length - 1].players.every((v,i)=>v.name===players[i]?.name)
    ) {
      rows[rows.length - 1].durationMs += encounter.durationMs;
      rows[rows.length - 1].attempts.push(encounter);
    } else {
      rows.push({
        ...encounter,
        players,
        image,
        attempts: [encounter]
      });
    }
  });
  logViewerStore.viewerState = encounters.length > 0 ? "none" : "no-data";
  encounterRows.value = rows;
}

function getLogfiles() {
  logViewerStore.resetState();

  window.messageApi.send("window-to-main", {
    message: "parse-logs",
    async: true
  });
}

function openLogDirectory() {
  window.messageApi.send("window-to-main", { message: "open-log-directory" });
}

const isReceivingParserStatus = ref(false);
const parserStatus = ref<ParserStatus>({
  completedJobs: 0,
  totalJobs: 0
});

onMounted(() => {
  getLogfiles();

  window.messageApi.receive("encounters", (value) => {
    console.log("encounters", value);
    isReceivingParserStatus.value = false;
    parserStatus.value = {
      completedJobs: 0,
      totalJobs: 0
    };

    calculateEncounters(value as Encounter[]);
  });

  window.messageApi.receive("encounter", (value) => {
    logViewerStore.currentEncounter = value as Encounter;

  });

  window.messageApi.receive("encounter-options", (value) => {
    console.log("encounter-options", value);

    logViewerStore.encounterOptions = value as string[];
    logViewerStore.encounterOptions.sort();
  });

  window.messageApi.receive("log-parser-status", (value) => {
    const status = value as ParserStatus;
    console.log("status", status);
    isReceivingParserStatus.value = true;
    parserStatus.value = status;

    if (status.completedJobs === status.totalJobs) {
      // window.messageApi.send("window-to-main", {
      //   message: "get-encounter-options",
      //   async: true,
      // });
      window.messageApi.send("window-to-main", {
        message: "get-encounters",
        value: logViewerStore.encounterFilter,
        async: true
      });
    }
  });
});

async function wipeParsedLogs() {
  window.messageApi.send("window-to-main", {
    message: "wipe-parsed-logs"
  });

  await sleep(1000);
  getLogfiles();
}
function getClassImage(classId) {
  if (classId in PCData)
    return new URL(
      `../assets/images/classes/${classId}.png`,
      import.meta.url
    ).href;

  return new URL("../assets/images/classes/101.png", import.meta.url).href;
}
</script>

<style>
.logs-page {
  padding: 16px 32px;
}

.spinner {
  width: 100%;
  height: calc(100vh - 128px);
}

.loader-img {
  width: 128px;
}

.logs-top-bar {
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}
</style>
