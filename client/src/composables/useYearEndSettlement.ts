import { computed, ref } from "vue";
import {
  calculateYearEndSettlement,
  type YearEndSettlementInput,
} from "@/utils/yearEndSettlementCalculator";

const DEFAULT_INPUT: YearEndSettlementInput = {
  annualSalary: 52_000_000,
  dependents: 1,
  children: 0,
  creditCardSpend: 8_000_000,
  debitCardSpend: 4_000_000,
  insurancePremium: 600_000,
  medicalExpense: 1_000_000,
  educationExpense: 0,
  donationAmount: 0,
  pensionSavings: 4_000_000,
  irpContribution: 3_000_000,
  monthlyRent: 0,
  rentMonths: 12,
};

export function useYearEndSettlement(initialSalary?: number) {
  const annualSalary = ref(initialSalary ?? DEFAULT_INPUT.annualSalary);
  const dependents = ref(DEFAULT_INPUT.dependents);
  const children = ref(DEFAULT_INPUT.children);
  const creditCardSpend = ref(DEFAULT_INPUT.creditCardSpend);
  const debitCardSpend = ref(DEFAULT_INPUT.debitCardSpend);
  const insurancePremium = ref(DEFAULT_INPUT.insurancePremium);
  const medicalExpense = ref(DEFAULT_INPUT.medicalExpense);
  const educationExpense = ref(DEFAULT_INPUT.educationExpense);
  const donationAmount = ref(DEFAULT_INPUT.donationAmount);
  const pensionSavings = ref(DEFAULT_INPUT.pensionSavings);
  const irpContribution = ref(DEFAULT_INPUT.irpContribution);
  const monthlyRent = ref(DEFAULT_INPUT.monthlyRent);
  const rentMonths = ref(DEFAULT_INPUT.rentMonths);

  const result = computed(() =>
    calculateYearEndSettlement({
      annualSalary: annualSalary.value,
      dependents: dependents.value,
      children: children.value,
      creditCardSpend: creditCardSpend.value,
      debitCardSpend: debitCardSpend.value,
      insurancePremium: insurancePremium.value,
      medicalExpense: medicalExpense.value,
      educationExpense: educationExpense.value,
      donationAmount: donationAmount.value,
      pensionSavings: pensionSavings.value,
      irpContribution: irpContribution.value,
      monthlyRent: monthlyRent.value,
      rentMonths: rentMonths.value,
    })
  );

  return {
    annualSalary,
    dependents,
    children,
    creditCardSpend,
    debitCardSpend,
    insurancePremium,
    medicalExpense,
    educationExpense,
    donationAmount,
    pensionSavings,
    irpContribution,
    monthlyRent,
    rentMonths,
    result,
  };
}
