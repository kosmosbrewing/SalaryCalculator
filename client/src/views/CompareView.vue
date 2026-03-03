<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";


import CompareInput from "@/components/compare/CompareInput.vue";
import CompareResult from "@/components/compare/CompareResult.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";

import {
  copyUsingExecCommand,
  formatManWon,
  formatManWonValue,
  formatWon,
} from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { showAlert } from "@/composables/useAlert";
import { addEntry } from "@/composables/useRecentCalcs";

type CompanyState = {
  annualGross: number;
  nonTaxableMonthly: number;
  retirementIncluded: boolean;
};

const props = defineProps<{
  initialAManWon?: number;
  initialBManWon?: number;
}>();

const route = useRoute();
const router = useRouter();
const initialized = ref(false);

const companyA = ref<CompanyState>({
  annualGross: 40_000_000,
  nonTaxableMonthly: 200_000,
  retirementIncluded: false,
});

const companyB = ref<CompanyState>({
  annualGross: 50_000_000,
  nonTaxableMonthly: 200_000,
  retirementIncluded: false,
});

const dependents = ref(1);
const childrenUnder20 = ref(0);

const calcA = useSalaryCalc({
  initialAnnualGross: companyA.value.annualGross,
  initialNonTaxableMonthly: companyA.value.nonTaxableMonthly,
  initialDependents: 1,
  initialChildrenUnder20: 0,
});

const calcB = useSalaryCalc({
  initialAnnualGross: companyB.value.annualGross,
  initialNonTaxableMonthly: companyB.value.nonTaxableMonthly,
  initialDependents: 1,
  initialChildrenUnder20: 0,
});

watch(
  [companyA, dependents, childrenUnder20],
  ([nextA, dep, child]) => {
    calcA.annualGross.value = nextA.annualGross;
    calcA.nonTaxableMonthly.value = nextA.nonTaxableMonthly;
    calcA.retirementIncluded.value = nextA.retirementIncluded;
    calcA.dependents.value = dep;
    calcA.childrenUnder20.value = child;
  },
  { deep: true, immediate: true }
);

watch(
  [companyB, dependents, childrenUnder20],
  ([nextB, dep, child]) => {
    calcB.annualGross.value = nextB.annualGross;
    calcB.nonTaxableMonthly.value = nextB.nonTaxableMonthly;
    calcB.retirementIncluded.value = nextB.retirementIncluded;
    calcB.dependents.value = dep;
    calcB.childrenUnder20.value = child;
  },
  { deep: true, immediate: true }
);

function parseIntSafe(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

onMounted(() => {
  if (props.initialAManWon && props.initialBManWon) {
    companyA.value.annualGross = props.initialAManWon * 10_000;
    companyB.value.annualGross = props.initialBManWon * 10_000;
  }

  const q = route.query;

  if (q.a) companyA.value.annualGross = parseIntSafe(q.a, 4000) * 10_000;
  if (q.b) companyB.value.annualGross = parseIntSafe(q.b, 5000) * 10_000;
  if (q.na) companyA.value.nonTaxableMonthly = parseIntSafe(q.na, 20) * 10_000;
  if (q.nb) companyB.value.nonTaxableMonthly = parseIntSafe(q.nb, 20) * 10_000;
  if (q.ra) companyA.value.retirementIncluded = String(q.ra) === "1";
  if (q.rb) companyB.value.retirementIncluded = String(q.rb) === "1";

  dependents.value = parseIntSafe(q.dep, 1);
  childrenUnder20.value = parseIntSafe(q.child, 0);

  initialized.value = true;
});

watch(
  [companyA, companyB, dependents, childrenUnder20],
  ([a, b, dep, child]) => {
    if (!initialized.value) return;

    const query: Record<string, string> = {
      a: String(Math.floor(a.annualGross / 10_000)),
      b: String(Math.floor(b.annualGross / 10_000)),
    };

    if (a.nonTaxableMonthly !== 200_000) query.na = String(Math.floor(a.nonTaxableMonthly / 10_000));
    if (b.nonTaxableMonthly !== 200_000) query.nb = String(Math.floor(b.nonTaxableMonthly / 10_000));
    if (a.retirementIncluded) query.ra = "1";
    if (b.retirementIncluded) query.rb = "1";
    if (dep !== 1) query.dep = String(dep);
    if (child !== 0) query.child = String(child);

    router.replace({ query });
  },
  { deep: true, flush: "post" }
);

const monthlyNetDiff = computed(() => calcB.monthlyNet.value - calcA.monthlyNet.value);

const seoTitle = computed(
  () =>
    `연봉 ${formatManWonValue(Math.floor(companyA.value.annualGross / 10_000))} vs ${formatManWonValue(Math.floor(companyB.value.annualGross / 10_000))} 이직 비교 | 실수령 차이 계산`
);

const seoDescription = computed(
  () => `연봉 ${formatManWon(companyA.value.annualGross)}에서 ${formatManWon(companyB.value.annualGross)}로 이직하면 월 실수령은 ${formatWon(monthlyNetDiff.value)} 차이. 4대보험·세금 반영 실수령 비교를 즉시 확인하세요.`
);

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "이직 연봉 비교 계산기",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));

function compareShareUrl(): string {
  const params = new URLSearchParams(route.query as Record<string, string>);
  const query = params.toString();
  return query
    ? `${window.location.origin}${route.path}?${query}`
    : `${window.location.origin}${route.path}`;
}

async function copyCompareLink(): Promise<void> {
  try {
    const link = compareShareUrl();
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else if (!copyUsingExecCommand(link)) {
      throw new Error("clipboard unavailable");
    }
    showAlert("비교 링크를 복사했습니다");
  } catch {
    showAlert("링크 복사에 실패했습니다", { type: "error" });
  }
}

async function shareCompare(): Promise<void> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: seoTitle.value,
        text: seoDescription.value,
        url: compareShareUrl(),
      });
      return;
    } catch {
      // 사용자가 공유를 취소한 경우도 여기로 들어올 수 있음
    }
  }

  await copyCompareLink();
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  monthlyNetDiff,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const aManWon = Math.floor(companyA.value.annualGross / 10_000);
      const bManWon = Math.floor(companyB.value.annualGross / 10_000);
      addEntry({
        type: "compare",
        label: `${formatManWonValue(aManWon)} vs ${formatManWonValue(bManWon)}`,
        path: `/compare?a=${aManWon}&b=${bManWon}`,
        summary: `차이 월 ${formatWon(Math.abs(monthlyNetDiff.value))}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <h1 class="text-h1 font-title">이직 연봉 비교 계산기</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <CompareInput
          v-model:company-a="companyA"
          v-model:company-b="companyB"
          v-model:dependents="dependents"
          v-model:children-under20="childrenUnder20"
        >
          <template #result>
            <CompareResult
              embedded
              :calc-a="calcA"
              :calc-b="calcB"
            />
          </template>
        </CompareInput>

        <button type="button" class="retro-button-subtle" @click="shareCompare">공유</button>

        <AdSlot slot="130001" label="광고 · top" />

        <AdSlot slot="130002" label="광고 · middle" />

        <InternalLink current="compare" />

        <AdSlot slot="130003" label="광고 · bottom" />

      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="compare-main" @share-request="shareCompare" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
