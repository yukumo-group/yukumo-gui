<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BetweenVerticalStart, Copy, Scissors, Trash2, Type, User } from '@lucide/vue';
import type {
  TimelineClip,
  TimelineClipColor,
} from '../../types/timeline';
import { TIMELINE_CLIP_COLORS } from '../../types/timeline';
import { CUSTOM_PROFILE_ID } from '../../types/profile';
import { characterProfiles } from '../../composables/useCharacterProfiles';
import { CLIP_COLOR_SWATCH } from '../../composables/timeline/clipAppearance';
import TimelineKnob from './TimelineKnob.vue';

const props = defineProps<{
  clips: TimelineClip[];
  canSplit: boolean;
}>();

const emit = defineEmits<{
  voice: [];
  content: [];
  split: [];
  color: [value: TimelineClipColor];
  volume: [value: number];
  pan: [value: number];
  mute: [];
  copy: [];
  cut: [];
  delete: [];
}>();

const { t } = useI18n();

const first = computed(() => props.clips[0] ?? null);

const canContent = computed(() => props.clips.length === 1);

const allMuted = computed(
  () => props.clips.length > 0 && props.clips.every((clip) => clip.muted),
);

const avatarUrl = computed(() => {
  const id = first.value?.speaker.profileId;
  if (!id || id === CUSTOM_PROFILE_ID) return null;
  return (
    characterProfiles.value.find((profile) => profile.id === id)
      ?.imageDataUrl ?? null
  );
});

const COLOR_LABEL_KEY: Record<
  TimelineClipColor,
  | 'pages.generate.timeline.clipColors.primary'
  | 'pages.generate.timeline.clipColors.info'
  | 'pages.generate.timeline.clipColors.warning'
  | 'pages.generate.timeline.clipColors.success'
  | 'pages.generate.timeline.clipColors.danger'
> = {
  primary: 'pages.generate.timeline.clipColors.primary',
  info: 'pages.generate.timeline.clipColors.info',
  warning: 'pages.generate.timeline.clipColors.warning',
  success: 'pages.generate.timeline.clipColors.success',
  danger: 'pages.generate.timeline.clipColors.danger',
};

function onColorSelect(value: unknown): void {
  if (
    value === 'primary' ||
    value === 'info' ||
    value === 'warning' ||
    value === 'success' ||
    value === 'danger'
  ) {
    emit('color', value);
  }
}
</script>

<template>
  <div
    v-if="first"
    class="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-outline/30 bg-surface-container-high px-1.5 py-1 shadow-md"
    role="toolbar"
    :aria-label="t('pages.generate.timeline.clipToolbar')"
    @pointerdown.stop
  >
    <var-tooltip
      :content="t('pages.generate.timeline.clipVoice')"
      placement="top"
    >
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
        :aria-label="t('pages.generate.timeline.clipVoice')"
        @click="emit('voice')"
      >
        <span
          class="flex size-6 items-center justify-center overflow-hidden rounded-full bg-surface-container text-on-surface-variant"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt=""
            class="size-full object-cover"
          />
          <User
            v-else
            :size="14"
            aria-hidden="true"
          />
        </span>
      </button>
    </var-tooltip>

    <var-tooltip
      :content="t('pages.generate.timeline.clipContent')"
      placement="top"
    >
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
        :aria-label="t('pages.generate.timeline.clipContent')"
        :disabled="!canContent"
        @click="emit('content')"
      >
        <Type
          :size="16"
          aria-hidden="true"
        />
      </button>
    </var-tooltip>

    <var-tooltip
      :content="t('pages.generate.timeline.clipSplit')"
      placement="top"
    >
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
        :aria-label="t('pages.generate.timeline.clipSplit')"
        :disabled="!canSplit"
        @click="emit('split')"
      >
        <BetweenVerticalStart
          :size="16"
          aria-hidden="true"
        />
      </button>
    </var-tooltip>

    <var-menu-select
      class="inline-flex shrink-0"
      :model-value="first.color"
      size="mini"
      placement="top"
      popover-class="timeline-clip-color-menu"
      close-on-select
      @update:model-value="onColorSelect"
    >
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-full hover:bg-surface-container"
        :aria-label="t('pages.generate.timeline.clipColor')"
        :aria-haspopup="true"
      >
        <span
          class="size-4 rounded-full ring-1 ring-outline/40"
          :class="CLIP_COLOR_SWATCH[first.color]"
        />
      </button>
      <template #options>
        <var-menu-option
          v-for="color in TIMELINE_CLIP_COLORS"
          :key="color"
          :value="color"
        >
          <span class="flex items-center gap-2">
            <span
              class="size-4 rounded-full ring-1 ring-outline/40"
              :class="CLIP_COLOR_SWATCH[color]"
            />
            <span>{{ t(COLOR_LABEL_KEY[color]) }}</span>
          </span>
        </var-menu-option>
      </template>
    </var-menu-select>

    <div class="mx-1.5 flex items-center gap-2.5">
      <TimelineKnob
        :model-value="first.volume"
        :min="0"
        :max="1"
        :size="24"
        unit="db"
        :ariaLabel="t('pages.generate.timeline.clipVolume')"
        @update:model-value="emit('volume', $event)"
      />
      <TimelineKnob
        :model-value="first.pan"
        :min="-1"
        :max="1"
        :size="24"
        offset
        unit="percent"
        :ariaLabel="t('pages.generate.timeline.clipPan')"
        @update:model-value="emit('pan', $event)"
      />
    </div>

    <button
      type="button"
      class="inline-flex size-8 shrink-0 items-center justify-center rounded-md font-bold text-[11px] hover:bg-surface-container"
      :class="
        allMuted ? 'bg-danger/15 text-danger' : 'text-on-surface-variant'
      "
      :aria-label="
        allMuted
          ? t('pages.generate.timeline.clipUnmute')
          : t('pages.generate.timeline.clipMute')
      "
      :aria-pressed="allMuted"
      @click="emit('mute')"
    >
      M
    </button>

    <var-tooltip
      :content="t('pages.generate.timeline.clipCopy')"
      placement="top"
    >
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
        :aria-label="t('pages.generate.timeline.clipCopy')"
        @click="emit('copy')"
      >
        <Copy
          :size="16"
          aria-hidden="true"
        />
      </button>
    </var-tooltip>

    <var-tooltip
      :content="t('pages.generate.timeline.clipCut')"
      placement="top"
    >
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
        :aria-label="t('pages.generate.timeline.clipCut')"
        @click="emit('cut')"
      >
        <Scissors
          :size="16"
          aria-hidden="true"
        />
      </button>
    </var-tooltip>

    <var-tooltip
      :content="t('pages.generate.timeline.clipDelete')"
      placement="top"
    >
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-full text-danger hover:bg-danger/15"
        :aria-label="t('pages.generate.timeline.clipDelete')"
        @click="emit('delete')"
      >
        <Trash2
          :size="16"
          aria-hidden="true"
        />
      </button>
    </var-tooltip>
  </div>
</template>

<style>
.timeline-clip-color-menu {
  --menu-select-menu-background-color: var(--color-body);
}

.timeline-clip-color-menu .var-menu-select__menu {
  overflow: hidden;
}
</style>
