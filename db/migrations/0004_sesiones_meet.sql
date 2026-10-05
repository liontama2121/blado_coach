-- Sessions: "casa" is now a VIRTUAL session over Google Meet; "gym" is in person.
-- Students propose any time; the coach accepts (adding the Meet link for virtual ones),
-- rejects, or counter-proposes another time that the student accepts or declines.

ALTER TABLE training_sessions ADD COLUMN meet_url TEXT;
ALTER TABLE training_sessions ADD COLUMN counter_starts_at TEXT;
ALTER TABLE training_sessions ADD COLUMN counter_ends_at TEXT;
ALTER TABLE training_sessions ADD COLUMN counter_note TEXT;
ALTER TABLE training_sessions ADD COLUMN google_event_id TEXT; -- for the future Google Calendar integration

-- Virtual sessions no longer need travel time.
UPDATE training_sessions SET travel_before_min = 0, travel_after_min = 0 WHERE location = 'casa';
UPDATE settings SET value = '0' WHERE key = 'travel_buffer_min';

-- Only https Google Meet links are accepted (defense in depth; the API validates too).
CREATE TRIGGER training_sessions_meet_url_check
BEFORE UPDATE OF meet_url ON training_sessions
WHEN NEW.meet_url IS NOT NULL AND NEW.meet_url NOT LIKE 'https://meet.google.com/%'
BEGIN
  SELECT RAISE(ABORT, 'enlace_meet_invalido');
END;

-- Coach notes on a student (private).
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status, starts_at);
