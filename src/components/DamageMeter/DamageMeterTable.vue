<template>
  <div class="damage-meter-table-wrapper" :style="wrapperStyle">
    <table class="damage-meter-table">
      <thead>
        <q-menu touch-position context-menu>
          <q-list dense style="min-width: 100px">
            <q-item
              v-for="tabName in Object.keys(
                settingsStore.settings.damageMeter.tabs
              )"
              :key="tabName"
              clickable
              @click="toggleTabDisplay(tabName)"
            >
              <q-item-section side>
                <q-icon
                  v-if="
                    settingsStore.settings.damageMeter.tabs[tabName].enabled
                  "
                  name="check"
                />
                <q-icon v-else name="close" />
              </q-item-section>
              <q-item-section>
                {{ settingsStore.settings.damageMeter.tabs[tabName].name }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <tr v-if="focusedPlayer === '#'">
          <th style="width: 26px"></th>
          <th style="width: 100%"></th>
          <template
            v-if="['dmg', 'tank', 'heal', 'shield'].includes(damageType)"
          >
            <th
              v-if="settingsStore.settings.damageMeter.tabs.deathTime.enabled"
              style="width: 48px"
            >
              Dead for
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
              style="width: 72px"
            >
              {{
                damageType === "dmg"
                  ? "Damage"
                  : damageType === "tank"
                  ? "Tanked"
                  : damageType === "heal"
                  ? "Healed"
                  : damageType === "shield"
                  ? "Shielded"
                  : ""
              }}
            </th>
            <th
              v-if="
                settingsStore.settings.damageMeter.tabs.damagePercent.enabled
              "
              style="width: 48px"
            >
              {{
                damageType === "dmg"
                  ? "D"
                  : damageType === "tank"
                  ? "T"
                  : damageType === "heal"
                  ? "H"
                  : damageType === "shield"
                  ? "S"
                  : ""
              }}%
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
              style="width: 52px"
            >
              {{
                damageType === "dmg"
                  ? "DPS"
                  : damageType === "tank"
                  ? "TPS"
                  : damageType === "heal"
                  ? "HPS"
                  : damageType === "shield"
                  ? "SPS"
                  : ""
              }}
            </th>
          </template>
          <template
            v-else-if="
              [
                'party_buff_dmg',
                'self_buff_dmg',
                'other_buff_dmg',
                'party_buff_hit',
                'self_buff_hit',
                'other_buff_hit',
              ].includes(damageType)
            "
          >
            <th
              v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
              style="width: 72px"
            >
              Damage
            </th>
            <template
              v-if="
                (damageType === 'party_buff_dmg' &&
                  settingsStore.settings.damageMeter.tabs.dPartyBuff.enabled) ||
                (damageType === 'party_buff_hit' &&
                  settingsStore.settings.damageMeter.tabs.hPartyBuff.enabled)
              "
            >
              <th
                v-for="[columnKey, columnData] of sortedBuffs"
                :key="columnKey"
                style="width: 90px; text-align: center"
              >
                <div class="header_text">
                  {{
                    getClassName(
                      columnData.values().next().value.source.skill?.classid
                    )
                  }}
                </div>
                <div class="header_container">
                  <template
                    v-for="[buffId, buffData] of columnData"
                    :key="buffId"
                  >
                    <div>
                      <img
                        class="header_img"
                        :src="getIconPath(buffData.source.icon)"
                      />
                      <BuffHeaderTooltip :buff-id="buffId" :buff="buffData" />
                    </div>
                  </template>
                </div>
              </th>
            </template>

            <template
              v-else-if="
                (damageType === 'self_buff_dmg' &&
                  settingsStore.settings.damageMeter.tabs.dSelfBuff.enabled) ||
                (damageType === 'self_buff_hit' &&
                  settingsStore.settings.damageMeter.tabs.hSelfBuff.enabled)
              "
            >
              <th
                v-for="[columnKey, columnData] of sortedBuffs"
                :key="columnKey"
                style="width: 90px; text-align: center"
              >
                <div class="header_text">
                  {{
                    columnKey.includes("_")
                      ? columnKey.split("_")[1]
                      : columnData.values().next().value.buffcategory
                  }}
                </div>
                <div class="header_container">
                  <template
                    v-for="[buffId, buffData] of columnData"
                    :key="buffId"
                  >
                    <div>
                      <img
                        class="header_img"
                        :src="getIconPath(buffData.source.icon)"
                      />
                      <BuffHeaderTooltip :buff-id="buffId" :buff="buffData" />
                    </div>
                  </template>
                </div>
              </th>
            </template>
            <template
              v-else-if="
                (damageType === 'other_buff_dmg' &&
                  settingsStore.settings.damageMeter.tabs.dOtherBuff.enabled) ||
                (damageType === 'other_buff_hit' &&
                  settingsStore.settings.damageMeter.tabs.dParhOtherBufftyBuff
                    .enabled)
              "
            >
              <th
                v-for="[columnKey, columnData] of sortedBuffs"
                :key="columnKey"
                style="width: 90px; text-align: center"
              >
                <div class="header_text">
                  {{ columnData.values().next().value.source.name }}
                </div>
                <div class="header_container">
                  <template
                    v-for="[buffId, buffData] of columnData"
                    :key="buffId"
                  >
                    <div>
                      <img
                        class="header_img"
                        :src="getIconPath(buffData.source.icon)"
                      />
                      <BuffHeaderTooltip :buff-id="buffId" :buff="buffData" />
                    </div>
                  </template>
                </div>
              </th>
            </template>
          </template>

          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.critRate.enabled
            "
            style="width: 48px"
          >
            CRIT
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.faRate.enabled
            "
            style="width: 48px"
          >
            F.A.
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.baRate.enabled
            "
            style="width: 48px"
          >
            B.A.
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.hBuffedBySup.enabled
            "
            style="width: 52px"
          >
            HBuf%
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.hDebuffedBySup.enabled
            "
            style="width: 52px"
          >
            HDebuf%
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.dBuffedBySup.enabled
            "
            style="width: 52px"
          >
            DBuf%
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.dDebuffedBySup.enabled
            "
            style="width: 52px"
          >
            DDebuf%
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.counterCount.enabled
            "
            style="width: 44px"
          >
            CNTR
          </th>
        </tr>
        <tr v-else-if="focusedPlayer !== '#'">
          <th style="width: 32px"></th>
          <th style="width: 100%"></th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
            style="width: 72px"
          >
            Damage
          </th>
          <template
            v-if="['dmg', 'tank', 'heal', 'shield'].includes(damageType)"
          >
            <th
              v-if="
                settingsStore.settings.damageMeter.tabs.damagePercent.enabled
              "
              style="width: 48px"
            >
              D%
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
              style="width: 52px"
            >
              DPS
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.critRate.enabled"
              style="width: 48px"
            >
              CRIT
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.faRate.enabled"
              style="width: 48px"
            >
              F.A.
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.baRate.enabled"
              style="width: 48px"
            >
              B.A.
            </th>
            <th
              v-if="
                settingsStore.settings.damageMeter.tabs.hBuffedBySup.enabled
              "
              style="width: 52px"
            >
              HBuf%
            </th>
            <th
              v-if="
                settingsStore.settings.damageMeter.tabs.hDebuffedBySup.enabled
              "
              style="width: 52px"
            >
              HDebuf%
            </th>
            <th
              v-if="
                settingsStore.settings.damageMeter.tabs.dBuffedBySup.enabled
              "
              style="width: 52px"
            >
              DBuf%
            </th>
            <th
              v-if="
                settingsStore.settings.damageMeter.tabs.dDebuffedBySup.enabled
              "
              style="width: 52px"
            >
              DDebuf%
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.maxDmg.enabled"
              style="width: 52px"
            >
              MaxDmg
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.avgDmg.enabled"
              style="width: 52px"
            >
              AvgDmg
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.avgCast.enabled"
              style="width: 52px"
            >
              AvgCast
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.totalHits.enabled"
              style="width: 52px"
            >
              TotalHits
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.totalCasts.enabled"
              style="width: 52px"
            >
              TotalCasts
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.hpm.enabled"
              style="width: 52px"
            >
              Hits/m
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.cpm.enabled"
              style="width: 52px"
            >
              Casts/m
            </th>
          </template>
          <template
            v-else-if="
              [
                'party_buff_dmg',
                'self_buff_dmg',
                'other_buff_dmg',
                'party_buff_hit',
                'self_buff_hit',
                'other_buff_hit',
              ].includes(damageType)
            "
          >
            <template
              v-if="
                (damageType === 'party_buff_dmg' &&
                  settingsStore.settings.damageMeter.tabs.dPartyBuff.enabled) ||
                (damageType === 'party_buff_hit' &&
                  settingsStore.settings.damageMeter.tabs.hPartyBuff.enabled)
              "
            >
              <th
                v-for="[columnKey, columnData] of sortedBuffs"
                :key="columnKey"
                style="width: 90px; text-align: center"
              >
                <div class="header_text">
                  {{
                    getClassName(
                      columnData.values().next().value.source.skill?.classid
                    )
                  }}
                </div>
                <div class="header_container">
                  <template
                    v-for="[buffId, buffData] of columnData"
                    :key="buffId"
                  >
                    <div>
                      <img
                        class="header_img"
                        :src="getIconPath(buffData.source.icon)"
                      />
                      <BuffHeaderTooltip :buff-id="buffId" :buff="buffData" />
                    </div>
                  </template>
                </div>
              </th>
            </template>

            <template
              v-else-if="
                (damageType === 'self_buff_dmg' &&
                  settingsStore.settings.damageMeter.tabs.dSelfBuff.enabled) ||
                (damageType === 'self_buff_hit' &&
                  settingsStore.settings.damageMeter.tabs.hSelfBuff.enabled)
              "
            >
              <th
                v-for="[columnKey, columnData] of sortedBuffs"
                :key="columnKey"
                style="width: 90px; text-align: center"
              >
                <div class="header_text">
                  {{ columnData.values().next().value.source.name }}
                </div>
                <div class="header_container">
                  <template
                    v-for="[buffId, buffData] of columnData"
                    :key="buffId"
                  >
                    <div>
                      <img
                        class="header_img"
                        :src="getIconPath(buffData.source.icon)"
                      />
                      <BuffHeaderTooltip :buff-id="buffId" :buff="buffData" />
                    </div>
                  </template>
                </div>
              </th>
            </template>
            <template
              v-else-if="
                (damageType === 'other_buff_dmg' &&
                  settingsStore.settings.damageMeter.tabs.dOtherBuff.enabled) ||
                (damageType === 'other_buff_hit' &&
                  settingsStore.settings.damageMeter.tabs.dParhOtherBufftyBuff
                    .enabled)
              "
            >
              <th
                v-for="[columnKey, columnData] of sortedBuffs"
                :key="columnKey"
                style="width: 90px; text-align: center"
              >
                <div class="header_text">
                  {{ columnData.values().next().value.source.name }}
                </div>
                <div class="header_container">
                  <template
                    v-for="[buffId, buffData] of columnData"
                    :key="buffId"
                  >
                    <div>
                      <img
                        class="header_img"
                        :src="getIconPath(buffData.source.icon)"
                      />
                      <BuffHeaderTooltip :buff-id="buffId" :buff="buffData" />
                    </div>
                  </template>
                </div>
              </th>
            </template>
          </template>
        </tr>
      </thead>
      <tbody
        v-if="
          (focusedPlayer === '#' && sortedEntities) ||
          (focusedPlayer !== '#' && sortedSkills.length === 0)
        "
      >
        <TableEntry
          v-for="player in sortedEntities"
          :key="player.id"
          :player="player"
          :sortedBuffs="sortedBuffs"
          :damage-type="damageType"
          :fight-duration="Math.max(1000, duration)"
          :last-combat-packet="
            sessionState?.lastCombatPacket ? sessionState.lastCombatPacket : 0
          "
          :name-display="nameDisplay"
          :session-state="sessionState"
          @click="focusPlayer(player)"
        />
      </tbody>
      <tbody
        v-else-if="
          focusedPlayer !== '#' && sortedSkills && sortedSkills.length > 0
        "
      >
        <template
          v-if="['self_buff_dmg', 'self_buff_hit'].includes(damageType)"
        >
          <TableEntry
            :player="
              sortedEntities.find((e) => {
                return e.name === focusedPlayer;
              })
            "
            :key="focusedPlayer"
            :sortedBuffs="sortedBuffs"
            :damage-type="damageType"
            :fight-duration="Math.max(1000, duration)"
            :last-combat-packet="
              sessionState?.lastCombatPacket ? sessionState.lastCombatPacket : 0
            "
            :name-display="nameDisplay"
            :session-state="sessionState"
            @click.right="focusedPlayer = '#'"
          />
          <tr class="spacing-row">
            <div></div>
          </tr>
        </template>
        <SkillEntry
          v-for="skill in sortedSkills"
          :key="skill.name"
          :skill="skill"
          :sortedBuffs="sortedBuffs"
          :damage-type="damageType"
          :class-name="focusedPlayerClass"
          :fight-duration="Math.max(1000, duration)"
          :session-state="sessionState"
          @click.right="focusedPlayer = '#'"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
  watch,
  PropType,
  Ref,
  ShallowRef,
  shallowRef,
} from "vue";
import { useSettingsStore } from "src/stores/settings";
import {
  Game,
  Entity,
  EntitySkills,
  Hits,
  StatusEffect,
  StatusEffectTarget,
  StatusEffectBuffTypeFlags,
} from "loa-details-log-parser/data";

