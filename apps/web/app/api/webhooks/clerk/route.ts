import { members } from "@/db/schema/app";
import { upsertWorkspaceFromClerk } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export const runtime = "nodejs";

type ClerkOrgData = { id: string; name: string; slug: string };
type ClerkMemberData = {
  organization: { id: string };
  public_user_data: { user_id: string; identifier: string; first_name?: string };
  role: string;
};

type ClerkEvent =
  | { type: "organization.created"; data: ClerkOrgData }
  | { type: "organization.updated"; data: ClerkOrgData }
  | { type: "organizationMembership.created"; data: ClerkMemberData }
  | {
      type: "organizationMembership.deleted";
      data: { organization: { id: string }; public_user_data: { user_id: string } };
    }
  | { type: string; data: unknown };

function isOrgData(d: unknown): d is ClerkOrgData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.slug === "string";
}

function isMemberData(d: unknown): d is ClerkMemberData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  const org = o.organization as Record<string, unknown> | undefined;
  const userData = o.public_user_data as Record<string, unknown> | undefined;
  return (
    typeof org?.id === "string" &&
    typeof userData?.user_id === "string" &&
    typeof userData.identifier === "string" &&
    typeof o.role === "string"
  );
}

export async function POST(req: Request) {
  try {
    const e = env();
    const secret = e.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
    }

    const h = await headers();
    const svixId = h.get("svix-id");
    const svixTs = h.get("svix-timestamp");
    const svixSig = h.get("svix-signature");
    if (!svixId || !svixTs || !svixSig) {
      return NextResponse.json({ error: "MISSING_SVIX_HEADERS" }, { status: 400 });
    }

    const rawBody = await req.text();
    const wh = new Webhook(secret);
    let event: ClerkEvent;
    try {
      event = wh.verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTs,
        "svix-signature": svixSig,
      }) as ClerkEvent;
    } catch (err) {
      return NextResponse.json(
        { error: "INVALID_SIGNATURE", message: (err as Error).message },
        { status: 401 },
      );
    }

    switch (event.type) {
      case "organization.created":
      case "organization.updated": {
        if (!isOrgData(event.data)) {
          return NextResponse.json({ error: "BAD_PAYLOAD" }, { status: 400 });
        }
        const ws = await upsertWorkspaceFromClerk({
          clerkOrgId: event.data.id,
          name: event.data.name,
          slug: event.data.slug,
        });
        return NextResponse.json({ ok: true, workspaceId: ws?.id ?? null });
      }
      case "organizationMembership.created": {
        if (!isMemberData(event.data)) {
          return NextResponse.json({ error: "BAD_PAYLOAD" }, { status: 400 });
        }
        const ws = await upsertWorkspaceFromClerk({
          clerkOrgId: event.data.organization.id,
          name: "",
          slug: event.data.organization.id,
        });
        if (!ws) {
          return NextResponse.json({ error: "WORKSPACE_NOT_FOUND" }, { status: 404 });
        }
        const db = getDb();
        await db
          .insert(members)
          .values({
            workspaceId: ws.id,
            email: event.data.public_user_data.identifier,
            name: event.data.public_user_data.first_name ?? null,
            role: mapClerkRole(event.data.role),
            emailVerifiedAt: new Date(),
          })
          .onConflictDoNothing();
        return NextResponse.json({ ok: true });
      }
      case "organizationMembership.deleted":
        // TODO: remover member — exige clerk user_id → member.id lookup.
        return NextResponse.json({ ok: true, note: "noop" });
      default:
        return NextResponse.json({ ok: true, ignored: event.type });
    }
  } catch (err) {
    console.error("[/api/webhooks/clerk] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

function mapClerkRole(role: string): "owner" | "admin" | "editor" | "viewer" {
  switch (role.toLowerCase()) {
    case "admin":
      return "admin";
    case "editor":
    case "editor:editor":
      return "editor";
    case "viewer":
    case "viewer:viewer":
      return "viewer";
    default:
      return "owner";
  }
}
