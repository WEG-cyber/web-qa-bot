import { adminDb, verifyIdToken } from "@/lib/firebase/admin";
import { indexDocument } from "@/lib/knowledge";

export async function POST(request: Request, { params }: { params: Promise<{ botId: string; documentId: string }> }) {
  const user = await verifyIdToken(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { botId, documentId } = await params;
  const { organizationId } = await request.json() as { organizationId?: string };
  if (!organizationId) return Response.json({ error: "organizationId is required" }, { status: 400 });
  const member = await adminDb.doc(`organizations/${organizationId}/members/${user.uid}`).get();
  const organization = await adminDb.doc(`organizations/${organizationId}`).get();
  if (!member.exists && organization.data()?.ownerId !== user.uid) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const chunkCount = await indexDocument({ organizationId, botId, documentId });
    return Response.json({ ok: true, chunkCount });
  } catch (error) {
    await adminDb.doc(`organizations/${organizationId}/bots/${botId}/documents/${documentId}`).update({ status: "error", error: error instanceof Error ? error.message : "Processing failed" });
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
