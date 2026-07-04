-- Academy lessons, per-lesson progress, user_courses RLS, lesson seeds

CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  content_type VARCHAR(50) NOT NULL DEFAULT 'article',
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_lessons_course_id ON academy_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_courses_user_course ON user_courses(user_id, course_id);

ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Academy lessons are public" ON academy_lessons;
CREATE POLICY "Academy lessons are public" ON academy_lessons
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users read own courses" ON user_courses;
CREATE POLICY "Users read own courses" ON user_courses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own courses" ON user_courses;
CREATE POLICY "Users insert own courses" ON user_courses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own courses" ON user_courses;
CREATE POLICY "Users update own courses" ON user_courses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own lesson progress" ON user_lesson_progress;
CREATE POLICY "Users read own lesson progress" ON user_lesson_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own lesson progress" ON user_lesson_progress;
CREATE POLICY "Users insert own lesson progress" ON user_lesson_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own lesson progress" ON user_lesson_progress;
CREATE POLICY "Users update own lesson progress" ON user_lesson_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

INSERT INTO academy_lessons (course_id, title, description, content, sort_order, duration_minutes, content_type)
SELECT
  c.id,
  CASE
    WHEN n.n = 1 THEN 'Introduction'
    WHEN n.n = GREATEST(c.lessons_count, 1) THEN 'Summary & next steps'
    ELSE 'Module ' || n.n
  END,
  'Key concepts from ' || c.title,
  'This lesson covers essential material for ' || c.title || '. Review the concepts, take notes, and mark the lesson complete when you are ready to continue.',
  n.n,
  GREATEST(5, COALESCE(c.duration_minutes, 60) / GREATEST(c.lessons_count, 1)),
  'article'
FROM academy_courses c
CROSS JOIN LATERAL generate_series(1, GREATEST(c.lessons_count, 1)) AS n(n)
WHERE NOT EXISTS (
  SELECT 1 FROM academy_lessons al WHERE al.course_id = c.id
);
