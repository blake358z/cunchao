import type {
  BookingEvent,
  Comment,
  ContentItem,
  League,
  Match,
  Post,
  StandingRow,
  Team,
  TravelGuide,
  UserActivity
} from "@cunchao/shared";

export type TabKey = "home" | "events" | "community" | "travel" | "profile";
export type DetailView =
  | { type: "match"; id: string }
  | { type: "team"; id: string }
  | { type: "article"; id: string }
  | { type: "post"; id: string }
  | null;

export interface BootstrapData {
  leagues: League[];
  matches: Match[];
  teams: Team[];
  standings: StandingRow[];
  contents: ContentItem[];
  posts: Post[];
  comments: Comment[];
  travelGuides: TravelGuide[];
  bookingEvents: BookingEvent[];
  activities: UserActivity[];
}

