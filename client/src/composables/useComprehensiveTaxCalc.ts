import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { type IndustryKey } from "@/data/freelanceTaxRates";
import {
  BUSINESS_WITHHOLDING,
  OTHER_INCOME_EXPENSE_RATE,
  OTHER_SEPARATE_MAX_INCOME_AMOUNT,
  OTHER_WITHHOLDING,
  RENTAL_REGISTERED_INCOME_RATE,
  RENTAL_SEPARATE_MAX_REVENUE,
  RENTAL_SEPARATE_TAX_RATE,
  RENTAL_UNREGISTERED_INCOME_RATE,
  RENTAL_WITHHOLDING,
  STANDARD_TAX_CREDIT_COMPREHENSIVE,
} from "@/data/comprehensiveTaxRules";
import {
  calcPensionDeduction,
  calcProgressiveIncomeTax,
  calcSimpleExpense,
} from "@/composables/useFreelanceCalc";
import {
  LOCAL_INCOME_TAX_RATE,
  PERSONAL_DEDUCTION_PER_PERSON,
} from "@/data/taxRates2026";

export type IncomeSourceType = "business" | "rental" | "other";

export type BusinessInput = {
  enabled: boolean;
  revenue: number;
  industryKey: IndustryKey;
  customExpenseRate: number | null;
};

export type RentalInput = {
  enabled: boolean;
  revenue: number;
  registered: boolean;
  customExpenseRate: number | null;
  preferSeparate: boolean;
};

export type OtherInput = {
  enabled: boolean;
  revenue: number;
  customExpenseRate: number | null;
  preferSeparate: boolean;
};

export type ComprehensiveTaxInput = {
  business: BusinessInput;
  rental: RentalInput;
  other: OtherInput;
  dependents: number;
  includePension: boolean;
};

export type SourceResult = {
  type: IncomeSourceType;
  revenue: number;
  expense: number;
  expenseRate: number;
  incomeAmount: number;
  taxation: "comprehensive" | "separate";
  separateTax: number;
  withheld: number;
};

export type ComprehensiveTaxResult = {
  sources: SourceResult[];
  comprehensiveIncome: number;
  personalDeduction: number;
  pensionDeduction: number;
  taxableBase: number;
  calculatedTax: number;
  taxCredit: number;
  determinedTax: number;
  localTax: number;
  separateTaxTotal: number;
  totalTax: number;
  totalWithheld: number;
  netPayable: number;
  effectiveRate: number;
  totalRevenue: number;
  rentalCompare: { comprehensive: number; separate: number } | null;
  otherCompare: { comprehensive: number; separate: number } | null;
};

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value || 0)));
}

function toWon(value: number): number {
  return Math.max(0, Math.floor(value || 0));
}

function normalizeExpenseRate(customExpenseRate: number | null): number | null {
  if (customExpenseRate == null || !Number.isFinite(customExpenseRate)) return null;
  return Math.max(0, Math.min(95, customExpenseRate)) / 100;
}

function buildBusinessSource(input: BusinessInput): SourceResult | null {
  if (!input.enabled) return null;

  const revenue = toWon(input.revenue);
  if (revenue <= 0) return null;

  const customRate = normalizeExpenseRate(input.customExpenseRate);
  const expense =
    customRate == null
      ? calcSimpleExpense(revenue, input.industryKey)
      : Math.floor(revenue * customRate);
  const expenseRate = revenue > 0 ? expense / revenue : 0;
  const incomeAmount = Math.max(0, revenue - expense);

  return {
    type: "business",
    revenue,
    expense,
    expenseRate,
    incomeAmount,
    taxation: "comprehensive",
    separateTax: 0,
    withheld: Math.floor(revenue * BUSINESS_WITHHOLDING),
  };
}

function buildRentalSource(input: RentalInput): SourceResult | null {
  if (!input.enabled) return null;

  const revenue = toWon(input.revenue);
  if (revenue <= 0) return null;

  const customRate = normalizeExpenseRate(input.customExpenseRate);
  const defaultIncomeRate = input.registered
    ? RENTAL_REGISTERED_INCOME_RATE
    : RENTAL_UNREGISTERED_INCOME_RATE;

  const expense =
    customRate == null
      ? Math.floor(revenue * (1 - defaultIncomeRate))
      : Math.floor(revenue * customRate);

  const expenseRate = revenue > 0 ? expense / revenue : 0;
  const incomeAmount = Math.max(0, revenue - expense);
  const separateEligible = revenue <= RENTAL_SEPARATE_MAX_REVENUE;
  const taxation =
    separateEligible && input.preferSeparate ? "separate" : "comprehensive";
  const separateTax =
    taxation === "separate"
      ? Math.floor(incomeAmount * RENTAL_SEPARATE_TAX_RATE * (1 + LOCAL_INCOME_TAX_RATE))
      : 0;

  return {
    type: "rental",
    revenue,
    expense,
    expenseRate,
    incomeAmount,
    taxation,
    separateTax,
    withheld: Math.floor(revenue * RENTAL_WITHHOLDING),
  };
}

function buildOtherSource(input: OtherInput): SourceResult | null {
  if (!input.enabled) return null;

  const revenue = toWon(input.revenue);
  if (revenue <= 0) return null;

  const customRate = normalizeExpenseRate(input.customExpenseRate);
  const expenseRate = customRate ?? OTHER_INCOME_EXPENSE_RATE;
  const expense = Math.floor(revenue * expenseRate);
  const incomeAmount = Math.max(0, revenue - expense);
  const withheld = Math.floor(revenue * OTHER_WITHHOLDING);

  const separateEligible = incomeAmount <= OTHER_SEPARATE_MAX_INCOME_AMOUNT;
  const taxation =
    separateEligible && input.preferSeparate ? "separate" : "comprehensive";
  const separateTax = taxation === "separate" ? withheld : 0;

  return {
    type: "other",
    revenue,
    expense,
    expenseRate,
    incomeAmount,
    taxation,
    separateTax,
    withheld,
  };
}

