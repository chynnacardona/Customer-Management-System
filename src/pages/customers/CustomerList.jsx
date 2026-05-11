import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Edit, Trash2, Plus, UserCheck, Loader2, RotateCcw } from 'lucide-react'
import AddCustomerModal from '../../components/shared/AddCustomerModal'
import EditCustomerModal from '../../components/shared/EditCustomerModal'
import FilterDropdown from '../../components/shared/FilterDropdown'
import SoftDeleteConfirmDialog from '../../components/shared/SoftDeleteConfirmDialog'
import { customerService } from '../../services/customerService'
import { useRights } from '../../context/useRights'
import {
  canAddCustomer as canAddCustomerByRights,
  canDeleteCustomer as canDeleteCustomerByRights,
  canEditCustomer as canEditCustomerByRights,
  canManageDeletedCustomers,
} from '../../utils/accessRules'

function normalizeStatus(status) {
  return String(status || '').toUpperCase()
}

function formatStamp(stamp) {
  if (!stamp) return '-'

  const raw = String(stamp)
  const primary = raw.split(';')[0]?.trim() || raw
  const readable = primary.replace(/^(\d{1,2}\/\d{1,2}):/, '$1 ').replaceAll(':', ':')

  return readable.length > 18 ? `${readable.slice(0, 18)}...` : readable
}

