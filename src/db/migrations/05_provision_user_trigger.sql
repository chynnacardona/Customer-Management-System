-- ============================================================
-- PR-04: provision_new_user trigger
-- Fires after every new INSERT into auth.users
-- Creates a matching row in public.user, user_module,
-- and UserModule_Rights with safe defaults.
-- ============================================================

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_new_user_provision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id INT;
BEGIN
  -- Insert into custom user table
  INSERT INTO public.user (email, full_name, role, record_status)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'USER',
    'INACTIVE'  -- Admin must manually activate
  )
  RETURNING user_id INTO v_user_id;

  -- Insert 4 module rows for this user
  INSERT INTO public.user_module (user_id, module_id)
  SELECT v_user_id, m.module_id
  FROM public.module m
  WHERE m.module_id IN ('Cust_Mod', 'Sales_Mod', 'Prod_Mod', 'Adm_Mod');

  -- Insert 9 rights rows (VIEW rights = 1, everything else = 0)
  INSERT INTO public.UserModule_Rights (user_id, module_id, right_id, is_allowed)
  SELECT
    v_user_id,
    um.module_id,
    r.right_id,
    CASE
      WHEN r.right_id IN (
        'CUST_VIEW', 'SALES_VIEW', 'SD_VIEW', 'PROD_VIEW', 'PRICE_VIEW'
      ) THEN 1
      ELSE 0  -- CUST_ADD, CUST_EDIT, CUST_DEL, ADM_USER = 0
    END
  FROM public.user_module um
  CROSS JOIN public.rights r
  WHERE um.user_id = v_user_id;

  RETURN NEW;
END;
$$;

-- 2. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_provision();