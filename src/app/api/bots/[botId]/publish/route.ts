import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyIdToken } from "@/lib/firebase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ botId: string }> }) {
  const user = await verifyIdToken(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const { organizationId } = await request.json() as { organizationId?: string };
  if (!organizationId) return Response.json({ error: "organizationId is required" }, { status: 400 });

  const member = await adminDb.doc(`organizations/${organizationId}/members/${user.uid}`).get();
  const organization = await adminDb.doc(`organizations/${organizationId}`).get();
  if (!member.exists && organization.data()?.ownerId !== user.uid) return Response.json({ error: "Forbidden" }, { status: 403 });

  const botRef = adminDb.doc(`organizations/${organizationId}/bots/${botId}`);
  const bot = await botRef.get();
  if (!bot.exists) return Response.json({ error: "Bot not found" }, { status: 404 });
  const data = bot.data()!;

  await adminDb.runTransaction(async transaction => {
    transaction.set(adminDb.doc(`publicBots/${botId}`), {
      organizationId, name: data.name, companyName: organization.data()?.name || "",
      primaryColor: data.primaryColor, welcomeMessage: data.welcomeMessage,
      systemPrompt: data.systemPrompt, defaultLanguage: data.defaultLanguage,
      supportedLanguages: data.supportedLanguages || [data.defaultLanguage],
      allowedDomains: data.allowedDomains || [], status: "active", updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(botRef, { status: "active", updatedAt: FieldValue.serverTimestamp() });
  });
  return Response.json({ ok: true, botId });
}
