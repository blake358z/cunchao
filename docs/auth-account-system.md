# 村超账号体系与真实登录接入说明

## 当前版本能力

- 微信登录走真实微信授权 code：前端通过微信环境的 `wx.login` 获取 code，后端调用微信 `jscode2session` 换取 `openid/session_key`。
- 手机号登录走真实短信验证码：后端生成 6 位验证码，通过腾讯云短信 `SendSms` 发送，用户提交验证码后校验登录。
- 前端已经移除本地伪登录和固定验证码。普通浏览器无法直接微信登录；未配置 API 或服务密钥时，会显示明确错误。
- 登录态保存到 `localStorage` 的 `cunchao.session`，互动记录保存到 `cunchao.activities`。
- 未登录时，评论、回复、收藏、关注、预约入场会拉起登录弹层。

## 后端环境变量

### 微信登录

```bash
WECHAT_APP_ID=微信小程序 AppID
WECHAT_APP_SECRET=微信小程序 AppSecret
```

后端接口会请求：

```text
https://api.weixin.qq.com/sns/jscode2session
```

### 手机短信验证码

当前实现使用腾讯云短信，需要配置：

```bash
TENCENT_SECRET_ID=腾讯云 SecretId
TENCENT_SECRET_KEY=腾讯云 SecretKey
TENCENT_SMS_APP_ID=短信应用 SDKAppID
TENCENT_SMS_SIGN_NAME=短信签名
TENCENT_SMS_TEMPLATE_ID=验证码模板 ID
TENCENT_SMS_REGION=ap-guangzhou
AUTH_CODE_PEPPER=验证码哈希加盐字符串
```

短信模板建议包含两个参数：

```text
您的验证码为 {1}，{2} 分钟内有效。
```

当前发送参数为 `[验证码, "5"]`。

## 前端环境变量

Vercel/H5 需要配置后端 API 地址：

```bash
VITE_API_BASE_URL=https://你的-api-域名
```

如果不配置，前端会向当前 H5 域名请求 `/api/auth/...`。静态 Vercel 项目没有这些 API 时，登录会失败并提示服务不可用。

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
{ "phone": "13800138000", "code": "用户收到的 6 位短信验证码" }
```

返回 `AuthSession`。

### 微信登录

`POST /api/auth/wechat/login`

```json
{ "code": "微信 wx.login 返回的 code" }
```

返回 `AuthSession`。

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

## 生产化待补

- 当前验证码和 session 存在 Node 内存中，单实例可用；生产需要换成 Redis 或数据库。
- 用户资料当前存在内存 Map 中，生产需要用户表和账号绑定表。
- 手机号与微信 openid 都登录过时，需要账号合并/绑定流程。
- 短信接口需要增加发送频控：手机号、IP、设备维度限流。
- Token 建议升级为 JWT + refresh token，或服务端 session + Redis。
- 微信登录在 H5 普通浏览器不能直接使用 `wx.login`，小程序版本需要在小程序原生层调用并把 code 传给 H5 或直接调后端。
