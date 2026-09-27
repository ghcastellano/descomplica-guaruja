-- Additive expansion: the experience booking/payment engine stays intact.
CREATE TABLE city_requests (
 id uuid PRIMARY KEY,
 number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 request_key uuid NOT NULL UNIQUE,
 fingerprint text NOT NULL,
 token_hash text NOT NULL UNIQUE,
 vertical text NOT NULL CHECK(vertical IN ('resolver','casa','experiencias','parceiros')),
 category text NOT NULL,
 briefing jsonb NOT NULL,
 status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','reviewing','awaiting_client','completed','cancelled')),
 version integer NOT NULL DEFAULT 1,
 experience_request_id uuid UNIQUE REFERENCES requests(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX city_requests_queue ON city_requests(status,updated_at DESC);
CREATE TABLE city_request_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL REFERENCES city_requests(id),
 actor text NOT NULL,
 kind text NOT NULL,
 public_note text NOT NULL,
 internal_note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX city_events_request ON city_request_events(request_id,id);
CREATE TRIGGER immutable_city_events BEFORE UPDATE OR DELETE ON city_request_events FOR EACH ROW EXECUTE FUNCTION keep_history();
