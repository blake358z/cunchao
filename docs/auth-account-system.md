# 村超账号体系与登录接入说明

## 当前版本能力

- 支持微信登录演示流程：前端生成 demo code，后端模拟换取 openid 并返回 session。
- 支持手机号验证码登录演示流程：验证码接口默认返回 5 分钟有效期，演示验证码为 `246810`。
- H5 静态部署时，如果后端 API 不可用，前端会自动降级到本地模拟登录，便于 Vercel 日常测试。
- 登录态保存到 `localStorage` 的 `cunchao.session`，互动记录保存到 `cunchao.activities`。
- 未登录时，评论、回复、收藏、关注、预约入场会拉起登录弹层。

## API 契约

### 发送验证码

`POST /api/auth/phone/code`

```json
{ "phone": "13800138000" }
```

返回：

```json
{ "expiresIn": 300, "maskedPhone": "138****8000" }
```

### 手机号验证码登录

`POST /api/auth/phone/login`

```json
{ "phone": "13800138000", "code": "246810" }
```

返回 `AuthSession`：

```json
{
  "token": "phone_...",
  "expiresAt": "2026-07-16T00:00:00.000Z",
  "user": {
    "id": "phone-13800138000",
    "nickname": "手机用户8000",
    "phone": "13800138000",
    "providers": ["phone"]
  }
}
```

### 微信登录

`POST /api/auth/wechat/login`

```json
{ "code": "微信小程序 wx.login 返回的 code" }
```

生产接入时，后端用 `code` 调微信接口换取 `openid/session_key/unionid`，再创建或绑定用户。

### 当前用户

`GET /api/auth/me`

Header:

```text
Authorization: Bearer <token>
```

### 退出登录

`POST /api/auth/logout`

Header:

```text
Authorization: Bearer <token>
```

## 生产化待接入

- 验证码：接阿里云短信、腾讯云短信或运营商短信服务；验证码放 Redis，设置发送频控、IP 限流和手机号限流。
- 微信登录：接微信小程序 `wx.login` 和微信开放平台，保存 `openid/unionid/session_key`。
- 用户表：建议包含 `id, nickname, avatar, phone, wechat_openid, unionid, providers, created_at, last_login_at`。
- 登录态：当前 demo token 后续替换为 JWT 或服务端 session；移动端建议支持 refresh token。
- 账号绑定：手机号与微信 openid 都登录过时，需要提供绑定/合并规则，避免同一用户生成两个账号。
