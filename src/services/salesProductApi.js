import { supabase } from "../supabase/supabaseClient";

export const getSalesByCustomer = async (custno) => {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      transno,
      salesdate,
      salesdetail (
        quantity,
        prodcode,
        product (
          description,
          unit,
          pricehist (unitprice, effdate)
        )
      )
    `)
    .eq('custno', custno)
    .order('salesdate', { ascending: false });

  if (error) throw error;
  return data;
};

export const getSales = async () => {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      transno,
      salesdate,
      custno,
      customer (
        custname
      )
    `)
    .order('salesdate', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateAccountStatus = async (custno, newStatus) => {
  const { error } = await supabase
    .from('customer')
    .update({ record_status: newStatus })
    .eq('custno', custno);
  if (error) throw error;
};

export const softDeleteCustomer = async (custno) => {
  const { error } = await supabase
    .from('customer')
    .update({ record_status: 'INACTIVE' }) 
    .eq('custno', custno);
  if (error) throw error;
};

export const getSalesDetail = async (transno) => {
  const { data, error } = await supabase
    .from('salesdetail')
    .select(`
      quantity,
      prodcode,
      product (
        description,
        unit,
        pricehist (unitprice)
      )
    `)
    .eq('transno', transno);

  if (error) throw error;
  
  return data.map(item => ({
    ...item,
    unit_price: item.product?.pricehist?.[0]?.unitprice || 0
  }));
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
  return data?.unitprice || 0;
};

