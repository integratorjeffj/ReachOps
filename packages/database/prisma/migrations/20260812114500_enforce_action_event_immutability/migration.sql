CREATE FUNCTION "reachops_reject_action_event_update"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'action events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ActionEvent_append_only"
BEFORE UPDATE ON "ActionEvent"
FOR EACH ROW EXECUTE FUNCTION "reachops_reject_action_event_update"();