import TableEntry from "./TableEntry.vue";
import SkillEntry from "./SkillEntry.vue";
import BuffHeaderTooltip from "./BuffHeaderTooltip.vue";
import {
  getIconPath,
  getClassName,
  EntityExtended,
  EntitySkillsExtended,
  tabNames,
} from "../../util/helpers";

const settingsStore = useSettingsStore();

// TODO: move these to a pinia store
const props = defineProps({
  sessionState: { type: Object as PropType<Game>, required: true },
  damageType: {
    type: String,
    default: "dmg",
  },
  duration: {
    type: Number,
    default: 0,
  },
  wrapperStyle: String,
  nameDisplay: {
    type: String,
    default: "name+class",
  },
});

function toggleTabDisplay(tabName: string) {
  settingsStore.settings.damageMeter.tabs[tabName].enabled =
    !settingsStore.settings.damageMeter.tabs[tabName].enabled;

  settingsStore.saveSettings();
}

watch(props, () => {
  sortEntities();
});
onMounted(() => {
  sortEntities();
});

const focusedPlayer = ref("#");
const focusedPlayerClass = ref("");
function focusPlayer(player: Entity) {
  focusedPlayer.value = player.name;
  focusedPlayerClass.value = player.class;
  calculateSkills();
}
let entitiesCopy: EntityExtended[] = [];

