// 컨설팅 폼 정의 — 공개 폼(렌더)과 멘토 prep 뷰(라벨 조회)가 공유한다.
// (server-only 아님: 클라이언트 컴포넌트에서도 import)
import type { ConsultingFormType } from "@/types";

export type ConsultingFieldType =
  | "image"      // 이미지 업로드
  | "longtext"   // 장문
  | "short"      // 단답
  | "single"     // 단일선택 (라디오)
  | "multi"      // 다중선택 (체크박스)
  | "section";   // 섹션 헤더/안내 (입력 아님)

export type ConsultingField = {
  key: string;
  label: string;
  hint?: string;
  type: ConsultingFieldType;
  required: boolean;
  options?: string[];                          // single / multi 선택지
  allowOther?: boolean;                         // multi "기타(직접입력)" 허용
  showIf?: { key: string; includes: string };  // 지정 multi 필드에 값이 선택됐을 때만 노출
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

// 사전 질문지 (pre) — 중등 버전. 첫 1회(1주차), 파일/동의 없음.
const PRE_SUBJECTS = ["국어", "수학", "영어", "과학", "사회", "역사"] as const;
const SUBJECT_KEY: Record<string, string> = {
  국어: "kor", 수학: "math", 영어: "eng", 과학: "sci", 사회: "soc", 역사: "hist",
};

function subjectQuestions(name: string): ConsultingField[] {
  const k = SUBJECT_KEY[name];
  const showIf = { key: "subjects", includes: name };
  return [
    { key: `${k}_score`, label: `[${name}] 이 과목의 성적은 어떻게 되나요?`, type: "longtext", required: false, showIf },
    {
      key: `${k}_trend`,
      label: `[${name}] 해당 학교의 내신 출제 경향은 어떻게 되나요?`,
      hint: "예: 서술형 비중이 높다 / 교과서에서 많이 나온다 / 기출에서 많이 나온다 / 따로 참고하는 부교재가 있다",
      type: "longtext",
      required: false,
      showIf,
    },
    {
      key: `${k}_method`,
      label: `[${name}] 평소 시험 대비를 진행할 때 어떤 방법으로 학습해 오셨나요?`,
      hint: "활용한 문제집, 인강, 학원 커리큘럼, 공부법 등",
      type: "longtext",
      required: false,
      showIf,
    },
    {
      key: `${k}_difficulty`,
      label: `[${name}] 이 과목을 대비하며 겪었던 어려움이나 고민을 최대한 자세하게 적어주세요.`,
      type: "longtext",
      required: false,
      showIf,
    },
  ];
}

export const PRE_FIELDS: ConsultingField[] = [
  // 1. 기본 정보 (이름은 헤더에 prefill)
  { key: "_sec_basic", label: "기본 정보", type: "section", required: false },
  { key: "school", label: "학교", type: "short", required: true },
  { key: "grade", label: "학년", type: "short", required: true },
  { key: "recent_score", label: "최근 내신 성적대", type: "short", required: true },
  { key: "target_highschool", label: "목표 고등학교", type: "short", required: true },
  { key: "target_university", label: "목표 대학교", type: "short", required: true },

  // 학원/과외/숙제 일정
  {
    key: "_sec_schedule",
    label: "학원 / 과외 / 숙제 일정",
    hint: "학교를 제외한 학원·과외·숙제 일정을 적어주세요.",
    type: "section",
    required: false,
  },
  { key: "my_schedule", label: "나의 일정", type: "longtext", required: true },

  // 2. 과목별 질문
  {
    key: "_sec_subjects",
    label: "과목별 질문",
    hint: "본인이 학습 중인 과목만 작성해주세요. 과목마다 질문 4가지는 동일합니다.",
    type: "section",
    required: false,
  },
  {
    key: "subjects",
    label: "학습 중인 과목을 선택해주세요",
    type: "multi",
    required: false,
    options: [...PRE_SUBJECTS],
  },
  ...PRE_SUBJECTS.flatMap((s) => subjectQuestions(s)),

  // 3. 학습 습관
  { key: "_sec_habit", label: "학습 습관", type: "section", required: false },
  {
    key: "planner_used",
    label: "플래너를 써본 경험이 있나요?",
    type: "single",
    required: true,
    options: ["네, 사용해본 적 있어요", "아니요, 사용해본 적 없어요"],
  },
  { key: "planner_reason", label: "현재 쓰고 있지 않다면 그 이유는?", type: "longtext", required: false },
  {
    key: "time_spent",
    label: "내가 가장 많이 시간을 쓰는 곳 (모두 체크)",
    type: "multi",
    required: false,
    options: ["인스타그램", "유튜브", "틱톡", "게임", "운동(농구·축구 등)", "노래방"],
    allowOther: true,
  },
  { key: "reduce_most", label: "코칭을 통해 가장 줄이고 싶은 건?", type: "longtext", required: true },
  { key: "study_weekday", label: "하루 공부 시간 — 평일", hint: "수업·숙제 시간 제외, 대략으로", type: "short", required: true },
  { key: "study_weekend", label: "하루 공부 시간 — 주말", hint: "수업·숙제 시간 제외, 대략으로", type: "short", required: true },
  {
    key: "motivation",
    label: "동기부여 수준",
    type: "single",
    required: true,
    options: [
      "🔴 동기부여가 약해서 의지가 잘 생기지 않는다",
      "🟡 동기부여가 보통이라 의지가 부족할 때가 있다",
      "🟢 동기부여가 충분해서 의지가 잘 유지된다",
    ],
  },

  // 4. 그 밖의 궁금한 점
  { key: "_sec_etc", label: "그 밖의 궁금한 점", type: "section", required: false },
  { key: "final_question", label: "컨설팅 전에 미리 궁금한 점이 있다면 적어주세요!", type: "longtext", required: false },
];

export function fieldsFor(formType: ConsultingFormType): ConsultingField[] {
  if (formType === "pre") return PRE_FIELDS;
  if (formType === "monthly") return MONTHLY_FIELDS;
  return WEEKLY_FIELDS;
}

export const FORM_TITLE: Record<ConsultingFormType, string> = {
  weekly: "주간 성장 코칭 폼",
  monthly: "월간 비전 컨설팅 폼",
  pre: "사전 질문지",
};

// 폼 상단 안내문 / 하단 문구 (값이 있는 폼만 노출)
export const FORM_INTRO: Partial<Record<ConsultingFormType, string>> = {
  pre: "상담을 위한 사전 질문지입니다. 본인 상태를 정확히 들여다보고 성장하기 위해 각 20분만 투자해주세요. 성실하게 작성할수록 상담 퀄리티가 올라갑니다.",
};
export const FORM_OUTRO: Partial<Record<ConsultingFormType, string>> = {
  pre: "작성해주셔서 감사합니다! 답변 내용을 바탕으로 곧 멘토님이 연락드리겠습니다.",
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
