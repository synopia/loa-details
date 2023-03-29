import { defineStore } from "pinia";
import type { Encounter, EncounterRow } from "../../types/index";

export {Encounter}


export const useLogViewerStore = defineStore("log-viewer", {
  state: () => ({
    viewerState: "loading", // available: loading, no-data, none, viewing-encounter
    currentEncounter: null as Encounter|null,
    encounterRows: [] as EncounterRow[],
    encounterOptions: [] as string[],
    lastFetched: 5,
    next: 0
  }),
  actions: {
    resetState() {
      this.viewerState = "loading";
      this.currentEncounter = null;
      this.encounterRows = [];
      this.encounterOptions = []
      this.lastFetched=5
      this.next = 0
    },
  },
});
