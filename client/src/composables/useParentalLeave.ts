import { computed, ref } from "vue";
import type { ParentalLeaveType } from "@/data/parentalLeave";
import { calculateParentalLeave } from "@/utils/parentalLeaveCalculator";

export function useParentalLeave(initialWage?: number) {
  const monthlyWage = ref(initialWage ?? 3_000_000);
  const months = ref(12);
  const leaveType = ref<ParentalLeaveType>("general");

  const result = computed(() =>
    calculateParentalLeave({
      monthlyWage: monthlyWage.value,
      months: months.value,
      leaveType: leaveType.value,
    })
  );

  return { monthlyWage, months, leaveType, result };
}
