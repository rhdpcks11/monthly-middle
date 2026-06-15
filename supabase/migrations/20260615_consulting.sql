-- 2026-06-15 학생 컨설팅 폼 제출 / 멘토 수집 기능용 스키마 변경
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 RUN 하세요.
-- (기존 테이블/컬럼은 건드리지 않고, 컬럼 1개 + 테이블 1개만 추가합니다.)

-- 1) 학생별 추측 불가능한 공개 링크 토큰 (학생은 /c/[token] 링크 하나만 받음)
--    - 기존 학생 전원에 hex 토큰 백필 (URL-safe, 사람이 입력하지 않음)
--    - 신규 학생은 앱(관리자 학생 생성 API)에서 자동 부여
alter table coaching_students
  add column if not exists consulting_token text;

update coaching_students
  set consulting_token = encode(gen_random_bytes(12), 'hex')
  where consulting_token is null;

create unique index if not exists coaching_students_consulting_token_idx
  on coaching_students (consulting_token);

-- 2) 컨설팅 폼 제출 내역
--    - week_number / form_type 는 제출 시점에 서버가 계산해 태깅 (클라이언트 값 신뢰 안 함)
--    - answers: { 질문키: 답변텍스트 }
--    - file_paths: { 질문키: ["coaching-photos 버킷 경로", ...] }  (이미지 업로드)
--    - agreements: { "principle": true, "entry": true, "guide": true, "recording": true, "final": true }
create table if not exists consulting_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references coaching_students(id) on delete cascade,
  week_number int not null,
  form_type text not null check (form_type in ('weekly', 'monthly')),
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}'::jsonb,
  file_paths jsonb not null default '{}'::jsonb,
  agreements jsonb not null default '{}'::jsonb,
  memo text
);

create index if not exists consulting_submissions_student_idx
  on consulting_submissions (student_id, submitted_at desc);

-- 3) 파일 업로드는 기존 'coaching-photos' 버킷을 재사용합니다 (별도 생성 불필요).
--    경로: consulting/{studentId}/{submissionId}/{uuid}.{ext}