const sortedEntities: ShallowRef<EntityExtended[]> = shallowRef([]);
let sortedSkills: EntitySkillsExtended[] = [];

function sortEntities() {
  if (!props.sessionState) return;
  if (Object.keys(props.sessionState).length <= 0) return;

  //TODO we changed that to not deepclone for performance boost, be carefull not to edit entities below (outside of display-reserved fields)
  entitiesCopy = Array.from(props.sessionState.entities.values());
  const res = entitiesCopy
    .filter((entity) => {
      if (!entity.isPlayer) return false;

      if (props.damageType === "tank" && entity.damageTaken > 0) return true;
      else if (props.damageType === "heal" && entity.healingDone > 0)
        return true;
      else if (props.damageType === "shield" && entity.shieldDone > 0)
        return true;
      else if (/*props.damageType === "dmg" &&*/ entity.damageDealt > 0)
        // default to dmg if not one of the above
        return true;

      return false;
    })
    .sort((a, b) => {
      if (settingsStore.settings.damageMeter.design.pinUserToTop) {
        if (a.name === "You") return -1e69;
        else if (b.name === "You") return 1e69; // nice
      }

      if (props.damageType === "tank") return b.damageTaken - a.damageTaken;
      else if (props.damageType === "heal")
        return b.healingDone - a.healingDone;
      else if (props.damageType === "shield")
        return b.shieldDone - a.shieldDone;
      else return b.damageDealt - a.damageDealt;
    });

  for (const entity of res) {
    entity.damagePercentageTotal = getPercentage(entity, "dmg", "total");
    entity.damagePercentageTop = getPercentage(entity, "dmg", "top");

    entity.tankPercentageTotal = getPercentage(entity, "tank", "total");
    entity.tankPercentageTop = getPercentage(entity, "tank", "top");

    entity.healPercentageTotal = getPercentage(entity, "heal", "total");
    entity.healPercentageTop = getPercentage(entity, "heal", "top");

    entity.shieldPercentageTotal = getPercentage(entity, "shield", "total");
    entity.shieldPercentageTop = getPercentage(entity, "shield", "top");

    let totalHitsWithBa = 0,
      totalHitsWithFa = 0;

    entity.skills.forEach((skill) => {
      if (skill.hits.backAttack / skill.hits.total >= 0.07)
        totalHitsWithBa += skill.hits.total;

      if (skill.hits.frontAttack / skill.hits.total >= 0.07)
        totalHitsWithFa += skill.hits.total;
    });

    entity.hits.totalHitsWithBa = totalHitsWithBa > 0 ? totalHitsWithBa : 1;
    entity.hits.totalHitsWithFa = totalHitsWithFa > 0 ? totalHitsWithFa : 1;
  }

  calculateSkills();
  sortedEntities.value = res;
}

