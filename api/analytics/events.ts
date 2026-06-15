export default async function handler(
  request: { method?: string; body?: unknown },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if (request.method && request.method !== "POST") {
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  response.status(200).json({
    data: {
      ok: true,
      accepted: 1,
      event: request.body ?? {},
      receivedAt: new Date().toISOString()
    },
    source: "mock",
    updatedAt: new Date().toISOString()
  });
}
