<script setup lang="ts">
import { computed } from "vue";
import { formatPercent, formatWon } from "@/lib/utils";
import type {
  ComprehensiveTaxResult,
  SourceResult,
} from "@/composables/useComprehensiveTaxCalc";

const props = defineProps<{
  result: ComprehensiveTaxResult;
}>();

const hasSources = computed(() => props.result.sources.length > 0);
const hasTax = computed(() => props.result.totalTax > 0 || props.result.totalWithheld > 0);
const isRefund = computed(() => props.result.netPayable < 0);
const netAmountAbs = computed(() => Math.abs(props.result.netPayable));

const toneClass = computed(() => {
  if (!hasTax.value || props.result.netPayable === 0) return "text-muted-foreground";
  return isRefund.value ? "text-status-success" : "text-status-danger";
});

const netLabel = computed(() => {
  if (!hasTax.value || props.result.netPayable === 0) return "추가 납부/환급 없음";
  return isRefund.value ? "환급 예상" : "추가 납부 예상";
});

function sourceLabel(source: SourceResult): string {
  if (source.type === "business") return "사업소득";
  if (source.type === "rental") return "임대소득";
  return "기타소득";
}

function taxationLabel(source: SourceResult): string {
  return source.taxation === "separate" ? "분리과세" : "종합과세";
}
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">종합소득세 계산 결과</h2>
      <span class="retro-kbd">실효세율 {{ formatPercent(result.effectiveRate, 1) }}</span>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="rounded-xl border border-border/60 bg-muted/20 p-4 text-center space-y-1">
        <p class="text-caption text-muted-foreground">종합소득세 정산 결과</p>
        <p class="text-h1 font-title tabular-nums" :class="toneClass">
          {{ formatWon(netAmountAbs) }}
        </p>
        <p class="text-caption font-semibold" :class="toneClass">{{ netLabel }}</p>
      </div>

      <div v-if="hasSources" class="space-y-3">
        <div class="retro-board-list text-caption">
          <div class="retro-board-item" v-for="source in result.sources" :key="source.type">
            <span>{{ sourceLabel(source) }} · {{ taxationLabel(source) }}</span>
            <strong class="tabular-nums">소득금액 {{ formatWon(source.incomeAmount) }}</strong>
          </div>
        </div>

        <div class="retro-board-list text-caption">
          <div class="retro-board-item">
            <span>종합과세 소득금액 합계</span>
            <strong class="tabular-nums">{{ formatWon(result.comprehensiveIncome) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>인적공제</span>
            <strong class="tabular-nums">{{ formatWon(result.personalDeduction) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>연금보험료 공제</span>
            <strong class="tabular-nums">{{ formatWon(result.pensionDeduction) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>과세표준</span>
            <strong class="tabular-nums">{{ formatWon(result.taxableBase) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>산출세액</span>
            <strong class="tabular-nums">{{ formatWon(result.calculatedTax) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>표준세액공제</span>
            <strong class="tabular-nums">- {{ formatWon(result.taxCredit) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>결정세액(국세)</span>
            <strong class="tabular-nums">{{ formatWon(result.determinedTax) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>지방소득세</span>
            <strong class="tabular-nums">{{ formatWon(result.localTax) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>분리과세 합계</span>
            <strong class="tabular-nums">{{ formatWon(result.separateTaxTotal) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>총세액</span>
            <strong class="tabular-nums">{{ formatWon(result.totalTax) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>기납부세액(원천징수)</span>
            <strong class="tabular-nums">{{ formatWon(result.totalWithheld) }}</strong>
          </div>
          <div class="retro-board-item bg-primary/5 font-semibold">
            <span>납부/환급 세액</span>
            <strong class="tabular-nums" :class="toneClass">{{ formatWon(result.netPayable) }}</strong>
          </div>
        </div>
      </div>

      <p v-else class="text-caption text-muted-foreground">
        최소 1개 소득원을 활성화하고 수입을 입력하세요.
      </p>
    </div>
  </section>
</template>
