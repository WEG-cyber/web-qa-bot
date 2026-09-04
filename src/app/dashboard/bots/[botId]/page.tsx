import BotStudio from "@/components/BotStudio";

export default async function BotPage({ params, searchParams }: {
  params: Promise<{ botId: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const { botId } = await params;
  const { org = "" } = await searchParams;
  return <BotStudio botId={botId} organizationId={org} />;
}
