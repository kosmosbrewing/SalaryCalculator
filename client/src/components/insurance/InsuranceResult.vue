<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatKrwAuto, formatWon, formatPercent } from "@/lib/utils";
import { RATES_2026 } from "@/data/taxRates2026";

const props = defineProps<{
  mode: "reverse" | "forward";
  healthInsuranceFee: number;
  estimatedTaxableMonthly: number;
  estimatedAnnualGross: number;
  calc: SalaryCalcResult;
}>();

const title = computed(() => {
  if (props.mode === "reverse") {
    return `건보료 ${formatWon(props.healthInsuranceFee)} 기준`;
  }
  return `연봉 ${formatKrwAuto(props.calc.annualGross.value)} 기준`;
});

// 애니메이션 카운트업 (SalaryResultPanel 동일 패턴)
const displayedMonthlyNet = ref(0);
const hasAnimatedInitial = ref(false);
const monthlyNetDiff = ref(0);
let previousMonthlyNet: number | null = null;
let rafId: number | null = null;

function animateInitialMonthlyNet(target: number): void {
  const durationMs = 600;
  const start = performance.now();
  const sign = target < 0 ? -1 : 1;
  const absTarget = Math.abs(target);

  const step = (timestamp: number): void => {
    const progress = Math.min(1, (timestamp - start) / durationMs);
    displayedMonthlyNet.value = Math.round(absTarget * progress) * sign;

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
      return;
    }

    hasAnimatedInitial.value = true;
    displayedMonthlyNet.value = props.calc.monthlyNet.value;
    rafId = null;
  };

  rafId = requestAnimationFrame(step);
}

watchEffect(() => {
  const next = props.calc.monthlyNet.value;
  if (previousMonthlyNet !== null) {
    monthlyNetDiff.value = next - previousMonthlyNet;
  }
  previousMonthlyNet = next;

  if (hasAnimatedInitial.value) {
    displayedMonthlyNet.value = next;
  }
});

const showDiff = computed(() =>
  hasAnimatedInitial.value && monthlyNetDiff.value !== 0
);
const diffLabel = computed(() => {
  const sign = monthlyNetDiff.value > 0 ? "+" : "-";
  return `${sign}${formatWon(Math.abs(monthlyNetDiff.value))}`;
});
const diffClass = computed(() =>
  monthlyNetDiff.value > 0
    ? "text-status-success"
    : "text-status-danger"
);

onMounted(() => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    hasAnimatedInitial.value = true;
    displayedMonthlyNet.value = props.calc.monthlyNet.value;
    return;
  }

  animateInitialMonthlyNet(props.calc.monthlyNet.value);
});

onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">{{ title }}</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <!-- 메인 결과: 애니메이션 카운트업 -->
      <div class="text-center py-4">
        <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">
          {{ mode === 'reverse' ? '추정 월 실수령액' : '월 실수령액' }}
        </p>
        <p class="text-display font-bold font-title text-primary tabular-nums">
          {{ formatWon(displayedMonthlyNet) }}
        </p>
        <p class="text-caption text-muted-foreground mt-1">
          {{ mode === 'reverse' ? '추정 연봉' : '연 실수령액' }}:
          {{ formatKrwAuto(mode === 'reverse' ? estimatedAnnualGross : calc.annualNet.value) }}
        </p>
        <Transition name="fade">
          <p
            v-if="showDiff"
            class="text-caption mt-1 font-semibold"
            :class="diffClass"
          >
            직전 입력 대비 {{ diffLabel }}
          </p>
        </Transition>
      </div>

      <!-- 요약 stat-grid (4열) -->
      <div class="retro-stat-grid">
        <div class="retro-stat">
          <p class="retro-stat-label">월 급여</p>
          <p class="retro-stat-value">{{ formatWon(calc.monthlyGross.value) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">공제합계</p>
          <p class="retro-stat-value text-deduction">{{ formatWon(calc.totalDeduction.value) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">4대보험</p>
          <p class="retro-stat-value">{{ formatWon(calc.totalInsurance.value) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">실효세율</p>
          <p class="retro-stat-value">{{ formatPercent(calc.effectiveTaxRate.value, 1) }}</p>
        </div>
      </div>

      <!-- 4대보험 차트 -->
      <div class="retro-chart">
        <div class="retro-chart-header">
          <span class="font-semibold text-foreground">4대보험</span>
          <span class="font-semibold tabular-nums">{{ formatWon(calc.totalInsurance.value) }}</span>
        </div>
        <div class="retro-chart-bar">
          <div
            class="bg-chart-pension retro-chart-segment"
            :style="{ width: calc.monthlyGross.value > 0 ? `${(calc.nationalPension.value / calc.monthlyGross.value) * 100}%` : '0%' }"
            title="국민연금"
          />
          <div
            class="bg-chart-health retro-chart-segment"
            :style="{ width: calc.monthlyGross.value > 0 ? `${(calc.healthInsurance.value / calc.monthlyGross.value) * 100}%` : '0%' }"
            title="건강보험"
          />
          <div
            class="bg-chart-care retro-chart-segment"
            :style="{ width: calc.monthlyGross.value > 0 ? `${(calc.longTermCare.value / calc.monthlyGross.value) * 100}%` : '0%' }"
            title="장기요양"
          />
          <div
            class="bg-chart-employment retro-chart-segment"
            :style="{ width: calc.monthlyGross.value > 0 ? `${(calc.employmentInsurance.value / calc.monthlyGross.value) * 100}%` : '0%' }"
            title="고용보험"
          />
        </div>
        <div class="retro-chart-legend">
          <div class="retro-chart-legend-item">
            <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-pension" />국민연금</span>
            <span class="tabular-nums font-medium">{{ formatWon(calc.nationalPension.value) }}</span>
          </div>
          <div class="retro-chart-legend-item">
            <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-health" />건강보험</span>
            <span class="tabular-nums font-medium">{{ formatWon(calc.healthInsurance.value) }}</span>
          </div>
          <div class="retro-chart-legend-item">
            <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-care" />장기요양</span>
            <span class="tabular-nums font-medium">{{ formatWon(calc.longTermCare.value) }}</span>
          </div>
          <div class="retro-chart-legend-item">
            <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-employment" />고용보험</span>
            <span class="tabular-nums font-medium">{{ formatWon(calc.employmentInsurance.value) }}</span>
          </div>
        </div>
      </div>

      <!-- 세금 차트 -->
      <div class="retro-chart">
        <div class="retro-chart-header">
          <span class="font-semibold text-foreground">세금</span>
          <span class="font-semibold tabular-nums">{{ formatWon(calc.totalTax.value) }}</span>
        </div>
        <div class="retro-chart-bar">
          <div
            class="bg-chart-tax retro-chart-segment"
            :style="{ width: calc.monthlyGross.value > 0 ? `${(calc.monthlyIncomeTax.value / calc.monthlyGross.value) * 100}%` : '0%' }"
            title="소득세"
          />
          <div
            class="bg-chart-localTax retro-chart-segment"
            :style="{ width: calc.monthlyGross.value > 0 ? `${(calc.monthlyLocalTax.value / calc.monthlyGross.value) * 100}%` : '0%' }"
            title="지방소득세"
          />
        </div>
        <div class="retro-chart-legend">
          <div class="retro-chart-legend-item">
            <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-tax" />소득세</span>
            <span class="tabular-nums font-medium">{{ formatWon(calc.monthlyIncomeTax.value) }}</span>
          </div>
          <div class="retro-chart-legend-item">
            <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-localTax" />지방소득세</span>
            <span class="tabular-nums font-medium">{{ formatWon(calc.monthlyLocalTax.value) }}</span>
          </div>
        </div>
      </div>

      <!-- 추정 근거 (reverse 모드) -->
      <Transition name="fade">
      <div v-if="mode === 'reverse'" class="rounded-xl border border-border/60 bg-muted/20 p-3 text-caption space-y-2">
        <p class="font-semibold">추정 근거</p>
        <ol class="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>건강보험료 <strong class="tabular-nums text-foreground">{{ formatWon(healthInsuranceFee) }}</strong> ÷ 근로자 부담률 {{ formatPercent(RATES_2026.healthInsurance.employee, 3) }}</li>
          <li>= 과세 기준 월급 <strong class="tabular-nums text-foreground">{{ formatWon(estimatedTaxableMonthly) }}</strong></li>
          <li>+ 비과세 {{ formatWon(calc.nonTaxableMonthly.value) }}, 연봉 환산 = <strong class="tabular-nums text-foreground">{{ formatKrwAuto(estimatedAnnualGross) }}</strong></li>
        </ol>
      </div>
      </Transition>

      <!-- 공제 상세 텍스트 목록 -->
      <div class="retro-board-list text-caption">
        <div class="retro-board-item"><span>국민연금</span><strong class="tabular-nums">{{ formatWon(calc.nationalPension.value) }}</strong></div>
        <div class="retro-board-item"><span>건강보험</span><strong class="tabular-nums">{{ formatWon(calc.healthInsurance.value) }}</strong></div>
        <div class="retro-board-item"><span>장기요양</span><strong class="tabular-nums">{{ formatWon(calc.longTermCare.value) }}</strong></div>
        <div class="retro-board-item"><span>고용보험</span><strong class="tabular-nums">{{ formatWon(calc.employmentInsurance.value) }}</strong></div>
        <div class="retro-board-item"><span>소득세</span><strong class="tabular-nums">{{ formatWon(calc.monthlyIncomeTax.value) }}</strong></div>
        <div class="retro-board-item"><span>지방소득세</span><strong class="tabular-nums">{{ formatWon(calc.monthlyLocalTax.value) }}</strong></div>
        <div class="retro-board-item bg-primary/5 text-body font-bold text-foreground"><span>총 공제</span><strong class="tabular-nums text-primary">{{ formatWon(calc.totalDeduction.value) }}</strong></div>
      </div>
    </div>
  </section>
</template>
