import { adminDb } from "@/lib/firebase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const snapshot = await adminDb.doc(`publicBots/${botId}`).get();
  if (!snapshot.exists || snapshot.data()?.status !== "active") {
    return Response.json({ error: "Bot not found" }, { status: 404 });
  }
  const data = snapshot.data()!;
  return Response.json({
    id: botId,
    name: data.name,
    primaryColor: data.primaryColor,
    welcomeMessage: data.welcomeMessage,
    defaultLanguage: data.defaultLanguage,
    supportedLanguages: data.supportedLanguages,
  }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
