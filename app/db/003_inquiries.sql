-- Um atendimento pode existir antes de haver uma proposta.
-- O identificador é preservado quando Sophia completa o briefing.
ALTER TABLE audit_events DROP CONSTRAINT audit_events_proposal_id_fkey;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_request_id_fkey
 FOREIGN KEY(proposal_id) REFERENCES requests(id);
