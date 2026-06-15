import { createHash, createHmac, randomInt, randomUUID } from "node:crypto";
import type { AuthSession, LoginProvider, UserAccount } from "@cunchao/shared";

type VerificationCode = {
  codeHash: string;
  expiresAt: number;
};

type WechatSessionResponse = {
  errcode?: number;
  errmsg?: string;
  openid?: string;
  session_key?: string;
  unionid?: string;
};

const users = new Map<string, UserAccount>();
const sessions = new Map<string, AuthSession>();
const verificationCodes = new Map<string, VerificationCode>();

function nowIso() {
  return new Date().toISOString();
}

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}:${process.env.AUTH_CODE_PEPPER ?? ""}`).digest("hex");
}

function createToken(provider: LoginProvider) {
  return `${provider}_${randomUUID()}`;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name}_NOT_CONFIGURED`);
  return value;
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

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function utcDate(timestamp: number) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

async function sendTencentSms(phone: string, code: string) {
  const secretId = requireEnv("TENCENT_SECRET_ID");
  const secretKey = requireEnv("TENCENT_SECRET_KEY");
  const smsSdkAppId = requireEnv("TENCENT_SMS_APP_ID");
  const signName = requireEnv("TENCENT_SMS_SIGN_NAME");
  const templateId = requireEnv("TENCENT_SMS_TEMPLATE_ID");
  const region = process.env.TENCENT_SMS_REGION ?? "ap-guangzhou";

  const host = "sms.tencentcloudapi.com";
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: smsSdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: [code, "5"]
  });

  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\nx-tc-action:sendsms\n`;
  const signedHeaders = "content-type;host;x-tc-action";
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256(payload)}`;
  const date = utcDate(timestamp);
  const credentialScope = `${date}/sms/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, "sms");
  const secretSigning = hmac(secretService, "tc3_request");
  const signature = createHmac("sha256", secretSigning).update(stringToSign).digest("hex");
  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}`, {
    body: payload,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: host,
      "X-TC-Action": "SendSms",
      "X-TC-Region": region,
      "X-TC-Timestamp": String(timestamp),
      "X-TC-Version": "2021-01-11"
    },
    method: "POST"
  });
  const result = (await response.json()) as { Response?: { Error?: { Code: string; Message: string } } };
  const error = result.Response?.Error;
  if (!response.ok || error) {
    throw new Error(error ? `SMS_SEND_FAILED:${error.Code}` : "SMS_SEND_FAILED");
  }
}

export class AuthService {
  async requestPhoneCode(phone: string) {
    const code = String(randomInt(100000, 999999));
    await sendTencentSms(phone, code);
    verificationCodes.set(phone, {
      codeHash: hashCode(phone, code),
      expiresAt: Date.now() + 1000 * 60 * 5
    });
    return {
      expiresIn: 300,
      maskedPhone: phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2")
    };
  }

  loginWithPhone(phone: string, code: string) {
    const verification = verificationCodes.get(phone);
    if (!verification || verification.expiresAt < Date.now() || verification.codeHash !== hashCode(phone, code)) {
      throw new Error("INVALID_CODE");
    }

    const userId = `phone-${phone}`;
    const existing = users.get(userId);
    const user = existing
      ? { ...existing, lastLoginAt: nowIso(), phone, providers: Array.from(new Set([...existing.providers, "phone" as const])) }
      : createUser({
          id: userId,
          nickname: `手机用户${phone.slice(-4)}`,
          phone,
          providers: ["phone"]
        });
    users.set(user.id, user);
    verificationCodes.delete(phone);
    return createSession(user, "phone");
  }

  async loginWithWechat(code: string) {
    const appId = requireEnv("WECHAT_APP_ID");
    const appSecret = requireEnv("WECHAT_APP_SECRET");
    const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
    url.searchParams.set("appid", appId);
    url.searchParams.set("secret", appSecret);
    url.searchParams.set("js_code", code);
    url.searchParams.set("grant_type", "authorization_code");

    const response = await fetch(url);
    const payload = (await response.json()) as WechatSessionResponse;
    if (!response.ok || payload.errcode || !payload.openid) {
      throw new Error(`WECHAT_LOGIN_FAILED:${payload.errcode ?? response.status}`);
    }

    const userId = `wechat-${payload.openid}`;
    const existing = users.get(userId);
    const user = existing
      ? { ...existing, lastLoginAt: nowIso(), providers: Array.from(new Set([...existing.providers, "wechat" as const])) }
      : createUser({
          avatar: "/data/avatars/avatar-01.svg",
          id: userId,
          nickname: "微信球迷",
          providers: ["wechat"],
          wechatOpenId: payload.openid
        });
    users.set(user.id, user);
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
