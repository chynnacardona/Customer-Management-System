import { supabase } from '../supabase/supabaseClient'

const moneyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

/**
 * Formats a number into Philippine Peso (PHP)
 */
export const formatCurrency = (value) => moneyFormatter.format(Number(value || 0))

/**
 * UTILITY: Checks multiple possible key names (camelCase vs snake_case)
 * and returns the first one that exists.
 */
export const getReportValue = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key]
  }
  return null
}

/**
 * PR-01: Fetches the Customer Sales Summary view.
 * Logic: Fetches all, then sorts by spend (Highest to Lowest).
 */
export async function getCustomerSalesSummary() {
  const { data, error } = await supabase
    .from('customer_sales_summary')
    .select('*')

  if (error) throw error

  return [...(data || [])].sort((a, b) => {
    // UPDATED: Added 'total_spent' to the search keys
    const spendA = Number(getReportValue(a, 'totalSpend', 'total_spent') || 0)
    const spendB = Number(getReportValue(b, 'totalSpend', 'total_spent') || 0)
    return spendB - spendA
  })
}

/**
 * Filters the Summary to show only the highest-spending customers.
 */
export async function getTopCustomers(limit = 10) {
  const rows = await getCustomerSalesSummary();
  
  return rows
    .filter((row) => {
      const spend = Number(getReportValue(row, 'totalSpend', 'total_spent') || 0);
      return spend > 0;
    })
    .slice(0, limit);
}

/**
 * PR-01: Fetches the Product Revenue view.
 * Logic: Fetches all products and sorts by revenue (Highest to Lowest).
 */
export async function getProductRevenue() {
  const { data, error } = await supabase
    .from('product_revenue')
    .select('*')

  if (error) throw error

  return [...(data || [])].sort((a, b) => {
    // Handles database 'totalrevenue' vs possible 'totalRevenue'
    const revenueA = Number(getReportValue(a, 'totalRevenue', 'total_revenue') || 0)
    const revenueB = Number(getReportValue(b, 'totalRevenue', 'total_revenue') || 0)
    return revenueB - revenueA
  })
}