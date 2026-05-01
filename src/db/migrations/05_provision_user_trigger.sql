--PR-04: provision_new_user trigger

 -- 1. CLEANUP: Remove old triggers and functions to prevent "duplicate" errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_provision();

-- 2. THE NEW AUTOMATED PROVISIONING FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Create the user profile row
  -- Uses naming from your Documentation Screenshot 4.3
  INSERT INTO public."user" ("userId", email, full_name, user_type, record_status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
    'USER', 
    'INACTIVE' -- As per Section 4.1: pending admin activation
  );

  -- B. YOUR SCRIPT: Link the new user to all 4 Modules in user_module
  INSERT INTO public.user_module ("userId", module_id)
  SELECT NEW.id, m.module_id 
  FROM public.Module m;

  -- C. YOUR SCRIPT: Map the 9 Rights (Default VIEW rights for new users)
  -- Based on Screenshot 4.1: VIEW rights = 1, others = 0
  INSERT INTO public.UserModule_Rights ("userId", module_id, right_id, is_allowed)
  SELECT 
    NEW.id, 
    m.module_id, 
    r.right_id, 
    CASE 
      WHEN r.right_id IN ('CUST_VIEW', 'SALES_VIEW', 'SD_VIEW', 'PROD_VIEW', 'PRICE_VIEW') THEN 1 
      ELSE 0 
    END
  FROM public.Module m
  CROSS JOIN public.rights r
  -- Only insert if the right belongs to the module (using your seed logic)
  WHERE (m.module_id = 'Cust_Mod' AND r.right_id LIKE 'CUST%')
     OR (m.module_id = 'Sales_Mod' AND r.right_id IN ('SALES_VIEW', 'SD_VIEW'))
     OR (m.module_id = 'Prod_Mod' AND r.right_id IN ('PROD_VIEW', 'PRICE_VIEW'))
     OR (m.module_id = 'Adm_Mod' AND r.right_id = 'ADM_USER');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ACTIVATE THE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();