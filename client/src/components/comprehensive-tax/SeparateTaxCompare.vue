<script setup lang="ts">
import { computed } from "vue";
import { formatWon } from "@/lib/utils";

const props = defineProps<{
  rentalCompare: { comprehensive: number; separate: number } | null;
  otherCompare: { comprehensive: number; separate: number } | null;
}>();

type CompareItem = {
  key: "rental" | "other";
  label: string;
  comprehensive: number;
  separate: number;
};

const items = computed<CompareItem[]>(() => {
  const rows: CompareItem[] = [];
  if (props.rentalCompare) {
    rows.push({
      key: "rental",
      label: "임대소득",
      comprehensive: props.rentalCompare.comprehensive,
      separate: props.rentalCompare.separate,
    });
  }
  if (props.otherCompare) {
    rows.push({
      key: "other",
      label: "기타소득",
      comprehensive: props.otherCompare.comprehensive,
      separate: props.otherCompare.separate,
    });
  }
  return rows;
});

function recommendation(item: CompareItem): string {
  if (item.comprehensive < item.separate) return "종합과세 유리";
  if (item.comprehensive > item.separate) return "분리과세 유리";
  return "차이 거의 없음";
}
</script>

<template>
  <section v-if="items.length > 0" class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">분리과세 vs 종합과세 비교</h2>
    </div>

    <div class="retro-panel-content space-y-2">
      <div
        v-for="item in items"
        :key="item.key"
        class="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <strong class="text-caption">{{ item.label }}</strong>
          <span class="retro-kbd">{{ recommendation(item) }}</span>
        </div>

        <div class="retro-board-list text-caption">
          <div class="retro-board-item">
            <span>종합과세 추가세액</span>
            <strong class="tabular-nums">{{ formatWon(item.comprehensive) }}</strong>
          </div>
          <div class="retro-board-item">
            <span>분리과세 세액</span>
            <strong class="tabular-nums">{{ formatWon(item.separate) }}</strong>
          </div>
          <div class="retro-board-item font-semibold">
            <span>차이</span>
            <strong class="tabular-nums">{{ formatWon(item.comprehensive - item.separate) }}</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
