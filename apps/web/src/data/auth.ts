import type { AuthSession, UserAccount } from "@cunchao/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const DEMO_CODE = "246810";

function localUser(partial: Partial<UserAccount> & Pick<UserAccount, "id" | "nickname" | "providers">): UserAccount {
  const now = new Date().toISOString();
  return {
    avatar: partial.avatar,
    createdAt: partial.createdAt ?? now,
    followedLeagueIds: partial.followedLeagueIds ?? ["gzcunchao"],
    followedTeamIds: partial.followedTeamIds ?? ["team-chejiang", "team-zhongcheng"],
    id: partial.id,
    lastLoginAt: now,
    nickname: partial.nickname,
    phone: partial.phone,
    providers: partial.providers,
    wechatOpenId: partial.wechatOpenId
  };
}

function localSession(user: UserAccount, provider: "phone" | "wechat"): AuthSession {
  return {
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    token: `${provider}_local_${Date.now()}`,
    user
  };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

export async function requestPhoneCode(phone: string) {
  try {
    return await postJson<{ expiresIn: number; maskedPhone: string }>("/api/auth/phone/code", { phone });
  } catch {
    return {
      expiresIn: 300,
      maskedPhone: phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2")
    };
  }
}

export async function loginWithPhone(phone: string, code: string) {
  try {
    return await postJson<AuthSession>("/api/auth/phone/login", { phone, code });
  } catch {
    if (code !== DEMO_CODE) throw new Error("验证码错误，演示验证码为 246810");
    return localSession(
      localUser({
        id: `phone-${phone}`,
        nickname: `手机用户${phone.slice(-4)}`,
        phone,
        providers: ["phone"]
      }),
      "phone"
    );
  }
}

export async function loginWithWechat() {
  const code = `demo-wechat-${Date.now()}`;
  try {
    return await postJson<AuthSession>("/api/auth/wechat/login", { code });
  } catch {
    return localSession(
      localUser({
        avatar: "/data/avatars/avatar-01.svg",
        id: `wechat-${code}`,
        nickname: "微信球迷",
        providers: ["wechat"],
        wechatOpenId: code
      }),
      "wechat"
    );
  }
}
