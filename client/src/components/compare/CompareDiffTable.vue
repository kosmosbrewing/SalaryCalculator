<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatWon } from "@/lib/utils";

const props = defineProps<{
  calcA: SalaryCalcResult;
  calcB: SalaryCalcResult;
  embedded?: boolean;
}>();

const items = [
  { label: "국민연금", key: "nationalPension" },
  { label: "건강보험", key: "healthInsurance" },
  { label: "장기요양보험", key: "longTermCare" },
  { label: "고용보험", key: "employmentInsurance" },
  { label: "소득세", key: "monthlyIncomeTax" },
  { label: "지방소득세", key: "monthlyLocalTax" },
] as const;

type CalcKey = (typeof items)[number]["key"];

const rows = computed(() =>
  items.map((item) => {
    const a = props.calcA[item.key as CalcKey].value;
    const b = props.calcB[item.key as CalcKey].value;
    const delta = b - a;
    return { label: item.label, a, b, delta };
  })
);

function diffClass(delta: number): string {
  if (delta > 0) return "text-status-danger";
  if (delta < 0) return "text-status-success";
  return "text-muted-foreground";
}
</script>

<template>
  <component :is="props.embedded ? 'div' : 'section'" :class="props.embedded ? '' : 'retro-panel overflow-hidden'">
    <div v-if="!props.embedded" class="retro-titlebar">
      <h2 class="retro-title">공제 항목 차이</h2>
    </div>

    <div :class="props.embedded ? '' : 'retro-panel-content'">
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
            <tr
              v-for="row in rows"
              :key="row.label"
              class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors"
            >
              <td class="px-3 py-2.5 whitespace-nowrap">{{ row.label }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(row.a) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(row.b) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap font-semibold" :class="diffClass(row.delta)">
                {{ formatWon(row.delta) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </component>
</template>
