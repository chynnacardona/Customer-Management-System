import { X, ReceiptText, Loader2 } from 'lucide-react'

function SalesDetailModal({ isOpen, onClose, transaction, details, isLoading }) {
  if (!isOpen || !transaction) return null

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

  // Standardize variables
  const transNo = transaction.transno || transaction.trans_no || "#";
  const salesDate = transaction.salesdate || transaction.sales_date;
  const empNo = transaction.empno || transaction.emp_no || "N/A";

  // --- CALCULATION LOGIC ---
  // Calculates the grand total by multiplying qty and historical price for every item
  const grandTotal = details?.reduce((sum, item) => {
    const price = item.product?.pricehist?.[0]?.unitprice || 0;
    return sum + (Number(item.quantity) * Number(price));
  }, 0) || 0;

  return (
    <>
      <style>{`
        @keyframes salesDetailIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .sales-detail-overlay { position: fixed; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; background: rgba(1, 6, 18, 0.74); backdrop-filter: blur(6px); padding: 16px; }
        .sales-detail-card { width: 100%; max-width: 600px; background: rgba(8, 18, 40, 0.97); border: 1px solid rgba(100, 160, 255, 0.12); border-radius: 18px; overflow: hidden; animation: salesDetailIn 0.25s ease-out forwards; }
        .sales-detail-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid rgba(100, 160, 255, 0.08); }
        .sales-detail-title-group { display: flex; align-items: center; gap: 10px; }
        .sales-detail-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #7eb8ff; background: rgba(46, 134, 245, 0.12); }
        .sales-detail-title { margin: 0; color: white; font-size: 15px; font-weight: 700; }
        .sales-detail-subtitle { margin: 2px 0 0; color: rgba(180, 210, 255, 0.34); font-size: 11px; }
        .sales-detail-close { background: transparent; border: none; color: rgba(180, 210, 255, 0.35); cursor: pointer; }
        .sales-detail-body { padding: 20px; }
        .sales-detail-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .sales-detail-meta-item { background: rgba(100, 160, 255, 0.04); border: 1px solid rgba(100, 160, 255, 0.08); border-radius: 10px; padding: 10px; }
        .sales-detail-label { display: block; color: rgba(180, 210, 255, 0.28); font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
        .sales-detail-value { color: white; font-size: 13px; font-weight: 600; }
        .sales-detail-table-wrap { border: 1px solid rgba(100, 160, 255, 0.08); border-radius: 12px; overflow: hidden; }
        .sales-detail-table { width: 100%; border-collapse: collapse; }
        .sales-detail-table th { padding: 12px; text-align: left; color: rgba(180, 210, 255, 0.35); background: rgba(100, 160, 255, 0.03); font-size: 10px; text-transform: uppercase; }
        .sales-detail-table td { padding: 12px; color: rgba(180, 210, 255, 0.7); font-size: 13px; border-top: 1px solid rgba(100, 160, 255, 0.05); }
        .sales-detail-product-name { color: white; font-weight: 600; }
        .sales-detail-total-section { display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding-top: 20px; color: rgba(180, 210, 255, 0.4); }
        .sales-detail-total-section strong { color: #7eb8ff; font-size: 20px; font-weight: 800; }
      `}</style>

      <div className="sales-detail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="sales-detail-card">
          <div className="sales-detail-header">
            <div className="sales-detail-title-group">
              <div className="sales-detail-icon"><ReceiptText size={18} /></div>
              <div>
                <h2 className="sales-detail-title">Sales Transaction</h2>
                <p className="sales-detail-subtitle">#{transNo}</p>
              </div>
            </div>
            <button className="sales-detail-close" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="sales-detail-body">
            <div className="sales-detail-meta">
              <div className="sales-detail-meta-item">
                <span className="sales-detail-label">Reference</span>
                <span className="sales-detail-value">{transNo}</span>
              </div>
              <div className="sales-detail-meta-item">
                <span className="sales-detail-label">Sales Date</span>
                <span className="sales-detail-value">
                  {salesDate ? new Date(salesDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="sales-detail-meta-item">
                <span className="sales-detail-label">Employee</span>
                <span className="sales-detail-value">{empNo}</span>
              </div>
            </div>

            <div className="sales-detail-table-wrap">
              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#7eb8ff' }}>
                  <Loader2 className="animate-spin mx-auto mb-2" />
                  <span>Loading items...</span>
                </div>
              ) : (
                <table className="sales-detail-table">
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details && details.length > 0 ? (
                      details.map((item, idx) => (
                        <tr key={idx}>
                          <td className="sales-detail-product-name">
                            {/* item.product is the joined table from your API */}
                            {item.product?.description || item.prodcode}
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td>{item.product?.unit || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '30px' }}>
                          No products found in this transaction.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* GRAND TOTAL - BOTTOM RIGHT */}
            <div className="sales-detail-total-section">
              Total Spend <strong>{formatCurrency(grandTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SalesDetailModal