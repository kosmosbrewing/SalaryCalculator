<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import { DEFAULT_SITE_URL } from "@/lib/site";

const route = useRoute();

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "서비스 소개",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));
</script>

<template>
  <div class="container py-8">
    <SEOHead
      title="서비스 소개 | 2026 연봉·건보료 계산기"
      description="연봉 실수령액, 건보료 역산, 이직 비교, 퇴사 시뮬레이션을 제공하는 무료 계산기. 2026 최신 세율 반영."
      :json-ld="breadcrumbJsonLd"
    />
    <section class="retro-panel p-5 space-y-5">
      <h1 class="text-h1 font-title">서비스 소개</h1>
      <p class="text-body text-muted-foreground leading-relaxed">
        finance.shakilabs.com은 2026년 최신 세율 기준으로 연봉과 세금을 빠르게 계산할 수 있도록 만든 무료 계산 서비스입니다.
      </p>

      <section class="space-y-2">
        <h2 class="text-h2 font-title">제공 서비스</h2>
        <ul class="list-disc pl-5 text-caption text-muted-foreground space-y-1.5">
          <li>건강보험료로 연봉 역산 계산</li>
          <li>연봉 실수령액 및 공제 항목 계산</li>
          <li>종합소득세 계산 및 분리과세 비교</li>
          <li>이직 연봉 비교, 퇴사 후 생존기간 시뮬레이션</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="text-h2 font-title">계산 기준</h2>
        <p class="text-caption text-muted-foreground leading-relaxed">
          계산식은 2026년 공개 세율과 보험료율을 바탕으로 구성되며, 부양가족 수와 비과세 항목 등 입력값에 따라 결과가 달라집니다.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-h2 font-title">이용 시 주의사항</h2>
        <ul class="list-disc pl-5 text-caption text-muted-foreground space-y-1.5">
          <li>결과는 참고용 추정값이며, 실제 급여명세/세액과 차이가 있을 수 있습니다.</li>
          <li>최종 신고·납부 금액은 회사 급여 담당자 또는 세무 전문가 확인이 필요합니다.</li>
          <li>세법 개정 시 계산 기준은 업데이트될 수 있습니다.</li>
        </ul>
      </section>
    </section>
  </div>
</template>