function calculateSkills() {
  sortedSkills = [];
  if (focusedPlayer.value === "#") return;

  const entity = entitiesCopy.find((e) => {
    return e.name === focusedPlayer.value;
  });
  if (!entity) return;

  const res = Array.from(entity.skills.values()).sort(
    (a, b) => b.damageDealt - a.damageDealt
  ) as EntitySkillsExtended[];

  for (const skill of res) {
    skill.damagePercent = (
      (skill.damageDealt / entity.damageDealt) *
      100
    ).toFixed(1);
    skill.relativePercent = (
      (skill.damageDealt / res[0].damageDealt) *
      100
    ).toFixed(1);
  }

  sortedSkills = res;
}

function getPercentage(
  player: Entity,
  dmgType: tabNames,
  relativeTo: "total" | "top"
) {
  if (!props.sessionState) return "0";
  let a = player.damageDealt;
  if (dmgType === "tank") a = player.damageTaken;
  else if (dmgType === "heal") a = player.healingDone;
  else if (dmgType === "shield") a = player.shieldDone;

  let b = 0;
  if (dmgType === "dmg") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topDamageDealt;
    else b = props.sessionState.damageStatistics.totalDamageDealt;
  } else if (dmgType === "tank") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topDamageTaken;
    else b = props.sessionState.damageStatistics.totalDamageTaken;
  } else if (dmgType === "heal") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topHealingDone;
    else b = props.sessionState.damageStatistics.totalHealingDone;
  } else if (dmgType === "shield") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topShieldDone;
    else b = props.sessionState.damageStatistics.totalShieldDone;
  }

  return ((a / b) * 100).toFixed(1);
}
const sortedBuffs = computed(() => {
  //TODO: this is used to update columns when new buffs are tracked, we should only do this every few frames
  // We could also track for difference only & not re-do everything
  if (
    ![
      "party_buff_dmg",
      "self_buff_dmg",
      "other_buff_dmg",
      "party_buff_hit",
      "self_buff_hit",
      "other_buff_hit",
    ].includes(props.damageType)
  ) {
    return new Map();
  }
  //["party_buff_dmg", "party_buff_hit"].includes(damageType)
  //["self_buff_dmg", "self_buff_hit"].includes(damageType)
  //["other_buff_dmg", "other_buff_hit"].includes(damageType)
  const statusEffects: Map<string, Map<number, StatusEffect>> = new Map();
  props.sessionState.damageStatistics.debuffs.forEach((debuff, id) => {
    if (debuff.category === "debuff") {
      filterStatusEffects(
        debuff,
        id,
        props.damageType,
        statusEffects,
        focusedPlayer.value
      );
    }
  });
  props.sessionState.damageStatistics.buffs.forEach((buff, id) => {
    if (buff.category === "buff") {
      filterStatusEffects(
        buff,
        id,
        props.damageType,
        statusEffects,
        focusedPlayer.value
      );
    }
  });
  //sortedBuffs.value = new Map([...statusEffects.entries()].sort());
  return new Map([...statusEffects.entries()].sort());
});
function filterStatusEffects(
  buff: StatusEffect,
  id: number,
  damageType: string,
  statusEffects: Map<string, Map<number, StatusEffect>>,
  focusedPlayer: string
) {
  // Party synergies
  if (
    ["classskill", "identity", "ability"].includes(buff.buffcategory) &&
    buff.target === StatusEffectTarget.PARTY
  ) {
    const key = `${getClassName(buff.source.skill?.classid)}_${
      buff.uniquegroup ? buff.uniquegroup : buff.source.skill?.id
    }`;
    if (["party_buff_dmg", "party_buff_hit"].includes(damageType))
      addStatusEffectIfNeeded(
        statusEffects,
        key,
        id,
        buff,
        focusedPlayer,
        damageType
      );
  }
  // Self synergies
  else if (
    ["pet", "cook", "battleitem", "dropsofether", "bracelet"].includes(
      buff.buffcategory
    )
  ) {
    if (
      ["self_buff_dmg", "self_buff_hit"].includes(damageType) &&
      focusedPlayer === "#"
    ) {
      addStatusEffectIfNeeded(
        statusEffects,
        buff.buffcategory,
        id,
        buff,
        focusedPlayer,
        damageType
      );
    }
  } else if (["set"].includes(buff.buffcategory)) {
    if (
      ["self_buff_dmg", "self_buff_hit"].includes(damageType) &&
      focusedPlayer === "#"
    ) {
      addStatusEffectIfNeeded(
        statusEffects,
        `set_${buff.source.setname}`,
        id,
        buff,
        focusedPlayer,
        damageType
      );
    }
  } else if (
    ["classskill", "identity", "ability"].includes(buff.buffcategory)
  ) {
    // self & other identity, classskill, engravings
    if (
      ["self_buff_dmg", "self_buff_hit"].includes(damageType) &&
      focusedPlayer !== "#"
    ) {
      let key;
      if (buff.buffcategory === "ability") {
        key = `${buff.uniquegroup ? buff.uniquegroup : id}`;
      } else {
        if (
          focusedPlayerClass.value !== getClassName(buff.source.skill?.classid)
        )
          return; // We hide other classes self buffs (classskill & identity)
        key = `${getClassName(buff.source.skill?.classid)}_${
          buff.uniquegroup ? buff.uniquegroup : buff.source.skill?.id
        }`;
      }
      addStatusEffectIfNeeded(
        statusEffects,
        key,
        id,
        buff,
        focusedPlayer,
        damageType
      );
    }
  } else {
    // others
    if (["other_buff_dmg", "other_buff_hit"].includes(damageType)) {
      const key = `${buff.buffcategory}_${
        buff.uniquegroup ? buff.uniquegroup : id
      }`;
      addStatusEffectIfNeeded(
        statusEffects,
        key,
        id,
        buff,
        focusedPlayer,
        damageType
      );
    }
  }
}
function isStatusEffectFiltered(
  damageType: string,
  statusEffect: StatusEffect
) {
  if (!damageType.includes("_")) return false;
  if (
    (settingsStore.settings.damageMeter.buffFilter[damageType.split("_")[0]] &
      StatusEffectBuffTypeFlags.ANY) !==
    0
  )
    return true;
  return (
    (settingsStore.settings.damageMeter.buffFilter[damageType.split("_")[0]] &
      statusEffect.bufftype) !==
    0
  );
}
function addStatusEffectIfNeeded(
  collection: Map<string, Map<number, StatusEffect>>,
  tableKey: string,
  buffId: number,
  statusEffect: StatusEffect,
  focusedPlayer: string,
  damageType: string
) {
  if (!isStatusEffectFiltered(damageType, statusEffect)) {
    return;
  }
  if (focusedPlayer !== "#" && props.sessionState) {
    // Check if the focused user has benifited from that buff
    // We only care about focused players, else we display everything
    const focus = props.sessionState.entities.get(focusedPlayer);
    if (!focus) return;
    // Hide buffs that doesn't benefit focused player
    if (
      !focus.hits.hitsBuffedBy.get(buffId) &&
      !focus.hits.hitsDebuffedBy.get(buffId)
    )
      return;
  }
  // Add status effect to collection
  if (collection.has(tableKey)) {
    collection.get(tableKey)?.set(buffId, statusEffect);
  } else {
    collection.set(tableKey, new Map([[buffId, statusEffect]]));
  }
}
</script>

