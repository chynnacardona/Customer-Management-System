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