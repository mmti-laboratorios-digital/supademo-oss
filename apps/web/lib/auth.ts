import { workspaces } from "@/db/schema/app";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "./db";

export type AuthContext = {
  userId: string;
  orgId: string;
  role: "owner" | "admin" | "editor" | "viewer";
};

/**
 * Garante que há sessão válida e retorna userId + orgId + role.
 * Lança redirect para /sign-in se não houver.
 */
export async function requireAuth(): Promise<AuthContext> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");
  if (!orgId) throw new Error("NO_WORKSPACE");

  // Mapear role Clerk → role interno
  const role = mapRole(orgRole);

  return { userId, orgId, role };
}

export async function getCurrentUser() {
  return await currentUser();
}

export async function getClerk() {
  return await clerkClient();
}

function mapRole(clerkRole: string | null | undefined): "owner" | "admin" | "editor" | "viewer" {
  switch ((clerkRole ?? "").toLowerCase()) {
    case "admin":
      return "admin";
    case "editor":
      return "editor";
    case "viewer":
      return "viewer";
    default:
      return "owner";
  }
}

/**
 * Sincroniza Org do Clerk → workspace na nossa DB.
 * Chamado pelo webhook `organization.created` e `organizationMembership.*`.
 */
export async function upsertWorkspaceFromClerk(args: {
  clerkOrgId: string;
  name: string;
  slug: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.clerkOrgId, args.clerkOrgId))
    .limit(1);

  if (existing) {
    await db
      .update(workspaces)
      .set({ name: args.name, slug: args.slug, updatedAt: new Date() })
      .where(eq(workspaces.id, existing.id));
    return existing;
  }

  const [row] = await db
    .insert(workspaces)
    .values({
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      slug: args.slug,
      locale: "pt-BR",
      planId: "free",
    })
    .returning();

  return row;
}
