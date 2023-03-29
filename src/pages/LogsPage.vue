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
            v-model="encounterFilter"
            @update:model-value="computedLogFileList()"
            multiple
            clearable
            :options="encounterOptions"
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
              v-if="logViewerStore.encounterRows.length === 0"
              style="font-size: 24px; font-family: 'questrial'"
            >
              No encounter found based on filter and options.
            </q-timeline-entry>
            <q-infinite-scroll @load="onLoad" :offset="250">
            <q-timeline-entry
              v-for="encounterRow in logViewerStore.encounterRows"
              :key="encounterRow.index"
              :title="
                encounterRow.raid +
                ' | ' +
                encounterRow.attempts.length +
                ' attempt(s)'
              "
              :subtitle="
                new Date(encounterRow.startingMs).toISOString()+
                // millisToHourMinuteSeconds(encounterRow.startingMs) +
                ' - ' +
                new Date(encounterRow.startingMs+encounterRow.durationMs).toISOString()
                // millisToHourMinuteSeconds(
                //   encounterRow.startingMs + encounterRow.durationMs
                // )
              "
            >
              <q-scroll-area
                style="width: calc(100vw - 96px - 12px)"
                :style="{ height: '272px' }"
              >
                <div class="row no-wrap">
                  <q-card
                    dark
                    class="my-card q-mr-md"
                    style="width: 256px"
                  >
                    <img v-if="encounterRow.image" :src="encounterRow.image" />

                    <q-card-section>
                      <div class="text-subtitle2">DPS</div>
                    </q-card-section>
                  </q-card>
                  <q-card
                    v-for="(attempt, index) in encounterRow.attempts"
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
              <template v-slot:loading>
                <div class="row justify-center q-my-md">
                  <q-spinner-dots color="primary" size="40px" />
                </div>
              </template>
            </q-infinite-scroll>
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
import { EncounterSession, ParserStatus } from "app/types";

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

function onEncounterClick(encounter: Encounter) {
  changeLogViewerStoreState("viewing-encounter");

  window.messageApi.send("window-to-main", {
    message: "get-encounter",
    value: encounter.startingMs
  });
}

function calculateEncounters(session: EncounterSession) {
  logViewerStore.resetState();
  const rows = session.rows.map(row=>{
    return {
      ...row,
      image: new URL('../assets/images/encounters/'+row.raid+'.png', import.meta.url).href
    }
  });

  logViewerStore.encounterRows = rows
  logViewerStore.viewerState = rows.length > 0 ? "none" : "no-data";
  logViewerStore.next = session.next
  logViewerStore.lastFetched = rows.length
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
const encounterFilter = ref<string[]|null>(null)
const encounterOptions = ref<string[]|null>(null)
const parserStatus = ref<ParserStatus>({
  completedJobs: 0,
  totalJobs: 0
});
let doneLoading : (()=>void)|undefined = undefined
function onLoad(index:number, done:()=>void) {
  const value = encounterFilter.value ?? []
  console.log(logViewerStore.lastFetched)
  if( logViewerStore.lastFetched===5) {
    doneLoading = done

    window.messageApi.send("window-to-main", {
      message: "get-encounters",
      value: JSON.stringify({ zones: value, start: logViewerStore.next }),
      async: true
    });
  }
}
function computedLogFileList(){
  const value = encounterFilter.value ?? []
  window.messageApi.send("window-to-main", {
    message: "get-encounters",
    value: JSON.stringify({zones: value}),
    async: true
  });
}
onMounted(() => {
  getLogfiles();

  window.messageApi.receive("encounters", (value) => {
    const session = value as EncounterSession
    if( !doneLoading ) {
      isReceivingParserStatus.value = false;
      parserStatus.value = {
        completedJobs: 0,
        totalJobs: 0
      };

      calculateEncounters(session);
    } else {
      logViewerStore.next = session.next
      logViewerStore.lastFetched = session.rows.length
      logViewerStore.encounterRows.push(...session.rows)
      doneLoading()
      doneLoading = undefined
    }
  });

  window.messageApi.receive("encounter", (value) => {
    logViewerStore.currentEncounter = value as Encounter;
  });

  window.messageApi.receive("encounter-options", (value) => {
    encounterFilter.value = []
    encounterOptions.value = value as string[]
    encounterOptions.value.sort();
  });

  window.messageApi.receive("log-parser-status", (value) => {
    const status = value as ParserStatus;
    isReceivingParserStatus.value = true;
    parserStatus.value = status;

    if (status.completedJobs === status.totalJobs) {
      window.messageApi.send("window-to-main", {
        message: "get-encounter-options",
        async: true,
      });
      const value = encounterFilter.value ?? []
      window.messageApi.send("window-to-main", {
        message: "get-encounters",
        value: JSON.stringify({zones: value}),
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
