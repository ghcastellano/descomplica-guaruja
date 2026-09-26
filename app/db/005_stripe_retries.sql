-- Preserve every expired attempt while allowing a new Checkout only after
-- Stripe has confirmed expiration. Unknown/open attempts remain exclusive.
ALTER TABLE stripe_checkout_attempts DROP CONSTRAINT stripe_checkout_attempts_booking_id_kind_key;
CREATE UNIQUE INDEX one_open_checkout_per_installment
 ON stripe_checkout_attempts(booking_id,kind) WHERE state IN ('pending','open');
CREATE INDEX stripe_attempt_history ON stripe_checkout_attempts(booking_id,kind,created_at DESC);
