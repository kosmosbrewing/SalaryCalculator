import { describe, expect, it } from "vitest";
import {
  calculateWeeklyHolidayPay,
  calculateWageConversion,
  calculateSeverancePay,
} from "@/utils/laborCalculator";

describe("calculateWeeklyHolidayPay", () => {
  it("2026 최저시급 10,320원, 주 5일 8시간 근무", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 10_320,
      workDaysPerWeek: 5,
      hoursPerDay: 8,
    });
    expect(result.weeklyHours).toBe(40);
    expect(result.isEligible).toBe(true);
    // 주휴수당 = 10,320 × (40/40) × 8 = 82,560
    expect(result.weeklyHolidayPay).toBe(82_560);
    expect(result.weeklyWage).toBe(412_800);
    // 실질 시급 = (412,800 + 82,560) / 40 = 12,384
    expect(result.effectiveHourlyWage).toBe(12_384);
    // 월급 = (412,800 + 82,560) × 4.345 ≈ 2,152,339
    expect(result.estimatedMonthlyPay).toBe(2_152_339);
  });

  it("주 15시간 미만이면 주휴수당 미발생", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 10_320,
      workDaysPerWeek: 2,
      hoursPerDay: 5,
    });
    expect(result.weeklyHours).toBe(10);
    expect(result.isEligible).toBe(false);
    expect(result.weeklyHolidayPay).toBe(0);
    expect(result.monthlyDifference).toBe(0);
  });

  it("주 3일 5시간 근무 시 주휴수당 발생 (15시간)", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 10_320,
      workDaysPerWeek: 3,
      hoursPerDay: 5,
    });
    expect(result.weeklyHours).toBe(15);
    expect(result.isEligible).toBe(true);
    // 주휴수당 = 10,320 × (15/40) × 8 = 30,960
    expect(result.weeklyHolidayPay).toBe(30_960);
  });

  it("시급 15,000원 주 6일 4시간", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 15_000,
      workDaysPerWeek: 6,
      hoursPerDay: 4,
    });
    expect(result.weeklyHours).toBe(24);
    expect(result.isEligible).toBe(true);
    // 주휴수당 = 15,000 × (24/40) × 8 = 72,000
    expect(result.weeklyHolidayPay).toBe(72_000);
  });
});

describe("calculateWageConversion", () => {
  it("시급 10,320원 → 월급 (주휴 포함, 주 40시간)", () => {
    const result = calculateWageConversion({
      base: "hourly",
      amount: 10_320,
      weeklyWorkHours: 40,
      includeWeeklyHoliday: true,
    });
    // 유효 주시간 = 40 + 8 = 48
    expect(result.effectiveWeeklyHours).toBe(48);
    expect(result.hourly).toBe(10_320);
    expect(result.daily).toBe(82_560);
    // 월 = 10,320 × 48 × 4.345 ≈ 2,152,434
    expect(result.monthly).toBeGreaterThan(2_100_000);
    expect(result.annual).toBe(result.monthly * 12);
  });

  it("월급 300만원 → 시급 (주휴 미포함, 주 40시간)", () => {
    const result = calculateWageConversion({
      base: "monthly",
      amount: 3_000_000,
      weeklyWorkHours: 40,
      includeWeeklyHoliday: false,
    });
    // 월시간 = 40 × 4.345 = 173.8
    expect(result.monthlyHours).toBeCloseTo(173.8, 0);
    // 시급 = 3,000,000 / 173.8 ≈ 17,261
    expect(result.hourly).toBeGreaterThan(17_000);
    expect(result.hourly).toBeLessThan(18_000);
  });

  it("연봉 3600만원 → 시급 (주휴 포함)", () => {
    const result = calculateWageConversion({
      base: "annual",
      amount: 36_000_000,
      weeklyWorkHours: 40,
      includeWeeklyHoliday: true,
    });
    // 월급 = 3,000,000, 월시간 = 48 × 4.345 = 208.6
    // 시급 = 3,000,000 / 208.6 ≈ 14,382
    expect(result.hourly).toBeGreaterThan(14_000);
    expect(result.hourly).toBeLessThan(15_000);
    expect(result.annual).toBeCloseTo(36_000_000, -4);
  });
});

describe("calculateSeverancePay", () => {
  it("1년 근속 월급 300만원", () => {
    const result = calculateSeverancePay({
      yearsOfService: 1,
      averageMonthlySalary: 3_000_000,
    });
    expect(result.isEligible).toBe(true);
    // 1일 평균임금 = 3,000,000 × 3 / 90 = 100,000
    expect(result.dailyAvgWage).toBe(100_000);
    // 퇴직금 = 100,000 × 30 × (365/365) = 3,000,000
    expect(result.severancePay).toBe(3_000_000);
    // 소액이므로 세금 매우 적음
    expect(result.netSeverancePay).toBeLessThanOrEqual(result.severancePay);
  });

  it("5년 근속 월급 400만원", () => {
    const result = calculateSeverancePay({
      yearsOfService: 5,
      averageMonthlySalary: 4_000_000,
    });
    expect(result.isEligible).toBe(true);
    const expectedDailyWage = Math.round((4_000_000 * 3) / 90);
    expect(result.dailyAvgWage).toBe(expectedDailyWage);
    // 퇴직금 = 일평균 × 30 × 5
    expect(result.severancePay).toBe(Math.round(expectedDailyWage * 30 * 5));
  });

  it("1년 미만은 수급요건 미충족", () => {
    const result = calculateSeverancePay({
      yearsOfService: 0,
      averageMonthlySalary: 3_000_000,
    });
    expect(result.isEligible).toBe(false);
    expect(result.severancePay).toBe(0);
  });

  it("10년 근속 비교 데이터가 6개", () => {
    const result = calculateSeverancePay({
      yearsOfService: 10,
      averageMonthlySalary: 3_500_000,
    });
    expect(result.comparisonData).toHaveLength(6);
    // 1년차 < 10년차
    expect(result.comparisonData[0].amount).toBeLessThan(result.comparisonData[3].amount);
  });

  it("퇴직소득세가 계산되어 실수령이 줄어든다 (고액)", () => {
    const result = calculateSeverancePay({
      yearsOfService: 20,
      averageMonthlySalary: 8_000_000,
    });
    expect(result.severanceTax).toBeGreaterThan(0);
    expect(result.netSeverancePay).toBeLessThan(result.severancePay);
    expect(result.netSeverancePay).toBe(result.severancePay - result.severanceTax);
  });
});
