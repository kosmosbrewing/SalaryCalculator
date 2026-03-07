<script setup lang="ts">
import { ChevronRight, Link2, X } from "lucide-vue-next";

const props = defineProps<{
  show: boolean;
  kakaoBusy: boolean;
  summaryText: string;
}>();

const emit = defineEmits<{
  close: [];
  shareKakao: [];
  copyLink: [];
}>();

function handleAction(action: "kakao" | "link"): void {
  if (action === "kakao") emit("shareKakao");
  else emit("copyLink");
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="props.show"
        class="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3 pt-10 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-[2px]" @click="emit('close')" />
        <div class="share-modal-shell relative z-10 w-full max-w-md overflow-hidden retro-panel border border-border shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div class="retro-titlebar flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="share-modal-eyebrow">SHARE</p>
              <h3 id="share-modal-title" class="retro-title text-[1rem]!">결과 공유</h3>
            </div>
            <button
              class="share-close inline-flex h-9 w-9 items-center justify-center rounded-none border border-border/70 bg-background/75 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="공유 모달 닫기"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="share-modal-body space-y-4 p-4 sm:p-5">
            <div class="share-summary retro-panel-muted border border-border/40 px-4 py-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground/90">
                    CURRENT SETTING
                  </p>
                  <p class="mt-2 text-[0.95rem] font-semibold leading-6 break-words text-foreground">
                    {{ props.summaryText }}
                  </p>
                </div>
                <span class="retro-kbd shrink-0 border-status-info/40 bg-status-info/10 text-status-info">LIVE</span>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                방법 선택
              </p>
              <div class="grid gap-3 sm:grid-cols-2">
              <button
                class="share-action share-action-kakao group"
                :disabled="props.kakaoBusy"
                aria-label="카카오톡 공유"
                @click="handleAction('kakao')"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="share-action-icon bg-[#FEE500] text-[#191600]">
                    <img
                      src="/images/icons/kakaotalk-sharing-medium.png?v=1"
                      alt=""
                      aria-hidden="true"
                      class="h-6 w-6 object-contain"
                    />
                  </div>
                  <ChevronRight class="share-action-arrow" />
                </div>
                <div class="mt-5 text-left">
                  <p class="text-[0.92rem] font-black tracking-tight text-foreground">카카오톡 공유</p>
                  <p class="mt-1 text-[0.74rem] leading-5 text-muted-foreground">
                    카카오톡으로 바로 보내기
                  </p>
                </div>
              </button>

              <button
                class="share-action share-action-link group"
                aria-label="공유 링크 복사"
                @click="handleAction('link')"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="share-action-icon bg-foreground text-background">
                    <Link2 class="h-5 w-5" />
                  </div>
                  <ChevronRight class="share-action-arrow" />
                </div>
                <div class="mt-5 text-left">
                  <p class="text-[0.92rem] font-black tracking-tight text-foreground">링크 복사</p>
                  <p class="mt-1 text-[0.74rem] leading-5 text-muted-foreground">
                    메시지나 메신저에 붙여넣기
                  </p>
                </div>
              </button>
              </div>
            </div>

            <div class="share-footnote flex items-center justify-between gap-3 border-t border-dashed border-border/50 pt-3">
              <p class="text-[0.72rem] leading-5 text-muted-foreground">
                현재 설정이 포함된 링크로 공유됩니다.
              </p>
              <span class="retro-kbd hidden sm:inline-flex">SAFE LINK</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.share-modal-shell {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0)) padding-box,
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.12)) border-box;
}

.share-modal-eyebrow {
  margin-bottom: 0.18rem;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.24em;
  color: hsl(var(--muted-foreground));
}

.share-modal-body {
  background:
    radial-gradient(circle at top right, rgba(254, 229, 0, 0.08), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 38%);
}

.share-summary {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.share-action {
  display: flex;
  min-height: 9.5rem;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid hsl(var(--border) / 0.45);
  padding: 1rem;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.share-action:hover {
  transform: translateY(-2px);
}

.share-action:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.45);
}

.share-action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}

.share-action-kakao {
  background: linear-gradient(180deg, rgba(254, 229, 0, 0.12), rgba(254, 229, 0, 0.03));
}

.share-action-kakao:hover {
  border-color: rgba(254, 229, 0, 0.55);
  box-shadow: 0 12px 30px rgba(254, 229, 0, 0.08);
}

.share-action-link {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
}

.share-action-link:hover {
  border-color: hsl(var(--border) / 0.9);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
}

.share-action-icon {
  display: inline-flex;
  height: 3rem;
  width: 3rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.share-action-arrow {
  height: 1rem;
  width: 1rem;
  color: hsl(var(--muted-foreground));
  transition:
    transform 0.18s ease,
    color 0.18s ease;
}

.share-action:hover .share-action-arrow {
  transform: translateX(3px);
  color: hsl(var(--foreground));
}

.share-close:hover {
  background: hsl(var(--background));
  border-color: hsl(var(--border));
}

.share-footnote {
  min-height: 2.5rem;
}

.retro-title {
  font-size: 1rem !important;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .share-modal-shell,
.modal-fade-leave-to .share-modal-shell {
  transform: translateY(10px) scale(0.985);
}

@media (max-width: 639px) {
  .share-action {
    min-height: 8.75rem;
  }
}
</style>
