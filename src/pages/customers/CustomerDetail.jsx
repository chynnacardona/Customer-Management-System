import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CreditCard, MapPin, UserRound } from 'lucide-react'
import SalesHistoryPanel from '../../components/shared/SalesHistoryPanel'

// para kay M1: palitan ito ng getCustomerByCustno(custno) API call kapag ready na service layer
const DUMMY_CUSTOMERS = [
  { custno: 'C0001', custname: 'Juan dela Cruz', address: 'Manila', payterm: 'COD', record_status: 'ACTIVE' },
  { custno: 'C0002', custname: 'Maria Santos', address: 'Quezon City', payterm: '30D', record_status: 'ACTIVE' },
  { custno: 'C0003', custname: 'Pedro Reyes', address: 'Makati', payterm: '45D', record_status: 'ACTIVE' },
  { custno: 'C0004', custname: 'Ana Gonzales', address: 'Pasig', payterm: 'COD', record_status: 'ACTIVE' },
  { custno: 'C0005', custname: 'Jose Ramirez', address: 'Taguig', payterm: '30D', record_status: 'ACTIVE' },
  { custno: 'C0006', custname: 'Luz Fernandez', address: 'Mandaluyong', payterm: 'COD', record_status: 'ACTIVE' },
]

// para kay M1: palitan ito ng getSalesByCustomer(custno) at getSalesDetail(transNo)
const DUMMY_SALES = [
  {
    transNo: 'TR000001',
    custNo: 'C0001',
    salesDate: '2026-03-05',
    empNo: 'E0001',
    items: [
      { prodCode: 'AK0001', description: 'All-Purpose Cleaner', quantity: 4, unitPrice: 145 },
      { prodCode: 'AK0004', description: 'Dishwashing Liquid', quantity: 2, unitPrice: 210 },
    ],
  },
  {
    transNo: 'TR000014',
    custNo: 'C0001',
    salesDate: '2026-03-22',
    empNo: 'E0003',
    items: [
      { prodCode: 'AK0010', description: 'Laundry Powder', quantity: 3, unitPrice: 280 },
      { prodCode: 'AK0022', description: 'Fabric Conditioner', quantity: 2, unitPrice: 195 },
      { prodCode: 'AK0031', description: 'Hand Soap Refill', quantity: 6, unitPrice: 89 },
    ],
  },
  {
    transNo: 'TR000023',
    custNo: 'C0002',
    salesDate: '2026-03-11',
    empNo: 'E0002',
    items: [
      { prodCode: 'AK0005', description: 'Glass Cleaner', quantity: 5, unitPrice: 132 },
      { prodCode: 'AK0011', description: 'Floor Wax', quantity: 1, unitPrice: 510 },
    ],
  },
  {
    transNo: 'TR000029',
    custNo: 'C0003',
    salesDate: '2026-04-01',
    empNo: 'E0004',
    items: [
      { prodCode: 'AK0008', description: 'Bathroom Disinfectant', quantity: 2, unitPrice: 245 },
    ],
  },
  {
    transNo: 'TR000038',
    custNo: 'C0004',
    salesDate: '2026-04-09',
    empNo: 'E0001',
    items: [
      { prodCode: 'AK0020', description: 'Kitchen Degreaser', quantity: 4, unitPrice: 165 },
      { prodCode: 'AK0024', description: 'Paper Towels', quantity: 8, unitPrice: 74 },
    ],
  },
]

function CustomerDetailPage() {
  const { custno } = useParams()
  const navigate = useNavigate()

  const customer = useMemo(() => DUMMY_CUSTOMERS.find((item) => item.custno === custno), [custno])
  const transactions = useMemo(() => DUMMY_SALES.filter((item) => item.custNo === custno), [custno])

  const paytermColor = (term) => {
    if (term === 'COD') return { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.2)' }
    if (term === '30D') return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' }
    if (term === '45D') return { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' }
    return { bg: 'transparent', color: 'white', border: 'transparent' }
  }

  if (!customer) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="customer-detail-page">
          <button className="detail-back-btn" onClick={() => navigate('/customers')}><ArrowLeft size={14} />Back to Customers</button>
          <div className="detail-empty-state">Customer not found</div>
        </div>
      </>
    )
  }

  const badge = paytermColor(customer.payterm)
  const totalSpend = transactions.reduce(
    (sum, transaction) => sum + transaction.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0),
    0
  )
  const formattedTotal = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(totalSpend)

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
              <span className="detail-status"><BadgeCheck size={13} />{customer.record_status}</span>
            </div>

            <div className="detail-meta-grid">
              <div className="detail-meta-card"><MapPin size={15} /><div><span className="detail-meta-label">Address</span><strong>{customer.address}</strong></div></div>
              <div className="detail-meta-card"><CreditCard size={15} /><div><span className="detail-meta-label">Pay Term</span><span className="detail-payterm-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>{customer.payterm}</span></div></div>
              <div className="detail-meta-card"><CreditCard size={15} /><div><span className="detail-meta-label">Total Spend</span><strong>{formattedTotal}</strong></div></div>
            </div>
          </div>
        </section>

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
