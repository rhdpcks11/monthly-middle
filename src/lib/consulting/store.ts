import "server-only";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase";
import type { ConsultingSubmission, ConsultingFormType, ConsultingFile } from "@/types";

const SUB_COLS =
  "id, student_id, week_number, form_type, submitted_at, answers, file_paths, agreements, memo";

/** 추측 불가능한 공개 링크 토큰 (24자리 hex, URL-safe, 사람이 입력하지 않음). */
export function generateToken(): string {
  return crypto.randomBytes(12).toString("hex");
}

export type ConsultingStudent = {
  id: string;
  name: string;
  phone: string | null;
  mentorName: string | null;
  coachingStartDate: string | null;
};

/** 공개 토큰으로 학생을 조회한다 (prefill / 권한 확인용). */
export async function getStudentByToken(token: string): Promise<ConsultingStudent | undefined> {
  if (!token || !/^[a-f0-9]{8,}$/i.test(token)) return undefined;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("coaching_students")
    .select("id, name, phone, coaching_start_date, mentor:coaching_mentors(name)")
    .eq("consulting_token", token)
    .maybeSingle<{
      id: string;
      name: string;
      phone: string | null;
      coaching_start_date: string | null;
      mentor: { name: string } | null;
    }>();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    phone: data.phone ?? null,
    mentorName: data.mentor?.name ?? null,
    coachingStartDate: data.coaching_start_date ?? null,
  };
}

/** 학생에게 토큰이 없으면 새로 발급한다 (기존 학생/멘토 페이지 링크 안전장치). */
export async function ensureToken(studentId: string): Promise<string> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("coaching_students")
    .select("consulting_token")
    .eq("id", studentId)
    .maybeSingle();
  if (data?.consulting_token) return data.consulting_token;
  for (let i = 0; i < 5; i++) {
    const token = generateToken();
    const { error } = await supabase
      .from("coaching_students")
      .update({ consulting_token: token })
      .eq("id", studentId);
    if (!error) return token;
    if ((error as { code?: string } | null)?.code !== "23505") throw new Error(error.message);
  }
  throw new Error("토큰 발급에 반복 실패했습니다.");
}

export type SaveSubmissionInput = {
  studentId: string;
  weekNumber: number;
  formType: ConsultingFormType;
  answers: Record<string, string>;
  filePaths: Record<string, ConsultingFile[]>;
  agreements: Record<string, boolean>;
  memo?: string | null;
};

export async function saveSubmission(input: SaveSubmissionInput): Promise<ConsultingSubmission> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("consulting_submissions")
    .insert({
      student_id: input.studentId,
      week_number: input.weekNumber,
      form_type: input.formType,
      answers: input.answers,
      file_paths: input.filePaths,
      agreements: input.agreements,
      memo: input.memo ?? null,
    })
    .select(SUB_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as ConsultingSubmission;
}

/** 특정 누적 주차 + 폼 종류에 해당하는 제출 1건 (최신, 레포트 참고용). */
export async function getSubmissionByWeek(
  studentId: string,
  weekNumber: number,
  formType: ConsultingFormType,
): Promise<ConsultingSubmission | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("consulting_submissions")
    .select(SUB_COLS)
    .eq("student_id", studentId)
    .eq("week_number", weekNumber)
    .eq("form_type", formType)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ConsultingSubmission) ?? null;
}

/** 학생의 제출 내역 (최신순). */
export async function listSubmissionsByStudent(studentId: string): Promise<ConsultingSubmission[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("consulting_submissions")
    .select(SUB_COLS)
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as ConsultingSubmission[];
}
