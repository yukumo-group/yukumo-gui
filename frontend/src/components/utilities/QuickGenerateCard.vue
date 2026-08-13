<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Play, RotateCcw, Save } from '@lucide/vue';
import type { editor as MonacoEditor } from 'monaco-editor';
import { Snackbar } from '@varlet/ui';
import SettingsCard from '../settings/SettingsCard.vue';
import AquesTalk1Form from '../profiles/AquesTalk1Form.vue';
import AquesTalk2Form from '../profiles/AquesTalk2Form.vue';
import AquesTalk10Form from '../profiles/AquesTalk10Form.vue';
import ProfileSelectLabel from '../profiles/ProfileSelectLabel.vue';
import VersionSelectLabel from '../profiles/VersionSelectLabel.vue';
import { createDefaultAquesTalk10 } from '../../composables/aquestalkPresets';
import { characterProfiles } from '../../composables/useCharacterProfiles';
import { resolvedTheme } from '../../theme/theme';
import type {
  AquesTalk1Config,
  AquesTalk10Config,
  AquesTalk2Config,
  AquesTalkVersion,
  CharacterProfile,
} from '../../types/profile';
import {
  createDefaultAquesTalk1,
  createDefaultAquesTalk2,
  supportedVersions,
} from '../../types/profile';

const CUSTOM_PROFILE_ID = '__custom__';

const { t } = useI18n();

const version = ref<AquesTalkVersion>(2);
const profileId = ref(CUSTOM_PROFILE_ID);
const text = ref('');
const at1 = ref<AquesTalk1Config>(createDefaultAquesTalk1());
const at2 = ref<AquesTalk2Config>(createDefaultAquesTalk2());
const at10 = ref<AquesTalk10Config>(createDefaultAquesTalk10());

/** Suppresses profile→custom switch while loading a saved profile into the forms. */
let syncingConfig = false;

const monacoTheme = computed(() =>
  resolvedTheme.value === 'dark' ? 'vs-dark' : 'vs',
);

const compatibleProfiles = computed(() =>
  characterProfiles.value.filter((profile) =>
    supportedVersions(profile).includes(version.value),
  ),
);

const isCustom = computed(() => profileId.value === CUSTOM_PROFILE_ID);

const selectedProfile = computed<CharacterProfile | null>(() => {
  if (profileId.value === CUSTOM_PROFILE_ID) return null;
  return (
    compatibleProfiles.value.find((profile) => profile.id === profileId.value) ??
    null
  );
});

const selectedProfileLabel = computed(() =>
  selectedProfile.value
    ? selectedProfile.value.name
    : t('pages.utilities.quickGenerate.customProfile'),
);

const selectedProfileImage = computed(
  () => selectedProfile.value?.imageDataUrl ?? null,
);

const versionLabelKey: Record<AquesTalkVersion, string> = {
  1: 'pages.utilities.quickGenerate.versions.at1',
  2: 'pages.utilities.quickGenerate.versions.at2',
  10: 'pages.utilities.quickGenerate.versions.at10',
};

const selectedVersionLabel = computed(() => t(versionLabelKey[version.value]));

const canGenerate = computed(() => text.value.trim().length > 0);

const editorOptions: MonacoEditor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'off',
  glyphMargin: false,
  folding: false,
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: 'auto',
    horizontal: 'hidden',
  },
  padding: { top: 12, bottom: 12 },
};

function withConfigSync(fn: () => void): void {
  syncingConfig = true;
  fn();
  void nextTick(() => {
    syncingConfig = false;
  });
}

function resetCustomConfigs(): void {
  withConfigSync(() => {
    at1.value = createDefaultAquesTalk1();
    at2.value = createDefaultAquesTalk2();
    at10.value = createDefaultAquesTalk10();
  });
}

function applyProfileConfig(id: string): void {
  if (id === CUSTOM_PROFILE_ID) return;
  const profile = characterProfiles.value.find((item) => item.id === id);
  if (!profile) return;
  withConfigSync(() => {
    if (profile.aquestalk1) {
      at1.value = { ...profile.aquestalk1 };
    }
    if (profile.aquestalk2) {
      at2.value = { ...profile.aquestalk2 };
    }
    if (profile.aquestalk10) {
      at10.value = { ...profile.aquestalk10 };
    }
  });
}

function markCustomized(): void {
  if (syncingConfig) return;
  if (profileId.value !== CUSTOM_PROFILE_ID) {
    profileId.value = CUSTOM_PROFILE_ID;
  }
}

function onVersionChange(value: string | number): void {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n !== 1 && n !== 2 && n !== 10) return;
  version.value = n;
}

function onProfileChange(value: string | number): void {
  const id = String(value);
  profileId.value = id;
  if (id === CUSTOM_PROFILE_ID) {
    resetCustomConfigs();
    return;
  }
  applyProfileConfig(id);
}

watch(
  [at1, at2, at10],
  () => {
    markCustomized();
  },
  { deep: true },
);

watch(version, () => {
  if (profileId.value === CUSTOM_PROFILE_ID) return;
  const stillCompatible = compatibleProfiles.value.some(
    (profile) => profile.id === profileId.value,
  );
  if (!stillCompatible) {
    profileId.value = CUSTOM_PROFILE_ID;
    resetCustomConfigs();
  } else {
    applyProfileConfig(profileId.value);
  }
});

watch(characterProfiles, () => {
  if (profileId.value === CUSTOM_PROFILE_ID) return;
  const exists = characterProfiles.value.some(
    (profile) => profile.id === profileId.value,
  );
  if (!exists) {
    profileId.value = CUSTOM_PROFILE_ID;
    resetCustomConfigs();
  }
});

