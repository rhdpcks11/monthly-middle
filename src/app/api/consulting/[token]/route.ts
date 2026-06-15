import { NextResponse } from "next/server";
import { getStudentByToken } from "@/lib/consulting/store";
import { weekStateForStudent } from "@/lib/consulting/week";
import { fieldsFor, FORM_TITLE, AGREEMENTS } from "@/lib/consulting/forms";

// GET /api/consulting/[token] → 학생 prefill + 현재 주차 폼 구성
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const student = await getStudentByToken(token);
  if (!student) {
    return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  }

  const state = weekStateForStudent(student.coachingStartDate);
  const prefill = {
    name: student.name,
    phone: student.phone,
    mentorName: student.mentorName,
  };

  if (state.kind === "not_started") {
    return NextResponse.json({ prefill, state: "not_started" });
  }
  if (state.kind === "pre") {
    return NextResponse.json({ prefill, state: "pre", week: 1 });
  }

  return NextResponse.json({
    prefill,
    state: "form",
    week: state.week,
    formType: state.formType,
    title: FORM_TITLE[state.formType],
    fields: fieldsFor(state.formType),
    agreements: AGREEMENTS,
  });
}
