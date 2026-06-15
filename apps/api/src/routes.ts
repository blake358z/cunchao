import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthService } from "./services/auth-service.js";
import { AppService } from "./services/app-service.js";
import { AdminService } from "./services/admin-service.js";

const service = new AppService();
const auth = new AuthService();
const admin = new AdminService();

const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/);

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  app.get("/api/bootstrap", async () => service.getBootstrap());

  app.get("/api/leagues", async () => service.getLeagues());

  app.get("/api/matches", async (request) => {
    const query = z.object({ leagueId: z.string().optional() }).parse(request.query);
    return service.getMatches(query.leagueId);
  });

  app.get("/api/matches/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return service.getMatch(params.id);
  });

  app.get("/api/teams/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return service.getTeam(params.id);
  });

  app.get("/api/content/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return service.getContent(params.id);
  });

  app.get("/api/posts/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return service.getPost(params.id);
  });

  app.get("/api/bookings", async () => service.getBookingEvents());

  app.get("/api/admin/overview", async () => admin.getOverview());

  app.post("/api/admin/content/drafts", async (request) => {
    const body = z.object({
      title: z.string().min(2).max(120),
      type: z.string().min(1).max(20),
      owner: z.string().max(40).optional(),
      source: z.string().max(40).optional()
    }).parse(request.body);
    return admin.createDraft(body);
  });

  app.post("/api/analytics/events", async (request) => {
    const body = z.object({
      event: z.string().min(1).max(80),
      page: z.string().max(80).optional(),
      targetId: z.string().max(120).optional(),
      targetType: z.string().max(40).optional(),
      properties: z.record(z.unknown()).optional()
    }).parse(request.body);
    return admin.trackEvent(body);
  });

  app.post("/api/auth/phone/code", async (request, reply) => {
    const body = z.object({ phone: phoneSchema }).parse(request.body);
    try {
      return await auth.requestPhoneCode(body.phone);
    } catch (error) {
      if (error instanceof Error && error.message.includes("_NOT_CONFIGURED")) {
        return reply.code(503).send({ error: "SMS_NOT_CONFIGURED", message: "短信服务未配置" });
      }
      if (error instanceof Error && error.message.startsWith("SMS_SEND_FAILED")) {
        return reply.code(502).send({ error: "SMS_SEND_FAILED", message: "短信发送失败" });
      }
      throw error;
    }
  });

  app.post("/api/auth/phone/login", async (request, reply) => {
    const body = z.object({ phone: phoneSchema, code: z.string().min(4).max(8) }).parse(request.body);
    try {
      return auth.loginWithPhone(body.phone, body.code);
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_CODE") {
        return reply.code(401).send({ error: "INVALID_CODE", message: "验证码错误或已过期" });
      }
      throw error;
    }
  });

  app.post("/api/auth/wechat/login", async (request, reply) => {
    const body = z.object({ code: z.string().min(1) }).parse(request.body);
    try {
      return await auth.loginWithWechat(body.code);
    } catch (error) {
      if (error instanceof Error && error.message.includes("_NOT_CONFIGURED")) {
        return reply.code(503).send({ error: "WECHAT_NOT_CONFIGURED", message: "微信登录服务未配置" });
      }
      if (error instanceof Error && error.message.startsWith("WECHAT_LOGIN_FAILED")) {
        return reply.code(401).send({ error: "WECHAT_LOGIN_FAILED", message: "微信授权失败" });
      }
      throw error;
    }
  });

  app.get("/api/auth/me", async (request, reply) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return reply.code(401).send({ error: "UNAUTHORIZED" });
    const session = auth.getSession(token);
    if (!session) return reply.code(401).send({ error: "UNAUTHORIZED" });
    return session.user;
  });

  app.post("/api/auth/logout", async (request) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (token) return auth.logout(token);
    return { ok: true };
  });
}
