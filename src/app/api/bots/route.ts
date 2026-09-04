import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyIdToken } from "@/lib/firebase/admin";

const planBotLimits: Record<string, number> = { free: 1, starter: 3, business: 10, enterprise: 1000 };

export async function POST(request: Request) {
  const user = await verifyIdToken(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { organizationId, name, description = "" } = await request.json() as { organizationId?: string; name?: string; description?: string };
  if (!organizationId || !name?.trim()) return Response.json({ error: "organizationId and name are required" }, { status: 400 });

  const organizationRef = adminDb.doc(`organizations/${organizationId}`);
  const [organization, member] = await Promise.all([
    organizationRef.get(),
    adminDb.doc(`organizations/${organizationId}/members/${user.uid}`).get(),
  ]);
  if (!organization.exists) return Response.json({ error: "Organization not found" }, { status: 404 });
  if (!member.exists && organization.data()?.ownerId !== user.uid) return Response.json({ error: "Forbidden" }, { status: 403 });

  const plan = organization.data()?.plan || "free";
  const existing = await organizationRef.collection("bots").count().get();
  if (existing.data().count >= (planBotLimits[plan] ?? 1)) {
    return Response.json({ error: "BOT_LIMIT_REACHED", plan }, { status: 409 });
  }

  const botRef = organizationRef.collection("bots").doc();
  await botRef.set({
    organizationId, name: name.trim(), description: description.trim(), status: "draft",
    primaryColor: "#22d3ee", welcomeMessage: `您好，我是 ${name.trim()}，有什麼可以協助您的？`,
    systemPrompt: "請根據知識庫內容，以專業、清楚且友善的方式回答。",
    defaultLanguage: "zh-TW", supportedLanguages: ["zh-TW"], allowedDomains: [],
    createdBy: user.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return Response.json({ id: botRef.id, organizationId }, { status: 201 });
}
