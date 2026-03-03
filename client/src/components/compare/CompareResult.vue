<script setup lang="ts">
import { computed } from "vue";
import CompareDiffTable from "@/components/compare/CompareDiffTable.vue";
import { formatKrwAuto, formatWon } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";

const props = defineProps<{
  calcA: SalaryCalcResult;
  calcB: SalaryCalcResult;
  embedded?: boolean;
}>();

const monthlyNetDiff = computed(
  () => props.calcB.monthlyNet.value - props.calcA.monthlyNet.value
);
const annualNetDiff = computed(
  () => props.calcB.annualNet.value - props.calcA.annualNet.value
);

const monthlyGapAbs = computed(() => Math.abs(monthlyNetDiff.value));
const annualGapAbs = computed(() => Math.abs(annualNetDiff.value));

const leadLabel = computed(() => {
  if (monthlyNetDiff.value > 0) return "이직 회사가 월 실수령 우위";
  if (monthlyNetDiff.value < 0) return "현재 회사가 월 실수령 우위";
  return "월 실수령 차이 없음";
});

const leadDescription = computed(() => {
  if (monthlyNetDiff.value === 0) return "월 실수령이 동일합니다";
  return `연간 차이 ${formatKrwAuto(annualGapAbs.value)}`;
});

const diffClass = computed(() => {
  if (monthlyNetDiff.value > 0) return "text-status-success";
  if (monthlyNetDiff.value < 0) return "text-status-danger";
  return "text-muted-foreground";
});

const barMax = computed(() =>
  Math.max(
    Math.abs(props.calcA.monthlyNet.value),
    Math.abs(props.calcB.monthlyNet.value),
    1
  )
);

const monthlyBarA = computed(
  () => `${(Math.abs(props.calcA.monthlyNet.value) / barMax.value) * 100}%`
);
const monthlyBarB = computed(
  () => `${(Math.abs(props.calcB.monthlyNet.value) / barMax.value) * 100}%`
);
</script>

<template>
  <component :is="props.embedded ? 'div' : 'section'" :class="props.embedded ? 'space-y-4' : 'retro-panel overflow-hidden'">
    <div v-if="!props.embedded" class="retro-titlebar">
      <h2 class="retro-title">비교 결과</h2>
    </div>

    <div :class="props.embedded ? 'space-y-4' : 'retro-panel-content space-y-4'">
      <div v-if="props.embedded" class="flex items-center justify-between">
        <h3 class="text-caption font-semibold text-foreground">비교 결과</h3>
        <span class="text-tiny text-muted-foreground">입력값 기준 자동 계산</span>
      </div>

      <div class="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
        <p class="text-caption font-semibold" :class="diffClass">{{ leadLabel }}</p>
        <p class="mt-1 text-h1 font-title tabular-nums" :class="diffClass">
          {{ formatWon(monthlyGapAbs) }}
        </p>
        <p class="text-caption text-muted-foreground">{{ leadDescription }}</p>
      </div>

      <div class="rounded-xl border border-border/70 bg-background p-3">
        <p class="text-caption font-semibold text-foreground">핵심 비교</p>
        <div class="mt-2 space-y-2 text-caption">
          <div>
            <div class="mb-1 flex items-center justify-between">
              <span class="text-muted-foreground">월 실수령</span>
              <span class="tabular-nums">Δ {{ formatWon(monthlyNetDiff) }}</span>
            </div>
            <div class="mb-1 flex items-center justify-between text-tiny text-muted-foreground">
              <span>현재 {{ formatWon(calcA.monthlyNet.value) }}</span>
              <span>이직 {{ formatWon(calcB.monthlyNet.value) }}</span>
            </div>
            <div class="space-y-1">
              <div class="h-2 rounded-full bg-muted/70">
                <div class="h-full rounded-full bg-status-info/80" :style="{ width: monthlyBarA }" />
              </div>
              <div class="h-2 rounded-full bg-muted/70">
                <div class="h-full rounded-full bg-primary/80" :style="{ width: monthlyBarB }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>상세 결과 보기 (연 실수령 차이 {{ formatKrwAuto(annualNetDiff) }})</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="overflow-x-auto">
          <table class="w-full text-caption border-collapse">
            <thead>
              <tr class="border-b-2 border-primary/20 bg-muted/40">
                <th class="px-3 py-2.5 text-left font-semibold">항목</th>
                <th class="px-3 py-2.5 text-right font-semibold">현재 회사</th>
                <th class="px-3 py-2.5 text-right font-semibold">이직 회사</th>
                <th class="px-3 py-2.5 text-right font-semibold">차이</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
                <td class="px-3 py-2.5 whitespace-nowrap">월 실수령</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calcA.monthlyNet.value) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calcB.monthlyNet.value) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap" :class="diffClass">{{ formatWon(monthlyNetDiff) }}</td>
              </tr>
              <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
                <td class="px-3 py-2.5 whitespace-nowrap">연 실수령</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatKrwAuto(calcA.annualNet.value) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatKrwAuto(calcB.annualNet.value) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap" :class="diffClass">{{ formatKrwAuto(annualNetDiff) }}</td>
              </tr>
              <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
                <td class="px-3 py-2.5 whitespace-nowrap">총 공제(월)</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calcA.totalDeduction.value) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calcB.totalDeduction.value) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calcB.totalDeduction.value - calcA.totalDeduction.value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>공제 항목 상세 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="p-3">
          <CompareDiffTable embedded :calc-a="calcA" :calc-b="calcB" />
        </div>
      </details>
    </div>
  </component>
</template>
