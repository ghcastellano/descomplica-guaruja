CREATE TABLE network_partners (
 id uuid PRIMARY KEY,
 number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 request_key uuid UNIQUE,
 prospect_key uuid UNIQUE,
 prospect_fingerprint text,
 fingerprint text,
 token_hash text UNIQUE NOT NULL,
 token_ciphertext text NOT NULL,
 status text NOT NULL CHECK(status IN ('prospect','invited','pending','reviewing','qualified','declined','withdrawn')),
 name text NOT NULL,
 contact text NOT NULL,
 source text NOT NULL,
 profile jsonb NOT NULL DEFAULT '{}',
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '90 days'
);
CREATE INDEX network_partners_queue ON network_partners(status,updated_at DESC);
CREATE TABLE network_partner_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 partner_id uuid NOT NULL REFERENCES network_partners(id),
 actor text NOT NULL,
 kind text NOT NULL,
 details jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX network_events_partner ON network_partner_events(partner_id,id);
CREATE TRIGGER immutable_network_events BEFORE UPDATE OR DELETE ON network_partner_events FOR EACH ROW EXECUTE FUNCTION keep_history();
