import "server-only";
import type { ReviewSet, GradeResult, GradedItem } from "@/types";
import { gradeOpenEnded, type AiGradeInput } from "./anthropic";

/** 채점용 문자열 정규화 (공백/대소문자/문장부호 차이 흡수). */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,!?;:'"()[\]{}·・]/g, "");
}

/**
 * 학생 답안을 채점한다.
 * - 객관식/OX/단답: 결정적 비교
 * - 서술형: AI 채점
 */
export async function gradeQuiz(
  quiz: ReviewSet,
  answers: string[]
): Promise<GradeResult> {
  const items: GradedItem[] = new Array(quiz.questions.length);
  const aiQueue: AiGradeInput[] = [];

  quiz.questions.forEach((q, i) => {
    const studentAnswer = (answers[i] ?? "").toString();

    if (q.type === "essay") {
      aiQueue.push({
        index: i,
        question: q.question,
        modelAnswer: q.answer,
        studentAnswer,
      });
      items[i] = {
        index: i,
        type: q.type,
        question: q.question,
        studentAnswer,
        correctAnswer: q.answer,
        isCorrect: false,
        score: 0,
        explanation: q.explanation,
        feedback: "",
      };
      return;
    }

    let isCorrect = false;
    if (q.type === "short_answer") {
      const candidates = [q.answer, ...q.acceptedAnswers].map(normalize);
      isCorrect = candidates.includes(normalize(studentAnswer));
    } else {
      isCorrect = normalize(studentAnswer) === normalize(q.answer);
    }

    items[i] = {
      index: i,
      type: q.type,
      question: q.question,
      studentAnswer,
      correctAnswer: q.answer,
      isCorrect,
      score: isCorrect ? 1 : 0,
      explanation: q.explanation,
      feedback: isCorrect ? "정답입니다." : "다시 한 번 해설을 확인해 보세요.",
    };
  });

  // 서술형 AI 채점
  if (aiQueue.length > 0) {
    try {
      const graded = await gradeOpenEnded(aiQueue);
      for (const g of graded) {
        const item = items[g.index];
        if (item) {
          item.score = Math.max(0, Math.min(1, g.score));
          item.isCorrect = g.isCorrect;
          item.feedback = g.feedback;
        }
      }
    } catch (e) {
      console.error("[복습] 서술형 채점 실패:", e);
      for (const q of aiQueue) {
        const item = items[q.index];
        if (item) item.feedback = "자동 채점에 실패했습니다. 선생님께 확인하세요.";
      }
    }
  }

  const scoreSum = items.reduce((acc, it) => acc + it.score, 0);
  const correct = items.filter((it) => it.isCorrect).length;
  const total = items.length;

  return {
    total,
    correct,
    scorePercent: total === 0 ? 0 : Math.round((scoreSum / total) * 100),
    items,
  };
}
