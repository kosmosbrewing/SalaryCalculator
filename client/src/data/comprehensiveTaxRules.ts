import {
  BUSINESS_WITHHOLDING_RATE,
  OTHER_INCOME_WITHHOLDING_RATE,
} from "@/data/freelanceTaxRates";

export const STANDARD_TAX_CREDIT_COMPREHENSIVE = 70_000;

// 임대소득 분리과세 소득율 (국세청: 필요경비 등록60%→소득율40%, 미등록50%→소득율50%)
export const RENTAL_REGISTERED_INCOME_RATE = 0.4;
export const RENTAL_UNREGISTERED_INCOME_RATE = 0.5;

// 임대소득 분리과세 기본공제 (소득세법 §64의2②)
// 적용 조건: 분리과세 임대소득 외 종합소득금액 ≤ 2천만원
export const RENTAL_REGISTERED_BASIC_DEDUCTION = 4_000_000;
export const RENTAL_UNREGISTERED_BASIC_DEDUCTION = 2_000_000;
export const RENTAL_BASIC_DEDUCTION_THRESHOLD = 20_000_000;

// 기타소득 필요경비율
export const OTHER_INCOME_EXPENSE_RATE = 0.6;

// 분리과세 요건
export const RENTAL_SEPARATE_MAX_REVENUE = 20_000_000;
export const OTHER_SEPARATE_MAX_INCOME_AMOUNT = 3_000_000;

// 분리과세 세율
export const RENTAL_SEPARATE_TAX_RATE = 0.14;

// 원천징수율
export const BUSINESS_WITHHOLDING = BUSINESS_WITHHOLDING_RATE;
export const OTHER_WITHHOLDING = OTHER_INCOME_WITHHOLDING_RATE;
export const RENTAL_WITHHOLDING = 0;
