-- Store every session instant in the same ISO format JS produces (toISOString: YYYY-MM-DDTHH:MM:SS.sssZ),
-- so text comparisons in SQL order instants correctly.
UPDATE training_sessions SET
  starts_at = strftime('%Y-%m-%dT%H:%M:%fZ', starts_at),
  ends_at = strftime('%Y-%m-%dT%H:%M:%fZ', ends_at),
  counter_starts_at = CASE WHEN counter_starts_at IS NULL THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%fZ', counter_starts_at) END,
  counter_ends_at = CASE WHEN counter_ends_at IS NULL THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%fZ', counter_ends_at) END;
