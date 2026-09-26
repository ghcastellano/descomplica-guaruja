ALTER TABLE bookings ADD COLUMN payment_review boolean NOT NULL DEFAULT false;
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK(status IN ('held','awaiting_deposit','confirmed','fully_paid','expired','cancelled'));
ALTER TABLE booking_payments DROP CONSTRAINT booking_payments_provider_check;
ALTER TABLE booking_payments ADD CONSTRAINT booking_payments_provider_check CHECK(provider IN ('simulated','stripe_test'));
ALTER TABLE booking_payments ADD COLUMN stripe_session_id text UNIQUE;
ALTER TABLE booking_payments ADD COLUMN payment_intent_id text UNIQUE;
CREATE TABLE stripe_checkout_attempts (
 id uuid PRIMARY KEY,
 booking_id uuid NOT NULL REFERENCES bookings(id),
 kind text NOT NULL CHECK(kind IN ('deposit','balance')),
 amount_cents integer NOT NULL CHECK(amount_cents>0),
 currency text NOT NULL DEFAULT 'brl' CHECK(currency='brl'),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','open','completed','expired','review')),
 request_ciphertext text NOT NULL,
 expires_at timestamptz NOT NULL,
 stripe_session_id text UNIQUE,
 url_ciphertext text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,kind)
);
CREATE TABLE stripe_webhook_events (
 id text PRIMARY KEY,
 type text NOT NULL,
 stripe_session_id text NOT NULL,
 attempt_id uuid NOT NULL REFERENCES stripe_checkout_attempts(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE stripe_receipts (
 stripe_session_id text PRIMARY KEY,
 attempt_id uuid NOT NULL UNIQUE REFERENCES stripe_checkout_attempts(id),
 booking_id uuid NOT NULL REFERENCES bookings(id),
 payment_intent_id text NOT NULL UNIQUE,
 amount_cents integer NOT NULL,
 currency text NOT NULL CHECK(currency='brl'),
 outcome text NOT NULL CHECK(outcome IN ('applied','review')),
 review_reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER immutable_stripe_events BEFORE UPDATE OR DELETE ON stripe_webhook_events FOR EACH ROW EXECUTE FUNCTION keep_history();
CREATE TRIGGER immutable_stripe_receipts BEFORE UPDATE OR DELETE ON stripe_receipts FOR EACH ROW EXECUTE FUNCTION keep_history();
