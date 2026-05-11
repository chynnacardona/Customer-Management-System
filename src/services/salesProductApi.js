import { supabase } from "../supabase/supabaseClient";

const getLatestUnitPrice = (priceHistory = []) => {
  if (!Array.isArray(priceHistory) || priceHistory.length === 0) return 0

  const latest = [...priceHistory].sort((a, b) => new Date(b.effdate) - new Date(a.effdate))[0]
  return Number(latest?.unitprice || 0)
}

const getTransactionTotal = (salesDetailRows = []) => {
  if (!Array.isArray(salesDetailRows) || salesDetailRows.length === 0) return 0

  return salesDetailRows.reduce((sum, item) => {
    const qty = Number(item?.quantity || 0)
    const unitPrice = getLatestUnitPrice(item?.product?.pricehist || [])
    return sum + (qty * unitPrice)
  }, 0)
}

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
      ),
      salesdetail (
        quantity,
        product (
          pricehist (
            unitprice,
            effdate
          )
        )
      )
    `)
    .order('salesdate', { ascending: false });

  if (error) throw error;
  return (data || []).map((sale) => ({
    ...sale,
    total_amount: Number(getTransactionTotal(sale.salesdetail || []).toFixed(2)),
  }));
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

export const getPriceHistory = async (prodCode) => {
  const { data, error } = await supabase
    .from('pricehist')
    .select('effdate, unitprice')
    .eq('prodcode', prodCode)
    .order('effdate', { ascending: false });

  if (error) throw error;
  return data;
};

