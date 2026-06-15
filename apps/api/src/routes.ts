import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthService } from "./services/auth-service.js";
import { AppService } from "./services/app-service.js";

const service = new AppService();
const auth = new AuthService();

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

  app.post("/api/auth/phone/code", async (request) => {
    const body = z.object({ phone: phoneSchema }).parse(request.body);
    return auth.requestPhoneCode(body.phone);
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

  app.post("/api/auth/wechat/login", async (request) => {
    const body = z.object({ code: z.string().min(1) }).parse(request.body);
    return auth.loginWithWechat(body.code);
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
