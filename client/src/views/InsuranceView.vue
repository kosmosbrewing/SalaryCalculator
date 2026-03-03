<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { useRoute } from "vue-router";


import InsuranceInput from "@/components/insurance/InsuranceInput.vue";
import InsuranceResult from "@/components/insurance/InsuranceResult.vue";
import InsuranceTable from "@/components/insurance/InsuranceTable.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import { useInsuranceReverse } from "@/composables/useInsuranceReverse";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { DEFAULT_INSURANCE_PRESET } from "@/data/insurancePresets";

import { formatManWon, formatWon, copyUsingExecCommand } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { showAlert } from "@/composables/useAlert";
import { addEntry } from "@/composables/useRecentCalcs";

const props = defineProps<{
  initialHealthInsuranceFee?: number;
}>();
const route = useRoute();

const mode = ref<"reverse" | "forward">("reverse");
const healthInsuranceFee = ref(DEFAULT_INSURANCE_PRESET);
const dependents = ref(1);
const childrenUnder20 = ref(0);
const nonTaxableMonthly = ref(200_000);

function parseQueryInt(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

watch(
  () => props.initialHealthInsuranceFee,
  (next) => {
    if (typeof next === "number" && Number.isFinite(next) && next > 0) {
      healthInsuranceFee.value = Math.floor(next);
    }
  },
  { immediate: true }
);

onMounted(() => {
  const hasPathHealth =
    typeof props.initialHealthInsuranceFee === "number" &&
    Number.isFinite(props.initialHealthInsuranceFee) &&
    props.initialHealthInsuranceFee > 0;

  const modeRaw = Array.isArray(route.query.mode) ? route.query.mode[0] : route.query.mode;
  if (modeRaw === "reverse" || modeRaw === "forward") {
    mode.value = modeRaw;
  }

  const healthFromQuery = parseQueryInt(route.query.health);
  if (!hasPathHealth && healthFromQuery !== null && healthFromQuery > 0) {
    healthInsuranceFee.value = Math.max(0, Math.min(5_000_000, healthFromQuery));
  }

  const grossFromQuery = parseQueryInt(route.query.gross);
  if (grossFromQuery !== null && grossFromQuery > 0) {
    forwardCalc.annualGross.value = Math.max(0, Math.min(10_000_000_000, grossFromQuery));
  }

  const depFromQuery = parseQueryInt(route.query.dep);
  if (depFromQuery !== null) {
    dependents.value = Math.max(1, Math.min(20, depFromQuery));
  }

  const childFromQuery = parseQueryInt(route.query.child);
  if (childFromQuery !== null) {
    childrenUnder20.value = Math.max(0, Math.min(20, childFromQuery));
  }

  const nonTaxFromQuery = parseQueryInt(route.query.nontax);
  if (nonTaxFromQuery !== null) {
    nonTaxableMonthly.value = Math.max(0, Math.min(5_000_000, nonTaxFromQuery));
  }

  const maxChildren = Math.max(0, dependents.value - 1);
  if (childrenUnder20.value > maxChildren) {
    childrenUnder20.value = maxChildren;
  }
});

const reverse = useInsuranceReverse({
  healthInsuranceFee,
  dependents,
  childrenUnder20,
  nonTaxableMonthly,
});

const forwardCalc = useSalaryCalc({
  initialAnnualGross: 40_000_000,
  initialDependents: 1,
  initialChildrenUnder20: 0,
  initialNonTaxableMonthly: 200_000,
});

watch(
  [dependents, childrenUnder20, nonTaxableMonthly],
  ([nextDependents, nextChildren, nextNonTaxable]) => {
    forwardCalc.dependents.value = nextDependents;
    forwardCalc.childrenUnder20.value = nextChildren;
    forwardCalc.nonTaxableMonthly.value = nextNonTaxable;
  },
  { immediate: true }
);

const activeCalc = computed(() =>
  mode.value === "reverse" ? reverse.calc : forwardCalc
);

const seoTitle = computed(() => {
  if (mode.value === "reverse") {
    return `건보료 ${formatWon(healthInsuranceFee.value)} 연봉 역산 | 2026 건강보험료 계산기`;
  }

  return `연봉 ${formatManWon(forwardCalc.annualGross.value)} 건보료 계산 | 2026 4대보험 계산기`;
});

const seoDescription = computed(() => {
  if (mode.value === "reverse") {
    return `건보료 ${formatWon(healthInsuranceFee.value)}이면 추정 연봉 ${formatManWon(reverse.estimatedAnnualGross.value)}. 2026 최신 요율로 4대보험·소득세·월 실수령액을 즉시 확인하세요.`;
  }

  return `연봉 ${formatManWon(forwardCalc.annualGross.value)} 기준 월 건보료와 4대보험, 소득세, 실수령액을 계산합니다.`;
});

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "건보료 연봉 역산",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));

