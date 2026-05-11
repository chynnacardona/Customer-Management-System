import { supabase } from '../supabase/supabaseClient'
import { formatCurrencyValue } from '../utils/currency'

export const formatCurrency = formatCurrencyValue

export const getReportValue = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key]
  }
  return null
}

const normalizeCustomerSummaryRow = (row) => ({
  ...row,
  custno: getReportValue(row, 'custno', 'custNo'),
  custname: getReportValue(row, 'custname', 'custName'),
  payterm: getReportValue(row, 'payterm', 'payTerm'),
  record_status: getReportValue(row, 'record_status', 'recordStatus'),
  totalTransactions: Number(getReportValue(row, 'totalTransactions', 'totaltransactions', 'total_transactions') || 0),
  totalSpend: Number(getReportValue(row, 'totalSpend', 'totalspend', 'total_spent') || 0),
  lastSaleDate: getReportValue(row, 'lastSaleDate', 'lastsaledate', 'last_sale_date'),
})

const normalizeProductRevenueRow = (row) => ({
  ...row,
  prodCode: getReportValue(row, 'prodCode', 'prodcode'),
  description: getReportValue(row, 'description'),
  unit: getReportValue(row, 'unit'),
  totalQtySold: Number(getReportValue(row, 'totalQtySold', 'totalqtysold', 'total_qty_sold') || 0),
  totalRevenue: Number(getReportValue(row, 'totalRevenue', 'totalrevenue', 'total_revenue') || 0),
})

const isMissingViewError = (error) =>
  error?.code === 'PGRST205' ||
  String(error?.message || '').toLowerCase().includes('schema cache')

async function getProductRevenueFallback() {
  const [
    { data: products, error: productsError },
    { data: salesDetails, error: salesDetailsError },
    { data: priceHistory, error: priceHistoryError },
  ] = await Promise.all([
    supabase.from('product').select('prodcode, description, unit'),
    supabase.from('salesdetail').select('prodcode, quantity'),
    supabase.from('pricehist').select('prodcode, unitprice, effdate'),
  ])

  if (productsError) throw productsError
  if (salesDetailsError) throw salesDetailsError
  if (priceHistoryError) throw priceHistoryError

  const latestPrices = new Map()
  for (const price of priceHistory || []) {
    const current = latestPrices.get(price.prodcode)
    if (!current || new Date(price.effdate) > new Date(current.effdate)) {
      latestPrices.set(price.prodcode, price)
    }
  }

  const quantityByProduct = new Map()
  for (const detail of salesDetails || []) {
    quantityByProduct.set(
      detail.prodcode,
      (quantityByProduct.get(detail.prodcode) || 0) + Number(detail.quantity || 0)
    )
  }

  return (products || []).map((product) => {
    const totalQtySold = quantityByProduct.get(product.prodcode) || 0
    const currentPrice = Number(latestPrices.get(product.prodcode)?.unitprice || 0)

    return normalizeProductRevenueRow({
      ...product,
      total_qty_sold: totalQtySold,
      total_revenue: totalQtySold * currentPrice,
    })
  })
}

export async function getCustomerSalesSummary() {
  const { data, error } = await supabase
    .from('customer_sales_summary')
    .select('*')

  if (error) throw error

  return [...(data || [])]
    .map(normalizeCustomerSummaryRow)
    .sort((a, b) => b.totalSpend - a.totalSpend)
}

export async function getTopCustomers(limit = 10) {
  const rows = await getCustomerSalesSummary()

  return rows
    .filter((row) => row.totalSpend > 0)
    .slice(0, limit)
}

export async function getProductRevenue() {
  const { data, error } = await supabase
    .from('product_revenue')
    .select('*')

  if (error) {
    if (isMissingViewError(error)) {
      return (await getProductRevenueFallback())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
    }
    throw error
  }

  return [...(data || [])]
    .map(normalizeProductRevenueRow)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
}
