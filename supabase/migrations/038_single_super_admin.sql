-- Single Super Admin lockdown: fxinvestprime@gmail.com is the only active tier-1 admin.
-- Preserves all user, financial, and support data; only admin_profiles access is changed.

DO $$
DECLARE
  super_email CONSTANT TEXT := 'fxinvestprime@gmail.com';
  super_user_id UUID;
BEGIN
  SELECT id INTO super_user_id
  FROM users
  WHERE lower(email) = lower(super_email)
  LIMIT 1;

  -- Deactivate every admin profile (including bootstrap-era rows for other emails).
  UPDATE admin_profiles
  SET
    is_active = false,
    updated_at = CURRENT_TIMESTAMP
  WHERE super_user_id IS NULL OR user_id IS DISTINCT FROM super_user_id;

  IF super_user_id IS NOT NULL THEN
    INSERT INTO admin_profiles (user_id, tier, role_label, is_active)
    VALUES (super_user_id, 1, 'Super Admin', true)
    ON CONFLICT (user_id) DO UPDATE SET
      tier = 1,
      role_label = 'Super Admin',
      is_active = true,
      updated_at = CURRENT_TIMESTAMP;
  ELSE
    RAISE NOTICE 'Super Admin user % not found in users — run again after signup.', super_email;
  END IF;
END $$;

-- Prevent accidental downgrade, deactivation, or deletion of the designated Super Admin.
CREATE OR REPLACE FUNCTION prevent_super_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
  super_email CONSTANT TEXT := 'fxinvestprime@gmail.com';
  target_email TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT email INTO target_email FROM users WHERE id = OLD.user_id;
    IF lower(target_email) = lower(super_email) AND OLD.tier = 1 AND OLD.is_active = true THEN
      RAISE EXCEPTION 'Cannot remove the designated Super Admin (%)', super_email;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT email INTO target_email FROM users WHERE id = OLD.user_id;
    IF lower(target_email) = lower(super_email) THEN
      IF (NEW.is_active = false OR NEW.tier <> 1) AND OLD.is_active = true AND OLD.tier = 1 THEN
        RAISE EXCEPTION 'Cannot downgrade or deactivate the designated Super Admin (%)', super_email;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_super_admin_removal ON admin_profiles;
CREATE TRIGGER trg_prevent_super_admin_removal
  BEFORE UPDATE OR DELETE ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_super_admin_removal();

-- Only the designated email may hold an active tier-1 (Super Admin) profile.
CREATE OR REPLACE FUNCTION enforce_single_super_admin()
RETURNS TRIGGER AS $$
DECLARE
  super_email CONSTANT TEXT := 'fxinvestprime@gmail.com';
  target_email TEXT;
BEGIN
  IF NEW.tier = 1 AND NEW.is_active = true THEN
    SELECT email INTO target_email FROM users WHERE id = NEW.user_id;
    IF lower(target_email) IS DISTINCT FROM lower(super_email) THEN
      RAISE EXCEPTION 'Only % may hold active Super Admin (tier 1) access', super_email;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_super_admin ON admin_profiles;
CREATE TRIGGER trg_enforce_single_super_admin
  BEFORE INSERT OR UPDATE ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_super_admin();