function calcComprehensiveTotalTax(params: {
  comprehensiveIncome: number;
  personalDeduction: number;
  pensionDeduction: number;
}): {
  taxableBase: number;
  calculatedTax: number;
  taxCredit: number;
  determinedTax: number;
  localTax: number;
  total: number;
} {
  const taxableBase = Math.max(
    0,
    params.comprehensiveIncome - params.personalDeduction - params.pensionDeduction
  );
  const calculatedTax = calcProgressiveIncomeTax(taxableBase);
  const taxCredit = STANDARD_TAX_CREDIT_COMPREHENSIVE;
  const determinedTax = Math.max(0, calculatedTax - taxCredit);
  const localTax = Math.floor(determinedTax * LOCAL_INCOME_TAX_RATE);
  return {
    taxableBase,
    calculatedTax,
    taxCredit,
    determinedTax,
    localTax,
    total: determinedTax + localTax,
  };
}

export function calculateComprehensiveTax(
  input: ComprehensiveTaxInput
): ComprehensiveTaxResult {
  const dependents = clampInt(input.dependents, 1, 20);

  const sources = [
    buildBusinessSource(input.business),
    buildRentalSource(input.rental),
    buildOtherSource(input.other),
  ].filter((value): value is SourceResult => value !== null);

  const comprehensiveSources = sources.filter(
    (source) => source.taxation === "comprehensive"
  );

  const comprehensiveIncome = comprehensiveSources.reduce(
    (sum, source) => sum + source.incomeAmount,
    0
  );
  const personalDeduction = dependents * PERSONAL_DEDUCTION_PER_PERSON;

  const businessIncomeAmount =
    sources.find((source) => source.type === "business")?.incomeAmount ?? 0;
  const pensionDeduction =
    input.includePension && businessIncomeAmount > 0
      ? calcPensionDeduction(businessIncomeAmount)
      : 0;

  const comprehensiveTax = calcComprehensiveTotalTax({
    comprehensiveIncome,
    personalDeduction,
    pensionDeduction,
  });

  const separateTaxTotal = sources.reduce(
    (sum, source) => sum + source.separateTax,
    0
  );

  const totalTax = comprehensiveTax.total + separateTaxTotal;
  const totalWithheld = sources.reduce((sum, source) => sum + source.withheld, 0);
  const netPayable = totalTax - totalWithheld;
  const totalRevenue = sources.reduce((sum, source) => sum + source.revenue, 0);
  const effectiveRate = totalRevenue > 0 ? totalTax / totalRevenue : 0;

  const rentalSource = sources.find((source) => source.type === "rental") ?? null;
  let rentalCompare: { comprehensive: number; separate: number } | null = null;
  if (
    rentalSource &&
    rentalSource.revenue > 0 &&
    rentalSource.revenue <= RENTAL_SEPARATE_MAX_REVENUE
  ) {
    const baseIncome =
      comprehensiveIncome -
      (rentalSource.taxation === "comprehensive" ? rentalSource.incomeAmount : 0);
    const withComprehensive = calcComprehensiveTotalTax({
      comprehensiveIncome: baseIncome + rentalSource.incomeAmount,
      personalDeduction,
      pensionDeduction,
    }).total;
    const withoutSource = calcComprehensiveTotalTax({
      comprehensiveIncome: baseIncome,
      personalDeduction,
      pensionDeduction,
    }).total;
    rentalCompare = {
      comprehensive: Math.max(0, withComprehensive - withoutSource),
      separate: Math.floor(
        rentalSource.incomeAmount *
          RENTAL_SEPARATE_TAX_RATE *
          (1 + LOCAL_INCOME_TAX_RATE)
      ),
    };
  }

  const otherSource = sources.find((source) => source.type === "other") ?? null;
  let otherCompare: { comprehensive: number; separate: number } | null = null;
  if (
    otherSource &&
    otherSource.revenue > 0 &&
    otherSource.incomeAmount <= OTHER_SEPARATE_MAX_INCOME_AMOUNT
  ) {
    const baseIncome =
      comprehensiveIncome -
      (otherSource.taxation === "comprehensive" ? otherSource.incomeAmount : 0);
    const withComprehensive = calcComprehensiveTotalTax({
      comprehensiveIncome: baseIncome + otherSource.incomeAmount,
      personalDeduction,
      pensionDeduction,
    }).total;
    const withoutSource = calcComprehensiveTotalTax({
      comprehensiveIncome: baseIncome,
      personalDeduction,
      pensionDeduction,
    }).total;
    otherCompare = {
      comprehensive: Math.max(0, withComprehensive - withoutSource),
      separate: Math.floor(otherSource.revenue * OTHER_WITHHOLDING),
    };
  }

  return {
    sources,
    comprehensiveIncome,
    personalDeduction,
    pensionDeduction,
    taxableBase: comprehensiveTax.taxableBase,
    calculatedTax: comprehensiveTax.calculatedTax,
    taxCredit: comprehensiveTax.taxCredit,
    determinedTax: comprehensiveTax.determinedTax,
    localTax: comprehensiveTax.localTax,
    separateTaxTotal,
    totalTax,
    totalWithheld,
    netPayable,
    effectiveRate,
    totalRevenue,
    rentalCompare,
    otherCompare,
  };
}

export function useComprehensiveTaxCalc(
  input: MaybeRefOrGetter<ComprehensiveTaxInput>
) {
  return computed(() => calculateComprehensiveTax(toValue(input)));
}
