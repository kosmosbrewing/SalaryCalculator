<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatKrwAuto, formatWon, formatPercent } from "@/lib/utils";

const props = defineProps<{
  monthlyIncomeTax: number;       // 사용자 입력 소득세
  estimatedAnnualGross: number;
  calc: SalaryCalcResult;
}>();

// 검산: 계산된 소득세와 입력 소득세의 차이
const calculatedIncomeTax = computed(() => props.calc.monthlyIncomeTax.value);
const taxDiff = computed(() => Math.abs(calculatedIncomeTax.value - props.monthlyIncomeTax));
// ±5,000원 이상 차이 시 안내 문구 표시
const showDiffWarning = computed(() => taxDiff.value >= 5_000 && props.monthlyIncomeTax > 0);

// 애니메이션 카운트업 (InsuranceResult 동일 패턴)
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

const showNetDiff = computed(() =>
  hasAnimatedInitial.value && monthlyNetDiff.value !== 0
);
const netDiffLabel = computed(() => {
  const sign = monthlyNetDiff.value > 0 ? "+" : "-";
  return `${sign}${formatWon(Math.abs(monthlyNetDiff.value))}`;
});
const netDiffClass = computed(() =>
  monthlyNetDiff.value > 0 ? "text-status-success" : "text-status-danger"
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
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">소득세 {{ formatWon(monthlyIncomeTax) }} 기준 역산 결과</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <!-- 핵심 배너: 추정 연봉 -->
      <div class="text-center py-4">
        <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">추정 연봉</p>
        <p class="text-display font-bold font-title text-primary tabular-nums">
          {{ formatKrwAuto(estimatedAnnualGross) }}
        </p>
        <p class="text-caption text-muted-foreground mt-1">
          추정 월 실수령액: {{ formatWon(displayedMonthlyNet) }}
        </p>
        <Transition name="fade">
          <p
            v-if="showNetDiff"
            class="text-caption mt-1 font-semibold"
            :class="netDiffClass"
          >
            직전 입력 대비 {{ netDiffLabel }}
          </p>
        </Transition>
      </div>

      <!-- 요약 stat-grid -->
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

      <!-- 공제 상세 텍스트 목록 -->
      <div class="retro-board-list text-caption">
        <div class="retro-board-item"><span>국민연금</span><strong class="tabular-nums">{{ formatWon(calc.nationalPension.value) }}</strong></div>
        <div class="retro-board-item"><span>건강보험</span><strong class="tabular-nums">{{ formatWon(calc.healthInsurance.value) }}</strong></div>
        <div class="retro-board-item"><span>장기요양</span><strong class="tabular-nums">{{ formatWon(calc.longTermCare.value) }}</strong></div>
        <div class="retro-board-item"><span>고용보험</span><strong class="tabular-nums">{{ formatWon(calc.employmentInsurance.value) }}</strong></div>
        <div class="retro-board-item"><span>소득세</span><strong class="tabular-nums">{{ formatWon(calc.monthlyIncomeTax.value) }}</strong></div>
        <div class="retro-board-item"><span>지방소득세</span><strong class="tabular-nums">{{ formatWon(calc.monthlyLocalTax.value) }}</strong></div>
        <div class="retro-board-item bg-primary/5 text-body font-bold text-foreground">
          <span>총 공제</span>
          <strong class="tabular-nums text-primary">{{ formatWon(calc.totalDeduction.value) }}</strong>
        </div>
      </div>

      <!-- 검산 row -->
      <div class="rounded-xl border border-border/60 bg-muted/20 p-3 text-caption space-y-2">
        <p class="font-semibold">역산 검산</p>
        <div class="space-y-1 text-muted-foreground">
          <div class="flex justify-between">
            <span>입력한 소득세</span>
            <strong class="tabular-nums text-foreground">{{ formatWon(monthlyIncomeTax) }}</strong>
          </div>
          <div class="flex justify-between">
            <span>계산된 소득세</span>
            <strong class="tabular-nums text-foreground">{{ formatWon(calculatedIncomeTax) }}</strong>
          </div>
          <div class="flex justify-between">
            <span>오차</span>
            <strong
              class="tabular-nums"
              :class="taxDiff <= 5_000 ? 'text-status-success' : 'text-status-danger'"
            >
              {{ formatWon(taxDiff) }}
            </strong>
          </div>
        </div>
        <Transition name="fade">
          <p v-if="showDiffWarning" class="text-status-warning text-caption">
            비과세 조건, 8~20세 자녀 세액공제, 학자금대출 공제로 인해 차이가 있을 수 있습니다.
          </p>
        </Transition>
      </div>
    </div>
  </section>
</template>
