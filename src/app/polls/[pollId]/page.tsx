import PollResponseClient from "./poll-response-client";

export default async function PublicPollPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  return <PollResponseClient pollId={pollId} />;
}
