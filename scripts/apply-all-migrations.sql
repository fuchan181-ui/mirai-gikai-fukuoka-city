-- ==============================================================================
-- Mirai Gikai Hirakata City - Clean Initial Database Schema
-- Designed for clean/fresh public schema execution in Supabase SQL Editor
-- (Trigger-based calculated columns: NO GENERATED ALWAYS AS)
-- ==============================================================================

-- 0. Ensure extensions schema and extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- 1. Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ENUM Types (with ALL required values from day one)
DO $$ BEGIN
  CREATE TYPE bill_publish_status AS ENUM ('draft', 'published', 'coming_soon');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bill_status_enum AS ENUM (
    'preparing',
    'submitted',
    'in_committee',
    'plenary_session',
    'approved',
    'rejected',
    'adopted',
    'partially_adopted',
    'reported'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE stance_type_enum AS ENUM ('for', 'against', 'neutral', 'continued_deliberation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE chat_role_enum AS ENUM ('user', 'system', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level_enum AS ENUM ('normal', 'hard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_config_status_enum AS ENUM ('public', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_role_enum AS ENUM ('assistant', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_report_role_enum AS ENUM (
    'subject_expert',
    'work_related',
    'daily_life_affected',
    'general_citizen'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Core Tables

-- council_sessions
DROP TABLE IF EXISTS council_sessions CASCADE;
CREATE TABLE council_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  council_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_council_sessions_date_range ON council_sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_council_sessions_slug ON council_sessions(slug);

CREATE OR REPLACE FUNCTION set_active_council_session(target_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE council_sessions
  SET is_active = (id = target_session_id)
  WHERE id IS NOT NULL;
END;
$$;

-- factions
CREATE TABLE IF NOT EXISTS factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  alternative_names TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- committees
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  description TEXT,
  featured_priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- bills
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  headline TEXT,
  description TEXT,
  status bill_status_enum NOT NULL DEFAULT 'submitted',
  status_note TEXT,
  published_at TIMESTAMPTZ,
  publish_status bill_publish_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  council_session_id UUID REFERENCES council_sessions(id) ON DELETE SET NULL,
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  bill_number TEXT UNIQUE,
  source_url TEXT,
  bill_type TEXT,
  submitted_date DATE,
  decided_date DATE,
  thumbnail_url TEXT,
  share_thumbnail_url TEXT,
  body_markdown TEXT,
  discussion_overview_points JSONB DEFAULT '[]'::jsonb,
  status_order INT NOT NULL DEFAULT 5,
  publish_status_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_published_at ON bills(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_council_session_id ON bills(council_session_id);
CREATE INDEX IF NOT EXISTS idx_bills_committee_id ON bills(committee_id);
CREATE INDEX IF NOT EXISTS idx_bills_status_order ON bills(status_order);
CREATE INDEX IF NOT EXISTS idx_bills_publish_status_order ON bills(publish_status_order);

-- bill_contents
CREATE TABLE IF NOT EXISTS bill_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  difficulty_level difficulty_level_enum NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bill_id, difficulty_level)
);
CREATE INDEX IF NOT EXISTS idx_bill_contents_bill_id ON bill_contents(bill_id);

-- bills_tags
CREATE TABLE IF NOT EXISTS bills_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bill_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_bills_tags_bill_id ON bills_tags(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_tags_tag_id ON bills_tags(tag_id);

-- faction_stances
CREATE TABLE IF NOT EXISTS faction_stances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  type stance_type_enum NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bill_id, faction_id)
);
CREATE INDEX IF NOT EXISTS idx_faction_stances_bill_id ON faction_stances(bill_id);
CREATE INDEX IF NOT EXISTS idx_faction_stances_faction_id ON faction_stances(faction_id);

-- chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id UUID,
  role chat_role_enum NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chats_bill_id ON chats(bill_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_bill_user ON chats(bill_id, user_id);

-- chat_usage_events
CREATE TABLE IF NOT EXISTS chat_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_usage_events_user_id ON chat_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_events_created_at ON chat_usage_events(created_at);

-- preview_tokens
CREATE TABLE IF NOT EXISTS preview_tokens (
  token TEXT PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_preview_tokens_token ON preview_tokens(token);
CREATE INDEX IF NOT EXISTS idx_preview_tokens_bill_id ON preview_tokens(bill_id);
CREATE INDEX IF NOT EXISTS idx_preview_tokens_expires_at ON preview_tokens(expires_at);

-- interview_configs
CREATE TABLE IF NOT EXISTS interview_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'デフォルト設定',
  status interview_config_status_enum NOT NULL DEFAULT 'closed',
  themes TEXT[] NOT NULL DEFAULT '{}',
  knowledge_source TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'normal',
  chat_model TEXT,
  follow_up_guide TEXT,
  estimated_duration INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_configs_bill_id ON interview_configs(bill_id);

-- interview_questions
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_config_id UUID NOT NULL REFERENCES interview_configs(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  follow_up_guide TEXT,
  quick_replies JSONB,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_questions_config_id ON interview_questions(interview_config_id);

-- interview_sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_config_id UUID NOT NULL REFERENCES interview_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_config_id ON interview_sessions(interview_config_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_completed_at ON interview_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_archived_at ON interview_sessions(archived_at);

-- interview_messages
CREATE TABLE IF NOT EXISTS interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  role interview_role_enum NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_messages_session_id ON interview_messages(interview_session_id);

-- interview_report
CREATE TABLE IF NOT EXISTS interview_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
  stance stance_type_enum NOT NULL,
  summary TEXT NOT NULL,
  role interview_report_role_enum,
  role_title TEXT,
  role_description TEXT,
  opinions JSONB NOT NULL DEFAULT '[]'::jsonb,
  scores JSONB,
  total_score NUMERIC(5, 2),
  is_public_by_admin BOOLEAN NOT NULL DEFAULT false,
  is_public_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_report_session_id ON interview_report(interview_session_id);
CREATE INDEX IF NOT EXISTS idx_interview_report_is_public_by_admin ON interview_report(is_public_by_admin);
CREATE INDEX IF NOT EXISTS idx_interview_report_is_public_by_user ON interview_report(is_public_by_user);
CREATE INDEX IF NOT EXISTS idx_interview_report_role ON interview_report(role);

-- interview_session_ratings
CREATE TABLE IF NOT EXISTS interview_session_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- expert_registrations
CREATE TABLE IF NOT EXISTS expert_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  expertise TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- report_reactions
CREATE TABLE IF NOT EXISTS report_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES interview_report(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id, user_id, reaction_type)
);
CREATE INDEX IF NOT EXISTS idx_report_reactions_report_id ON report_reactions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_reactions_user_id ON report_reactions(user_id);

-- topic_analysis
CREATE TABLE IF NOT EXISTS topic_analysis_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  phase TEXT NOT NULL DEFAULT 'draft',
  current_step TEXT,
  phase_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bill_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_topic_analysis_versions_bill_id ON topic_analysis_versions(bill_id);

CREATE TABLE IF NOT EXISTS topic_analysis_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES topic_analysis_versions(id) ON DELETE CASCADE,
  topic_title TEXT NOT NULL,
  topic_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_topic_analysis_topics_version_id ON topic_analysis_topics(version_id);

CREATE TABLE IF NOT EXISTS topic_analysis_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topic_analysis_topics(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES interview_report(id) ON DELETE CASCADE,
  opinion_index INTEGER NOT NULL,
  relevance_score NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, report_id, opinion_index)
);
CREATE INDEX IF NOT EXISTS idx_topic_analysis_classifications_topic_id ON topic_analysis_classifications(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_analysis_classifications_report_id ON topic_analysis_classifications(report_id);

-- budget_overviews
CREATE TABLE IF NOT EXISTS budget_overviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  council_session_id UUID NOT NULL UNIQUE REFERENCES council_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  total_budget_amount NUMERIC(15, 2),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_overview_id UUID NOT NULL REFERENCES budget_overviews(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_theme_id UUID NOT NULL REFERENCES budget_themes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2),
  department_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- general_questions
CREATE TABLE IF NOT EXISTS general_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  council_session_id UUID NOT NULL REFERENCES council_sessions(id) ON DELETE CASCADE,
  session_day INTEGER NOT NULL,
  question_order INTEGER NOT NULL,
  questioner_name TEXT NOT NULL,
  questioner_party TEXT,
  questioner_number INTEGER,
  summary TEXT NOT NULL,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_text TEXT NOT NULL,
  source_url TEXT,
  publish_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (council_session_id, session_day, question_order)
);
CREATE INDEX IF NOT EXISTS idx_general_questions_session_id ON general_questions(council_session_id);

CREATE TABLE IF NOT EXISTS general_question_overviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  council_session_id UUID NOT NULL UNIQUE REFERENCES council_sessions(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  lines TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- bill_discussions
CREATE TABLE IF NOT EXISTS bill_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  questioner_name TEXT NOT NULL,
  questioner_party TEXT,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bill_discussions_bill_id ON bill_discussions(bill_id);

-- committee_meetings
CREATE TABLE IF NOT EXISTS committee_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_name TEXT NOT NULL,
  committee_slug TEXT NOT NULL,
  committee_type TEXT NOT NULL CHECK (committee_type IN ('standing', 'budget_special', 'settlement_special', 'special')),
  meeting_date DATE NOT NULL,
  source_document_id INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  speeches JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS committee_meetings_slug_date_idx ON committee_meetings(committee_slug, meeting_date DESC);

CREATE TABLE IF NOT EXISTS committee_meeting_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES committee_meetings(id) ON DELETE CASCADE,
  topic_order INTEGER NOT NULL,
  topic_title TEXT NOT NULL,
  discussion_summary TEXT,
  start_voice_no INTEGER,
  end_voice_no INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, topic_order)
);
CREATE INDEX IF NOT EXISTS committee_meeting_topics_meeting_id_idx ON committee_meeting_topics(meeting_id);

-- press_conferences
CREATE TABLE IF NOT EXISTS press_conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  held_at DATE NOT NULL,
  youtube_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'structuring', 'review', 'published', 'error')),
  overview_summary TEXT,
  themes JSONB DEFAULT '[]'::jsonb,
  key_topics JSONB DEFAULT '[]'::jsonb,
  raw_transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS press_conference_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  press_conference_id UUID NOT NULL REFERENCES press_conferences(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  summary TEXT,
  material_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_press_conference_items_conference_id ON press_conference_items(press_conference_id);

CREATE TABLE IF NOT EXISTS press_conference_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  press_conference_item_id UUID NOT NULL REFERENCES press_conference_items(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  speaker TEXT NOT NULL,
  speaker_name TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_press_conference_turns_item_id ON press_conference_turns(press_conference_item_id);

-- jimu_jigyo
CREATE TABLE IF NOT EXISTS jimu_jigyo_bureaus (
  bureau_code TEXT PRIMARY KEY,
  bureau_name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO jimu_jigyo_bureaus (bureau_code, bureau_name, display_order) VALUES
  ('somu', '総務企画局', 0),
  ('fukushi', '福祉局', 1),
  ('hoken', '保健福祉局', 2),
  ('kyouiku', '教育委員会', 3),
  ('kodomo', 'こども青年局', 4),
  ('juto', '建設局', 5),
  ('keizai', '経済局', 6),
  ('kankyo', '環境局', 7),
  ('shimin', '市民局', 8),
  ('nousui', '農業委員会', 9),
  ('kouwan', '港湾空港局', 10)
ON CONFLICT (bureau_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS jimu_jigyo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  bureau_code TEXT NOT NULL REFERENCES jimu_jigyo_bureaus(bureau_code) ON DELETE RESTRICT,
  bureau_name TEXT NOT NULL,
  department_code TEXT NOT NULL,
  department_name TEXT NOT NULL,
  start_fiscal_year TEXT,
  root_law TEXT,
  administrative_plan TEXT,
  establishment_trigger TEXT,
  target_description TEXT,
  target_goal_state TEXT,
  implementation_content TEXT,
  achievement_criteria TEXT,
  activity_output TEXT,
  result_output TEXT,
  intermediate_outcome TEXT,
  final_outcome TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_items_item_name ON jimu_jigyo_items(item_name);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_items_bureau_code ON jimu_jigyo_items(bureau_code);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_items_item_code ON jimu_jigyo_items(item_code);

CREATE TABLE IF NOT EXISTS jimu_jigyo_fiscal_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES jimu_jigyo_items(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  expenditure_amount INTEGER,
  expenditure_type TEXT,
  specific_revenue INTEGER,
  general_revenue INTEGER,
  next_year_budget INTEGER,
  basic_plan_data JSONB,
  administrative_plan_data JSONB,
  data_source TEXT,
  imported_at TIMESTAMP DEFAULT now(),
  imported_by TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(item_id, fiscal_year)
);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_fy_item_id ON jimu_jigyo_fiscal_years(item_id);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_fy_fiscal_year ON jimu_jigyo_fiscal_years(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_fy_item_fiscal ON jimu_jigyo_fiscal_years(item_id, fiscal_year);

CREATE TABLE IF NOT EXISTS jimu_jigyo_kpi_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_type_code TEXT UNIQUE NOT NULL,
  kpi_type_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO jimu_jigyo_kpi_types (kpi_type_code, kpi_type_name, display_order) VALUES
  ('ACTIVITY', '活動指標', 0),
  ('ACHIEVEMENT', '成果指標', 1)
ON CONFLICT (kpi_type_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS jimu_jigyo_kpi_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES jimu_jigyo_items(id) ON DELETE CASCADE,
  kpi_type_id UUID NOT NULL REFERENCES jimu_jigyo_kpi_types(id) ON DELETE RESTRICT,
  kpi_name TEXT NOT NULL,
  kpi_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(item_id, kpi_type_id, kpi_name)
);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_kpi_items_item_id ON jimu_jigyo_kpi_items(item_id);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_kpi_items_type_id ON jimu_jigyo_kpi_items(kpi_type_id);

CREATE TABLE IF NOT EXISTS jimu_jigyo_kpi_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_item_id UUID NOT NULL REFERENCES jimu_jigyo_kpi_items(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  actual_value TEXT,
  achievement_rate TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(kpi_item_id, fiscal_year)
);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_kpi_results_kpi_item_id ON jimu_jigyo_kpi_results(kpi_item_id);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_kpi_results_fiscal_year ON jimu_jigyo_kpi_results(fiscal_year);

CREATE TABLE IF NOT EXISTS jimu_jigyo_kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_item_id UUID NOT NULL REFERENCES jimu_jigyo_kpi_items(id) ON DELETE CASCADE,
  target_fiscal_year INTEGER,
  target_value TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(kpi_item_id, target_fiscal_year)
);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_kpi_targets_kpi_item_id ON jimu_jigyo_kpi_targets(kpi_item_id);

CREATE TABLE IF NOT EXISTS jimu_jigyo_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  file_name TEXT,
  total_items_processed INTEGER,
  total_items_inserted INTEGER,
  total_items_updated INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  imported_by TEXT,
  imported_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_import_logs_fiscal_year ON jimu_jigyo_import_logs(fiscal_year);

CREATE TABLE IF NOT EXISTS jimu_jigyo_matching_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL,
  source_item_name TEXT NOT NULL,
  source_bureau_code TEXT NOT NULL,
  source_department_name TEXT NOT NULL,
  target_item_id UUID REFERENCES jimu_jigyo_items(id) ON DELETE SET NULL,
  match_score NUMERIC(5, 2),
  match_method TEXT NOT NULL,
  matched_at TIMESTAMP DEFAULT now(),
  matched_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_jimu_jigyo_matching_logs_item_id ON jimu_jigyo_matching_logs(target_item_id);

-- 4. Triggers for updated_at
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_factions_updated_at ON factions;
CREATE TRIGGER set_factions_updated_at BEFORE UPDATE ON factions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_committees_updated_at ON committees;
CREATE TRIGGER set_committees_updated_at BEFORE UPDATE ON committees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_council_sessions_updated_at ON council_sessions;
CREATE TRIGGER update_council_sessions_updated_at BEFORE UPDATE ON council_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bill_contents_updated_at ON bill_contents;
CREATE TRIGGER update_bill_contents_updated_at BEFORE UPDATE ON bill_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_faction_stances_updated_at ON faction_stances;
CREATE TRIGGER set_faction_stances_updated_at BEFORE UPDATE ON faction_stances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_configs_updated_at ON interview_configs;
CREATE TRIGGER update_interview_configs_updated_at BEFORE UPDATE ON interview_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_questions_updated_at ON interview_questions;
CREATE TRIGGER update_interview_questions_updated_at BEFORE UPDATE ON interview_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_sessions_updated_at ON interview_sessions;
CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON interview_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_report_updated_at ON interview_report;
CREATE TRIGGER update_interview_report_updated_at BEFORE UPDATE ON interview_report FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_general_questions_updated_at ON general_questions;
CREATE TRIGGER update_general_questions_updated_at BEFORE UPDATE ON general_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_committee_meetings_updated_at ON committee_meetings;
CREATE TRIGGER update_committee_meetings_updated_at BEFORE UPDATE ON committee_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_committee_meeting_topics_updated_at ON committee_meeting_topics;
CREATE TRIGGER update_committee_meeting_topics_updated_at BEFORE UPDATE ON committee_meeting_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_press_conferences_updated_at ON press_conferences;
CREATE TRIGGER update_press_conferences_updated_at BEFORE UPDATE ON press_conferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Trigger Functions for Calculated Columns (Replacing GENERATED ALWAYS AS)

-- 5a. bills: status_order & publish_status_order calculation trigger
CREATE OR REPLACE FUNCTION calculate_bill_orders()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status_order := CASE NEW.status::text
    WHEN 'approved'          THEN 0
    WHEN 'adopted'           THEN 0
    WHEN 'reported'          THEN 0
    WHEN 'partially_adopted' THEN 1
    WHEN 'rejected'          THEN 2
    WHEN 'plenary_session'   THEN 3
    WHEN 'in_committee'      THEN 4
    WHEN 'submitted'         THEN 5
    WHEN 'preparing'         THEN 6
    ELSE 5
  END;

  NEW.publish_status_order := CASE NEW.publish_status::text
    WHEN 'draft'       THEN 0
    WHEN 'coming_soon' THEN 1
    WHEN 'published'   THEN 2
    ELSE 0
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_bill_orders ON bills;
CREATE TRIGGER trigger_calculate_bill_orders
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bill_orders();

-- 5b. interview_report: total_score calculation trigger
CREATE OR REPLACE FUNCTION calculate_interview_report_total_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scores IS NOT NULL AND
     jsonb_typeof(NEW.scores->'constructiveness') = 'number' AND
     jsonb_typeof(NEW.scores->'specificity') = 'number' AND
     jsonb_typeof(NEW.scores->'logicality') = 'number'
  THEN
    NEW.total_score := ROUND(
      (
        (NEW.scores->>'constructiveness')::numeric * 0.4 +
        (NEW.scores->>'specificity')::numeric * 0.4 +
        (NEW.scores->>'logicality')::numeric * 0.2
      ),
      2
    );
  ELSE
    NEW.total_score := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_interview_report_total_score ON interview_report;
CREATE TRIGGER trigger_calculate_interview_report_total_score
  BEFORE INSERT OR UPDATE ON interview_report
  FOR EACH ROW
  EXECUTE FUNCTION calculate_interview_report_total_score();

-- 6. Views & RPC Functions

CREATE OR REPLACE VIEW jimu_jigyo_latest AS
SELECT
  jj.id,
  jj.item_code,
  jj.item_name,
  jj.bureau_code,
  jj.bureau_name,
  jj.department_code,
  jj.department_name,
  MAX(fy.fiscal_year) AS latest_fiscal_year,
  COUNT(DISTINCT fy.fiscal_year) AS fiscal_year_count
FROM jimu_jigyo_items jj
LEFT JOIN jimu_jigyo_fiscal_years fy ON jj.id = fy.item_id
GROUP BY jj.id, jj.item_code, jj.item_name, jj.bureau_code, jj.bureau_name, jj.department_code, jj.department_name;

CREATE OR REPLACE VIEW jimu_jigyo_budget_timeline AS
SELECT
  jj.id AS item_id,
  jj.item_name,
  jj.bureau_name,
  fy.fiscal_year,
  fy.expenditure_amount,
  fy.specific_revenue,
  fy.general_revenue,
  LAG(fy.expenditure_amount) OVER (
    PARTITION BY fy.item_id
    ORDER BY fy.fiscal_year
  ) AS prev_year_amount,
  ROUND(
    ((fy.expenditure_amount - LAG(fy.expenditure_amount) OVER (
      PARTITION BY fy.item_id
      ORDER BY fy.fiscal_year
    ))::numeric / NULLIF(LAG(fy.expenditure_amount) OVER (
      PARTITION BY fy.item_id
      ORDER BY fy.fiscal_year
    ), 0)) * 100, 1
  ) AS change_rate_percent
FROM jimu_jigyo_items jj
JOIN jimu_jigyo_fiscal_years fy ON jj.id = fy.item_id
ORDER BY jj.item_name, fy.fiscal_year;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'roles' LIKE '%admin%'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, u.email, u.created_at, u.last_sign_in_at
  FROM auth.users u
  WHERE u.raw_app_meta_data->'roles' ? 'admin'
  ORDER BY u.created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO service_role;

CREATE OR REPLACE FUNCTION get_interview_message_counts(session_ids UUID[])
RETURNS TABLE (
  interview_session_id UUID,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    im.interview_session_id,
    COUNT(*)::BIGINT AS message_count
  FROM interview_messages im
  WHERE im.interview_session_id = ANY(session_ids)
  GROUP BY im.interview_session_id;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION count_reactions_by_report_ids(report_ids uuid[])
RETURNS TABLE (report_id uuid, reaction_type text, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT report_id, reaction_type, COUNT(*)::bigint AS count
  FROM report_reactions
  WHERE report_id = ANY(report_ids)
  GROUP BY report_id, reaction_type;
$$;

CREATE OR REPLACE FUNCTION get_jimu_jigyo_statistics(target_fiscal_year INTEGER DEFAULT 2024)
RETURNS TABLE (
  fiscal_year INTEGER,
  total_items BIGINT,
  total_budget BIGINT,
  avg_achievement_rate NUMERIC,
  bureau_breakdown JSONB
)
LANGUAGE sql
STABLE
AS $$
WITH base AS (
  SELECT
    jj.id,
    jj.bureau_code,
    jj.bureau_name,
    fy.expenditure_amount,
    CASE
      WHEN kr.achievement_rate ~ '^[0-9]+(.[0-9]+)?%?$'
      THEN REPLACE(kr.achievement_rate, '%', '')::numeric
      ELSE NULL
    END AS achievement_rate_num
  FROM jimu_jigyo_items jj
  JOIN jimu_jigyo_fiscal_years fy ON jj.id = fy.item_id AND fy.fiscal_year = target_fiscal_year
  LEFT JOIN jimu_jigyo_kpi_items ki ON jj.id = ki.item_id
  LEFT JOIN jimu_jigyo_kpi_results kr ON ki.id = kr.kpi_item_id AND kr.fiscal_year = target_fiscal_year
),
bureau_agg AS (
  SELECT
    bureau_code,
    bureau_name,
    COUNT(DISTINCT id)::bigint AS item_count,
    SUM(DISTINCT expenditure_amount)::bigint AS total_budget
  FROM base
  GROUP BY bureau_code, bureau_name
)
SELECT
  target_fiscal_year AS fiscal_year,
  COUNT(DISTINCT b.id)::bigint AS total_items,
  SUM(DISTINCT b.expenditure_amount)::bigint AS total_budget,
  ROUND(AVG(b.achievement_rate_num), 1) AS avg_achievement_rate,
  (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
    'bureau_code', ba.bureau_code,
    'bureau_name', ba.bureau_name,
    'item_count', ba.item_count,
    'total_budget', ba.total_budget
  )) FROM bureau_agg ba) AS bureau_breakdown
FROM base b;
$$;

-- 7. Storage Bucket & Policies
INSERT INTO storage.buckets (id, name, public) VALUES ('bill-thumbnails', 'bill-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'bill-thumbnails');

DROP POLICY IF EXISTS "Admin users can upload bill thumbnails" ON storage.objects;
CREATE POLICY "Admin users can upload bill thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bill-thumbnails' AND public.is_admin());

DROP POLICY IF EXISTS "Admin users can update bill thumbnails" ON storage.objects;
CREATE POLICY "Admin users can update bill thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'bill-thumbnails' AND public.is_admin());

DROP POLICY IF EXISTS "Admin users can delete bill thumbnails" ON storage.objects;
CREATE POLICY "Admin users can delete bill thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'bill-thumbnails' AND public.is_admin());

-- 8. Enable Row Level Security (all access denied by default for external clients, service_role bypasses)
ALTER TABLE council_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_stances ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_session_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_analysis_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_analysis_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_analysis_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_overviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_question_overviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_meeting_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_conference_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_conference_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_kpi_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_kpi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_kpi_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimu_jigyo_matching_logs ENABLE ROW LEVEL SECURITY;

-- 9. Grant Schema Permissions (essential after DROP SCHEMA public CASCADE)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
