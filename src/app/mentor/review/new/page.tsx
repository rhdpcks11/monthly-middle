import { getSession } from "@/lib/session";
import { getServiceClient } from "@/lib/supabase";
import { ReviewEditor } from "./review-editor";

export const dynamic = "force-dynamic";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { studentId } = await searchParams;

  // 멘토의 담당 학생(연결용 드롭다운). admin은 전체.
  const supabase = getServiceClient();
  let query = supabase
    .from("coaching_students")
    .select("id, name, grade")
    .eq("coaching_ended", false)
    .order("name");
  if (session.role !== "admin" && session.mentorId) {
    query = query.eq("mentor_id", session.mentorId);
  }
  const { data: students } = await query;

  return (
    <ReviewEditor
      students={(students as { id: string; name: string; grade: string | null }[]) || []}
      initialStudentId={studentId || ""}
    />
  );
}
