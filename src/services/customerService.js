import { supabase } from '../supabase/supabaseClient';

export const customerService = {
  // 1. READ
  getCustomers: async (userType) => {
    let query = supabase.from('customer').select('*');
    if (userType === 'USER') {
      query = query.eq('record_status', 'active');
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // 2. CREATE 
  addCustomer: async (customerData) => {
    const { data, error } = await supabase
      .from('customer')
      .insert([customerData]) // customerData should be an object like { name: 'John', ... }
      .select();
    if (error) throw error;
    return data;
  },

  // 3. UPDATE 
  updateCustomer: async (custno, updates) => {
    const { data, error } = await supabase
      .from('customer')
      .update(updates)
      .eq('custno', custno)
      .select();
    if (error) throw error;
    return data;
  },

  // 4. DELETE (Soft Delete)
  softDeleteCustomer: async (custno) => {
    const { data, error } = await supabase
      .from('customer')
      .update({ record_status: 'deleted' }) // We don't actually remove the row!
      .eq('custno', custno)
      .select();
    if (error) throw error;
    return data;
  },
  // 5. RECOVER: Bring a deleted customer back to 'active' status
  recoverCustomer: async (custno) => {
    const { data, error } = await supabase
      .from('customer')
      .update({ record_status: 'active' })
      .eq('custno', custno)
      .select();
    
    if (error) throw error;
    return data;
  }
};