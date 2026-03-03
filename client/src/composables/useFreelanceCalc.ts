import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { INCOME_TAX_BRACKETS } from "@/data/taxBrackets";
import {
  BUSINESS_WITHHOLDING_RATE,
  FREELANCE_INDUSTRIES,
  type IncomeType,
  type IndustryKey,
  INDUSTRY_EXPENSE_THRESHOLD,
  LOCAL_PENSION_MAX_MONTHLY,
  LOCAL_PENSION_MIN_MONTHLY,
  LOCAL_PENSION_RATE,
  OTHER_INCOME_EXPENSE_RATE,
  OTHER_INCOME_WITHHOLDING_RATE,
} from "@/data/freelanceTaxRates";
import {
  LOCAL_INCOME_TAX_RATE,
  PERSONAL_DEDUCTION_PER_PERSON,
} from "@/data/taxRates2026";

export type FreelanceInput = {
  annualIncome: number;
  incomeType: IncomeType;
  industryKey: IndustryKey;
  dependents: number;
};

export type FreelanceCalcResult = {
  expense: number;
  expenseRate: number;
  incomeAmount: number;
  basicDeduction: number;
  pensionDeduction: number;
  taxableBase: number;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  withheld: number;
  netPayable: number;
  effectiveTaxRate: number;
};

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value || 0)));
}

export function calcProgressiveIncomeTax(taxableBase: number): number {
  const safeTaxableBase = Math.max(0, Math.floor(taxableBase));
  if (safeTaxableBase <= 0) return 0;

  for (const bracket of INCOME_TAX_BRACKETS) {
    if (safeTaxableBase <= bracket.limit) {
      return Math.floor(
        bracket.progressiveTax +
          (safeTaxableBase - bracket.baseIncome) * bracket.rate
      );
    }
  }

  return 0;
}

export function calcSimpleExpense(
  annualIncome: number,
  industryKey: IndustryKey
): number {
  const safeIncome = Math.max(0, Math.floor(annualIncome));
  if (safeIncome <= 0) return 0;

  const industry = FREELANCE_INDUSTRIES[industryKey];
  const inThreshold = Math.min(safeIncome, INDUSTRY_EXPENSE_THRESHOLD);
  const excess = Math.max(0, safeIncome - INDUSTRY_EXPENSE_THRESHOLD);

  return Math.floor(inThreshold * industry.baseRate + excess * industry.excessRate);
}

export function calcPensionDeduction(incomeAmount: number): number {
  const safeIncomeAmount = Math.max(0, Math.floor(incomeAmount));
  if (safeIncomeAmount <= 0) return 0;

  const monthlyIncome = safeIncomeAmount / 12;
  const pensionBase = Math.min(
    LOCAL_PENSION_MAX_MONTHLY,
    Math.max(LOCAL_PENSION_MIN_MONTHLY, monthlyIncome)
  );

  return Math.floor(pensionBase * LOCAL_PENSION_RATE * 12);
}

export function calculateFreelanceTax(input: FreelanceInput): FreelanceCalcResult {
  const annualIncome = Math.max(0, Math.floor(input.annualIncome || 0));
  const incomeType: IncomeType =
    input.incomeType === "other_income" ? "other_income" : "business";
  const industryKey: IndustryKey = FREELANCE_INDUSTRIES[input.industryKey]
    ? input.industryKey
    : "it";
  const dependents = clampInt(input.dependents, 1, 20);

  const expense =
    incomeType === "business"
      ? calcSimpleExpense(annualIncome, industryKey)
      : Math.floor(annualIncome * OTHER_INCOME_EXPENSE_RATE);

  const incomeAmount = Math.max(0, annualIncome - expense);

  const basicDeduction = dependents * PERSONAL_DEDUCTION_PER_PERSON;
  const pensionDeduction =
    incomeType === "business" ? calcPensionDeduction(incomeAmount) : 0;

  const taxableBase = Math.max(0, incomeAmount - basicDeduction - pensionDeduction);
  const incomeTax = calcProgressiveIncomeTax(taxableBase);
  const localTax = Math.floor(incomeTax * LOCAL_INCOME_TAX_RATE);
  const totalTax = incomeTax + localTax;

  const withholdingRate =
    incomeType === "business"
      ? BUSINESS_WITHHOLDING_RATE
      : OTHER_INCOME_WITHHOLDING_RATE;
  const withheld = Math.floor(annualIncome * withholdingRate);
  const netPayable = totalTax - withheld;

  const expenseRate = annualIncome > 0 ? expense / annualIncome : 0;
  const effectiveTaxRate = annualIncome > 0 ? totalTax / annualIncome : 0;

  return {
    expense,
    expenseRate,
    incomeAmount,
    basicDeduction,
    pensionDeduction,
    taxableBase,
    incomeTax,
    localTax,
    totalTax,
    withheld,
    netPayable,
    effectiveTaxRate,
  };
}

export function useFreelanceCalc(input: MaybeRefOrGetter<FreelanceInput>) {
  return computed(() => calculateFreelanceTax(toValue(input)));
}
