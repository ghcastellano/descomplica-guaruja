CREATE TABLE ai_interpretations (
  id uuid PRIMARY KEY,
  actor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  model text NOT NULL,
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved','completed','fallback')),
  reserved_micro_usd integer NOT NULL CHECK (reserved_micro_usd > 0),
  input_tokens integer,
  output_tokens integer,
  estimated_micro_usd integer
);
CREATE INDEX ai_interpretations_day ON ai_interpretations(created_at);
CREATE INDEX ai_interpretations_actor ON ai_interpretations(actor_hash, created_at);
