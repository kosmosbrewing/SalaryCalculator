import {
  GENERAL_BRACKETS,
  PARENT_66_CAPS,
  PARENTAL_LEAVE_MIN,
  SINGLE_PARENT_BRACKETS,
  type ParentalLeaveType,
} from "@/data/parentalLeave";

export type ParentalLeaveInput = {
  monthlyWage: number; // 통상임금 (월)
  months: number; // 휴직 기간 (개월, 1~12)
  leaveType: ParentalLeaveType;
};

export type MonthlyBenefit = {
  month: number;
  rate: number;
  rawAmount: number; // rate × 통상임금
  cap: number;
  benefit: number; // min(max(rawAmount, 하한), 상한)
};

export type ParentalLeaveResult = {
  monthlyDetails: MonthlyBenefit[];
  totalBenefit: number;
  averageMonthly: number;
  incomeReplacementRate: number; // 총급여 / (통상임금 × 기간)
};

function calcMonthBenefit(
  monthlyWage: number,
  month: number,
  leaveType: ParentalLeaveType
): MonthlyBenefit {
  let rate = 1.0;
  let cap = 2_500_000;

  if (leaveType === "parent66" && month <= 6) {
    rate = 1.0;
    cap = PARENT_66_CAPS[month - 1];
  } else if (leaveType === "singleParent") {
    const bracket = SINGLE_PARENT_BRACKETS.find(
      (b) => month >= b.fromMonth && month <= b.toMonth
    );
    if (bracket) {
      rate = bracket.rate;
      cap = bracket.cap;
    }
  } else {
    // 일반 또는 6+6 7개월 이후
    const bracket = GENERAL_BRACKETS.find(
      (b) => month >= b.fromMonth && month <= b.toMonth
    );
    if (bracket) {
      rate = bracket.rate;
      cap = bracket.cap;
    }
  }

  const rawAmount = Math.floor(monthlyWage * rate);
  const benefit = Math.min(cap, Math.max(PARENTAL_LEAVE_MIN, rawAmount));

  return { month, rate, rawAmount, cap, benefit };
}

export function calculateParentalLeave(
  input: ParentalLeaveInput
): ParentalLeaveResult {
  const wage = Math.max(0, Math.floor(input.monthlyWage));
  const months = Math.max(1, Math.min(12, Math.floor(input.months)));
  const leaveType = input.leaveType;

  const monthlyDetails: MonthlyBenefit[] = [];
  for (let m = 1; m <= months; m++) {
    monthlyDetails.push(calcMonthBenefit(wage, m, leaveType));
  }

  const totalBenefit = monthlyDetails.reduce((sum, d) => sum + d.benefit, 0);
  const averageMonthly = months > 0 ? Math.floor(totalBenefit / months) : 0;
  const totalWage = wage * months;
  const incomeReplacementRate = totalWage > 0 ? totalBenefit / totalWage : 0;

  return { monthlyDetails, totalBenefit, averageMonthly, incomeReplacementRate };
}
