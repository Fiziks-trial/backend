-- problems table
CREATE TYPE subject AS ENUM ('physics','chemistry','biology','math');
CREATE TYPE difficulty AS ENUM ('easy','medium','hard');

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject subject NOT NULL,
  topic TEXT NOT NULL,
  difficulty difficulty NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation TEXT,
  hint TEXT,
  animation_type TEXT,
  animation_config JSONB,
  time_limit INT DEFAULT 15,
  points INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- performance indexes
CREATE INDEX idx_problems_subject ON problems(subject);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_topic ON problems(topic);

-- prevent duplicate questions (case-insensitive)
CREATE UNIQUE INDEX uq_problem_question_lower
ON problems (LOWER(question));