function CustomerListPage() {
  const navigate = useNavigate()
  const { rights, userType } = useRights()
  const effectiveUserType = userType ?? 'USER'
  const canRecoverDeleted = canManageDeletedCustomers(userType)
  const canAddCustomer = canAddCustomerByRights(rights)
  const canEditCustomer = canEditCustomerByRights(rights)
  const canDeleteCustomer = userType === 'SUPERADMIN' && canDeleteCustomerByRights(rights)
  const canSeeStamp = canManageDeletedCustomers(userType)
  const tableColumnCount = canSeeStamp ? 7 : 6
  
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [search, setSearch] = useState('')
  const [paytermFilter, setPaytermFilter] = useState('ALL')
  const [selectedRow, setSelectedRow] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deletingCustomer, setDeletingCustomer] = useState(null)

  const fetchFromDB = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await customerService.getCustomers(effectiveUserType)
      setCustomers(data || [])
    } catch (err) {
      setError(err.message || 'Database connection failed.')
    } finally {
      setLoading(false)
    }
  }, [effectiveUserType])

  useEffect(() => {
    fetchFromDB()
  }, [fetchFromDB])

  useEffect(() => {
    const unsubscribe = customerService.subscribeToCustomerChanges(() => {
      fetchFromDB()
    })

    return () => unsubscribe()
  }, [fetchFromDB])

  const filtered = customers.filter((customer) => {
    const matchesSearch =
      customer.custname?.toLowerCase().includes(search.toLowerCase()) ||
      customer.custno?.toLowerCase().includes(search.toLowerCase()) ||
      customer.payterm?.toLowerCase().includes(search.toLowerCase())
    const matchesPayterm = paytermFilter === 'ALL' || customer.payterm === paytermFilter

    return matchesSearch && matchesPayterm
  })

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  const handleViewClick = (e, customer) => {
    e.stopPropagation()
    navigate(`/customers/${customer.custno}`)
  }

  const handleAddCustomer = async (payload) => {
    await customerService.addCustomer(payload)
    await fetchFromDB()
  }

  const handleUpdateCustomer = async (custno, payload) => {
    await customerService.updateCustomer(custno, payload)
    await fetchFromDB()
  }

  const handleSoftDeleteCustomer = async (customer) => {
    await customerService.softDeleteCustomer(customer.custno)
    setDeletingCustomer(null)
    await fetchFromDB()
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
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .customer-list { animation: pageIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; height: 100%; min-height: 0; display: flex; flex-direction: column; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .page-title h1 { font-size: 20px; font-weight: 700; color: white; letter-spacing: 0.02em; margin: 0; }
        .page-title p { font-size: 12px; color: rgba(180, 210, 255, 0.35); margin: 5px 0 0; }
        .page-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .search-wrapper { display: flex; align-items: center; gap: 8px; background: rgba(126, 184, 255, 0.04); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 10px; padding: 7px 12px; transition: all 0.2s ease; min-width: 220px; }
        .search-wrapper:focus-within { border-color: rgba(56, 189, 248, 0.34); background: rgba(126, 184, 255, 0.07); box-shadow: 0 0 0 3px rgba(46, 134, 245, 0.1); }
        .search-wrapper input { background: none; border: none; outline: none; font-size: 12.5px; color: rgba(180, 210, 255, 0.8); width: 100%; }
        .action-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 10px; color: white; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .add-btn { background: linear-gradient(135deg, #1a4fd6, #2e86f5); }
        .recover-link-btn { background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.22); color: rgba(134, 239, 172, 0.95); }
        .action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(46, 134, 245, 0.22); }
        .table-container { flex: 1; min-height: 0; display: flex; flex-direction: column; background: linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 44%), linear-gradient(145deg, rgba(8, 18, 40, 0.84), rgba(3, 9, 24, 0.9)); backdrop-filter: blur(20px); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.045); animation: cardIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both; transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease; }
        .table-container:hover { transform: translateY(-2px); border-color: rgba(126, 184, 255, 0.24); box-shadow: 0 22px 48px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255,255,255,0.07); }
        .table-scroll { flex: 1; min-height: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: rgba(126, 184, 255, 0.45) rgba(8, 18, 40, 0.28); }
        .table-scroll::-webkit-scrollbar { width: 11px; height: 11px; }
        .table-scroll::-webkit-scrollbar-track { background: rgba(5, 16, 48, 0.6); }
        .table-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(46, 134, 245, 0.82), rgba(26, 79, 214, 0.88)); border-radius: 999px; border: 2px solid rgba(5, 16, 48, 0.78); }
        .table-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(96, 165, 250, 0.92), rgba(46, 134, 245, 0.92)); }
        .table-scroll::-webkit-scrollbar-corner { background: rgba(5, 16, 48, 0.6); }
        .data-table { width: 100%; min-width: 960px; height: 100%; border-collapse: collapse; display: flex; flex-direction: column; }
        .data-table thead { flex: 0 0 auto; display: table; width: 100%; table-layout: fixed; }
        .data-table tbody { flex: 1; min-height: 0; display: block; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: rgba(126, 184, 255, 0.45) rgba(8, 18, 40, 0.28); }
        .data-table tbody::-webkit-scrollbar { width: 11px; }
        .data-table tbody::-webkit-scrollbar-track { background: rgba(5, 16, 48, 0.6); }
        .data-table tbody::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(46, 134, 245, 0.82), rgba(26, 79, 214, 0.88)); border-radius: 999px; border: 2px solid rgba(5, 16, 48, 0.78); }
        .data-table tbody::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(96, 165, 250, 0.92), rgba(46, 134, 245, 0.92)); }
        .data-table tbody tr { display: table; width: 100%; table-layout: fixed; }
        .data-table thead th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; color: rgba(180, 210, 255, 0.46); letter-spacing: 0.12em; text-transform: uppercase; background: rgba(6, 16, 36, 0.96); backdrop-filter: blur(12px); box-shadow: 0 1px 0 rgba(126, 184, 255, 0.12), 0 10px 18px rgba(2, 8, 24, 0.18); }
        .data-table thead th { position: relative; z-index: 3; }
        .data-table:not(.with-stamp) th:nth-child(1), .data-table:not(.with-stamp) td:nth-child(1) { width: 13%; }
        .data-table:not(.with-stamp) th:nth-child(2), .data-table:not(.with-stamp) td:nth-child(2) { width: 18%; }
        .data-table:not(.with-stamp) th:nth-child(3), .data-table:not(.with-stamp) td:nth-child(3) { width: 30%; }
        .data-table:not(.with-stamp) th:nth-child(4), .data-table:not(.with-stamp) td:nth-child(4) { width: 13%; }
        .data-table:not(.with-stamp) th:nth-child(5), .data-table:not(.with-stamp) td:nth-child(5) { width: 14%; }
        .data-table:not(.with-stamp) th:nth-child(6), .data-table:not(.with-stamp) td:nth-child(6) { width: 12%; }
        .data-table.with-stamp th:nth-child(1), .data-table.with-stamp td:nth-child(1) { width: 12%; }
        .data-table.with-stamp th:nth-child(2), .data-table.with-stamp td:nth-child(2) { width: 17%; }
        .data-table.with-stamp th:nth-child(3), .data-table.with-stamp td:nth-child(3) { width: 24%; }
        .data-table.with-stamp th:nth-child(4), .data-table.with-stamp td:nth-child(4) { width: 12%; }
        .data-table.with-stamp th:nth-child(5), .data-table.with-stamp td:nth-child(5) { width: 13%; }
        .data-table.with-stamp th:nth-child(6), .data-table.with-stamp td:nth-child(6) { width: 14%; }
        .data-table.with-stamp th:nth-child(7), .data-table.with-stamp td:nth-child(7) { width: 8%; }
        .data-table tbody tr { border-bottom: 1px solid rgba(126, 184, 255, 0.06); transition: background 0.18s ease, box-shadow 0.18s ease; cursor: pointer; }
        .data-table tbody tr:hover { background: rgba(126, 184, 255, 0.07); box-shadow: inset 3px 0 0 rgba(56, 189, 248, 0.75); }
        .data-table tbody td { padding: 12px 16px; font-size: 12.5px; color: rgba(180, 210, 255, 0.7); }
        .data-table th.status-col,
        .data-table td.status-col,
        .data-table th.stamp-col,
        .data-table td.stamp-col,
        .data-table th.actions-col,
        .data-table td.actions-col { text-align: center; }
        .custno-cell { font-family: monospace; font-size: 12px; color: rgba(180, 210, 255, 0.45); }
        .custname-cell { font-weight: 600; color: rgba(220, 235, 255, 0.9) !important; }
        .payterm-badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid; }
        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 82px;
          font-size: 11px;
          color: rgba(74, 222, 128, 0.86);
        }
        .status-badge.inactive {
          color: rgba(248, 113, 113, 0.95);
        }
        .stamp-cell {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .action-cell { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .action-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid transparent; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(180, 210, 255, 0.3); transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease; }
        .action-btn:hover { transform: translateY(-1px) scale(1.05); }
        .action-btn.view:hover { color: #60a5fa; background: rgba(59, 130, 246, 0.1); }
        .action-btn.edit:hover { color: #facc15; background: rgba(234, 179, 8, 0.1); }
        .action-btn.delete:hover { color: #f87171; background: rgba(239, 68, 68, 0.1); }
        .empty-state { padding: 60px 16px; text-align: center; color: rgba(180, 210, 255, 0.25); font-size: 13px; }
        .error-state { margin-bottom: 12px; border: 1px solid rgba(248, 113, 113, 0.2); background: rgba(239, 68, 68, 0.08); color: rgba(252, 165, 165, 0.95); border-radius: 12px; padding: 10px 12px; font-size: 12.5px; }
        @media (max-width: 920px) { .page-header { margin-bottom: 14px; } }
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
            <FilterDropdown
              label="Pay term"
              value={paytermFilter}
              onChange={setPaytermFilter}
              options={[
                { value: 'ALL', label: 'All Pay Terms' },
                { value: 'COD', label: 'COD' },
                { value: '30D', label: '30D' },
                { value: '45D', label: '45D' },
              ]}
            />
            {canRecoverDeleted && (
              <button className="action-btn-primary recover-link-btn" onClick={() => navigate('/deleted-customers')}>
                <RotateCcw size={14} /> Recover Deleted Accounts
              </button>
            )}
            {canAddCustomer && (
              <button className="action-btn-primary add-btn" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={14} /> Add Customer
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-state">{error}</div>}

        <div className="table-container">
          <div className="table-scroll">
            <table className={`data-table ${canSeeStamp ? 'with-stamp' : ''}`}>
              <thead>
                <tr>
                  <th>Cust No.</th>
                  <th>Customer Name</th>
                  <th>Address</th>
                  <th>Pay Term</th>
                  <th className="status-col">Status</th>
                  {canSeeStamp && <th className="stamp-col">Stamp</th>}
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tableColumnCount}>
                      <div className="empty-state">
                        <Loader2 className="animate-spin mb-2 mx-auto text-blue-400" />
                        <p>Fetching records from database...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumnCount}>
                      <div className="empty-state">No customers found.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => {
                    const badge = paytermColor(customer.payterm)
                    return (
                      <tr key={customer.custno} onClick={() => setSelectedRow(customer.custno)} style={{ background: selectedRow === customer.custno ? 'rgba(46, 134, 245, 0.08)' : 'transparent' }}>
                        <td className="custno-cell">{customer.custno}</td>
                        <td className="custname-cell">{customer.custname}</td>
                        <td>{customer.address}</td>
                        <td>
                          <span className="payterm-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
                            {customer.payterm}
                          </span>
                        </td>
                        <td className="status-col">
                          <span className={`status-badge ${normalizeStatus(customer.record_status) === 'INACTIVE' ? 'inactive' : ''}`}>
                            <UserCheck size={11} />
                            {customer.record_status}
                          </span>
                        </td>
                        {canSeeStamp && <td className="stamp-col stamp-cell" title={customer.stamp || ''}>{formatStamp(customer.stamp)}</td>}
                        <td className="actions-col">
                          <div className="action-cell">
                            <button className="action-btn view" onClick={(e) => handleViewClick(e, customer)}>
                              <Eye size={13} />
                            </button>
                            {canEditCustomer && (
                              <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                                <Edit size={13} />
                              </button>
                            )}
                            {canDeleteCustomer && (
                              <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); setDeletingCustomer(customer); }}>
                                <Trash2 size={13} />
                              </button>
                            )}
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
      </div>

      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddCustomer} />
      <EditCustomerModal isOpen={Boolean(editingCustomer)} customer={editingCustomer} onClose={() => setEditingCustomer(null)} onSubmit={handleUpdateCustomer} />
      <SoftDeleteConfirmDialog isOpen={Boolean(deletingCustomer)} customer={deletingCustomer} onClose={() => setDeletingCustomer(null)} onConfirm={handleSoftDeleteCustomer} />
    </>
  )
}

export default CustomerListPage
