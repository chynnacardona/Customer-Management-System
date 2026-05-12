-- Repair existing user profiles that were provisioned with the placeholder "Admin User".
-- This uses Google/Supabase auth metadata when available, then falls back to the email prefix.
UPDATE public."user" public_user
SET full_name = COALESCE(
    NULLIF(auth_user.raw_user_meta_data->>'full_name', ''),
    NULLIF(auth_user.raw_user_meta_data->>'name', ''),
    INITCAP(REPLACE(SPLIT_PART(auth_user.email, '@', 1), '.', ' '))
)
FROM auth.users auth_user
WHERE public_user."userId" = auth_user.id
  AND (
    public_user.full_name IS NULL
    OR TRIM(public_user.full_name) = ''
    OR LOWER(public_user.full_name) = 'admin user'
  );
