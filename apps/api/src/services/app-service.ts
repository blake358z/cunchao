import type { ApiEnvelope } from "@cunchao/shared";
import { activities, bookingEvents, standings } from "../data/mock-store.js";
import { CatalogRepository } from "../repositories/catalog-repository.js";
import { ContentRepository } from "../repositories/content-repository.js";

const envelope = <T>(data: T, source: ApiEnvelope<T>["source"] = "mock"): ApiEnvelope<T> => ({
  data,
  source,
  updatedAt: new Date().toISOString()
});

export class AppService {
  constructor(
    private readonly catalog = new CatalogRepository(),
    private readonly content = new ContentRepository()
  ) {}

  getBootstrap() {
    return envelope({
      leagues: this.catalog.listLeagues(),
      matches: this.catalog.listMatches(),
      teams: this.catalog.listTeams(),
      standings,
      contents: this.content.listContent(),
      posts: this.content.listPosts(),
      comments: this.content.listComments(),
      travelGuides: this.content.listTravelGuides(),
      bookingEvents,
      activities
    });
  }

  getLeagues() {
    return envelope(this.catalog.listLeagues());
  }

  getMatches(leagueId?: string) {
    return envelope(this.catalog.listMatches(leagueId));
  }

  getMatch(matchId: string) {
    return envelope(this.catalog.getMatch(matchId));
  }

  getTeam(teamId: string) {
    return envelope(this.catalog.getTeam(teamId));
  }

  getContent(contentId: string) {
    return envelope(this.content.getContent(contentId));
  }

  getPost(postId: string) {
    return envelope(this.content.getPost(postId));
  }

  getBookingEvents() {
    return envelope(bookingEvents);
  }
}
