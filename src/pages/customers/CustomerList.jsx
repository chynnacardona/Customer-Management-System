import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Edit, Trash2, Plus, UserCheck, Loader2 } from 'lucide-react'
import AddCustomerModal from '../../components/shared/AddCustomerModal'
import EditCustomerModal from '../../components/shared/EditCustomerModal'
import SoftDeleteConfirmDialog from '../../components/shared/SoftDeleteConfirmDialog'
import { customerService } from '../../services/customerService'

function CustomerListPage() {
  const navigate = useNavigate()
  
  // LIVE DATABASE STATES
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI STATES
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deletingCustomer, setDeletingCustomer] = useState(null)

  // FETCHING FROM DATABASE
  useEffect(() => {
    const fetchFromDB = async () => {
      try {
        setLoading(true)
        const data = await customerService.getCustomers()
        setCustomers(data || [])
      } catch (err) {
        console.error("Database connection failed:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchFromDB()
  }, [])

  // SEARCH FILTER (No pagination, displays all rows)
  const filtered = customers.filter(c =>
    c.custname?.toLowerCase().includes(search.toLowerCase()) ||
    c.custno?.toLowerCase().includes(search.toLowerCase()) ||
    c.payterm?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  const handleViewClick = (e, customer) => {
    e.stopPropagation()
    navigate(`/customers/${customer.custno}`)
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
        @keyframes pageIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .customer-list { animation: pageIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .page-title h1 { font-size: 20px; font-weight: 700; color: white; letter-spacing: 0.02em; margin: 0; }
        .page-title p { font-size: 12px; color: rgba(180, 210, 255, 0.35); margin: 5px 0 0; }
        .page-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .search-wrapper { display: flex; align-items: center; gap: 8px; background: rgba(100, 160, 255, 0.04); border: 1px solid rgba(100, 160, 255, 0.1); border-radius: 10px; padding: 7px 12px; transition: all 0.2s ease; min-width: 220px; }
        .search-wrapper:focus-within { border-color: rgba(100, 160, 255, 0.3); background: rgba(100, 160, 255, 0.07); }
        .search-wrapper input { background: none; border: none; outline: none; font-size: 12.5px; color: rgba(180, 210, 255, 0.8); width: 100%; }
        .add-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: linear-gradient(135deg, #1a4fd6, #2e86f5); border: none; border-radius: 10px; color: white; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .table-container { background: rgba(8, 18, 40, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(100, 160, 255, 0.1); border-radius: 16px; overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; color: rgba(180, 210, 255, 0.35); letter-spacing: 0.12em; text-transform: uppercase; background: rgba(100, 160, 255, 0.03); }
        .data-table tbody tr { border-bottom: 1px solid rgba(100, 160, 255, 0.05); transition: all 0.15s ease; cursor: pointer; }
        .data-table tbody tr:hover { background: rgba(100, 160, 255, 0.06); }
        .data-table tbody td { padding: 12px 16px; font-size: 12.5px; color: rgba(180, 210, 255, 0.7); }
        .custno-cell { font-family: monospace; font-size: 12px; color: rgba(180, 210, 255, 0.45); }
        .custname-cell { font-weight: 600; color: rgba(220, 235, 255, 0.9) !important; }
        .payterm-badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid; }
        .action-cell { display: flex; align-items: center; gap: 4px; }
        .action-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid transparent; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(180, 210, 255, 0.3); }
        .action-btn.view:hover { color: #60a5fa; background: rgba(59, 130, 246, 0.1); }
        .empty-state { padding: 60px 16px; text-align: center; color: rgba(180, 210, 255, 0.25); font-size: 13px; }
      `}</style>

      <div className="customer-list">
        <div className="page-header">
          <div className="page-title">
            <h1>Customers</h1>
            <p>{filtered.length} live records found</p>
          </div>
          <div className="page-actions">
            <div className="search-wrapper">
              <Search size={13} style={{ color: 'rgba(180, 210, 255, 0.25)' }} />
              <input placeholder="Search customers..." value={search} onChange={handleSearch} />
            </div>
            <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={14} /> Add Customer
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cust No.</th>
                <th>Customer Name</th>
                <th>Address</th>
                <th>Pay Term</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Loader2 className="animate-spin mb-2 mx-auto text-blue-400" />
                      <p>Fetching records from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No customers found.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => {
                  const badge = paytermColor(customer.payterm)
                  return (
                    <tr key={customer.custno} onClick={() => setSelectedRow(customer.custno)}>
                      <td className="custno-cell">{customer.custno}</td>
                      <td className="custname-cell">{customer.custname}</td>
                      <td>{customer.address}</td>
                      <td>
                        <span className="payterm-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
                          {customer.payterm}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(74, 222, 128, 0.8)' }}>
                          <UserCheck size={11} />
                          {customer.record_status}
                        </span>
                      </td>
                      <td>
                        <div className="action-cell">
                          <button className="action-btn view" onClick={(e) => handleViewClick(e, customer)}>
                            <Eye size={13} />
                          </button>
                          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                            <Edit size={13} />
                          </button>
                          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setDeletingCustomer(customer); }}>
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
        </div>
      </div>

      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditCustomerModal isOpen={Boolean(editingCustomer)} customer={editingCustomer} onClose={() => setEditingCustomer(null)} />
      <SoftDeleteConfirmDialog isOpen={Boolean(deletingCustomer)} customer={deletingCustomer} onClose={() => setDeletingCustomer(null)} onConfirm={() => {}} />
    </>
  )
}

export default CustomerListPage