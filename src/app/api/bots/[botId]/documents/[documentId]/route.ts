import { adminDb, adminStorage, verifyIdToken } from "@/lib/firebase/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ botId: string; documentId: string }> }) {
  const user = await verifyIdToken(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { botId, documentId } = await params;
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return Response.json({ error: "organizationId is required" }, { status: 400 });
  const member = await adminDb.doc(`organizations/${organizationId}/members/${user.uid}`).get();
  const organization = await adminDb.doc(`organizations/${organizationId}`).get();
  if (!member.exists && organization.data()?.ownerId !== user.uid) return Response.json({ error: "Forbidden" }, { status: 403 });

  const documentRef = adminDb.doc(`organizations/${organizationId}/bots/${botId}/documents/${documentId}`);
  const document = await documentRef.get();
  if (!document.exists) return Response.json({ error: "Document not found" }, { status: 404 });
  const storagePath = document.data()?.storagePath as string | undefined;
  if (storagePath) await adminStorage.bucket().file(storagePath).delete({ ignoreNotFound: true });

  const chunks = await adminDb.collection(`organizations/${organizationId}/bots/${botId}/chunks`).where("documentId", "==", documentId).get();
  for (let offset = 0; offset < chunks.docs.length; offset += 400) {
    const batch = adminDb.batch();
    chunks.docs.slice(offset, offset + 400).forEach(chunk => batch.delete(chunk.ref));
    await batch.commit();
  }
  await documentRef.delete();
  return Response.json({ ok: true });
}
