CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE bookings (
 id uuid PRIMARY KEY,
 proposal_id uuid NOT NULL,
 proposal_version integer NOT NULL,
 status text NOT NULL CHECK(status IN ('held','awaiting_deposit','confirmed','fully_paid','expired')),
 resource_id text NOT NULL DEFAULT 'equipe-demo' CHECK(resource_id='equipe-demo'),
 location_id text NOT NULL CHECK(location_id IN ('jardim-demo','coberto-demo')),
 start_at timestamptz NOT NULL,
 end_at timestamptz NOT NULL CHECK(end_at>start_at),
 occupied_range tstzrange NOT NULL,
 hold_expires_at timestamptz NOT NULL,
 total_cents integer NOT NULL CHECK(total_cents>=100),
 deposit_cents integer NOT NULL CHECK(deposit_cents>0),
 balance_cents integer NOT NULL CHECK(balance_cents>=0),
 paid_cents integer NOT NULL DEFAULT 0 CHECK(paid_cents>=0),
 balance_due_at timestamptz NOT NULL,
 accepted_at timestamptz,
 terms_version text,
 accepted_snapshot jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(proposal_id,proposal_version) REFERENCES proposal_revisions(proposal_id,version),
 CHECK(deposit_cents+balance_cents=total_cents),
 CHECK(paid_cents<=total_cents),
 EXCLUDE USING gist(resource_id WITH =, occupied_range WITH &&)
 WHERE(status IN ('held','awaiting_deposit','confirmed','fully_paid'))
);
CREATE UNIQUE INDEX one_active_booking_per_proposal ON bookings(proposal_id)
 WHERE(status IN ('held','awaiting_deposit','confirmed','fully_paid'));
CREATE TABLE booking_payments (
 id uuid PRIMARY KEY,
 booking_id uuid NOT NULL REFERENCES bookings(id),
 event_key uuid NOT NULL UNIQUE,
 kind text NOT NULL CHECK(kind IN ('deposit','balance')),
 amount_cents integer NOT NULL CHECK(amount_cents>0),
 provider text NOT NULL DEFAULT 'simulated' CHECK(provider='simulated'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,kind)
);
CREATE TABLE booking_notifications (
 id uuid PRIMARY KEY,
 booking_id uuid NOT NULL REFERENCES bookings(id),
 kind text NOT NULL,
 audience text NOT NULL CHECK(audience IN ('client','sophia')),
 message text NOT NULL,
 delivery text NOT NULL DEFAULT 'simulated' CHECK(delivery='simulated'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,kind,audience)
);
CREATE TRIGGER immutable_booking_payments BEFORE UPDATE OR DELETE ON booking_payments FOR EACH ROW EXECUTE FUNCTION keep_history();
CREATE TRIGGER immutable_booking_notifications BEFORE UPDATE OR DELETE ON booking_notifications FOR EACH ROW EXECUTE FUNCTION keep_history();
CREATE FUNCTION keep_booking_agreement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.accepted_at IS NOT NULL AND (
  NEW.accepted_at IS DISTINCT FROM OLD.accepted_at OR
  NEW.accepted_snapshot IS DISTINCT FROM OLD.accepted_snapshot OR
  NEW.terms_version IS DISTINCT FROM OLD.terms_version OR
  NEW.proposal_id IS DISTINCT FROM OLD.proposal_id OR
  NEW.proposal_version IS DISTINCT FROM OLD.proposal_version OR
  NEW.location_id IS DISTINCT FROM OLD.location_id OR
  NEW.start_at IS DISTINCT FROM OLD.start_at OR NEW.end_at IS DISTINCT FROM OLD.end_at OR
  NEW.occupied_range IS DISTINCT FROM OLD.occupied_range OR
  NEW.total_cents IS DISTINCT FROM OLD.total_cents OR
  NEW.deposit_cents IS DISTINCT FROM OLD.deposit_cents OR
  NEW.balance_cents IS DISTINCT FROM OLD.balance_cents OR
  NEW.balance_due_at IS DISTINCT FROM OLD.balance_due_at
 ) THEN RAISE EXCEPTION 'Condições aceitas são imutáveis'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_booking_agreement BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION keep_booking_agreement();
