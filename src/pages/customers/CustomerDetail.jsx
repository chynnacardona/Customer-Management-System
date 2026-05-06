import { useEffect, useState } from 'react' 
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CreditCard, MapPin, UserRound, Loader2 } from 'lucide-react'
import SalesHistoryPanel from '../../components/shared/SalesHistoryPanel'
import { getSalesByCustomer } from '../../services/salesProductApi' 
import { supabase } from '../../supabase/supabaseClient'

function CustomerDetailPage() {
  const { custno } = useParams()
  const navigate = useNavigate()

  // --- LIVE DATA STATES ---
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFullDetails = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch Customer Profile
        // Note: Using 'custno' to match your URL param and database column
        const { data: custData, error: custErr } = await supabase
          .from('customer')
          .select('*')
          .eq('custno', custno)
          .single()

        if (custErr) throw custErr
        setCustomer(custData)

        // 2. Fetch Sales History via M2's PR-02 Service
        // This calls the 'sales' table in Supabase
        const salesData = await getSalesByCustomer(custno)
        setTransactions(salesData || [])

      } catch (err) {
        console.error("Error loading customer details:", err.message)
      } finally {
        setLoading(false)
      }
    }

    if (custno) fetchFullDetails()
  }, [custno])

  const paytermColor = (term) => {
    const colors = {
      'COD': { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.2)' },
      '30D': { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
      '45D': { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' }
    }
    return colors[term] || { bg: 'transparent', color: 'white', border: 'transparent' }
  }

  const totalSpend = transactions.reduce((sum, ts) => {
  // 1. Calculate the total for ONE transaction
  const transactionTotal = (ts.salesdetail || []).reduce((tSum, item) => {
    // Get the latest price from the pricehist array inside the product
    const price = item.product?.pricehist?.[0]?.unitprice || 0;
    const lineTotal = Number(item.quantity) * Number(price);
    return tSum + lineTotal;
  }, 0);

  // 2. Add this transaction's total to the Customer's grand total
  return sum + transactionTotal;
}, 0);

const formattedTotal = new Intl.NumberFormat('en-PH', { 
  style: 'currency', 
  currency: 'PHP' 
}).format(totalSpend);

  if (loading) {
    return (
      <div className="detail-empty-state" style={{ padding: '100px 0' }}>
        <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={32} />
        <p>Loading database records...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="customer-detail-page">
        <div className="detail-topbar">
          <button className="detail-back-btn" onClick={() => navigate('/customers')}><ArrowLeft size={14} />Back to Customers</button>
        </div>
        <div className="detail-empty-state">Customer {custno} not found in database.</div>
      </div>
    )
  }

  const badge = paytermColor(customer.payterm)

  return (
    <>
      <style>{pageStyles}</style>

      <div className="customer-detail-page">
        <div className="detail-topbar">
          <button className="detail-back-btn" onClick={() => navigate('/customers')}><ArrowLeft size={14} />Back</button>
        </div>

        <section className="detail-hero">
          <div className="detail-avatar"><UserRound size={26} /></div>
          <div className="detail-main">
            <div className="detail-title-row">
              <div>
                <p className="detail-kicker">{customer.custno}</p>
                <h1 className="detail-title">{customer.custname}</h1>
              </div>
              <span className="detail-status">
                <BadgeCheck size={13} />
                {customer.record_status || 'ACTIVE'}
              </span>
            </div>

            <div className="detail-meta-grid">
              <div className="detail-meta-card">
                <MapPin size={15} />
                <div>
                  <span className="detail-meta-label">Address</span>
                  <strong>{customer.address}</strong>
                </div>
              </div>
              <div className="detail-meta-card">
                <CreditCard size={15} />
                <div>
                  <span className="detail-meta-label">Pay Term</span>
                  <span className="detail-payterm-badge" style={{ 
                    background: badge.bg, 
                    color: badge.color, 
                    borderColor: badge.border 
                  }}>
                    {customer.payterm}
                  </span>
                </div>
              </div>
              <div className="detail-meta-card">
                <CreditCard size={15} />
                <div>
                  <span className="detail-meta-label">Total Spend</span>
                  <strong>{formattedTotal}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* This passes the live 'transactions' array to the panel.
           The panel will now use database fields like 'trans_no' and 'sales_date'.
        */}
        <SalesHistoryPanel transactions={transactions} />
      </div>
    </>
  )
}

const pageStyles = `
  @keyframes detailPageIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .customer-detail-page { animation: detailPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; display: flex; flex-direction: column; gap: 18px; }
  .detail-topbar { display: flex; align-items: center; justify-content: space-between; }
  .detail-back-btn { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(100, 160, 255, 0.1); background: rgba(100, 160, 255, 0.04); color: rgba(180, 210, 255, 0.62); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all 0.18s ease; }
  .detail-back-btn:hover { background: rgba(100, 160, 255, 0.08); color: rgba(220, 235, 255, 0.92); border-color: rgba(100, 160, 255, 0.2); }
  .detail-hero { display: flex; gap: 16px; background: rgba(8, 18, 40, 0.62); border: 1px solid rgba(100, 160, 255, 0.1); border-radius: 16px; padding: 18px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
  .detail-avatar { width: 58px; height: 58px; border-radius: 16px; background: linear-gradient(135deg, rgba(26, 79, 214, 0.9), rgba(46, 134, 245, 0.82)); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(30, 80, 220, 0.28); flex-shrink: 0; }
  .detail-main { min-width: 0; flex: 1; }
  .detail-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
  .detail-kicker { margin: 0 0 5px; color: rgba(180, 210, 255, 0.35); font-size: 11px; font-family: monospace; font-weight: 700; }
  .detail-title { margin: 0; color: white; font-size: 24px; line-height: 1.1; font-weight: 800; letter-spacing: 0; }
  .detail-status { display: inline-flex; align-items: center; gap: 5px; padding: 5px 9px; border-radius: 8px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: rgba(74, 222, 128, 0.88); font-size: 11px; font-weight: 700; white-space: nowrap; }
  .detail-meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .detail-meta-card { display: flex; align-items: center; gap: 10px; background: rgba(100, 160, 255, 0.04); border: 1px solid rgba(100, 160, 255, 0.08); border-radius: 12px; padding: 12px; color: rgba(126, 184, 255, 0.75); min-width: 0; }
  .detail-meta-card strong { display: block; color: rgba(220, 235, 255, 0.88); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .detail-meta-label { display: block; color: rgba(180, 210, 255, 0.3); font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px; }
  .detail-payterm-badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid; }
  .detail-empty-state { padding: 48px 16px; border: 1px solid rgba(100, 160, 255, 0.1); border-radius: 16px; color: rgba(180, 210, 255, 0.3); text-align: center; background: rgba(8, 18, 40, 0.6); }
  @media (max-width: 860px) { .detail-hero { flex-direction: column; } .detail-meta-grid { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .detail-title-row { flex-direction: column; align-items: flex-start; } .detail-title { font-size: 20px; } }
`

export default CustomerDetailPage