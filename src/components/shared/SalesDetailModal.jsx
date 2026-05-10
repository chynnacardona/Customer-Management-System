import { X, ReceiptText, Loader2 } from 'lucide-react'

function SalesDetailModal({ isOpen, onClose, transaction, details, isLoading, error }) {
  if (!isOpen || !transaction) return null

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

  // Standardize variables from the database (lowercase keys)
  const transNo = transaction.transno || transaction.trans_no || "#";
  const salesDate = transaction.salesdate || transaction.sales_date;
  const lineItems = details?.map((item) => {
    const unitPrice = Number(item.product?.pricehist?.[0]?.unitprice || item.unit_price || 0)
    const quantity = Number(item.quantity || 0)

    return {
      ...item,
      unitPrice,
      lineTotal: quantity * unitPrice,
    }
  }) || []

  const grandTotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <>
      <style>{`
        @keyframes salesDetailIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .sales-detail-overlay { position: fixed; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; background: rgba(1, 6, 18, 0.74); backdrop-filter: blur(6px); padding: 18px; }
        .sales-detail-card { width: min(880px, 100%); max-height: min(760px, calc(100vh - 36px)); display: flex; flex-direction: column; background: linear-gradient(180deg, rgba(126, 184, 255, 0.045), rgba(8, 18, 40, 0.97) 38%), rgba(8, 18, 40, 0.97); border: 1px solid rgba(100, 160, 255, 0.14); border-radius: 18px; overflow: hidden; animation: salesDetailIn 0.25s ease-out forwards; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.48); }
        .sales-detail-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid rgba(100, 160, 255, 0.08); }
        .sales-detail-title-group { display: flex; align-items: center; gap: 10px; }
        .sales-detail-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #7eb8ff; background: rgba(46, 134, 245, 0.12); }
        .sales-detail-title { margin: 0; color: white; font-size: 15px; font-weight: 700; }
        .sales-detail-subtitle { margin: 2px 0 0; color: rgba(180, 210, 255, 0.34); font-size: 11px; }
        .sales-detail-close { background: transparent; border: none; color: rgba(180, 210, 255, 0.35); cursor: pointer; transition: 0.2s; }
        .sales-detail-close:hover { color: #ff6b6b; }
        .sales-detail-body { padding: 20px; overflow: auto; }
        .sales-detail-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
        .sales-detail-meta-item { background: rgba(100, 160, 255, 0.04); border: 1px solid rgba(100, 160, 255, 0.08); border-radius: 10px; padding: 12px; }
        .sales-detail-label { display: block; color: rgba(180, 210, 255, 0.28); font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em; }
        .sales-detail-value { color: white; font-size: 14px; font-weight: 600; }
        .sales-detail-table-wrap { border: 1px solid rgba(100, 160, 255, 0.08); border-radius: 12px; overflow: hidden; background: rgba(3, 9, 24, 0.28); }
        .sales-detail-table { width: 100%; min-width: 720px; border-collapse: collapse; table-layout: fixed; }
        .sales-detail-table th { padding: 12px; text-align: left; color: rgba(180, 210, 255, 0.35); background: rgba(100, 160, 255, 0.03); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .sales-detail-table td { padding: 12px; color: rgba(180, 210, 255, 0.7); font-size: 13.5px; border-top: 1px solid rgba(100, 160, 255, 0.05); }
        .sales-detail-product-name { color: white; font-weight: 600; }
        .sales-detail-number { text-align: right; font-variant-numeric: tabular-nums; }
        .sales-detail-total-section { display: flex; justify-content: flex-end; align-items: center; gap: 14px; padding: 18px 2px 0; color: rgba(180, 210, 255, 0.48); font-size: 13px; }
        .sales-detail-total-section strong { color: #7eb8ff; font-size: 22px; font-weight: 850; font-variant-numeric: tabular-nums; }
        .sales-detail-error { padding: 34px 18px; text-align: center; color: rgba(252, 165, 165, 0.95); font-size: 13px; }
        @media (max-width: 760px) { .sales-detail-meta { grid-template-columns: 1fr; } .sales-detail-table-wrap { overflow-x: auto; } }
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
                  {salesDate ? new Date(salesDate).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div className="sales-detail-meta-item">
                <span className="sales-detail-label">Items</span>
                <span className="sales-detail-value">{lineItems.length}</span>
              </div>
            </div>

            <div className="sales-detail-table-wrap">
              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#7eb8ff' }}>
                  <Loader2 className="animate-spin mx-auto mb-2" />
                  <span>Loading items...</span>
                </div>
              ) : error ? (
                <div className="sales-detail-error">{error}</div>
              ) : (
                <table className="sales-detail-table">
                  <colgroup>
                    <col style={{ width: '42%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.length > 0 ? (
                      lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="sales-detail-product-name">
                            {item.product?.description || item.prodcode || "Unknown Item"}
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td>{item.product?.unit || '-'}</td>
                          <td className="sales-detail-number">{formatCurrency(item.unitPrice)}</td>
                          <td className="sales-detail-number">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'rgba(180, 210, 255, 0.2)' }}>
                          No products found in this transaction.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* GRAND TOTAL - DYNAMICALLY CALCULATED */}
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
