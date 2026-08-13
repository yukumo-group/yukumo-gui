import { ref, watch, type Ref } from 'vue';

/** Fit/min zoom bound — frozen during drag/scrub, committed on gesture end. */
export function useTimelineFitBound(contentBoundSec: Ref<number>) {
  const fitBoundSec = ref(contentBoundSec.value);
  const fitBoundFrozen = ref(false);

  function commitFitBound(): void {
    fitBoundSec.value = contentBoundSec.value;
  }

  watch(contentBoundSec, (value) => {
    if (!fitBoundFrozen.value) {
      fitBoundSec.value = value;
    }
  });

  function freezeFitBound(): void {
    fitBoundFrozen.value = true;
  }

  function unfreezeFitBound(): void {
    fitBoundFrozen.value = false;
    commitFitBound();
  }

  return {
    fitBoundSec,
    freezeFitBound,
    unfreezeFitBound,
  };
}