function onPreview(): void {
  if (!canGenerate.value) return;
  Snackbar(t('pages.utilities.quickGenerate.pending'));
}

function onSave(): void {
  if (!canGenerate.value) return;
  Snackbar(t('pages.utilities.quickGenerate.pending'));
}

function onReset(): void {
  text.value = '';
  if (isCustom.value) {
    resetCustomConfigs();
  } else {
    applyProfileConfig(profileId.value);
  }
}
</script>

<template>
  <SettingsCard>
    <div class="flex flex-col gap-4 p-4 sm:p-5">
      <header class="flex flex-col gap-1">
        <h2 class="font-bold text-text text-xl">
          {{ t('pages.utilities.quickGenerate.title') }}
        </h2>
        <p class="text-sm text-on-surface-variant">
          {{ t('pages.utilities.quickGenerate.description') }}
        </p>
      </header>

      <div
        class="flex min-h-0 flex-col gap-4 sm:flex-row sm:items-stretch"
      >
        <aside
          class="flex w-full shrink-0 flex-col gap-3 sm:w-72 sm:border-r sm:border-outline/30 sm:pr-4"
          :aria-label="t('pages.utilities.quickGenerate.configAriaLabel')"
        >
          <var-select
            :model-value="version"
            size="small"
            variant="outlined"
            :placeholder="t('pages.utilities.quickGenerate.version')"
            @update:model-value="onVersionChange"
          >
            <template #selected>
              <VersionSelectLabel
                :version="version"
                :label="selectedVersionLabel"
              />
            </template>
            <var-option
              :value="1"
              :label="t('pages.utilities.quickGenerate.versions.at1')"
            >
              <VersionSelectLabel
                :version="1"
                :label="t('pages.utilities.quickGenerate.versions.at1')"
              />
            </var-option>
            <var-option
              :value="2"
              :label="t('pages.utilities.quickGenerate.versions.at2')"
            >
              <VersionSelectLabel
                :version="2"
                :label="t('pages.utilities.quickGenerate.versions.at2')"
              />
            </var-option>
            <var-option
              :value="10"
              :label="t('pages.utilities.quickGenerate.versions.at10')"
            >
              <VersionSelectLabel
                :version="10"
                :label="t('pages.utilities.quickGenerate.versions.at10')"
              />
            </var-option>
          </var-select>

          <var-select
            :model-value="profileId"
            size="small"
            variant="outlined"
            :placeholder="t('pages.utilities.quickGenerate.profile')"
            @update:model-value="onProfileChange"
          >
            <template #selected>
              <ProfileSelectLabel
                :name="selectedProfileLabel"
                :image-data-url="selectedProfileImage"
              />
            </template>
            <var-option
              :value="CUSTOM_PROFILE_ID"
              :label="t('pages.utilities.quickGenerate.customProfile')"
            >
              <ProfileSelectLabel
                :name="t('pages.utilities.quickGenerate.customProfile')"
                :image-data-url="null"
              />
            </var-option>
            <var-option
              v-for="profile in compatibleProfiles"
              :key="profile.id"
              :value="profile.id"
              :label="profile.name"
            >
              <ProfileSelectLabel
                :name="profile.name"
                :image-data-url="profile.imageDataUrl"
              />
            </var-option>
          </var-select>

          <p
            v-if="compatibleProfiles.length === 0"
            class="text-sm text-on-surface-variant"
          >
            {{ t('pages.utilities.quickGenerate.noCompatibleProfiles') }}
          </p>

          <div class="flex max-h-80 flex-col gap-3 overflow-y-auto lg:max-h-none">
            <p class="text-sm font-medium text-on-surface-variant">
              {{ t('pages.utilities.quickGenerate.customConfig') }}
            </p>
            <AquesTalk1Form
              v-if="version === 1"
              v-model="at1"
            />
            <AquesTalk2Form
              v-else-if="version === 2"
              v-model="at2"
            />
            <AquesTalk10Form
              v-else
              v-model="at10"
            />
          </div>
        </aside>

        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <div
            class="h-48 overflow-hidden rounded-xl border-2 border-outline/40 bg-surface-container lg:h-72"
            role="region"
            :aria-label="t('pages.utilities.quickGenerate.editorAriaLabel')"
          >
            <VueMonacoEditor
              v-model:value="text"
              language="plaintext"
              :theme="monacoTheme"
              :options="editorOptions"
              height="100%"
            >
              <template #default>
                <span class="p-3 text-on-surface-variant text-sm">
                  {{ t('pages.utilities.quickGenerate.editorLoading') }}
                </span>
              </template>
              <template #failure>
                <span class="p-3 text-danger text-sm">
                  {{ t('pages.utilities.quickGenerate.editorLoadFailed') }}
                </span>
              </template>
            </VueMonacoEditor>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <var-button
              type="primary"
              :disabled="!canGenerate"
              @click="onPreview"
            >
              <Play
                :size="18"
                aria-hidden="true"
                class="mr-2"
              />
              {{ t('pages.utilities.quickGenerate.preview') }}
            </var-button>
            <var-button
              type="primary"
              outlined
              :disabled="!canGenerate"
              @click="onSave"
            >
              <Save
                :size="18"
                aria-hidden="true"
                class="mr-2"
              />
              {{ t('pages.utilities.quickGenerate.save') }}
            </var-button>
            <div class="grow" />
            <var-button
              tonal
              @click="onReset"
            >
              <RotateCcw
                :size="18"
                aria-hidden="true"
                class="mr-2"
              />
              {{ t('pages.utilities.quickGenerate.reset') }}
            </var-button>
          </div>
        </div>
      </div>
    </div>
  </SettingsCard>
</template>
