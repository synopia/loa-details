import { defineStore } from "pinia";
import type {Encounter} from '../../types/index'

export {Encounter}

export const useLogViewerStore = defineStore("log-viewer", {
  state: () => ({
    viewerState: "loading", // available: loading, no-data, none, viewing-encounter
    currentEncounter: null as Encounter|null,
    encounters: [] as Encounter[],
    encounterOptions: [] as string[],
    encounterFilter: null as string|null,
  }),
  actions: {
    resetState() {
      this.viewerState = "loading";
      this.currentEncounter = null;
      this.encounters = [];
      this.encounterOptions = [];
      this.encounterFilter = null;
    },
  },
});
