export type LeagueType = "village" | "city" | "youth" | "provincial";

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export interface League {
  id: string;
  name: string;
  shortName: string;
  type: LeagueType;
  region: string;
  season: string;
  description: string;
  liveHint?: string;
  nextHint?: string;
}

export interface Team {
  id: string;
  leagueId: string;
  name: string;
  village: string;
  record: string;
  goalsFor: number;
  intro: string;
  honors: string[];
}

export interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  startsAt: string;
  status: MatchStatus;
  score?: {
    home: number;
    away: number;
  };
  minute?: number;
  source?: string;
  originalUrl?: string;
}

export interface StandingRow {
  teamId: string;
  rank: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

export interface ContentItem {
  id: string;
  type: "news" | "article" | "video" | "travel" | "post";
  title: string;
  summary: string;
  source: string;
  leagueId?: string;
  teamId?: string;
  image: string;
  likes: number;
  comments: number;
  favorites: number;
  publishedAt: string;
  body?: string;
  originalUrl?: string;
  imageCredit?: string;
}

export interface Comment {
  id: string;
  postId?: string;
  parentId?: string;
  replyTo?: string;
  author: string;
  body: string;
  likes: number;
  replies: number;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  author: string;
  body: string;
  leagueId?: string;
  teamId?: string;
  likes: number;
  comments: number;
  favorites: number;
  createdAt: string;
}

export interface TravelGuide {
  id: string;
  title: string;
  leagueId: string;
  region: string;
  image: string;
  summary: string;
  tags: string[];
  matchId?: string;
  teamId?: string;
  teamName?: string;
  village?: string;
  opponent?: string;
  startsAt?: string;
  venue?: string;
  intro?: string;
  teamIntro?: string;
  players?: string[];
  travelTips?: string[];
  lodgingTips?: string[];
  foodTips?: string[];
  sourceUrls?: string[];
}

export interface BookingEvent {
  id: string;
  matchId: string;
  title: string;
  venue: string;
  startsAt: string;
  availability: "available" | "limited" | "full";
  provider: "official" | "external";
}

export interface UserActivity {
  id: string;
  type: "comment" | "like" | "favorite" | "history";
  title: string;
  targetType: "article" | "post" | "match" | "team" | "travel";
  createdAt: string;
}

export interface ApiEnvelope<T> {
  data: T;
  source: "mock" | "official" | "partner" | "external";
  updatedAt: string;
}

export * from "./mock-data.js";
