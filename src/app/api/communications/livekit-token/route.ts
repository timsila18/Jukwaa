import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const publishRoles = new Set(["host", "co_host", "speaker"]);

const requestSchema = z.object({
  roomName: z.string().trim().min(3).max(96),
  identity: z.string().trim().min(2).max(96),
  displayName: z.string().trim().min(2).max(96).optional(),
  role: z.enum(["host", "co_host", "speaker", "attendee", "guest"]).default("speaker"),
});

export async function POST(request: Request) {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit is not configured for this deployment yet." },
      { status: 503 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "roomName, identity, displayName, and role are required in the expected format." },
      { status: 400 },
    );
  }

  const { roomName, identity, displayName, role } = parsed.data;
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: displayName ?? identity,
    ttl: "2h",
    metadata: JSON.stringify({
      role,
      client: "jukwaa-web",
      bridge: "solco-livekit",
      lowBandwidthMode: true,
    }),
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: publishRoles.has(role),
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });

  return NextResponse.json({
    token: await token.toJwt(),
    url: livekitUrl,
    roomName,
    identity,
    role,
    expiresIn: "2h",
  });
}
