import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppService } from "./services/app-service.js";

const service = new AppService();

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
}
