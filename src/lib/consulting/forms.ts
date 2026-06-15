// 컨설팅 폼 정의 — 공개 폼(렌더)과 멘토 prep 뷰(라벨 조회)가 공유한다.
// (server-only 아님: 클라이언트 컴포넌트에서도 import)
import type { ConsultingFormType } from "@/types";

export type ConsultingFieldType = "image" | "longtext";

export type ConsultingField = {
  key: string;
  label: string;
  hint?: string;
  type: ConsultingFieldType;
  required: boolean;
};

// 주간 성장 코칭 폼 (weekly)
export const WEEKLY_FIELDS: ConsultingField[] = [
  { key: "screentime", label: "스크린타임 스크린샷", type: "image", required: true },
  { key: "miss_reason", label: "지난 주 계획을 못 지킨 이유가 있다면 간단히", type: "longtext", required: true },
  { key: "next_plan", label: "다음 주 계획을 적어서 찍어 보내기 (가능한 수준으로)", type: "image", required: true },
  { key: "worry_korean", label: "이번주 주요 국어 고민", hint: "구체적일수록 자세한 상담이 가능해요", type: "longtext", required: true },
  { key: "worry_math", label: "이번주 주요 수학 고민", type: "longtext", required: true },
  { key: "worry_english", label: "이번주 주요 영어 고민", type: "longtext", required: true },
  { key: "worry_extra", label: "이번주 추가적인 고민", type: "longtext", required: true },
  { key: "help_wanted", label: "멘토님께 이번주 특히 도움받고 싶은 부분", type: "longtext", required: true },
  { key: "memo", label: "메모", type: "longtext", required: false },
];

// 월간 비전 컨설팅 폼 (monthly)
export const MONTHLY_FIELDS: ConsultingField[] = [
  { key: "last_plan_photo", label: "지난 달 계획 사진 (완료된 걸 표시 후)", type: "image", required: true },
  { key: "achievement_review", label: "계획 달성도가 얼마나 됐는지 + 미달성 이유 회고", type: "longtext", required: true },
  { key: "month_goal_note", label: "이번 4주간 꼭 이뤄야 하는 공부를 과목별로 적은 노트 (큰 틀 목표)", type: "image", required: false },
  { key: "week_plan_note", label: "4주 목표를 위해 이번주에 이룰 구체적 계획 노트", type: "image", required: true },
  { key: "growth_goal", label: "이번 달 이루고 싶은 성장 (공부/생활태도/루틴 등 모든 분야 간단히)", type: "longtext", required: true },
  { key: "nearest_exam", label: "가장 임박한 시험 일정 + 그 시험을 위해 필요한 공부", type: "longtext", required: true },
  { key: "help_wanted", label: "멘토님께 이번주 특히 도움받고 싶은 부분 & 고민", type: "longtext", required: true },
  { key: "memo", label: "메모", type: "longtext", required: false },
];

export function fieldsFor(formType: ConsultingFormType): ConsultingField[] {
  return formType === "monthly" ? MONTHLY_FIELDS : WEEKLY_FIELDS;
}

export const FORM_TITLE: Record<ConsultingFormType, string> = {
  weekly: "주간 성장 코칭 폼",
  monthly: "월간 비전 컨설팅 폼",
};

// 하단 주의사항 / 동의 항목 (두 폼 공통, 전부 필수 체크)
export type AgreementItem = { key: string; title: string; lines: string[] };

export const AGREEMENTS: AgreementItem[] = [
  {
    key: "principle",
    title: "코칭 시간 및 원칙",
    lines: [
      "사전에 고지된 시간을 지켜 입장해주세요.",
      "웬만하면 캠을 켜주시고, 부득이한 경우엔 멘토에게 말씀해주세요!",
    ],
  },
  {
    key: "entry",
    title: "코칭 입장 방법",
    lines: [
      "줌 코칭은 카톡 방 공지에 있는 줌 회의 링크로 입장하시면 됩니다.",
      "시작 5분 전엔 입장 완료 부탁드립니다.",
      "지각으로 인해 코칭 시작이 지연될 경우 코칭 시간이 연장되지 않습니다.",
    ],
  },
  {
    key: "guide",
    title: "주차별 코칭 가이드",
    lines: [
      "1주차 VISION 코칭: 4주간의 계획을 설계하고 목표를 향한 비전을 체크합니다.",
      "2-4주차 GROWTH 코칭: 한 주간의 학습을 돌아보고 비전을 향한 차주 계획을 수립합니다.",
      "4주마다 변화하는 성적과 상태에 따라 재 점검하며 나아갑니다.",
    ],
  },
  {
    key: "recording",
    title: "코칭 녹화 규정",
    lines: [
      "코칭의 품질 관리와 복습을 위해, 별도의 협의 없이 세션이 녹화됩니다.",
      "모든 녹화물은 내부 교육 및 분쟁 시 확인 용도로만 사용 가능하며, 제3자에게 공개하거나 배포하는 것은 엄격히 금지됩니다.",
    ],
  },
  {
    key: "final",
    title: "최종 동의",
    lines: [
      "위 내용을 제대로 읽지 않아 발생하는 불이익에 대해서는 스카이메이트에서 책임지지 않습니다. 이에 동의하시나요?",
    ],
  },
];