function getShareUrl(): string {
  if (mode.value === "reverse") {
    const params = new URLSearchParams();
    if (dependents.value !== 1) params.set("dep", String(dependents.value));
    if (childrenUnder20.value !== 0) params.set("child", String(childrenUnder20.value));
    if (nonTaxableMonthly.value !== 200_000) params.set("nontax", String(nonTaxableMonthly.value));

    const basePath = `${window.location.origin}/insurance/${healthInsuranceFee.value}`;
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const params = new URLSearchParams();
  params.set("mode", "forward");
  params.set("gross", String(forwardCalc.annualGross.value));
  if (dependents.value !== 1) params.set("dep", String(dependents.value));
  if (childrenUnder20.value !== 0) params.set("child", String(childrenUnder20.value));
  if (nonTaxableMonthly.value !== 200_000) params.set("nontax", String(nonTaxableMonthly.value));
  return `${window.location.origin}/insurance?${params.toString()}`;
}

async function copyInsuranceLink(): Promise<void> {
  try {
    const link = getShareUrl();
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else if (!copyUsingExecCommand(link)) {
      throw new Error("clipboard unavailable");
    }
    showAlert("링크를 복사했습니다");
  } catch {
    showAlert("링크 복사에 실패했습니다", { type: "error" });
  }
}

async function shareInsurance(): Promise<void> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: seoTitle.value,
        text: seoDescription.value,
        url: getShareUrl(),
      });
      return;
    } catch {
      // 사용자가 공유를 취소한 경우
    }
  }
  await copyInsuranceLink();
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => activeCalc.value.monthlyNet.value,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      if (mode.value === "reverse") {
        addEntry({
          type: "insurance",
          label: `건보료 ${formatWon(healthInsuranceFee.value)}`,
          path: "/insurance",
          summary: `추정 연봉 ${formatManWon(reverse.estimatedAnnualGross.value)}`,
        });
      } else {
        if (forwardCalc.annualGross.value <= 0) return;
        addEntry({
          type: "insurance",
          label: `연봉 ${formatManWon(forwardCalc.annualGross.value)}`,
          path: "/insurance",
          summary: `월 실수령 ${formatWon(forwardCalc.monthlyNet.value)}`,
        });
      }
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <h1 class="text-h1 font-title">2026 건강보험료 연봉 역산 계산기</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <div class="space-y-4">
          <InsuranceInput
            v-model:mode="mode"
            v-model:health-insurance-fee="healthInsuranceFee"
            v-model:annual-gross="forwardCalc.annualGross.value"
            v-model:dependents="dependents"
            v-model:children-under20="childrenUnder20"
            v-model:non-taxable-monthly="nonTaxableMonthly"
          />

          <InsuranceResult
            :mode="mode"
            :health-insurance-fee="healthInsuranceFee"
            :estimated-taxable-monthly="reverse.estimatedTaxableMonthly.value"
            :estimated-annual-gross="reverse.estimatedAnnualGross.value"
            :calc="activeCalc"
          />
        </div>

        <button type="button" class="retro-button-subtle" @click="shareInsurance">공유</button>

        <AdSlot slot="110001" label="광고 · top" />

        <InsuranceTable />

        <AdSlot slot="110002" label="광고 · middle" />

        <CalcSourceBox />
        <InternalLink current="insurance" />

        <AdSlot slot="110003" label="광고 · bottom" />

      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="insurance-main" @share-request="shareInsurance" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
