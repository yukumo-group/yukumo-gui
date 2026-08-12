<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChartGantt, Code, FolderTree, Magnet, Pause, Play, Square, Timer } from '@lucide/vue';
import cookieMaskUrl from '../assets/images/4-sided cookie.svg';
import GenerateWorkspace from '../components/generate/GenerateWorkspace.vue';
import {
  cycleRightPanel,
  rightPanel,
  showFileTree,
  toggleFileTree,
} from '../composables/generateWorkspace';
import {
  snapClipsEnabled,
  snapPlayheadEnabled,
  timelinePlayback,
  toggleSnapClips,
  toggleSnapPlayhead,
} from '../composables/timelineSession';

const { t } = useI18n();

const isSmUp = ref(false);

const elapsedLabel = timelinePlayback.elapsedLabel;
const isPlaying = timelinePlayback.isPlaying;

const playPetalStyle = {
  WebkitMaskImage: `url("${cookieMaskUrl}")`,
  maskImage: `url("${cookieMaskUrl}")`,
};

const tooltipPlacement = computed(() => (isSmUp.value ? 'bottom' : 'top'));

const rightPanelIcon = computed(() =>
  rightPanel.value === 'code' ? Code : ChartGantt,
);

const rightPanelLabel = computed(() =>
  t('pages.generate.cycleRightPanel', {
    panel: t(`pages.generate.rightPanel.${rightPanel.value}`),
  }),
);

const playButtonLabel = computed(() =>
  isPlaying.value ? t('pages.generate.pause') : t('pages.generate.play'),
);

function play(): void {
  timelinePlayback.togglePlay();
}

function stop(): void {
  timelinePlayback.stop();
}

let smMediaQuery: MediaQueryList | undefined;

function syncViewport(): void {
  if (!smMediaQuery) return;
  isSmUp.value = smMediaQuery.matches;
}

onMounted(() => {
  smMediaQuery = window.matchMedia('(min-width: 640px)');
  syncViewport();
  smMediaQuery.addEventListener('change', syncViewport);
});

onUnmounted(() => {
  smMediaQuery?.removeEventListener('change', syncViewport);
  timelinePlayback.dispose();
});
</script>

<template>
  <section
    class="flex h-full min-h-0 w-full flex-1 flex-col-reverse sm:flex-col gap-2 self-stretch p-2 text-left sm:p-0"
  >
    <div
      class="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-surface-container px-2 py-1 sm:px-3"
      role="toolbar"
      :aria-label="t('pages.generate.playbarAriaLabel')"
    >
      <div class="flex min-w-0 items-center justify-center px-2 sm:justify-start">
        <time
          class="font-mono text-text text-2xl tabular-nums tracking-tight sm:text-3xl"
          :aria-label="t('pages.generate.elapsedTimeAriaLabel')"
        >
          {{ elapsedLabel }}
        </time>
      </div>

      <div class="flex items-center justify-center gap-2">
        <var-tooltip
          :content="playButtonLabel"
          :placement="tooltipPlacement"
        >
          <button
            v-ripple="{ color: 'var(--color-on-primary)' }"
            type="button"
            class="play-petal inline-flex size-14 shrink-0 items-center justify-center bg-primary text-on-primary transition-opacity hover:opacity-90"
            :style="playPetalStyle"
            :aria-label="playButtonLabel"
            :aria-pressed="isPlaying"
            @click="play"
          >
            <Pause
              v-if="isPlaying"
              class="relative z-10 size-5 fill-current"
              aria-hidden="true"
            />
            <Play
              v-else
              class="relative z-10 size-5 fill-current"
              aria-hidden="true"
            />
          </button>
        </var-tooltip>

        <var-tooltip
          :content="t('pages.generate.stop')"
          :placement="tooltipPlacement"
        >
          <button
            type="button"
            class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity hover:opacity-90"
            :aria-label="t('pages.generate.stop')"
            @click="stop"
          >
            <Square class="size-3.5 fill-current" aria-hidden="true" />
          </button>
        </var-tooltip>
      </div>

      <div class="flex min-w-0 items-center justify-end">
        <div
          class="grid auto-cols-min grid-flow-col grid-rows-[auto_auto] items-center justify-items-center"
        >
          <var-tooltip
            :content="t('pages.generate.snapPlayhead')"
            :placement="tooltipPlacement"
          >
            <var-button
              text
              round
              :type="snapPlayheadEnabled ? 'primary' : undefined"
              :aria-pressed="snapPlayheadEnabled"
              :aria-label="t('pages.generate.snapPlayhead')"
              @click="toggleSnapPlayhead"
            >
              <Timer :size="20" aria-hidden="true" />
            </var-button>
          </var-tooltip>

          <var-tooltip
            :content="t('pages.generate.snapClips')"
            :placement="tooltipPlacement"
          >
            <var-button
              text
              round
              :type="snapClipsEnabled ? 'primary' : undefined"
              :aria-pressed="snapClipsEnabled"
              :aria-label="t('pages.generate.snapClips')"
              @click="toggleSnapClips"
            >
              <Magnet :size="20" aria-hidden="true" />
            </var-button>
          </var-tooltip>

          <var-tooltip
            :content="rightPanelLabel"
            :placement="tooltipPlacement"
          >
            <var-button
              text
              round
              type="primary"
              :aria-label="rightPanelLabel"
              @click="cycleRightPanel"
            >
              <component
                :is="rightPanelIcon"
                :size="20"
                aria-hidden="true"
              />
            </var-button>
          </var-tooltip>

          <var-tooltip
            :content="t('pages.generate.toggleFileTree')"
            :placement="tooltipPlacement"
          >
            <var-button
              text
              round
              :type="showFileTree ? 'primary' : undefined"
              :aria-pressed="showFileTree"
              :aria-label="t('pages.generate.toggleFileTree')"
              @click="toggleFileTree"
            >
              <FolderTree :size="20" aria-hidden="true" />
            </var-button>
          </var-tooltip>
        </div>
      </div>
    </div>

    <GenerateWorkspace />
  </section>
</template>

<style scoped>
.play-petal {
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}
</style>

<style>
/* Teleported popovers; allow hover/click to reach stacked toolbar controls underneath */
.var-tooltip__tooltip {
  pointer-events: none;
}
</style>
