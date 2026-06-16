-- ============================================================
-- SKY MATE 코칭 대시보드 — 전체 스키마 (새 프로젝트 부트스트랩용)
-- 새 Supabase 프로젝트의 SQL Editor 에 "통째로" 붙여넣고 RUN 하세요.
-- (기존 고등 프로젝트의 모든 테이블/버킷/제약을 빈 상태로 재생성합니다. 데이터는 복제하지 않음)
-- 의존성 순서대로 생성하므로 한 번에 실행하면 됩니다.
-- ============================================================

-- 1) 멘토
create table if not exists coaching_mentors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mentor_code text not null unique,
  created_at timestamptz not null default now()
);

-- 2) 학생
create table if not exists coaching_students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int,
  grade text,                       -- 학년 (고1/고2/… 또는 중1/중2/중3 등 문자열)
  phone text,
  parent_phone text,
  high_school text,                 -- 출신 학교명
  mentor_id uuid references coaching_mentors(id) on delete set null,
  coaching_start_date date,         -- 항상 월요일로 보정해 저장
  coaching_ended boolean not null default false,
  consulting_token text,            -- 학생 컨설팅 폼 공개 링크 토큰 (/c/[token])
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists coaching_students_consulting_token_idx
  on coaching_students (consulting_token);
create index if not exists coaching_students_mentor_idx
  on coaching_students (mentor_id);

-- 3) 주간 레포트 (월차/주차 단위, 7일 day_data)
create table if not exists coaching_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references coaching_students(id) on delete cascade,
  cycle_number int not null,
  week_number int not null,         -- 1~4
  start_date date,
  end_date date,
  day_data jsonb not null default '[]'::jsonb,
  good_points text,
  improvement_points text,
  next_week_actions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, cycle_number, week_number)
);
create index if not exists coaching_weekly_reports_student_idx
  on coaching_weekly_reports (student_id);

-- 4) 월간 레포트 (월차 단위 총평)
create table if not exists coaching_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references coaching_students(id) on delete cascade,
  cycle_number int not null,
  month_summary text,
  next_month_direction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, cycle_number)
);
create index if not exists coaching_monthly_reports_student_idx
  on coaching_monthly_reports (student_id);

-- 5) 월차별 날짜 오버라이드 + 관리자 메모(notes)
create table if not exists coaching_cycles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references coaching_students(id) on delete cascade,
  cycle_number int not null,
  start_date date,
  end_date date,
  memo text,
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, cycle_number)
);
create index if not exists coaching_cycles_student_idx
  on coaching_cycles (student_id);

-- 6) 코칭 재시작 앵커
create table if not exists coaching_restarts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references coaching_students(id) on delete cascade,
  cycle_number int not null,
  start_date date not null,
  created_at timestamptz not null default now(),
  unique (student_id, cycle_number)
);
create index if not exists coaching_restarts_student_idx
  on coaching_restarts (student_id);

-- 7) 주간 계획표 (노션형 JSON)
create table if not exists coaching_weekly_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references coaching_students(id) on delete cascade,
  cycle_number int not null,
  week_number int not null,
  plan_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, cycle_number, week_number)
);
create index if not exists coaching_weekly_plans_student_idx
  on coaching_weekly_plans (student_id);

-- 8) 복습 세트 (AI 출제)
create table if not exists review_sets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  mentor_id uuid references coaching_mentors(id) on delete set null,
  student_id uuid references coaching_students(id) on delete set null,
  subject text,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  mentor_note text,
  created_at timestamptz not null default now()
);
create index if not exists review_sets_mentor_idx on review_sets (mentor_id);
create index if not exists review_sets_student_idx on review_sets (student_id);

-- 9) 복습 응시 기록
create table if not exists review_attempts (
  id uuid primary key default gen_random_uuid(),
  review_set_id uuid not null references review_sets(id) on delete cascade,
  student_id uuid references coaching_students(id) on delete set null,
  student_name text,
  subject text,
  title text,
  score_percent numeric not null default 0,
  total int not null default 0,
  correct int not null default 0,
  result jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);
create index if not exists review_attempts_set_idx on review_attempts (review_set_id);

-- 10) 컨설팅 폼 제출 (pre/weekly/monthly)
create table if not exists consulting_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references coaching_students(id) on delete cascade,
  week_number int not null,
  form_type text not null check (form_type in ('weekly', 'monthly', 'pre')),
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}'::jsonb,
  file_paths jsonb not null default '{}'::jsonb,
  agreements jsonb not null default '{}'::jsonb,
  memo text
);
create index if not exists consulting_submissions_student_idx
  on consulting_submissions (student_id, submitted_at desc);

-- 11) 파일 업로드 버킷 (공부 인증 사진 + 컨설팅 업로드 공용, public read)
insert into storage.buckets (id, name, public)
values ('coaching-photos', 'coaching-photos', true)
on conflict (id) do update set public = true;
