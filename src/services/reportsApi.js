import { supabase } from '../supabase/supabaseClient'

const moneyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

export const formatCurrency = (value) => moneyFormatter.format(Number(value || 0))

export const getReportValue = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key]
  }

  return null
}

export async function getCustomerSalesSummary() {
  const { data, error } = await supabase
    .from('customer_sales_summary')
    .select('*')

  if (error) throw error

  return [...(data || [])].sort((a, b) => {
    const spendA = Number(getReportValue(a, 'totalSpend', 'totalspend') || 0)
    const spendB = Number(getReportValue(b, 'totalSpend', 'totalspend') || 0)
    return spendB - spendA
  })
}

export async function getTopCustomers(limit = 10) {
  const rows = await getCustomerSalesSummary()
  return rows
    .filter((row) => Number(getReportValue(row, 'totalSpend', 'totalspend') || 0) > 0)
    .slice(0, limit)
}

export async function getProductRevenue() {
  const { data, error } = await supabase
    .from('product_revenue')
    .select('*')

  if (error) throw error

  return [...(data || [])].sort((a, b) => {
    const revenueA = Number(getReportValue(a, 'totalRevenue', 'totalrevenue') || 0)
    const revenueB = Number(getReportValue(b, 'totalRevenue', 'totalrevenue') || 0)
    return revenueB - revenueA
  })
}
