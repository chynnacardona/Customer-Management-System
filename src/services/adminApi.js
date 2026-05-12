import { supabase } from '../supabase/supabaseClient';

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('user')
    .select('userId, email, full_name, user_type, record_status')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data;
};

export const activateUser = async (userId) => {
  const { data, error } = await supabase
    .from('user')
    .update({ record_status: 'ACTIVE' })
    .eq('userId', userId);

  if (error) throw error;
  return data;
};

export const deactivateUser = async (userId) => {
  const { data, error } = await supabase
    .from('user')
    .update({ record_status: 'INACTIVE' })
    .eq('userId', userId);

  if (error) throw error;
  return data;
};

const ROLE_RIGHTS = {
  USER: {
    CUST_VIEW: 1,
    CUST_ADD: 0,
    CUST_EDIT: 0,
    CUST_DEL: 0,
    SALES_VIEW: 1,
    SD_VIEW: 1,
    PROD_VIEW: 1,
    PRICE_VIEW: 1,
    ADM_USER: 0,
  },
  ADMIN: {
    CUST_VIEW: 1,
    CUST_ADD: 1,
    CUST_EDIT: 1,
    CUST_DEL: 0,
    SALES_VIEW: 1,
    SD_VIEW: 1,
    PROD_VIEW: 1,
    PRICE_VIEW: 1,
    ADM_USER: 1,
  },
};

const MODULE_ACCESS = {
  USER: {
    Cust_Mod: 1,
    Sales_Mod: 1,
    Prod_Mod: 1,
    Adm_Mod: 0,
  },
  ADMIN: {
    Cust_Mod: 1,
    Sales_Mod: 1,
    Prod_Mod: 1,
    Adm_Mod: 1,
  },
};

export const updateUserType = async (userId, nextUserType) => {
  const normalizedType = String(nextUserType || '').toUpperCase();

  if (!ROLE_RIGHTS[normalizedType]) {
    throw new Error('Only USER and ADMIN roles can be assigned from User Management.');
  }

  const { data, error } = await supabase
    .from('user')
    .update({ user_type: normalizedType })
    .eq('userId', userId)
    .neq('user_type', 'SUPERADMIN')
    .select('userId, email, full_name, user_type, record_status')
    .single();

  if (error) throw error;

  await Promise.all(
    Object.entries(ROLE_RIGHTS[normalizedType]).map(([rightId, isAllowed]) =>
      supabase
        .from('usermodule_rights')
        .update({ is_allowed: isAllowed })
        .eq('userId', userId)
        .eq('right_id', rightId)
        .then(({ error: rightsError }) => {
          if (rightsError) throw rightsError;
        })
    )
  );

  await Promise.all(
    Object.entries(MODULE_ACCESS[normalizedType]).map(([moduleId, rightsValue]) =>
      supabase
        .from('user_module')
        .update({ rights_value: rightsValue })
        .eq('userId', userId)
        .eq('module_id', moduleId)
        .then(({ error: moduleError }) => {
          if (moduleError) throw moduleError;
        })
    )
  );

  return data;
};