<style>
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.damage-meter-table-wrapper {
  overflow-y: scroll;
}
.damage-meter-table-wrapper::-webkit-scrollbar {
  display: none;
}
.damage-meter-table {
  font-family: "Segoe UI", "Segoe UI", "sans-serif";
  z-index: 100;
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.damage-meter-table thead {
  position: sticky;
  top: 0;
  background: black;
  z-index: 5000;
}
.damage-meter-table thead tr {
  color: rgb(189, 189, 189);
  font-size: 11px;
}
.damage-meter-table thead tr th {
  vertical-align: middle;
}
.damage-meter-table thead tr th div.header_container {
  display: inline-flex;
}
.damage-meter-table thead tr th div.header_text {
  margin: auto;
  text-transform: capitalize;

  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.damage-meter-table thead tr th img.header_img {
  width: 16px;
  max-width: 100%;
  max-height: 100%;
  display: block;
  margin: 3px;
}
.damage-meter-table tbody tr {
  position: relative;
  height: 28px;
  color: #ffffff;
  font-size: 12px;
  text-shadow: rgb(0, 0, 0) 0px 0px 0.3rem;
}
.damage-meter-table tbody tr.spacing-row {
  height: 5px;
}
.damage-meter-table tbody tr.spacing-row div {
  background: black;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -100;
  height: 100%;
  width: 100%;
}
.damage-meter-table .ex {
  font-size: 10px;
  color: rgb(189, 189, 189);
}
.td-class-img,
.td-skill-img {
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.5),
    rgba(0, 0, 0, 0)
  );
}
.td-class-img img {
  width: 16px;
  margin-left: 4px;
  margin-top: 4px;
}
.td-skill-img img {
  width: 20px;
  margin-left: 6px;
  margin-top: 4px;
}

.player-bar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -100;
  opacity: 0.75;
  height: 100%;
  transition: 100ms;
}

.dmg_full_value {
  position: relative;
  background: #121519;
  font-family: "Segoe UI", "Segoe UI", "sans-serif";
  font-size: 12px;
  text-shadow: rgb(0, 0, 0) 0px 0px 0.3rem;
}
</style>
