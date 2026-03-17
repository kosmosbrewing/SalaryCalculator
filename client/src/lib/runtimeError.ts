import { readonly, reactive } from "vue";

type RuntimeErrorState = {
  hasError: boolean;
  blocking: boolean;
  message: string;
  detail: string;
  context: string;
  updatedAt: string;
};

const state = reactive<RuntimeErrorState>({
  hasError: false,
  blocking: true,
  message: "",
  detail: "",
  context: "",
  updatedAt: "",
});

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim() || error.name;
  }

  if (typeof error === "string") {
    return error.trim();
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "알 수 없는 런타임 오류";
  }
}

function toUserMessage(detail: string): string {
  const normalized = detail.toLowerCase();

  if (
    normalized.includes("failed to fetch dynamically imported module") ||
    normalized.includes("error loading dynamically imported module")
  ) {
    return "화면 스크립트를 불러오지 못했습니다. 배포된 정적 파일과 브라우저 캐시를 확인해 주세요.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("load failed")
  ) {
    return "필수 리소스를 불러오지 못했습니다. 네트워크 또는 API 연결 상태를 확인해 주세요.";
  }

  return "화면 렌더링 중 오류가 발생했습니다.";
}

function isBlockingError(detail: string, context: string): boolean {
  const normalized = detail.toLowerCase();
  const normalizedContext = context.toLowerCase();

  if (normalizedContext.includes("router")) {
    return true;
  }

  if (
    normalized.includes("failed to fetch dynamically imported module") ||
    normalized.includes("error loading dynamically imported module")
  ) {
    return true;
  }

  if (
    normalized.includes("network") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("load failed") ||
    normalized.includes("apirequesterror")
  ) {
    return false;
  }

  return true;
}

export function reportRuntimeError(error: unknown, context: string): void {
  const detail = stringifyError(error);
  state.hasError = true;
  state.blocking = isBlockingError(detail, context);
  state.detail = detail;
  state.context = context;
  state.updatedAt = new Date().toISOString();
  state.message = toUserMessage(detail);
}

export function clearRuntimeError(): void {
  state.hasError = false;
  state.blocking = true;
  state.message = "";
  state.detail = "";
  state.context = "";
  state.updatedAt = "";
}

export function useRuntimeError(): {
  runtimeError: Readonly<RuntimeErrorState>;
} {
  return {
    runtimeError: readonly(state) as Readonly<RuntimeErrorState>,
  };
}
