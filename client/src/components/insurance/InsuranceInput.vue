<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/lib/utils";

const props = defineProps<{
  mode: "reverse" | "forward";
  healthInsuranceFee: number;
  annualGross: number;
  dependents: number;
  childrenUnder20: number;
  nonTaxableMonthly: number;
}>();

const emit = defineEmits<{
  "update:mode": [value: "reverse" | "forward"];
  "update:healthInsuranceFee": [value: number];
  "update:annualGross": [value: number];
  "update:dependents": [value: number];
  "update:childrenUnder20": [value: number];
  "update:nonTaxableMonthly": [value: number];
}>();

// 천단위 콤마 포맷 (건보료, 원 단위)
const formattedHealthFee = computed(() =>
  formatNumber(props.healthInsuranceFee)
);

function onHealthFeeInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:healthInsuranceFee", Math.max(0, Math.min(5_000_000, value)));
  }
}

// 연봉 입력값 만원 단위로 변환 (SalaryInputPanel 동일 패턴)
const annualGrossManWon = computed({
  get: () => Math.round(props.annualGross / 10_000),
  set: (value: number) => {
    const safe = Math.max(1_000, Math.min(300_000, Math.floor(value || 0)));
    emit("update:annualGross", safe * 10_000);
  },
});

const formattedGrossManWon = computed(() =>
  formatNumber(annualGrossManWon.value)
);

function onGrossInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    annualGrossManWon.value = value;
  }
}

// 비과세
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

  const maxChildren = Math.max(0, safe - 1);
  if (props.childrenUnder20 > maxChildren) {
    emit("update:childrenUnder20", maxChildren);
  }
}

function updateChildren(value: number): void {
  const maxChildren = Math.max(0, props.dependents - 1);
  const safe = Math.max(0, Math.min(maxChildren, Math.floor(value || 0)));
  emit("update:childrenUnder20", safe);
}

const inputIds = {
  reverseHealthInsurance: "insurance-health-fee",
  reverseHealthInsuranceRange: "insurance-health-fee-range",
  forwardAnnualGross: "insurance-annual-gross",
  forwardAnnualGrossRange: "insurance-annual-gross-range",
  dependents: "insurance-dependents",
  children: "insurance-children",
  nonTaxableMonthly: "insurance-nontaxable-monthly",
} as const;

function onHealthFeeRangeInput(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  if (Number.isFinite(value)) {
    emit("update:healthInsuranceFee", Math.max(0, Math.min(500_000, value)));
  }
}

</script>

<template>
  <section class="retro-panel">
    <div class="retro-titlebar">
      <h2 class="retro-title">건보료/연봉 입력</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="flex gap-2.5 border-b border-border/40 pb-4">
        <button
          type="button"
          class="touch-target min-w-0 flex-1 rounded-xl border px-2 py-1.5 text-caption font-semibold transition-colors"
          :class="mode === 'reverse' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
          @click="emit('update:mode', 'reverse')"
        >
          건보료 → 연봉
        </button>
        <button
          type="button"
          class="touch-target min-w-0 flex-1 rounded-xl border px-2 py-1.5 text-caption font-semibold transition-colors"
          :class="mode === 'forward' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
          @click="emit('update:mode', 'forward')"
        >
          연봉 → 건보료
        </button>
      </div>

      <Transition name="slide-fade" mode="out-in">
        <!-- 건보료 → 연봉 추정 모드 -->
        <div v-if="mode === 'reverse'" key="reverse" class="space-y-3">
        <label :for="inputIds.reverseHealthInsurance" class="mb-0.5 block text-caption font-semibold text-foreground">
          월 건강보험료 (원)
        </label>
        <p class="text-caption text-muted-foreground">
          급여명세서의 <strong>건강보험(근로자 부담분)</strong>만 입력하세요.
        </p>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="1만원 감소"
              @click="emit('update:healthInsuranceFee', Math.max(0, healthInsuranceFee - 10_000))"
            >
              −
            </button>
            <input
              :id="inputIds.reverseHealthInsurance"
              :value="formattedHealthFee"
              type="text"
              inputmode="numeric"
              class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
              @input="onHealthFeeInput"
            />
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="1만원 증가"
              @click="emit('update:healthInsuranceFee', Math.min(5_000_000, healthInsuranceFee + 10_000))"
            >
              +
            </button>
          </div>
          <input
            :id="inputIds.reverseHealthInsuranceRange"
            :value="healthInsuranceFee"
            type="range"
            min="0"
            max="500000"
            step="1000"
            class="retro-range"
            aria-label="건보료 슬라이더"
            @input="onHealthFeeRangeInput"
          />
        </div>
      </div>

        <!-- 연봉 → 건보료 계산 모드 -->
        <div v-else key="forward" class="space-y-3">
        <label :for="inputIds.forwardAnnualGross" class="mb-0.5 block text-caption font-semibold text-foreground">
          연봉 (만원)
        </label>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="100만원 감소"
              @click="annualGrossManWon = Math.max(1000, annualGrossManWon - 100)"
            >
              −
            </button>
            <input
              :id="inputIds.forwardAnnualGross"
              :value="formattedGrossManWon"
              type="text"
              inputmode="numeric"
              class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
              @input="onGrossInput"
            />
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="100만원 증가"
              @click="annualGrossManWon = Math.min(20000, annualGrossManWon + 100)"
            >
              +
            </button>
          </div>
          <input
            :id="inputIds.forwardAnnualGrossRange"
            v-model.number="annualGrossManWon"
            type="range"
            min="1000"
            max="20000"
            step="100"
            class="retro-range"
            aria-label="연봉 슬라이더"
          />
        </div>
        </div>
      </Transition>

      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>상세 설정 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
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
          <label class="space-y-1" :for="inputIds.children">
            <span class="text-caption text-muted-foreground">8~20세 자녀</span>
            <input
              :id="inputIds.children"
              :value="childrenUnder20"
              type="number"
              inputmode="numeric"
              min="0"
              max="20"
              class="retro-input"
              @input="updateChildren(parseInt(($event.target as HTMLInputElement).value, 10))"
            />
          </label>
          <label class="space-y-1" :for="inputIds.nonTaxableMonthly">
            <span class="text-caption text-muted-foreground">비과세(만원/월)</span>
            <input
              :id="inputIds.nonTaxableMonthly"
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
