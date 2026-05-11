import { supabase } from '../supabase/supabaseClient';

export const customerService = {
  getCustomers: async () => {
    const query = supabase
      .from('customer')
      .select('*')
      .in('record_status', ['ACTIVE', 'active'])
      .order('custno');
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  addCustomer: async (customerData) => {
    const { data, error } = await supabase
      .from('customer')
      .insert([{ ...customerData, record_status: 'ACTIVE' }])
      .select();
    if (error) throw error;
    return data;
  },

  updateCustomer: async (custno, updates) => {
    const { data, error } = await supabase
      .from('customer')
      .update(updates)
      .eq('custno', custno)
      .select();
    if (error) throw error;
    return data;
  },

  softDeleteCustomer: async (custno) => {
    const { data, error } = await supabase
      .from('customer')
      .update({ record_status: 'INACTIVE' })
      .eq('custno', custno)
      .select();
    if (error) throw error;
    return data;
  },

  recoverCustomer: async (custno) => {
    const { data, error } = await supabase
      .from('customer')
      .update({ record_status: 'ACTIVE' })
      .eq('custno', custno)
      .select();
    
    if (error) throw error;
    return data;
  },

  getDeletedCustomers: async () => {
    const { data, error } = await supabase
      .from('customer')
      .select('*')
      .in('record_status', ['INACTIVE', 'inactive', 'deleted'])
      .order('custno');

    if (error) throw error;
    return data;
  }
};
