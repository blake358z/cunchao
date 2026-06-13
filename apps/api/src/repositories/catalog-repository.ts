import type { League, Match, Team } from "@cunchao/shared";
import { leagues, matches, teams } from "../data/mock-store.js";

export class CatalogRepository {
  listLeagues(): League[] {
    return leagues;
  }

  listTeams(leagueId?: string): Team[] {
    return leagueId ? teams.filter((team) => team.leagueId === leagueId) : teams;
  }

  listMatches(leagueId?: string): Match[] {
    return leagueId ? matches.filter((match) => match.leagueId === leagueId) : matches;
  }

  getMatch(matchId: string): Match | undefined {
    return matches.find((match) => match.id === matchId);
  }

  getTeam(teamId: string): Team | undefined {
    return teams.find((team) => team.id === teamId);
  }
}
