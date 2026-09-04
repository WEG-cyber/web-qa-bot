import { adminDb, adminStorage, verifyIdToken } from "@/lib/firebase/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ botId: string }> }) {
  const user = await verifyIdToken(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { botId } = await params;
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return Response.json({ error: "organizationId is required" }, { status: 400 });
  const organization = await adminDb.doc(`organizations/${organizationId}`).get();
  if (organization.data()?.ownerId !== user.uid) return Response.json({ error: "Only the owner can delete a Bot" }, { status: 403 });

  const botRef = adminDb.doc(`organizations/${organizationId}/bots/${botId}`);
  if (!(await botRef.get()).exists) return Response.json({ error: "Bot not found" }, { status: 404 });
  const bucket = adminStorage.bucket();
  await bucket.deleteFiles({ prefix: `organizations/${organizationId}/bots/${botId}/`, force: true }).catch(() => undefined);
  await adminDb.recursiveDelete(botRef);
  await adminDb.doc(`publicBots/${botId}`).delete().catch(() => undefined);
  return Response.json({ ok: true });
}
