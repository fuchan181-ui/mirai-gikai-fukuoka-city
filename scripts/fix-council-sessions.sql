-- Fix council_sessions table to match Mirai Gikai schema
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

CREATE INDEX idx_council_sessions_date_range ON council_sessions(start_date, end_date);
CREATE INDEX idx_council_sessions_slug ON council_sessions(slug);

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

DROP TRIGGER IF EXISTS update_council_sessions_updated_at ON council_sessions;
CREATE TRIGGER update_council_sessions_updated_at
  BEFORE UPDATE ON council_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE council_sessions ENABLE ROW LEVEL SECURITY;

-- Re-establish foreign keys to council_sessions
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_council_session_id_fkey;
ALTER TABLE bills ADD CONSTRAINT bills_council_session_id_fkey FOREIGN KEY (council_session_id) REFERENCES council_sessions(id) ON DELETE SET NULL;

ALTER TABLE budget_overviews DROP CONSTRAINT IF EXISTS budget_overviews_council_session_id_fkey;
ALTER TABLE budget_overviews ADD CONSTRAINT budget_overviews_council_session_id_fkey FOREIGN KEY (council_session_id) REFERENCES council_sessions(id) ON DELETE CASCADE;

ALTER TABLE general_questions DROP CONSTRAINT IF EXISTS general_questions_council_session_id_fkey;
ALTER TABLE general_questions ADD CONSTRAINT general_questions_council_session_id_fkey FOREIGN KEY (council_session_id) REFERENCES council_sessions(id) ON DELETE CASCADE;

ALTER TABLE general_question_overviews DROP CONSTRAINT IF EXISTS general_question_overviews_council_session_id_fkey;
ALTER TABLE general_question_overviews ADD CONSTRAINT general_question_overviews_council_session_id_fkey FOREIGN KEY (council_session_id) REFERENCES council_sessions(id) ON DELETE CASCADE;

-- Permissions
GRANT ALL ON TABLE council_sessions TO postgres, anon, authenticated, service_role;

