import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Edit, UserCheck, Loader2, X, ChevronLeft, Trash2 } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import AddCustomerModal from '../../components/shared/AddCustomerModal'
import EditCustomerModal from '../../components/shared/EditCustomerModal'
import SoftDeleteConfirmDialog from '../../components/shared/SoftDeleteConfirmDialog'
import { customerService } from '../../services/customerService'
import { useAuth } from '../../context/useAuth' 
import { useRights } from '../../context/useRights'
import {
  canAddCustomer as canAddCustomerByRights,
  canEditCustomer as canEditCustomerByRights,
} from '../../utils/accessRules'

function CustomerListPage() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth() 
  const { rights, userType: rightsUserType } = useRights()

  const metadataName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name
  const databaseName = authUser?.full_name && authUser.full_name.toLowerCase() !== 'admin user' ? authUser.full_name : ''
  const actualDisplayName = databaseName || metadataName || authUser?.email?.split('@')?.[0] || 'System User'
  const actualEmail = authUser?.email ?? 'admin@hope.com'
  const userRole = (rightsUserType ?? authUser?.user_type ?? 'USER').toUpperCase()

  const isSuperAdmin = userRole === 'SUPERADMIN'
  const isAdmin = userRole === 'ADMIN'

  const canSeeAuditHistory = isSuperAdmin || isAdmin
  const canRecoverDeletedRecords = isSuperAdmin || isAdmin
  const canAddCustomer = canAddCustomerByRights(rights)
  const canEditCustomer = canEditCustomerByRights(rights) && (isSuperAdmin || isAdmin)
  const canDeleteCustomer = isSuperAdmin 

  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [timeFilter, setTimeFilter] = useState('ALL')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deletingCustomer, setDeletingCustomer] = useState(null)
  const [logModal, setLogModal] = useState({ 
    isOpen: false, 
    history: [], 
    view: 'list', 
    selectedEntry: null, 
    rawStampData: '' 
  });

  const fetchCustomersFromDatabase = useCallback(async () => {
    try {
      setIsLoading(true)
      const customerData = await customerService.getCustomers(userRole)
      setCustomers(customerData || [])
    } catch (error) { 
      console.error("Fetch error:", error) 
    } finally { 
      setIsLoading(false) 
    }
  }, [userRole])

  useEffect(() => { 
    fetchCustomersFromDatabase() 
  }, [fetchCustomersFromDatabase])

  const filteredCustomers = customers.filter(customer =>
    (customer.custname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.custno || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleHistoryClick = async (event, stampString, filterType = 'ALL') => {
    if (event) event.stopPropagation();
    if (!stampString || stampString === '-' || stampString.trim() === '') {
      setLogModal({ isOpen: true, history: [], view: 'list', selectedEntry: null, rawStampData: stampString });
      return;
    }
    const historyEntries = stampString.split(';');
    const uniqueUserPrefixes = [...new Set(historyEntries.map(entry => entry.split(':')[5]))];
    try {
      const { data: fetchedUsers } = await supabase
        .from('user')
        .select('full_name, email')
        .or(uniqueUserPrefixes.map(prefix => `email.ilike.${prefix}%`).join(','));
      const currentTime = new Date();
      const processedHistory = historyEntries.map(entry => {
        const segments = entry.split(':');
        const userCode = segments[5];
        const isCurrentUser = actualEmail.toLowerCase().startsWith(userCode?.toLowerCase());
        const matchedDatabaseUser = fetchedUsers?.find(user => user.email.toLowerCase().startsWith(userCode?.toLowerCase()));
        const rawDescription = segments[7] || '';
        const legacyMapping = { 'N': 'Name Update', 'A': 'Address Update', 'P': 'Pay Term Update', 'C': 'Record Creation', 'G': 'General Update', 'D': 'Record Deleted' };
        const finalDescription = legacyMapping[rawDescription] || rawDescription || 'Record Update';
        
        return {
          displayDate: `${segments[0]}/26`,
          militaryTime: segments.slice(1, 4).join(':'),
          actionType: segments[4] === 'C' ? 'Created' : (segments[4] === 'D' ? 'Deleted' : 'Updated'),
          userName: isCurrentUser ? actualDisplayName : (matchedDatabaseUser?.full_name || `User (${userCode})`),
          userEmail: isCurrentUser ? actualEmail : (matchedDatabaseUser?.email || `${userCode}@hope.com`),
          systemRole: segments[6] === 'S' ? 'SUPERADMIN' : (segments[6] === 'A' ? 'ADMIN' : 'USER'),
          modificationDescription: finalDescription
        };
      });
      setLogModal({ isOpen: true, history: processedHistory, view: 'list', selectedEntry: null, rawStampData: stampString });
    } catch (e) { console.error(e); }
  };

  const handleUpdateCustomer = async (customerNumber, payload) => {
    try {
      const current = customers.find(c => c.custno === customerNumber);
      const userPrefix = actualEmail.split('@')[0].substring(0, 3);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      const stampEntry = `${now.getMonth()+1}/${now.getDate()}:${timeStr}:U:${userPrefix}:${userRole[0]}:Updated Details:`;
      const newStamp = [stampEntry, ...(current.stamp?.split(';') || [])].join(';');
      
      await customerService.updateCustomer(customerNumber, { ...payload, stamp: newStamp });
      await fetchCustomersFromDatabase();
      setEditingCustomer(null);
    } catch (e) { console.error(e); }
  }

  const handleSoftDeleteCustomer = async (customer) => {
    try {
        const now = new Date();
        const monthDay = `${now.getMonth() + 1}/${now.getDate()}`;
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
        const userPrefix = actualEmail.split('@')[0].substring(0, 3);
        
        // Mark as D (Deleted) in stamp and record_status as INACTIVE
        const deleteEntry = `${monthDay}:${timeStr}:D:${userPrefix}:${userRole[0]}:Record Deleted:`;
        const existingHistory = customer?.stamp && customer.stamp !== '-' ? customer.stamp.split(';') : [];
        const updatedStamp = [deleteEntry, ...existingHistory].join(';');

        await customerService.updateCustomer(customer.custno, { 
          record_status: 'INACTIVE', 
          stamp: updatedStamp 
        });
        
        setDeletingCustomer(null);
        await fetchCustomersFromDatabase();
    } catch (error) { console.error("Soft delete failed:", error); }
  }

  const handleAddCustomer = async (payload) => {
    const now = new Date();
    const userPrefix = actualEmail.split('@')[0].substring(0, 3);
    const initialStamp = `${now.getMonth()+1}/${now.getDate()}:${now.toLocaleTimeString('en-GB', {hour12:false})}:C:${userPrefix}:${userRole[0]}:Record Created:`;
    await customerService.addCustomer({ ...payload, stamp: initialStamp, record_status: 'ACTIVE' });
    await fetchCustomersFromDatabase();
  }

  return (
    <>
      <style>{`
        .customer-list-page { height: 100vh; display: flex; flex-direction: column; padding: 25px; background: #020617; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .table-frame { flex: 1; background: #0b1224; border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
        .scroll-container { flex: 1; overflow: auto; }
        .c-table { width: 100%; border-collapse: collapse; min-width: 1050px; }
        .c-table th { padding: 14px 16px; text-align: left; font-size: 10px; color: white; text-transform: uppercase; font-weight: 850; border-bottom: 1px solid rgba(255,255,255,0.05); sticky; top: 0; background: #111a2e; }
        .c-table td { padding: 14px 16px; font-size: 12.5px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .action-container { display: flex; justify-content: center; gap: 14px; }
        .history-btn { background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 700; }
        .log-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .log-modal { background: #0b1224; border: 1px solid #1e293b; width: 400px; height: 550px; border-radius: 20px; padding: 24px; position: relative; }
      `}</style>

      <div className="customer-list-page">
        <header className="page-header">
          <div>
            <h1 style={{color:'white', margin: 0, fontSize: '20px', fontWeight: 800}}>Customer Directory</h1>
            <p style={{color:'#475569', fontSize:'11px'}}>{filteredCustomers.length} Active Records</p>
          </div>
          <div style={{display:'flex', gap:'12px'}}>
             <div style={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '0 12px', display: 'flex', alignItems: 'center'}}>
                <Search size={14} color="#475569" />
                <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{background:'none', border:'none', color:'white', padding:'8px', outline:'none', fontSize:'12px'}} />
             </div>
             {canRecoverDeletedRecords && (
               <button onClick={() => navigate('/deleted-customers')} style={{background: 'transparent', border: '1px solid #16a34a', color: '#4ade80', padding: '8px 16px', borderRadius: '8px', cursor:'pointer', fontSize:'11px', fontWeight: '800'}}>RECOVER DELETED</button>
             )}
             {canAddCustomer && (
                <button onClick={() => setIsAddModalOpen(true)} style={{background: '#2563eb', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '11px'}}>+ ADD CUSTOMER</button>
             )}
          </div>
        </header>

        <div className="table-frame">
          <div className="scroll-container">
            <table className="c-table">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>ID</th>
                  <th style={{width: '250px'}}>Name</th>
                  <th style={{width: '80px', textAlign: 'center'}}>Pay</th>
                  <th>Address</th>
                  <th style={{width: '120px'}}>Status</th>
                  {canSeeAuditHistory && <th style={{width: '100px', textAlign: 'center'}}>STAMP</th>}
                  <th style={{width: '130px', textAlign: 'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin mx-auto" color="#38bdf8"/></td></tr>
                ) : filteredCustomers.map((customer) => (
                  <tr key={customer.custno} onClick={() => setSelectedRowId(customer.custno)} style={{background: selectedRowId === customer.custno ? 'rgba(56, 189, 248, 0.08)' : 'transparent'}}>
                    <td style={{fontFamily:'monospace', color: '#475569'}}>{customer.custno}</td>
                    <td style={{color: 'white', fontWeight: '800'}}>{customer.custname}</td>
                    <td style={{textAlign: 'center', fontWeight:'900', color: '#64748b'}}>{customer.payterm}</td>
                    <td>{customer.address}</td>
                    <td>
                      <div style={{color:'#22c55e', fontSize:'11px', fontWeight:'850', display:'flex', alignItems:'center', gap:'5px'}}>
                        <UserCheck size={14}/> {customer.record_status}
                      </div>
                    </td>
                    
                    {canSeeAuditHistory && (
                      <td style={{textAlign: 'center'}} onClick={(e) => e.stopPropagation()}>
                        <button className="history-btn" onClick={(e) => handleHistoryClick(e, customer.stamp)}>view</button>
                      </td>
                    )}

                    <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-container">
                          <button onClick={() => navigate(`/customers/${customer.custno}`)} style={{background:'none', border:'none', color:'#475569', cursor:'pointer'}}><Eye size={15}/></button>
                          {canEditCustomer && (
                            <button onClick={() => setEditingCustomer(customer)} style={{background:'none', border:'none', color:'#475569', cursor:'pointer'}}><Edit size={15}/></button>
                          )}
                          {canDeleteCustomer && (
                            <button 
                              onClick={() => setDeletingCustomer(customer)} 
                              style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}
                            >
                              <Trash2 size={15}/>
                            </button>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditCustomerModal isOpen={Boolean(editingCustomer)} customer={editingCustomer} onClose={() => setEditingCustomer(null)} onSubmit={handleUpdateCustomer} />
      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddCustomer} />
      <SoftDeleteConfirmDialog 
        isOpen={Boolean(deletingCustomer)} 
        customer={deletingCustomer} 
        onClose={() => setDeletingCustomer(null)} 
        onConfirm={() => handleSoftDeleteCustomer(deletingCustomer)} 
      />

      {/* Audit Log Modal (simplified) */}
      {logModal.isOpen && (
        <div className="log-overlay" onClick={() => setLogModal({ ...logModal, isOpen: false })}>
          <div className="log-modal" onClick={e => e.stopPropagation()}>
             <h3 style={{color:'white', fontSize:'16px', fontWeight: 850}}>Audit Stack</h3>
             <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '400px'}}>
                {logModal.history.map((h, i) => (
                  <div key={i} style={{background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #38bdf8'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#38bdf8'}}>
                      <span>{h.actionType}</span>
                      <span>{h.displayDate} {h.militaryTime}</span>
                    </div>
                    <div style={{color: 'white', fontWeight: '700', fontSize: '12px', marginTop: '4px'}}>{h.modificationDescription}</div>
                    <div style={{fontSize: '10px', color: '#64748b'}}>by {h.userName}</div>
                  </div>
                ))}
             </div>
             <button onClick={() => setLogModal({...logModal, isOpen: false})} style={{marginTop: '20px', width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}

export default CustomerListPage;