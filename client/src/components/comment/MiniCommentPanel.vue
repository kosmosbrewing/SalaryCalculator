<script setup lang="ts">
import { ref, watch } from "vue";
import { Send, Loader2, RefreshCw } from "lucide-vue-next";
import { apiFetch } from "@/api/helpers";
import type { Comment } from "@/api/types";

const props = withDefaults(
  defineProps<{
    pageKey: string;
    title?: string;
    maxLength?: number;
  }>(),
  { title: "익명 게시판", maxLength: 300 }
);

const inputText = ref("");
const comments = ref<Comment[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const error = ref("");

async function fetchComments(): Promise<void> {
  isLoading.value = true;
  error.value = "";
  try {
    const data = await apiFetch<{ comments: Comment[] }>(
      `/comments?pageKey=${encodeURIComponent(props.pageKey)}&limit=50`
    );
    comments.value = data.comments;
  } catch {
    error.value = "댓글을 불러올 수 없습니다.";
  } finally {
    isLoading.value = false;
  }
}

async function addComment(): Promise<void> {
  const content = inputText.value.trim();
  if (!content || content.length > props.maxLength || isSubmitting.value) return;

  isSubmitting.value = true;
  error.value = "";
  try {
    const created = await apiFetch<Comment>("/comments", {
      method: "POST",
      body: JSON.stringify({ pageKey: props.pageKey, content }),
    });
    // 서버 응답을 목록 선두에 추가 (재조회 없이 즉시 반영)
    comments.value = [created, ...comments.value];
    inputText.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : "댓글 등록에 실패했습니다.";
  } finally {
    isSubmitting.value = false;
  }
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

watch(() => props.pageKey, () => fetchComments(), { immediate: true });
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">{{ title }}</h2>
      <span class="retro-kbd tabular-nums">
        {{ comments.length }}
      </span>
    </div>

    <div class="retro-panel-content space-y-3">
      <!-- 입력 영역 -->
      <form class="flex gap-2" @submit.prevent="addComment">
        <input
          v-model="inputText"
          type="text"
          :maxlength="maxLength"
          :disabled="isSubmitting"
          placeholder="한 줄 의견을 남겨보세요"
          class="retro-input flex-1 !py-2 text-caption"
        />
        <button
          type="submit"
          :disabled="!inputText.trim() || isSubmitting"
          class="inline-flex items-center justify-center rounded-xl border border-border/70 bg-card px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="inputText.trim() && !isSubmitting
            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-muted-foreground'"
        >
          <Loader2 v-if="isSubmitting" class="h-3.5 w-3.5 animate-spin" />
          <Send v-else class="h-3.5 w-3.5" />
        </button>
      </form>

      <!-- 에러 메시지 -->
      <p v-if="error" class="text-tiny text-destructive">
        {{ error }}
      </p>

      <!-- 로딩 -->
      <div v-if="isLoading" class="flex items-center justify-center py-6">
        <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
      </div>

      <!-- 댓글 목록 -->
      <ul v-else-if="comments.length" class="space-y-2 max-h-64 overflow-y-auto">
        <li
          v-for="comment in comments"
          :key="comment.id"
          class="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5"
        >
          <p class="text-caption text-foreground break-words leading-relaxed">{{ comment.content }}</p>
          <div class="mt-1.5 flex items-center justify-between text-tiny text-muted-foreground">
            <span class="font-medium">{{ comment.nickname }}</span>
            <span>{{ formatTime(comment.createdAt) }}</span>
          </div>
        </li>
      </ul>

      <!-- 빈 상태 -->
      <p v-else class="text-center text-caption text-muted-foreground py-4">
        첫 댓글을 남겨보세요
      </p>
    </div>
  </section>
</template>
