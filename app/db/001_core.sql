CREATE TABLE requests (
 id uuid PRIMARY KEY,
 number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 request_key uuid NOT NULL UNIQUE,
 fingerprint text NOT NULL,
 briefing jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE proposals (
 id uuid PRIMARY KEY REFERENCES requests(id),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','released')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE proposal_revisions (
 proposal_id uuid NOT NULL REFERENCES proposals(id),
 version integer NOT NULL CHECK(version>0),
 snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(proposal_id,version)
);
CREATE TABLE proposal_links (
 token_hash text PRIMARY KEY,
 proposal_id uuid NOT NULL,
 version integer NOT NULL,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 FOREIGN KEY(proposal_id,version) REFERENCES proposal_revisions(proposal_id,version)
);
CREATE TABLE outbox (
 id uuid PRIMARY KEY,
 proposal_id uuid NOT NULL,
 version integer NOT NULL,
 payload_ciphertext text NOT NULL,
 status text NOT NULL DEFAULT 'simulated' CHECK(status='simulated'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(proposal_id,version),
 FOREIGN KEY(proposal_id,version) REFERENCES proposal_revisions(proposal_id,version)
);
CREATE TABLE audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 proposal_id uuid NOT NULL REFERENCES proposals(id),
 kind text NOT NULL,
 actor text NOT NULL,
 details jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_proposal ON audit_events(proposal_id,id);
CREATE FUNCTION keep_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Histórico imutável'; END;
$$;
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION keep_history();
CREATE TRIGGER immutable_revisions BEFORE UPDATE OR DELETE ON proposal_revisions FOR EACH ROW EXECUTE FUNCTION keep_history();
