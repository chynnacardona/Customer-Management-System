import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Edit, UserCheck, Loader2, X, ChevronLeft, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import AddCustomerModal from '../../components/shared/AddCustomerModal'
import EditCustomerModal from '../../components/shared/EditCustomerModal'
import SoftDeleteConfirmDialog from '../../components/shared/SoftDeleteConfirmDialog'
import FilterDropdown from '../../components/shared/FilterDropdown'
import { customerService } from '../../services/customerService'
import { useAuth } from '../../context/useAuth' 
import { useRights } from '../../context/useRights'
import {
  canAddCustomer as canAddCustomerByRights,
  canEditCustomer as canEditCustomerByRights,
} from '../../utils/accessRules'
import {
  appendCustomerStampEntry,
  buildActorSnapshot,
  createCustomerStampEntry,
  decodeStampPayload,
  resolveStampActor,
} from '../../utils/stampAudit'

function CustomerListPage() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth() 
  const { rights, userType: rightsUserType } = useRights()

  // Identification and Permissions logic
  const userRole = (rightsUserType ?? authUser?.user_type ?? 'USER').toUpperCase()
  const actorSnapshot = useMemo(
    () => buildActorSnapshot({ authUser, userRole }),
    [authUser, userRole]
  )

  // Strict Role Checks
  const isSuperAdmin = userRole === 'SUPERADMIN'
  const isAdmin = userRole === 'ADMIN'

  // Action Visibility Logic
  const canSeeAuditHistory = isSuperAdmin || isAdmin
  const canRecoverDeletedRecords = isSuperAdmin || isAdmin
  const canAddCustomer = canAddCustomerByRights(rights)
  const canEditCustomer = canEditCustomerByRights(rights) && (isSuperAdmin || isAdmin)
  const canDeleteCustomer = isSuperAdmin 

  // Component State
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [paytermFilter, setPaytermFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortConfig, setSortConfig] = useState({ key: 'custno', direction: 'asc' })
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [timeFilter, setTimeFilter] = useState('ALL')
  const [pageError, setPageError] = useState('')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deletingCustomer, setDeletingCustomer] = useState(null)
  const [logModal, setLogModal] = useState({ 
    isOpen: false, 
    history: [], 
    view: 'list', 
    selectedEntry: null, 
    rawStampData: '',
    customerId: null,
  });

  const fetchCustomersFromDatabase = useCallback(async () => {
    try {
      setIsLoading(true)
      setPageError('')
      const customerData = await customerService.getCustomers(userRole)
      setCustomers(customerData || [])
    } catch (error) {
      setPageError(error.message || 'Unable to load customers.')
    } finally { 
      setIsLoading(false) 
    }
  }, [userRole])

  useEffect(() => { 
    fetchCustomersFromDatabase() 
  }, [fetchCustomersFromDatabase])

  useEffect(() => {
    return customerService.subscribeToCustomerChanges(() => {
      fetchCustomersFromDatabase()
    })
  }, [fetchCustomersFromDatabase])

  const paytermOptions = useMemo(() => {
    return [...new Set(customers.map((customer) => customer.payterm).filter(Boolean))].sort()
  }, [customers])

  const statusOptions = useMemo(() => {
    return [...new Set(customers.map((customer) => String(customer.record_status || '').toUpperCase()).filter(Boolean))].sort()
  }, [customers])

  const filteredCustomers = useMemo(() => {
    const term = searchQuery.toLowerCase().trim()
    const filtered = customers.filter((customer) => {
      const status = String(customer.record_status || '').toUpperCase()
      const searchable = [
        customer.custno,
        customer.custname,
        customer.payterm,
        customer.address,
        customer.record_status,
        customer.stamp,
      ]
      const matchesSearch =
        !term ||
        searchable.some((value) => String(value || '').toLowerCase().includes(term))
      const matchesPayterm = paytermFilter === 'ALL' || customer.payterm === paytermFilter
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter

      return matchesSearch && matchesPayterm && matchesStatus
    })

    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) =>
      String(a[sortConfig.key] || '').localeCompare(String(b[sortConfig.key] || '')) * direction
    )
  }, [customers, paytermFilter, searchQuery, sortConfig, statusFilter])

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortLabel = (key, label) => {
    const active = sortConfig.key === key
    const SortIcon = sortConfig.direction === 'asc' ? ChevronUp : ChevronDown
    return (
      <>
        <span>{label}</span>
        {active && <SortIcon className="sort-side-icon" size={13} />}
      </>
    )
  }

  const buildHistoryFromStamp = useCallback(async (stampString, filterType = 'ALL') => {
    if (!stampString || stampString === '-' || stampString.trim() === '') {
      return []
    }

    const historyEntries = stampString.split(';').filter(Boolean);
    const uniqueUserPrefixes = [...new Set(historyEntries.map(entry => entry.split(':')[5]).filter(Boolean))];

    const { data: fetchedUsers } = uniqueUserPrefixes.length > 0
      ? await supabase
        .from('user')
        .select('full_name, email')
        .or(uniqueUserPrefixes.map(prefix => `email.ilike.${prefix}%`).join(','))
      : { data: [] };

    const currentTime = new Date();

    return historyEntries.map(entry => {
      const segments = entry.split(':');
      const dateSegments = segments[0].split('/');
      const entryDateObject = new Date(2026, parseInt(dateSegments[0]) - 1, parseInt(dateSegments[1]));
      const userCode = segments[5];
      const actorData = decodeStampPayload(segments[9]);
      const matchedDatabaseUser = fetchedUsers?.find(user => user.email.toLowerCase().startsWith(userCode?.toLowerCase()));
      const actor = resolveStampActor({ segments, actorData, matchedDatabaseUser })

      const rawDescription = segments[7] || '';
      const legacyMapping = { 'N': 'Name Update', 'A': 'Address Update', 'P': 'Pay Term Update', 'C': 'Record Creation', 'G': 'General Update' };
      const finalDescription = legacyMapping[rawDescription] || rawDescription || 'Record Update';

      return {
        displayDate: `${segments[0]}/26`,
        entryDateObject: entryDateObject,
        militaryTime: segments.slice(1, 4).join(':'),
        actionType: segments[4] === 'C' ? 'Created' : 'Updated',
        userName: actor.name,
        userEmail: actor.email,
        systemRole: actor.role,
        modificationDescription: finalDescription,
        previousRowSnapshot: decodeStampPayload(segments[8])
      };
    }).filter(item => {
      if (filterType === 'ALL') return true;
      const diffDays = (currentTime - item.entryDateObject) / (1000 * 60 * 60 * 24);
      if (filterType === 'WEEK') return diffDays <= 7;
      if (filterType === 'MONTH') return diffDays <= 30;
      if (filterType === 'YEAR') return diffDays <= 365;
      return true;
    });
  }, [])

  const handleHistoryClick = async (event, stampString, filterType = 'ALL', customerId = null) => {
    if (event) event.stopPropagation();
    
    if (!stampString || stampString === '-' || stampString.trim() === '') {
      setLogModal({ isOpen: true, history: [], view: 'list', selectedEntry: null, rawStampData: stampString, customerId });
      return;
    }

    try {
      const processedHistory = await buildHistoryFromStamp(stampString, filterType);
      setLogModal({ isOpen: true, history: processedHistory, view: 'list', selectedEntry: null, rawStampData: stampString, customerId });
      setTimeFilter(filterType);
    } catch {
      setLogModal({ isOpen: true, history: [], view: 'list', selectedEntry: null, rawStampData: stampString, customerId });
    }
  };

  useEffect(() => {
    if (!logModal.isOpen || !logModal.customerId) return

    const currentCustomer = customers.find((customer) => customer.custno === logModal.customerId)
    if (!currentCustomer || currentCustomer.stamp === logModal.rawStampData) return

    let cancelled = false
    buildHistoryFromStamp(currentCustomer.stamp, timeFilter).then((history) => {
      if (!cancelled) {
        setLogModal((current) => ({
          ...current,
          history,
          rawStampData: currentCustomer.stamp,
          selectedEntry: null,
          view: 'list',
        }))
      }
    })

    return () => {
      cancelled = true
    }
  }, [buildHistoryFromStamp, customers, logModal.customerId, logModal.isOpen, logModal.rawStampData, timeFilter])

  const handleUpdateCustomer = async (customerNumber, payload) => {
    try {
      const currentCustomerState = customers.find(customer => customer.custno === customerNumber);
      
      let detectedChanges = [];
      if (currentCustomerState.custname !== payload.custname) detectedChanges.push('Name');
      if (currentCustomerState.address !== payload.address) detectedChanges.push('Address');
      if (currentCustomerState.payterm !== payload.payterm) detectedChanges.push('Pay Term');
      
      const changeDescription = detectedChanges.length > 0 
        ? `Modified ${detectedChanges.join(', ')}` 
        : 'General Update';

      const { stamp: _, ...dataToSnapshot } = currentCustomerState;
      const newHistoryEntry = createCustomerStampEntry({
        actionType: 'U',
        actor: actorSnapshot,
        description: changeDescription,
        previousSnapshot: dataToSnapshot,
      })
      const updatedStampString = appendCustomerStampEntry(currentCustomerState?.stamp, newHistoryEntry)

      await customerService.updateCustomer(customerNumber, { ...payload, stamp: updatedStampString });
      await fetchCustomersFromDatabase();
      setEditingCustomer(null);
    } catch (error) {
      setPageError(error.message || 'Unable to update customer.')
    }
  }

  const handleAddCustomer = async (payload) => {
    const initialStamp = createCustomerStampEntry({
      actionType: 'C',
      actor: actorSnapshot,
      description: 'Record Created',
    })
    await customerService.addCustomer({ ...payload, stamp: initialStamp });
    await fetchCustomersFromDatabase();
  }

  const handleSoftDeleteCustomer = async (customer) => {
    const { stamp: _, ...dataToSnapshot } = customer
    const deleteStampEntry = createCustomerStampEntry({
      actionType: 'U',
      actor: actorSnapshot,
      description: 'Soft Deleted',
      previousSnapshot: dataToSnapshot,
    })
    const updatedStampString = appendCustomerStampEntry(customer.stamp, deleteStampEntry)

    await customerService.softDeleteCustomer(customer.custno, updatedStampString)
    await fetchCustomersFromDatabase()
  }

  return (
    <>
      <style>{`
        @keyframes customerPageIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes customerCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .customer-list-page { animation: customerPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 18px; overflow: hidden; }
        .page-header { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .customer-title { color: white; margin: 0; font-size: 20px; line-height: 1; font-weight: 800; }
        .customer-subtitle { color: rgba(180, 210, 255, 0.35); font-size: 12px; margin: 6px 0 0; }
        .customer-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: nowrap; max-width: none; }
        .customer-toolbar .filter-dropdown { flex: 0 0 148px; }
        .customer-search { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; min-width: 240px; max-width: 320px; background: rgba(126, 184, 255, 0.04); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 10px; padding: 8px 12px; transition: all 0.2s ease; }
        .customer-search:focus-within { border-color: rgba(56, 189, 248, 0.34); background: rgba(126, 184, 255, 0.07); box-shadow: 0 0 0 3px rgba(46, 134, 245, 0.1); }
        .customer-search input { width: 100%; border: none; outline: none; background: transparent; color: rgba(220, 235, 255, 0.86); font-size: 12.5px; }
        .customer-search input::placeholder { color: rgba(180, 210, 255, 0.28); }
        .customer-btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 0 16px;
          cursor: pointer;
          font-size: 11px;
          line-height: 1.15;
          font-weight: 850;
          text-align: center;
          white-space: normal;
          border: 1px solid transparent;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .customer-btn:hover { box-shadow: 0 10px 24px rgba(37, 99, 235, 0.16); }
        .customer-btn.recover { background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.22); color: rgba(134, 239, 172, 0.95); }
        .customer-btn.add { background: linear-gradient(135deg, #2563eb, #38bdf8); color: white; box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22); }
        .customer-error { padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(248, 113, 113, 0.2); background: rgba(239, 68, 68, 0.08); color: rgba(252, 165, 165, 0.95); font-size: 12.5px; }
        .table-frame { flex: 1; min-height: 0; display: flex; flex-direction: column; background: linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 44%), linear-gradient(145deg, rgba(8, 18, 40, 0.84), rgba(3, 9, 24, 0.9)); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.045); animation: customerCardIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .scroll-container { flex: 1; min-height: 0; overflow-y: auto; overflow-x: auto; scrollbar-width: thin; scrollbar-color: rgba(126, 184, 255, 0.45) rgba(8, 18, 40, 0.28); }
        
        .c-table { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 1080px; }
        .c-table thead { position: sticky; top: 0; z-index: 10; background: rgba(6, 16, 36, 0.96); backdrop-filter: blur(12px); }
        .c-table th { padding: 12px 16px; text-align: center; font-size: 10px; color: rgba(180, 210, 255, 0.35) !important; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800; border-bottom: 1px solid rgba(100, 160, 255, 0.08); }
        .c-table td { padding: 13px 16px; text-align: center; font-size: 12.5px; color: rgba(180, 210, 255, 0.68); border-bottom: 1px solid rgba(100, 160, 255, 0.05); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .c-table tbody tr { transition: background 0.18s ease, box-shadow 0.18s ease; cursor: pointer; }
        .c-table tbody tr:hover { background: rgba(126, 184, 255, 0.07); box-shadow: inset 3px 0 0 rgba(56, 189, 248, 0.75); }
        .customer-sort-btn { border: 0; padding: 0; background: transparent; color: inherit; font: inherit; text-transform: inherit; letter-spacing: inherit; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
        .customer-sort-btn:hover { color: rgba(224, 242, 254, 0.96); }
        .sort-side-icon { color: rgba(56, 189, 248, 0.95); flex-shrink: 0; stroke-width: 2.8; }
        
        /* Width adjustments and centering */
        .col-id { width: 96px; } 
        .col-name { width: 220px; } 
        .col-pay { width: 60px; text-align: center; } 
        .col-status { width: 120px; text-align: center; } 
        .col-hist { width: 120px; text-align: center; }
        .col-actions { width: 132px; text-align: center; }
        .col-status-cell,
        .col-hist,
        .col-actions { text-align: center; }
        .id-cell { overflow: visible !important; text-overflow: clip !important; letter-spacing: 0.02em; }

        .action-container { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 12px; 
            width: 100%; 
            padding-right: 0;
        }

        .status-pill { display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: rgba(34, 197, 94, 0.95); font-size: 11px; font-weight: 850; min-width: 82px; }
        .icon-action { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: rgba(180, 210, 255, 0.34); cursor: pointer; transition: all 0.2s ease; }
        .icon-action:hover { background: rgba(126, 184, 255, 0.08); border-color: rgba(126, 184, 255, 0.14); color: rgba(220, 235, 255, 0.88); transform: translateY(-1px); }
        .icon-action.danger { color: rgba(248, 113, 113, 0.82); }
        .icon-action.danger:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(248, 113, 113, 0.2); color: rgba(252, 165, 165, 0.98); }
        .stamp-cell { text-align: center; }
        .history-btn {
          min-width: 58px;
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid rgba(56, 189, 248, 0.18);
          background: rgba(56, 189, 248, 0.08);
          color: rgba(125, 211, 252, 0.92);
          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
          line-height: 1;
          letter-spacing: 0;
          text-transform: none;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .history-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(56, 189, 248, 0.32);
          background: rgba(56, 189, 248, 0.12);
          color: rgba(224, 242, 254, 0.98);
        }
        @keyframes logOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes logModalIn { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes logItemIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .log-overlay {
          position: fixed;
          inset: 0;
          background: rgba(1, 6, 18, 0.78);
          backdrop-filter: blur(10px) saturate(135%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 18px;
          animation: logOverlayIn 0.2s ease forwards;
        }
        .log-modal {
          width: min(460px, 100%);
          max-height: min(680px, calc(100vh - 36px));
          min-height: 560px;
          background: linear-gradient(180deg, rgba(126, 184, 255, 0.045), transparent 44%), rgba(8, 18, 40, 0.96);
          border: 1px solid rgba(126, 184, 255, 0.16);
          border-radius: 20px;
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255,255,255,0.06);
          padding: 22px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          animation: logModalIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .log-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 10;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(180, 210, 255, 0.42);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .log-close-btn:hover {
          transform: translateY(-1px);
          background: rgba(248, 113, 113, 0.1);
          border-color: rgba(248, 113, 113, 0.18);
          color: rgba(252, 165, 165, 0.96);
        }
        .log-title { color: rgba(245, 250, 255, 0.96); font-size: 17px; line-height: 1; margin: 0; font-weight: 850; }
        .log-subtitle { color: rgba(180, 210, 255, 0.42); font-size: 12px; margin: 7px 0 16px; }
        .filter-bar {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 14px;
          padding: 4px;
          border: 1px solid rgba(126, 184, 255, 0.1);
          border-radius: 12px;
          background: rgba(126, 184, 255, 0.035);
        }
        .filter-btn {
          min-height: 30px;
          border: 1px solid transparent;
          color: rgba(180, 210, 255, 0.48);
          font-family: inherit;
          font-size: 10.5px;
          font-weight: 850;
          cursor: pointer;
          padding: 0 8px;
          border-radius: 9px;
          background: transparent;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .filter-btn:hover {
          transform: translateY(-1px);
          color: rgba(220, 235, 255, 0.88);
          background: rgba(126, 184, 255, 0.07);
        }
        .filter-btn.active {
          color: rgba(224, 242, 254, 0.98);
          background: rgba(56, 189, 248, 0.13);
          border-color: rgba(56, 189, 248, 0.2);
          box-shadow: 0 8px 18px rgba(56, 189, 248, 0.08);
        }
        .log-stack { flex: 1; min-height: 0; overflow-y: auto; padding: 2px 4px 2px 0; display: flex; flex-direction: column; gap: 11px; }
        .log-stack::-webkit-scrollbar { width: 7px; }
        .log-stack::-webkit-scrollbar-track { background: rgba(8, 18, 40, 0.35); border-radius: 999px; }
        .log-stack::-webkit-scrollbar-thumb { background: rgba(126, 184, 255, 0.25); border-radius: 999px; }
        .log-card {
          width: 100%;
          background: rgba(126, 184, 255, 0.045);
          border: 1px solid rgba(126, 184, 255, 0.08);
          padding: 14px;
          border-radius: 14px;
          text-align: left;
          cursor: pointer;
          border-left: 4px solid transparent;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          animation: logItemIn 0.26s ease both;
        }
        .log-card:hover {
          transform: translateX(3px);
          border-color: rgba(126, 184, 255, 0.2);
          background: rgba(126, 184, 255, 0.075);
          box-shadow: inset 3px 0 0 rgba(56, 189, 248, 0.62), 0 12px 24px rgba(0,0,0,0.16);
        }
        .log-card.latest {
          border-left-color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border-color: rgba(56, 189, 248, 0.18);
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.12);
        }
        .log-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .log-action-pill {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 9px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.16);
          color: rgba(125, 211, 252, 0.95);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .log-date-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
        .log-date { font-size: 11px; color: rgba(191, 219, 254, 0.9); font-weight: 850; }
        .log-time { font-size: 10.5px; color: rgba(180, 210, 255, 0.36); font-weight: 750; }
        .log-description { color: rgba(245, 250, 255, 0.94); font-size: 13px; margin-top: 10px; font-weight: 750; }
        .log-actor { color: rgba(180, 210, 255, 0.46); font-size: 11.5px; margin-top: 4px; }
        .log-empty {
          flex: 1;
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(180, 210, 255, 0.36);
          font-size: 12.5px;
          border: 1px dashed rgba(126, 184, 255, 0.12);
          border-radius: 14px;
          background: rgba(126, 184, 255, 0.025);
        }
        .detail-back-btn {
          width: fit-content;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(56, 189, 248, 0.12);
          background: rgba(56, 189, 248, 0.06);
          color: rgba(125, 211, 252, 0.95);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          margin-bottom: 18px;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        }
        .detail-back-btn:hover {
          transform: translateY(-1px);
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.22);
        }
        .detail-row { display: grid; grid-template-columns: 124px 1fr; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(126, 184, 255, 0.08); }
        .detail-label { color: rgba(180, 210, 255, 0.34); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 850; }
        .detail-val { color: rgba(245, 250, 255, 0.94); font-size: 12.5px; font-weight: 700; text-align: right; overflow-wrap: anywhere; }
        .detail-val.accent { color: rgba(125, 211, 252, 0.98); }
        .detail-val.warning { color: rgba(250, 204, 21, 0.92); }
        .snapshot-panel { margin-top: 18px; border-top: 1px solid rgba(126, 184, 255, 0.1); padding-top: 14px; overflow-y: auto; }
        .snapshot-title { color: rgba(125, 211, 252, 0.96); font-size: 10.5px; font-weight: 900; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.08em; }
        .snapshot-grid { display: grid; grid-template-columns: 112px 1fr; gap: 8px; background: rgba(126, 184, 255, 0.045); border: 1px solid rgba(126, 184, 255, 0.09); padding: 12px; border-radius: 12px; }
        .snapshot-key { color: rgba(180, 210, 255, 0.34); font-size: 10px; font-weight: 850; }
        .snapshot-value { color: rgba(220, 235, 255, 0.76); font-size: 11.5px; text-align: right; word-break: break-word; }
        @media (max-width: 1180px) {
          .customer-toolbar { width: 100%; flex-wrap: wrap; justify-content: stretch; }
          .customer-search { max-width: none; }
          .customer-toolbar .filter-dropdown { flex: 1 1 148px; }
        }
      `}</style>

      <div className="customer-list-page">
        <header className="page-header">
          <div>
            <h1 className="customer-title">Customer Directory</h1>
            <p className="customer-subtitle">{filteredCustomers.length} total entries</p>
          </div>
          <div className="customer-toolbar">
             <div className="customer-search">
                <Search size={14} color="rgba(180, 210, 255, 0.28)" />
                <input placeholder="Search ID, name, pay, address..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
             </div>
             <FilterDropdown
               label="Pay Term"
               value={paytermFilter}
               onChange={setPaytermFilter}
               options={[
                 { value: 'ALL', label: 'All Pay Terms' },
                 ...paytermOptions.map((payterm) => ({ value: payterm, label: payterm })),
               ]}
             />
             <FilterDropdown
               label="Status"
               value={statusFilter}
               onChange={setStatusFilter}
               options={[
                 { value: 'ALL', label: 'All Status' },
                 ...statusOptions.map((status) => ({ value: status, label: status })),
               ]}
             />
             {canRecoverDeletedRecords && (
               <button className="customer-btn recover" onClick={() => navigate('/deleted-customers')}>RECOVER DELETED</button>
             )}
             {canAddCustomer && (
                <button className="customer-btn add" onClick={() => setIsAddModalOpen(true)}>+ ADD CUSTOMER</button>
             )}
          </div>
        </header>

        {pageError && <div className="customer-error">{pageError}</div>}

        <div className="table-frame">
          <div className="scroll-container">
            <table className="c-table">
              <thead>
                <tr>
                  <th className="col-id"><button type="button" className="customer-sort-btn" onClick={() => handleSort('custno')}>{sortLabel('custno', 'ID')}</button></th>
                  <th className="col-name"><button type="button" className="customer-sort-btn" onClick={() => handleSort('custname')}>{sortLabel('custname', 'Name')}</button></th>
                  <th className="col-pay"><button type="button" className="customer-sort-btn" onClick={() => handleSort('payterm')}>{sortLabel('payterm', 'Pay')}</button></th>
                  <th><button type="button" className="customer-sort-btn" onClick={() => handleSort('address')}>{sortLabel('address', 'Address')}</button></th>
                  <th className="col-status"><button type="button" className="customer-sort-btn" onClick={() => handleSort('record_status')}>{sortLabel('record_status', 'Status')}</button></th>
                  {canSeeAuditHistory && <th className="col-hist" style={{textAlign:'center'}}>Stamp</th>}
                  <th className="col-actions" style={{textAlign:'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin mx-auto" color="#38bdf8"/></td></tr>
                ) : filteredCustomers.map((customer) => (
                  <tr
                    key={customer.custno}
                    onClick={() => {
                      setSelectedRowId(customer.custno)
                      navigate(`/customers/${customer.custno}`)
                    }}
                    title="Open customer details"
                    style={{background: selectedRowId === customer.custno ? 'rgba(56, 189, 248, 0.08)' : 'transparent'}}
                  >
                    <td className="id-cell" style={{fontFamily:'monospace', color: '#475569', textAlign: 'center'}}>{customer.custno}</td>
                    <td style={{color: 'white', fontWeight: '800'}}>{customer.custname}</td>
                    <td style={{textAlign:'center', fontWeight:'900', color: '#64748b'}}>{customer.payterm}</td>
                    <td>{customer.address}</td>
                    <td className="col-status-cell"><div className="status-pill"><UserCheck size={14}/> {customer.record_status}</div></td>
                    
                    {canSeeAuditHistory && (
                      <td className="col-hist stamp-cell" onClick={(event) => event.stopPropagation()}>
                        <button className="history-btn" onClick={(event) => handleHistoryClick(event, customer.stamp, 'ALL', customer.custno)}>View</button>
                      </td>
                    )}

                    <td className="col-actions" onClick={(event) => event.stopPropagation()}>
                        <div className="action-container">
                          {/* Edit Button - SuperAdmin/Admin */}
                          {canEditCustomer && (
                            <button className="icon-action" onClick={() => setEditingCustomer(customer)} title="Edit customer"><Edit size={15}/></button>
                          )}

                          {/* Delete Button - STRICTLY SuperAdmin Only */}
                          {canDeleteCustomer && (
                            <button className="icon-action danger" onClick={() => setDeletingCustomer(customer)} title="Deactivate customer"><Trash2 size={15}/></button>
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

      {logModal.isOpen && (
        <div className="log-overlay" onClick={() => setLogModal({ ...logModal, isOpen: false })}>
          <div className="log-modal" onClick={event => event.stopPropagation()}>
            <button
              type="button"
              className="log-close-btn"
              onClick={() => setLogModal({ ...logModal, isOpen: false })}
              aria-label="Close audit stack"
            >
              <X size={17} />
            </button>

            {logModal.view === 'list' ? (
              <>
                <h3 className="log-title">Audit Stack</h3>
                <p className="log-subtitle">Review recent customer changes and previous row snapshots.</p>
                <div className="filter-bar">
                  {['ALL', 'WEEK', 'MONTH', 'YEAR'].map(option => (
                    <button key={option} className={`filter-btn ${timeFilter === option ? 'active' : ''}`} onClick={() => handleHistoryClick(null, logModal.rawStampData, option, logModal.customerId)}>{option}</button>
                  ))}
                </div>
                <div className="log-stack">
                  {logModal.history.length > 0 ? logModal.history.map((item, index) => (
                    <div key={index} className={`log-card ${index === 0 ? 'latest' : ''}`} onClick={() => setLogModal({...logModal, view: 'detail', selectedEntry: item})}>
                      <div className="log-card-top">
                        <span className="log-action-pill">{item.actionType.toUpperCase()}</span>
                        <div className="log-date-stack">
                          <span className="log-date">{item.displayDate}</span>
                          <span className="log-time">{item.militaryTime}</span>
                        </div>
                      </div>
                      <div className="log-description">{item.modificationDescription}</div>
                      <div className="log-actor">by {item.userName}</div>
                    </div>
                  )) : <div className="log-empty">No audit entries found for this filter.</div>}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setLogModal({...logModal, view: 'list', selectedEntry: null})} className="detail-back-btn">
                  <ChevronLeft size={18}/> Back to History
                </button>
                <h3 className="log-title">Audit Details</h3>
                <p className="log-subtitle">Focused record of the selected customer activity.</p>
                <div className="detail-row"><span className="detail-label">Modification</span><span className="detail-val accent">{logModal.selectedEntry.modificationDescription}</span></div>
                <div className="detail-row"><span className="detail-label">Actual Name</span><span className="detail-val">{logModal.selectedEntry.userName}</span></div>
                <div className="detail-row"><span className="detail-label">Actual Email</span><span className="detail-val">{logModal.selectedEntry.userEmail}</span></div>
                <div className="detail-row"><span className="detail-label">System Role</span><span className="detail-val warning">{logModal.selectedEntry.systemRole}</span></div>
                <div className="detail-row"><span className="detail-label">Timestamp</span><span className="detail-val">{logModal.selectedEntry.displayDate} | {logModal.selectedEntry.militaryTime}</span></div>
                {logModal.selectedEntry.previousRowSnapshot && (
                  <div className="snapshot-panel">
                    <p className="snapshot-title">View Past Row</p>
                    <div className="snapshot-grid">
                      {Object.entries(logModal.selectedEntry.previousRowSnapshot).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <div className="snapshot-key">{key.toUpperCase()}</div>
                          <div className="snapshot-value">{String(value ?? '-')}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <EditCustomerModal isOpen={Boolean(editingCustomer)} customer={editingCustomer} onClose={() => setEditingCustomer(null)} onSubmit={handleUpdateCustomer} />
      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddCustomer} />
      <SoftDeleteConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        customer={deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleSoftDeleteCustomer}
      />
    </>
  )
}

export default CustomerListPage;
