import type { AuthSession, LoginProvider, UserAccount } from "@cunchao/shared";

type VerificationCode = {
  code: string;
  expiresAt: number;
};

const demoUsers = new Map<string, UserAccount>();
const sessions = new Map<string, AuthSession>();
const verificationCodes = new Map<string, VerificationCode>();

function nowIso() {
  return new Date().toISOString();
}

function createToken(prefix: LoginProvider) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createUser(partial: Pick<UserAccount, "id" | "nickname" | "providers"> & Partial<UserAccount>): UserAccount {
  const now = nowIso();
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

function createSession(user: UserAccount, provider: LoginProvider): AuthSession {
  const session: AuthSession = {
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    token: createToken(provider),
    user
  };
  sessions.set(session.token, session);
  return session;
}

export class AuthService {
  requestPhoneCode(phone: string) {
    const code = process.env.AUTH_DEMO_CODE ?? "246810";
    verificationCodes.set(phone, {
      code,
      expiresAt: Date.now() + 1000 * 60 * 5
    });
    return {
      expiresIn: 300,
      maskedPhone: phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2")
    };
  }

  loginWithPhone(phone: string, code: string) {
    const verification = verificationCodes.get(phone);
    if (!verification || verification.expiresAt < Date.now() || verification.code !== code) {
      throw new Error("INVALID_CODE");
    }

    const userId = `phone-${phone}`;
    const existing = demoUsers.get(userId);
    const user = existing
      ? { ...existing, lastLoginAt: nowIso(), phone, providers: Array.from(new Set([...existing.providers, "phone" as const])) }
      : createUser({
          id: userId,
          nickname: `手机用户${phone.slice(-4)}`,
          phone,
          providers: ["phone"]
        });
    demoUsers.set(user.id, user);
    verificationCodes.delete(phone);
    return createSession(user, "phone");
  }

  loginWithWechat(code: string) {
    const openId = `demo-openid-${code.slice(-8) || "cunchao"}`;
    const userId = `wechat-${openId}`;
    const existing = demoUsers.get(userId);
    const user = existing
      ? { ...existing, lastLoginAt: nowIso(), providers: Array.from(new Set([...existing.providers, "wechat" as const])) }
      : createUser({
          avatar: "/data/avatars/avatar-01.svg",
          id: userId,
          nickname: "微信球迷",
          providers: ["wechat"],
          wechatOpenId: openId
        });
    demoUsers.set(user.id, user);
    return createSession(user, "wechat");
  }

  getSession(token: string) {
    const session = sessions.get(token);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      if (session) sessions.delete(token);
      return null;
    }
    return session;
  }

  logout(token: string) {
    sessions.delete(token);
    return { ok: true };
  }
}
