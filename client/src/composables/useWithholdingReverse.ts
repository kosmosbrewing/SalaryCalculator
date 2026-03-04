import { computed, watch, type ComputedRef, type Ref } from "vue";
import { calculateSalaryBreakdown } from "@/utils/calculator";
import { useSalaryCalc, type SalaryCalcResult } from "@/composables/useSalaryCalc";

type WithholdingReverseInput = {
  monthlyIncomeTax: Ref<number>;  // 사용자 입력 소득세 (지방소득세 제외)
  dependents: Ref<number>;
  childrenUnder20: Ref<number>;
  nonTaxableMonthly: Ref<number>;
};

export type WithholdingReverseResult = {
  estimatedAnnualGross: ComputedRef<number>;
  calc: SalaryCalcResult;
};

// 소득세는 누진세 → 선형 계산 불가, 이진탐색으로 계산
function findAnnualGrossFromMonthlyIncomeTax(
  target: number,
  dependents: number,
  childrenUnder20: number,
  nonTaxableMonthly: number
): number {
  if (target <= 0) return 0;
  let lo = 1_000_000;
  let hi = 3_000_000_000;
  for (let i = 0; i < 60; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const { monthlyIncomeTax } = calculateSalaryBreakdown({
      grossAnnual: mid,
      nonTaxableMonthly,
      dependents,
      children: childrenUnder20,
      retirementIncluded: false,
    });
    if (monthlyIncomeTax < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function useWithholdingReverse(input: WithholdingReverseInput): WithholdingReverseResult {
  const estimatedAnnualGross = computed(() =>
    findAnnualGrossFromMonthlyIncomeTax(
      input.monthlyIncomeTax.value,
      input.dependents.value,
      input.childrenUnder20.value,
      input.nonTaxableMonthly.value
    )
  );

  const calc = useSalaryCalc({
    initialAnnualGross: estimatedAnnualGross.value,
    initialDependents: input.dependents.value,
    initialChildrenUnder20: input.childrenUnder20.value,
    initialNonTaxableMonthly: input.nonTaxableMonthly.value,
    initialRetirementIncluded: false,
  });

  // 계산값 변경 시 정방향 계산기에 동기화
  watch(
    [estimatedAnnualGross, input.dependents, input.childrenUnder20, input.nonTaxableMonthly],
    ([gross, dep, child, nonTax]) => {
      calc.annualGross.value = gross;
      calc.dependents.value = dep;
      calc.childrenUnder20.value = child;
      calc.nonTaxableMonthly.value = nonTax;
    },
    { immediate: true }
  );

  return { estimatedAnnualGross, calc };
}
