<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/lib/utils";

const props = defineProps<{
  monthlyIncomeTax: number;
  dependents: number;
  nonTaxableMonthly: number;
}>();

const emit = defineEmits<{
  "update:monthlyIncomeTax": [value: number];
  "update:dependents": [value: number];
  "update:nonTaxableMonthly": [value: number];
}>();

// 소득세 범위 제한 (최대 1,000만원)
const MAX_TAX = 10_000_000;

const formattedTax = computed(() => formatNumber(props.monthlyIncomeTax));

function onTaxInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:monthlyIncomeTax", Math.max(0, Math.min(MAX_TAX, value)));
  }
}

// 퀵 버튼: 각 값은 약 2,000~7,000만원 연봉에 대응
const quickAmounts = [30_000, 50_000, 100_000, 150_000, 200_000, 300_000];

// 비과세 만원 단위
const nonTaxableManWon = computed({
  get: () => Math.floor(props.nonTaxableMonthly / 10_000),
  set: (value: number) => {
    const safe = Math.max(0, Math.min(500, Math.floor(value || 0)));
    emit("update:nonTaxableMonthly", safe * 10_000);
  },
});

function updateDependents(value: number): void {
  const safe = Math.max(1, Math.min(20, Math.floor(value || 1)));
  emit("update:dependents", safe);
}

const inputIds = {
  monthlyIncomeTax: "withholding-income-tax",
  dependents: "withholding-dependents",
  nonTaxable: "withholding-nontaxable",
} as const;
</script>

<template>
  <section class="retro-panel">
    <div class="retro-titlebar">
      <h2 class="retro-title">월 소득세 입력</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="space-y-2">
        <label :for="inputIds.monthlyIncomeTax" class="block text-caption font-semibold text-foreground">
          월 소득세 (원)
        </label>
        <p class="text-caption text-muted-foreground">
          급여명세서의 <strong>소득세</strong> 항목만 입력하세요. 지방소득세(10%)는 별도 계산됩니다.
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="1만원 감소"
            @click="emit('update:monthlyIncomeTax', Math.max(0, monthlyIncomeTax - 10_000))"
          >
            −
          </button>
          <input
            :id="inputIds.monthlyIncomeTax"
            :value="formattedTax"
            type="text"
            inputmode="numeric"
            class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
            @input="onTaxInput"
          />
          <button
            type="button"
            class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="1만원 증가"
            @click="emit('update:monthlyIncomeTax', Math.min(MAX_TAX, monthlyIncomeTax + 10_000))"
          >
            +
          </button>
        </div>

        <!-- 퀵 버튼 -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="amount in quickAmounts"
            :key="amount"
            type="button"
            class="touch-target rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1 text-caption font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            :class="monthlyIncomeTax === amount ? 'border-primary bg-primary/10 text-primary' : ''"
            @click="emit('update:monthlyIncomeTax', amount)"
          >
            {{ (amount / 10_000).toLocaleString("ko-KR") }}만
          </button>
        </div>
      </div>

      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>상세 설정 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
          <label class="space-y-1" :for="inputIds.dependents">
            <span class="text-caption text-muted-foreground">부양가족(본인 포함)</span>
            <input
              :id="inputIds.dependents"
              :value="dependents"
              type="number"
              inputmode="numeric"
              min="1"
              max="20"
              class="retro-input"
              @input="updateDependents(parseInt(($event.target as HTMLInputElement).value, 10))"
            />
          </label>
          <label class="space-y-1" :for="inputIds.nonTaxable">
            <span class="text-caption text-muted-foreground">비과세(만원/월)</span>
            <input
              :id="inputIds.nonTaxable"
              v-model.number="nonTaxableManWon"
              type="number"
              inputmode="numeric"
              min="0"
              max="500"
              class="retro-input"
            />
          </label>
        </div>
      </details>
    </div>
  </section>
</template>
