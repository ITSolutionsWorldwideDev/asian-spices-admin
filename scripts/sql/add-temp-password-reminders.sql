-- Tracks how many times a temporary password was auto-rotated after 72h.
-- 0 = original credentials email
-- 1 = first auto-reset + credentials email resent
-- 2 = second auto-reset + support email (no further auto emails)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS temp_password_reminders integer NOT NULL DEFAULT 0;
