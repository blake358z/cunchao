import type { AuthSession } from "@cunchao/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  if (!response.ok) {
    let payload: ApiErrorBody = {};
    try {
      payload = (await response.json()) as ApiErrorBody;
    } catch {
      // Ignore non-JSON error bodies.
    }
    throw new Error(payload.message ?? payload.error ?? `API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function requestPhoneCode(phone: string) {
  return postJson<{ expiresIn: number; maskedPhone: string }>("/api/auth/phone/code", { phone });
}

export async function loginWithPhone(phone: string, code: string) {
  return postJson<AuthSession>("/api/auth/phone/login", { phone, code });
}

export async function loginWithWechat(code: string) {
  return postJson<AuthSession>("/api/auth/wechat/login", { code });
}
