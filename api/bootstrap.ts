import {
  activities,
  bookingEvents,
  comments,
  contents,
  leagues,
  matches,
  posts,
  standings,
  teams,
  travelGuides
} from "../packages/shared/dist/index.js";

export default function handler(_request: unknown, response: any) {
  response.status(200).json({
    data: {
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
    },
    source: "mock",
    updatedAt: new Date().toISOString()
  });
}
