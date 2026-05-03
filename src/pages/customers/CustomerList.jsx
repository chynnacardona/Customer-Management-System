import { useState } from 'react'
import { Search, Eye, Edit, Trash2, Plus, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react'

// Dummy data - si M4 na bahala magfetch ng real data from supabase
const DUMMY_CUSTOMERS = [
  { custno: 'C0001', custname: 'Juan dela Cruz', address: 'Manila', payterm: 'COD', record_status: 'ACTIVE' },
  { custno: 'C0002', custname: 'Maria Santos', address: 'Quezon City', payterm: '30D', record_status: 'ACTIVE' },
  { custno: 'C0003', custname: 'Pedro Reyes', address: 'Makati', payterm: '45D', record_status: 'ACTIVE' },
  { custno: 'C0004', custname: 'Ana Gonzales', address: 'Pasig', payterm: 'COD', record_status: 'ACTIVE' },
  { custno: 'C0005', custname: 'Jose Ramirez', address: 'Taguig', payterm: '30D', record_status: 'ACTIVE' },
  { custno: 'C0006', custname: 'Luz Fernandez', address: 'Mandaluyong', payterm: 'COD', record_status: 'ACTIVE' },
  { custno: 'C0007', custname: 'Carlos Mendoza', address: 'Caloocan', payterm: '45D', record_status: 'ACTIVE' },
  { custno: 'C0008', custname: 'Rosa Villanueva', address: 'Paranaque', payterm: '30D', record_status: 'ACTIVE' },
  { custno: 'C0009', custname: 'Miguel Torres', address: 'Las Pinas', payterm: 'COD', record_status: 'ACTIVE' },
  { custno: 'C0010', custname: 'Elena Cruz', address: 'Muntinlupa', payterm: '45D', record_status: 'ACTIVE' },
  { custno: 'C0011', custname: 'Roberto Ramos', address: 'Valenzuela', payterm: 'COD', record_status: 'ACTIVE' },
  { custno: 'C0012', custname: 'Carmen Flores', address: 'Malabon', payterm: '30D', record_status: 'ACTIVE' },
]

const ROWS_OPTIONS = [5, 10, 15, 20]

function CustomerListPage() {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState(null)

  // Filter by search
  const filtered = DUMMY_CUSTOMERS.filter(c =>
    c.custname.toLowerCase().includes(search.toLowerCase()) ||
    c.payterm.toLowerCase().includes(search.toLowerCase()) ||
    c.custno.toLowerCase().includes(search.toLowerCase())
  )

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginated = filtered.slice(startIndex, startIndex + rowsPerPage)

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  const paytermColor = (term) => {
    if (term === 'COD') return { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.2)' }
    if (term === '30D') return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' }
    if (term === '45D') return { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' }
    return { bg: 'transparent', color: 'white', border: 'transparent' }
  }

  return (
    <>
      <style>{`
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .customer-list {
          animation: pageIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* Page Header */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-title h1 {
          font-size: 20px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.02em;
          margin: 0;
          line-height: 1;
        }

        .page-title p {
          font-size: 12px;
          color: rgba(180, 210, 255, 0.35);
          margin: 5px 0 0;
          letter-spacing: 0.02em;
        }

        .page-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Search bar */
        .search-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(100, 160, 255, 0.04);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 10px;
          padding: 7px 12px;
          transition: all 0.2s ease;
          min-width: 220px;
        }

        .search-wrapper:focus-within {
          border-color: rgba(100, 160, 255, 0.3);
          background: rgba(100, 160, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(60, 120, 255, 0.08);
        }

        .search-wrapper input {
          background: none;
          border: none;
          outline: none;
          font-size: 12.5px;
          color: rgba(180, 210, 255, 0.8);
          width: 100%;
        }

        .search-wrapper input::placeholder { color: rgba(180, 210, 255, 0.22); }
        .search-icon-c { color: rgba(180, 210, 255, 0.25); flex-shrink: 0; }

        /* Add button */
        .add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #1a4fd6, #2e86f5);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(30, 80, 220, 0.4);
        }

        .add-btn:active { transform: translateY(0); }

        /* Table container */
        .table-container {
          background: rgba(8, 18, 40, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        /* Table */
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table thead {
          border-bottom: 1px solid rgba(100, 160, 255, 0.08);
        }

        .data-table thead th {
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          background: rgba(100, 160, 255, 0.03);
        }

        .data-table tbody tr {
          border-bottom: 1px solid rgba(100, 160, 255, 0.05);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .data-table tbody tr:last-child { border-bottom: none; }

        .data-table tbody tr:hover {
          background: rgba(100, 160, 255, 0.06);
        }

        .data-table tbody tr.selected {
          background: rgba(46, 134, 245, 0.1);
          border-color: rgba(100, 160, 255, 0.15);
        }

        .data-table tbody td {
          padding: 12px 16px;
          font-size: 12.5px;
          color: rgba(180, 210, 255, 0.7);
          white-space: nowrap;
        }

        .custno-cell {
          font-family: monospace;
          font-size: 12px;
          color: rgba(180, 210, 255, 0.45);
        }

        .custname-cell {
          font-weight: 600;
          color: rgba(220, 235, 255, 0.9) !important;
        }

        /* Payterm badge */
        .payterm-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border: 1px solid;
        }

        /* Action buttons */
        .action-cell {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid transparent;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          color: rgba(180, 210, 255, 0.3);
        }

        .action-btn.view:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .action-btn.edit:hover {
          background: rgba(234, 179, 8, 0.1);
          border-color: rgba(234, 179, 8, 0.2);
          color: #facc15;
        }

        .action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid rgba(100, 160, 255, 0.07);
          flex-wrap: wrap;
          gap: 8px;
        }

        .pagination-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(180, 210, 255, 0.35);
        }

        .rows-select {
          background: rgba(100, 160, 255, 0.05);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 7px;
          color: rgba(180, 210, 255, 0.7);
          font-size: 12px;
          padding: 3px 6px;
          outline: none;
          cursor: pointer;
        }

        .pagination-right {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(180, 210, 255, 0.4);
        }

        .page-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid rgba(100, 160, 255, 0.1);
          background: rgba(100, 160, 255, 0.04);
          color: rgba(180, 210, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .page-btn:hover:not(:disabled) {
          background: rgba(100, 160, 255, 0.1);
          border-color: rgba(100, 160, 255, 0.2);
          color: rgba(180, 210, 255, 0.9);
        }

        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Empty state */
        .empty-state {
          padding: 48px 16px;
          text-align: center;
          color: rgba(180, 210, 255, 0.25);
          font-size: 13px;
        }
      `}</style>

      <div className="customer-list">

        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>Customers</h1>
            <p>{totalItems} {totalItems === 1 ? 'record' : 'records'} found</p>
          </div>
          <div className="page-actions">
            {/* Search */}
            <div className="search-wrapper">
              <Search size={13} className="search-icon-c" />
              <input
                placeholder="Search by name, payterm..."
                value={search}
                onChange={handleSearch}
              />
            </div>
            {/* para kay M4: itago yung button na to kung ang user ay walang CUST_ADD na karapatan*/} 
            <button className="add-btn">
              <Plus size={14} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cust No.</th>
                <th>Customer Name</th>
                <th>Address</th>
                <th>Pay Term</th>
                {/* para kay M4: itago yung column na to kung yung user ay USER lang - visible lang sa ADMIN at SUPERADMIN */}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No customers found</div>
                  </td>
                </tr>
              ) : (
                paginated.map((customer) => {
                  const badge = paytermColor(customer.payterm)
                  return (
                    <tr
                      key={customer.custno}
                      className={selectedRow === customer.custno ? 'selected' : ''}
                      onClick={() => setSelectedRow(customer.custno)}
                    >
                      <td className="custno-cell">{customer.custno}</td>
                      <td className="custname-cell">{customer.custname}</td>
                      <td>{customer.address}</td>
                      <td>
                        <span
                          className="payterm-badge"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            borderColor: badge.border,
                          }}
                        >
                          {customer.payterm}
                        </span>
                      </td>
                      {/* para kay M4: itago yung cell na to kung yung user ay USER lang - visible lang dapat sa ADMIN at SUPERADMIN */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: 'rgba(74, 222, 128, 0.8)',
                        }}>
                          <UserCheck size={11} />
                          {customer.record_status}
                        </span>
                      </td>
                      <td>
                        <div className="action-cell">
                          {/* View */}
                          <button className="action-btn view" title="View">
                            <Eye size={13} />
                          </button>
                          {/* para kay M4: itago yung button na to kung yung user ay walang CUST_EDIT na karapatan*/}
                          <button className="action-btn edit" title="Edit">
                            <Edit size={13} />
                          </button>
                          {/* para kay M4: itago yung button na to kung yung user ay walang CUST_DEL na karapatan. SUPERADMIN lang yung may karapatang neto*/}
                          <button className="action-btn delete" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-left">
              Rows per page:
              <select
                className="rows-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {ROWS_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="pagination-right">
              {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

export default CustomerListPage