// 육아휴직 급여 상수 (2025~2026 기준, 고용보험법 시행령)

export const PARENTAL_LEAVE_MIN = 700_000; // 하한

/** 일반 육아휴직 급여 구간 */
export const GENERAL_BRACKETS = [
  { fromMonth: 1, toMonth: 3, rate: 1.0, cap: 2_500_000 },
  { fromMonth: 4, toMonth: 6, rate: 1.0, cap: 2_000_000 },
  { fromMonth: 7, toMonth: 12, rate: 0.8, cap: 1_600_000 },
] as const;

/** 6+6 부모육아휴직제 상한 (1~6개월 월별) */
export const PARENT_66_CAPS = [
  2_500_000, // 1개월
  2_500_000, // 2개월
  3_000_000, // 3개월
  3_500_000, // 4개월
  4_000_000, // 5개월
  4_500_000, // 6개월
] as const;

/** 한부모 특례 구간 */
export const SINGLE_PARENT_BRACKETS = [
  { fromMonth: 1, toMonth: 3, rate: 1.0, cap: 3_000_000 },
  { fromMonth: 4, toMonth: 6, rate: 1.0, cap: 2_000_000 },
  { fromMonth: 7, toMonth: 12, rate: 0.8, cap: 1_600_000 },
] as const;

export type ParentalLeaveType = "general" | "parent66" | "singleParent";

export const PARENTAL_LEAVE_TYPE_LABELS: Record<ParentalLeaveType, string> = {
  general: "일반 육아휴직",
  parent66: "6+6 부모육아휴직제",
  singleParent: "한부모 특례",
};

export const PARENTAL_LEAVE_SALARY_PRESETS = [
  { label: "250만원", value: 2_500_000 },
  { label: "300만원", value: 3_000_000 },
  { label: "350만원", value: 3_500_000 },
  { label: "400만원", value: 4_000_000 },
];

export const PARENTAL_LEAVE_AMOUNTS = [250, 300, 350, 400, 450, 500];

export const PARENTAL_LEAVE_UPDATED = "2026.01";

export const PARENTAL_LEAVE_FAQS = [
  {
    question: "육아휴직 급여는 누가 받을 수 있나요?",
    answer:
      "만 8세 이하 또는 초등학교 2학년 이하 자녀가 있는 근로자로, 육아휴직 개시일 전 고용보험 피보험기간이 180일 이상이어야 합니다.",
  },
  {
    question: "6+6 부모육아휴직제란 무엇인가요?",
    answer:
      "자녀 출생 후 18개월 이내에 부모가 모두 육아휴직을 사용하면, 처음 6개월간 최대 월 450만원까지 지원하는 제도입니다. 부모 각각에게 적용됩니다.",
  },
  {
    question: "통상임금이란 무엇인가요?",
    answer:
      "근로자에게 정기적·일률적·고정적으로 지급하는 임금입니다. 기본급, 직책수당, 정기상여금 등이 포함되며 연장·야간 수당 등 비정기적 급여는 제외됩니다.",
  },
  {
    question: "육아휴직 기간은 최대 얼마인가요?",
    answer:
      "자녀 1명당 최대 1년(12개월)입니다. 부모 각각 1년씩 사용할 수 있으므로 가구 기준 최대 2년입니다.",
  },
];
