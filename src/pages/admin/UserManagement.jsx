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
import { supabase } from '../../supabase/supabaseClient'

const USER_SELECT = 'userId, email, full_name, user_type, record_status'

function normalizeStatus(status) {
  return String(status || '').toUpperCase()
}

function getStatusTone(status) {
  return normalizeStatus(status) === 'ACTIVE' ? 'active' : 'inactive'
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionUserId, setActionUserId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: usersError } = await supabase
        .from('user')
        .select(USER_SELECT)
        .order('user_type', { ascending: true })
        .order('full_name', { ascending: true })

      if (usersError) throw usersError
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

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) =>
      [
        user.userId,
        user.full_name,
        user.email,
        user.user_type,
        user.record_status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [search, users])

  const stats = useMemo(() => {
    const active = users.filter((user) => normalizeStatus(user.record_status) === 'ACTIVE').length
    const inactive = users.filter((user) => normalizeStatus(user.record_status) !== 'ACTIVE').length
    const protectedCount = users.filter((user) => user.user_type === 'SUPERADMIN').length

    return { active, inactive, protectedCount, total: users.length }
  }, [users])

  const updateUserStatus = async (user, nextStatus) => {
    if (user.user_type === 'SUPERADMIN') return

    try {
      setActionUserId(user.userId)
      setError('')
      setNotice('')

      const { error: updateError } = await supabase
        .from('user')
        .update({ record_status: nextStatus })
        .eq('userId', user.userId)
        .neq('user_type', 'SUPERADMIN')

      if (updateError) throw updateError

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.userId === user.userId
            ? { ...currentUser, record_status: nextStatus }
            : currentUser
        )
      )
      setNotice(`${user.full_name || user.email} is now ${nextStatus.toLowerCase()}.`)
    } catch (err) {
      setError(err.message || 'Unable to update this user.')
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
          letter-spacing: 0;
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
          transition: all 0.2s ease;
        }

        .admin-search:focus-within {
          border-color: rgba(100, 160, 255, 0.3);
          background: rgba(100, 160, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(60, 120, 255, 0.08);
        }

        .admin-search svg {
          color: rgba(180, 210, 255, 0.28);
          flex-shrink: 0;
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

        .admin-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .admin-stat-card,
        .admin-table-card {
          background: rgba(8, 18, 40, 0.62);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .admin-stat-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          min-width: 0;
        }

        .admin-stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: rgba(147, 197, 253, 0.95);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(147, 197, 253, 0.16);
        }

        .admin-stat-label {
          display: block;
          margin-bottom: 4px;
          color: rgba(180, 210, 255, 0.34);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .admin-stat-value {
          display: block;
          color: rgba(245, 250, 255, 0.94);
          font-size: 18px;
          font-weight: 850;
          line-height: 1;
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

        .admin-table-card {
          overflow: hidden;
        }

        .admin-table-scroll {
          overflow-x: auto;
        }

        .admin-users-table {
          width: 100%;
          min-width: 880px;
          border-collapse: collapse;
        }

        .admin-users-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          color: rgba(180, 210, 255, 0.38);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          background: rgba(100, 160, 255, 0.03);
          border-bottom: 1px solid rgba(100, 160, 255, 0.08);
        }

        .admin-users-table td {
          padding: 13px 16px;
          font-size: 12.5px;
          color: rgba(180, 210, 255, 0.68);
          border-bottom: 1px solid rgba(100, 160, 255, 0.05);
          vertical-align: middle;
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
          gap: 6px;
          min-height: 26px;
          padding: 0 9px;
          border-radius: 999px;
          border: 1px solid rgba(100, 160, 255, 0.14);
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .admin-role-badge.superadmin {
          color: rgba(252, 211, 77, 0.96);
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(252, 211, 77, 0.18);
        }

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
          gap: 7px;
          flex-wrap: wrap;
        }

        .admin-action-btn {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 9px;
          border: 1px solid rgba(100, 160, 255, 0.12);
          padding: 0 11px;
          background: rgba(100, 160, 255, 0.06);
          color: rgba(190, 215, 255, 0.82);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .admin-action-btn.activate {
          color: rgba(134, 239, 172, 0.95);
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.18);
        }

        .admin-action-btn.deactivate {
          color: rgba(252, 165, 165, 0.95);
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(248, 113, 113, 0.18);
        }

        .admin-action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }

        .admin-action-btn:disabled {
          opacity: 0.52;
          cursor: not-allowed;
          transform: none;
        }

        .admin-protected-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
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

          .admin-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-users-page">
        <div className="admin-users-header">
          <div className="admin-title-wrap">
            <div className="admin-title-icon">
              <UserCog size={20} />
            </div>
            <div>
              <h1 className="admin-title">User Management</h1>
              <p className="admin-subtitle">Activate and deactivate CMS accounts with SUPERADMIN protection.</p>
            </div>
          </div>

          <div className="admin-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, emails, roles..."
            />
          </div>
        </div>

        <section className="admin-stat-grid" aria-label="User account summary">
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><UserCog size={17} /></div>
            <div>
              <span className="admin-stat-label">Total Users</span>
              <span className="admin-stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><CheckCircle2 size={17} /></div>
            <div>
              <span className="admin-stat-label">Active</span>
              <span className="admin-stat-value">{stats.active}</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><XCircle size={17} /></div>
            <div>
              <span className="admin-stat-label">Inactive</span>
              <span className="admin-stat-value">{stats.inactive}</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><ShieldCheck size={17} /></div>
            <div>
              <span className="admin-stat-label">Protected</span>
              <span className="admin-stat-value">{stats.protectedCount}</span>
            </div>
          </div>
        </section>

        {error && <div className="admin-feedback error">{error}</div>}
        {notice && <div className="admin-feedback success">{notice}</div>}

        <section className="admin-table-card">
          {loading ? (
            <div className="admin-empty">
              <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
              <p>Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-empty">No users found.</div>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>User Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSuperadmin = user.user_type === 'SUPERADMIN'
                    const isActive = normalizeStatus(user.record_status) === 'ACTIVE'
                    const isUpdating = actionUserId === user.userId
                    const statusTone = getStatusTone(user.record_status)
                    const roleTone = String(user.user_type || 'USER').toLowerCase()

                    return (
                      <tr key={user.userId}>
                        <td className="admin-user-id" title={user.userId}>{user.userId}</td>
                        <td>
                          <div className="admin-user-name">
                            <strong>{user.full_name || 'Unnamed User'}</strong>
                            <span>{user.email || 'No email on file'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-role-badge ${roleTone}`}>
                            {isSuperadmin ? <ShieldCheck size={12} /> : <UserCog size={12} />}
                            {user.user_type || 'USER'}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-badge ${statusTone}`}>
                            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {normalizeStatus(user.record_status) || 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          {isSuperadmin ? (
                            <span
                              className="admin-protected-note"
                              title="SUPERADMIN accounts cannot be modified"
                            >
                              <Lock size={13} />
                              SUPERADMIN accounts cannot be modified
                            </span>
                          ) : (
                            <div className="admin-action-group">
                              <button
                                className="admin-action-btn activate"
                                type="button"
                                disabled={isActive || isUpdating}
                                onClick={() => updateUserStatus(user, 'ACTIVE')}
                              >
                                {isUpdating ? <Loader2 className="animate-spin" size={13} /> : <CheckCircle2 size={13} />}
                                Activate
                              </button>
                              <button
                                className="admin-action-btn deactivate"
                                type="button"
                                disabled={!isActive || isUpdating}
                                onClick={() => updateUserStatus(user, 'INACTIVE')}
                              >
                                {isUpdating ? <Loader2 className="animate-spin" size={13} /> : <Power size={13} />}
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
