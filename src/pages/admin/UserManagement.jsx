import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  Lock,
  Power,
  Search,
  ShieldCheck,
  UserCog,
  XCircle,
} from 'lucide-react'
import FilterDropdown from '../../components/shared/FilterDropdown'
import { logAuditActivity } from '../../services/auditLogService'
import { getUsers, activateUser, deactivateUser } from '../../services/adminApi'

function normalizeStatus(status) {
  return String(status || '').toUpperCase()
}

function getStatusTone(status) {
  return normalizeStatus(status) === 'ACTIVE' ? 'active' : 'inactive'
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [actionUserId, setActionUserId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('success')

  // PR-01: Fetch Users using the Service Layer
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getUsers();
      setUsers(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Search Logic
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        [
          user.userId,
          user.full_name,
          user.email,
          user.user_type,
          user.record_status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      const matchesRole = roleFilter === 'ALL' || user.user_type === roleFilter
      const matchesStatus = statusFilter === 'ALL' || normalizeStatus(user.record_status) === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, search, statusFilter, users])

  // Stats Logic
  const stats = useMemo(() => {
    const active = users.filter((user) => normalizeStatus(user.record_status) === 'ACTIVE').length
    const inactive = users.filter((user) => normalizeStatus(user.record_status) !== 'ACTIVE').length
    const protectedCount = users.filter((user) => user.user_type === 'SUPERADMIN').length

    return { active, inactive, protectedCount, total: users.length }
  }, [users])

  // PR-01: Update User Status (Activate/Deactivate)
  const updateUserStatus = async (user, nextStatus) => {
    // Safety check: Block SuperAdmin modification at UI level
    if (user.user_type === 'SUPERADMIN') {
      setError("SUPERADMIN accounts are protected and cannot be modified.")
      return
    }

    try {
      setActionUserId(user.userId)
      setError('')
      setNotice('')

      if (nextStatus === 'ACTIVE') {
        await activateUser(user.userId)
      } else {
        await deactivateUser(user.userId)
      }

      // Update local state instead of full re-fetch for better UX
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.userId === user.userId
            ? { ...currentUser, record_status: nextStatus }
            : currentUser
        )
      )
      await logAuditActivity({
        action: `${nextStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'} user account`,
        entityType: 'user',
        entityId: user.userId,
        metadata: { email: user.email, userType: user.user_type },
      })
      setNoticeTone(nextStatus === 'ACTIVE' ? 'success' : 'warning')
      setNotice(`${user.full_name || user.email} is now ${nextStatus.toLowerCase()}.`)
    } catch (err) {
      setError(err.message || 'Update failed: You may not have permission.')
    } finally {
      setActionUserId(null)
    }
  }

  return (
    <>
      <style>{`
        @keyframes adminPageIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-users-page {
          animation: adminPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: 100%;
          padding: 20px;
        }

        .admin-users-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .admin-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(147, 197, 253, 0.18);
          box-shadow: 0 8px 24px rgba(30, 64, 175, 0.18);
        }

        .admin-title {
          margin: 0;
          color: rgba(245, 250, 255, 0.96);
          font-size: 20px;
          font-weight: 850;
          line-height: 1;
        }

        .admin-subtitle {
          margin: 6px 0 0;
          color: rgba(180, 210, 255, 0.38);
          font-size: 12.5px;
        }

        .admin-search {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 280px;
          background: rgba(100, 160, 255, 0.04);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 10px;
          padding: 8px 12px;
        }

        .admin-search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: rgba(220, 235, 255, 0.86);
          font-size: 12.5px;
        }

        .admin-search input::placeholder {
          color: rgba(180, 210, 255, 0.24);
        }

        .admin-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .admin-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .admin-stat-card, .admin-table-card {
          background: rgba(8, 18, 40, 0.62);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 16px;
        }

        .admin-stat-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
        }

        .admin-stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(147, 197, 253, 0.95);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(147, 197, 253, 0.16);
        }

        .admin-stat-label {
          display: block;
          color: rgba(180, 210, 255, 0.34);
          font-size: 9px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .admin-stat-value {
          color: rgba(245, 250, 255, 0.94);
          font-size: 18px;
          font-weight: 850;
        }

        .admin-feedback {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 12.5px;
        }

        .admin-feedback.error {
          border: 1px solid rgba(248, 113, 113, 0.2);
          background: rgba(239, 68, 68, 0.08);
          color: rgba(252, 165, 165, 0.95);
        }

        .admin-feedback.success {
          border: 1px solid rgba(34, 197, 94, 0.18);
          background: rgba(34, 197, 94, 0.08);
          color: rgba(134, 239, 172, 0.95);
        }

        .admin-feedback.warning {
          border: 1px solid rgba(251, 146, 60, 0.22);
          background: rgba(249, 115, 22, 0.1);
          color: rgba(253, 186, 116, 0.96);
        }

        .admin-table-card {
          overflow: hidden;
        }

        .admin-users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-users-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          color: rgba(180, 210, 255, 0.38);
          background: rgba(100, 160, 255, 0.03);
          border-bottom: 1px solid rgba(100, 160, 255, 0.08);
          text-transform: uppercase;
        }

        .admin-users-table td {
          padding: 13px 16px;
          font-size: 12.5px;
          border-bottom: 1px solid rgba(100, 160, 255, 0.05);
        }

        .admin-users-table th.role-col,
        .admin-users-table td.role-col,
        .admin-users-table th.status-col,
        .admin-users-table td.status-col,
        .admin-users-table th.actions-col,
        .admin-users-table td.actions-col {
          text-align: center;
        }

        .admin-users-table td.role-col,
        .admin-users-table td.status-col,
        .admin-users-table td.actions-col {
          white-space: nowrap;
        }

        .admin-users-table tbody tr:last-child td {
          border-bottom: none;
        }

        .admin-users-table tbody tr:hover {
          background: rgba(100, 160, 255, 0.06);
        }

        .admin-user-id {
          max-width: 180px;
          color: rgba(180, 210, 255, 0.46) !important;
          font-family: monospace;
          font-size: 11.5px !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-user-name {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .admin-user-name strong {
          color: rgba(235, 245, 255, 0.92);
          font-size: 13px;
        }

        .admin-user-name span {
          color: rgba(180, 210, 255, 0.38);
          font-size: 11.5px;
        }

        .admin-role-badge,
        .admin-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 106px;
          min-height: 26px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .admin-role-badge.superadmin { color: #fcd34d; background: rgba(245, 158, 11, 0.1); }
        .admin-role-badge.admin { color: #93c5fd; background: rgba(59, 130, 246, 0.1); }
        .admin-role-badge.user { color: #c4b5fd; background: rgba(139, 92, 246, 0.1); }

        .admin-role-badge.admin {
          color: rgba(147, 197, 253, 0.96);
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(147, 197, 253, 0.18);
        }

        .admin-role-badge.user {
          color: rgba(196, 181, 253, 0.96);
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(196, 181, 253, 0.18);
        }

        .admin-status-badge.active {
          color: rgba(134, 239, 172, 0.95);
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.18);
        }

        .admin-status-badge.inactive {
          color: rgba(252, 165, 165, 0.95);
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(248, 113, 113, 0.18);
        }

        .admin-action-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .admin-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
          border: 1px solid transparent;
        }

        .admin-action-btn.activate {
          color: #86efac;
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.18);
        }

        .admin-action-btn.deactivate {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(248, 113, 113, 0.18);
        }

        .admin-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .admin-protected-note {
          color: #fcd34d;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          color: rgba(252, 211, 77, 0.76);
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
        }

        .admin-empty {
          padding: 48px 16px;
          text-align: center;
          color: rgba(180, 210, 255, 0.32);
          font-size: 13px;
        }

        @media (max-width: 980px) {
          .admin-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .admin-search {
            min-width: 100%;
          }

          .admin-filters {
            width: 100%;
            justify-content: stretch;
          }

          .admin-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-users-page">
        <div className="admin-users-header">
          <div className="admin-title-wrap">
            <div className="admin-title-icon"><UserCog size={20} /></div>
            <div>
              <h1 className="admin-title">User Management</h1>
              <p className="admin-subtitle">Securely manage CMS access and account status.</p>
            </div>
          </div>

          <div className="admin-filters">
            <div className="admin-search">
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users, emails, roles..."
              />
            </div>
            <FilterDropdown
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'ALL', label: 'All Roles' },
                { value: 'USER', label: 'USER' },
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'SUPERADMIN', label: 'SUPERADMIN' },
              ]}
            />
            <FilterDropdown
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

        <section className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><UserCog size={17} /></div>
            <div><span className="admin-stat-label">Total</span><span className="admin-stat-value">{stats.total}</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><CheckCircle2 size={17} /></div>
            <div><span className="admin-stat-label">Active</span><span className="admin-stat-value">{stats.active}</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><XCircle size={17} /></div>
            <div><span className="admin-stat-label">Inactive</span><span className="admin-stat-value">{stats.inactive}</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><ShieldCheck size={17} /></div>
            <div><span className="admin-stat-label">Protected</span><span className="admin-stat-value">{stats.protectedCount}</span></div>
          </div>
        </section>

        {error && <div className="admin-feedback error">{error}</div>}
        {notice && <div className={`admin-feedback ${noticeTone}`}>{notice}</div>}

        <section className="admin-table-card">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-400" size={32} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Username</th>
                    <th className="role-col">User Type</th>
                    <th className="status-col">Status</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSuper = user.user_type === 'SUPERADMIN'
                    const isActive = normalizeStatus(user.record_status) === 'ACTIVE'
                    const isUpdating = actionUserId === user.userId

                    return (
                      <tr key={user.userId}>
                        <td>
                          <div className="flex flex-col">
                            <strong className="text-white">{user.full_name || 'No Name'}</strong>
                            <span className="text-blue-200/40 text-xs">{user.email}</span>
                          </div>
                        </td>
                        <td className="role-col">
                          <span className={`admin-role-badge ${String(user.user_type).toLowerCase()}`}> 
                            {isSuper ? <ShieldCheck size={12} /> : <UserCog size={12} />}
                            {user.user_type || 'USER'}
                          </span>
                        </td>
                        <td className="status-col">
                          <span className={`admin-status-badge ${normalizeStatus(user.record_status).toLowerCase()}`}> 
                            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {normalizeStatus(user.record_status) || 'INACTIVE'}
                          </span>
                        </td>
                        <td className="actions-col">
                          {isSuper ? (
                            <span
                              className="admin-protected-note"
                              title="SUPERADMIN accounts cannot be modified"
                            >
                              <Lock size={13} />
                              SUPERADMIN accounts cannot be modified
                            </span>

                          ) : (
                            <div className="flex gap-2">
                              <button
                                className="admin-action-btn activate"
                                disabled={isActive || isUpdating}
                                onClick={() => updateUserStatus(user, 'ACTIVE')}
                              >
                                {isUpdating && actionUserId === user.userId ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                                Activate
                              </button>
                              <button
                                className="admin-action-btn deactivate"
                                disabled={!isActive || isUpdating}
                                onClick={() => updateUserStatus(user, 'INACTIVE')}
                              >
                                {isUpdating && actionUserId === user.userId ? <Loader2 className="animate-spin" size={12} /> : <Power size={12} />}
                                Deactivate
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export default UserManagement
