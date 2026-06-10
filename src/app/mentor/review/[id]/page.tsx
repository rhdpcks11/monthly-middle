import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getReviewSetById, listAttemptsBySet } from "@/lib/review/store";
import { ReviewDetail } from "./review-detail";

export const dynamic = "force-dynamic";

export default async function ReviewSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const set = await getReviewSetById(id);
  if (!set) return notFound();
  if (session.role !== "admin" && set.mentorId !== session.mentorId) return notFound();

  const attempts = await listAttemptsBySet(id);

  return <ReviewDetail set={set} attempts={attempts} />;
}
