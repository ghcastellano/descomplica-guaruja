CREATE TABLE whatsapp_test_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_key text NOT NULL UNIQUE,
 kind text NOT NULL CHECK (kind IN ('message','status')),
 message_id text NOT NULL,
 contact_hash text NOT NULL,
 event_at timestamptz NOT NULL,
 payload_ciphertext text NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_test_events_recent ON whatsapp_test_events(received_at DESC);
CREATE TRIGGER immutable_whatsapp_test_events BEFORE UPDATE OR DELETE ON whatsapp_test_events FOR EACH ROW EXECUTE FUNCTION keep_history();
CREATE TABLE whatsapp_test_sends (
 request_key uuid PRIMARY KEY,
 fingerprint text NOT NULL,
 state text NOT NULL CHECK (state IN ('sending','accepted','rejected','unknown')),
 message_id text,
 error_code text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
