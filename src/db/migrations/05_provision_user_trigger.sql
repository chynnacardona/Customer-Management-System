-- ==========================================
-- HOPE CMS: UNIFIED PROVISIONING ENGINE
-- Handles: New Signups (AFTER INSERT) 
-- Handles: Existing Auth Logins (BEFORE UPDATE)
-- ==========================================

-- 1. CLEANUP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_provision_on_login ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_provisioning();

-- 2. THE UNIFIED PROVISIONING FUNCTION
CREATE OR REPLACE FUNCTION public.handle_user_provisioning()
RETURNS TRIGGER AS $$
DECLARE
    is_new_signup BOOLEAN := (TG_OP = 'INSERT');
    initial_role VARCHAR(20);
    initial_status VARCHAR(10);
BEGIN
    -- Only proceed if the user doesn't exist in our public "user" table
    IF NOT EXISTS (SELECT 1 FROM public."user" WHERE "userId" = NEW.id) THEN
        
        -- A. Determine Role and Status logic
        -- New Signups = USER/INACTIVE. Logins for missing users = ADMIN/ACTIVE.
        IF is_new_signup THEN
            initial_role := 'USER';
            initial_status := 'INACTIVE';
        ELSE
            initial_role := 'ADMIN';
            initial_status := 'ACTIVE';
        END IF;

        -- B. Create the User Profile
        INSERT INTO public."user" ("userId", email, full_name, user_type, record_status)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(
                NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
                NULLIF(NEW.raw_user_meta_data->>'name', ''),
                INITCAP(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' '))
            ), 
            initial_role, 
            initial_status
        );

        -- C. Link to all 4 Modules
        INSERT INTO public.user_module ("userId", module_id)
        SELECT NEW.id, m.module_id 
        FROM public.Module m;

        -- D. Provision Rights
        -- For Signups: Only VIEW rights. For Logins: All rights = 1.
        INSERT INTO public.UserModule_Rights ("userId", module_id, right_id, is_allowed)
        SELECT 
            NEW.id, 
            m.module_id, 
            r.right_id, 
            CASE 
                WHEN NOT is_new_signup THEN 1 -- Admins get everything
                WHEN r.right_id IN ('CUST_VIEW', 'SALES_VIEW', 'SD_VIEW', 'PROD_VIEW', 'PRICE_VIEW') THEN 1 
                ELSE 0 
            END
        FROM public.Module m
        CROSS JOIN public.rights r
        WHERE (m.module_id = 'Cust_Mod' AND r.right_id LIKE 'CUST%')
           OR (m.module_id = 'Sales_Mod' AND r.right_id IN ('SALES_VIEW', 'SD_VIEW'))
           OR (m.module_id = 'Prod_Mod' AND r.right_id IN ('PROD_VIEW', 'PRICE_VIEW'))
           OR (m.module_id = 'Adm_Mod' AND r.right_id = 'ADM_USER');
           
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER 1: Handle New Signups (Insert)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_provisioning();

-- 4. TRIGGER 2: Handle Migrated/Existing User Logins (Update)
CREATE TRIGGER tr_provision_on_login
  BEFORE UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at) -- Detects a fresh login
  EXECUTE PROCEDURE public.handle_user_provisioning();

-- 5. Repair previously provisioned Google users that were saved as "Admin User"
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
