import type { ApiEnvelope } from "@cunchao/shared";
import { activities, bookingEvents, comments, contents, leagues, matches, posts, standings, teams, travelGuides } from "@cunchao/shared/src/mock-data";
import type { BootstrapData } from "../domain/types";

const fallback: BootstrapData = {
  leagues,
  matches,
  teams,
  standings,
  contents,
  posts,
  comments,
  travelGuides,
  bookingEvents,
  activities
};

export async function fetchBootstrap(): Promise<BootstrapData> {
  try {
    const response = await fetch("/data/bootstrap.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const payload = (await response.json()) as ApiEnvelope<BootstrapData>;
    return payload.data;
  } catch {
    return fallback;
  }
}
