import { supabase } from "../supabase/supabaseClient";

export const getSalesByCustomer = async (custNo) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('custno', custNo)
    .order('salesdate', { ascending: false });
  if (error) throw error;
  return data;
};

export const getSalesDetail = async (transNo) => {
  const { data, error } = await supabase
    .from('salesDetail')
    .select(`
      quantity,
      prodCode,
      product:prodCode (description, unit)
    `)
    .eq('transNo', transNo);
  if (error) throw error;
  return data;
};

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('product')
    .select(`
      prodcode,
      description,
      unit,
      pricehist (unitprice, effdate)
    `)
    // We order the nested table to get the newest price first
    .order('effdate', { foreignTable: 'pricehist', ascending: false });

  if (error) throw error;
  return data;
};

export const getCurrentPrice = async (prodCode) => {
  const { data, error } = await supabase
    .from('pricehist')
    .select('unitprice')
    .eq('prodcode', prodCode)
    .order('effdate', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.unit_price || 0;
};

