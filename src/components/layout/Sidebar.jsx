import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import neuLogo from '../../assets/neu-logo.png'

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const navigate = useNavigate()
  const { user: authUser, signOut } = useAuth()

  const userType = authUser?.user_type ?? 'USER'
  const canViewDeletedCustomers = userType === 'ADMIN' || userType === 'SUPERADMIN'

  const sections = [
    {
      label: 'Overview',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      ],
    },
    {
      label: 'Management',
      items: [
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: ShoppingCart, label: 'Sales', path: '/sales' },
        { icon: Package, label: 'Products', path: '/products' },
      ],
    },
    {
      label: 'System',
      items: [
        { icon: ShieldCheck, label: 'Admin', path: '/admin' },
        ...(canViewDeletedCustomers
          ? [{ icon: Trash2, label: 'Deleted Customers', path: '/deleted-customers' }]
          : []),
      ],
    },
  ]

  const user = {
    name: authUser?.full_name ?? authUser?.user_metadata?.full_name ?? 'Hope User',
    email: authUser?.email ?? 'admin@hope.com',
    initials: (authUser?.full_name ?? authUser?.email ?? 'A')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'A',
    role: userType,
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      setShowLogoutConfirm(false)
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Sign out failed:', err)
      setIsSigningOut(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes sidebarIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .sidebar {
          width: ${collapsed ? '76px' : '248px'};
          height: calc(100vh - 28px);
          margin: 14px 0 14px 14px;
          flex-shrink: 0;
          position: relative;
          z-index: 20;
          display: flex;
          flex-direction: column;
          padding: 14px 10px;
          box-sizing: border-box;
          animation: sidebarIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          background: linear-gradient(180deg, rgba(8, 18, 40, 0.82), rgba(3, 9, 24, 0.9));
          border: 1px solid rgba(126, 184, 255, 0.12);
          border-radius: 20px;
          box-shadow: 12px 0 34px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(26px) saturate(150%);
          -webkit-backdrop-filter: blur(26px) saturate(150%);
          transition:
            width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            margin 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.24s ease,
            box-shadow 0.24s ease;
        }

        .sidebar::after {
          content: '';
          position: absolute;
          top: 18px;
          right: -1px;
          width: 1px;
          height: calc(100% - 36px);
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(126, 184, 255, 0.18) 18%,
            rgba(56, 189, 248, 0.62) 50%,
            rgba(52, 211, 153, 0.18) 82%,
            transparent 100%
          );
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.34);
          pointer-events: none;
        }

        .sidebar-toggle {
          position: absolute;
          right: -11px;
          top: 82px;
          width: 24px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(126, 184, 255, 0.16);
          background: rgba(7, 18, 42, 0.96);
          color: rgba(180, 210, 255, 0.46);
          cursor: pointer;
          z-index: 80;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18), 0 0 0 2px rgba(4, 9, 22, 0.86);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .sidebar-toggle:hover {
          transform: translateX(${collapsed ? '1px' : '-1px'});
          border-color: rgba(126, 184, 255, 0.34);
          background: rgba(18, 40, 82, 0.96);
          color: rgba(230, 244, 255, 0.86);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22), 0 0 0 2px rgba(4, 9, 22, 0.86);
        }

        .sidebar-toggle:focus-visible {
          outline: 2px solid rgba(126, 184, 255, 0.9);
          outline-offset: 3px;
        }

        .sidebar-header {
          min-height: 70px;
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'space-between'};
          gap: 12px;
          padding: ${collapsed ? '13px 8px' : '13px 8px'};
          box-sizing: border-box;
          transition:
            padding 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            justify-content 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .header-accent {
          height: 1px;
          margin: ${collapsed ? '2px 18px 10px' : '2px 18px 10px'};
          background: linear-gradient(90deg, transparent, rgba(126, 184, 255, 0.26), rgba(52, 211, 153, 0.18), transparent);
          opacity: 0.75;
          flex-shrink: 0;
        }

        .user-accent {
          height: 1px;
          margin: 10px 18px 2px;
          background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.18), rgba(126, 184, 255, 0.26), transparent);
          opacity: 0.75;
          flex-shrink: 0;
        }

        .brand-block {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '10px'};
          padding: ${collapsed ? '0' : '0 4px'};
          transition:
            gap 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            padding 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .logo-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 0 16px rgba(126, 184, 255, 0.2);
        }

        .logo-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(250deg, transparent 0%, rgba(255, 255, 255, 0.38) 48%, transparent 70%);
          background-size: 240% 100%;
          background-position: 150% 0;
          animation: logoShimmer 4s linear infinite;
          pointer-events: none;
        }

        @keyframes logoShimmer {
          0% { background-position: 150% 0; }
          50%, 100% { background-position: -150% 0; }
        }

        .neu-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 1;
        }

        .logo-text {
          min-width: 0;
          opacity: ${collapsed ? 0 : 1};
          max-width: ${collapsed ? '0' : '150px'};
          transform: translateX(${collapsed ? '-8px' : '0'});
          pointer-events: ${collapsed ? 'none' : 'auto'};
          overflow: hidden;
          transition:
            opacity 0.24s ease,
            max-width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .logo-title {
          margin: 0;
          color: rgba(248, 252, 255, 0.96);
          font-size: 15px;
          font-weight: 850;
          line-height: 1;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .logo-subtitle {
          margin: 4px 0 0;
          color: rgba(126, 184, 255, 0.56);
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .sidebar-body {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
          padding: 0 0 10px;
          overflow: visible;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .section-label {
          height: ${collapsed ? '0' : '24px'};
          opacity: ${collapsed ? 0 : 1};
          overflow: hidden;
          padding: ${collapsed ? '0' : '0 12px'};
          color: rgba(180, 210, 255, 0.26);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          transition: all 0.24s ease;
        }

        .section-items {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 0 ${collapsed ? '8px' : '8px'};
          transition: padding 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nav-item {
          position: relative;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          gap: ${collapsed ? '0' : '10px'};
          padding: ${collapsed ? '0' : '0 12px'};
          border-radius: 12px;
          border: 1px solid transparent;
          color: rgba(180, 210, 255, 0.42);
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 650;
          transform: translateX(${collapsed ? '0' : '0'});
          transition:
            background 0.22s ease,
            border-color 0.22s ease,
            color 0.22s ease,
            transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            padding 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            gap 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            min-height 0.42s cubic-bezier(0.22, 1, 0.36, 1);
          overflow: visible;
        }

        .nav-item:hover {
          background: rgba(100, 160, 255, 0.08);
          color: rgba(220, 236, 255, 0.9);
        }

        .nav-item.active {
          background: linear-gradient(90deg, rgba(46, 134, 245, 0.22), rgba(34, 211, 238, 0.1));
          border-color: rgba(100, 160, 255, 0.2);
          color: rgba(226, 244, 255, 0.96);
          box-shadow: inset 3px 0 0 rgba(46, 134, 245, 0.95);
        }

        .nav-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          opacity: 0.72;
        }

        .nav-item.active .nav-icon,
        .nav-item:hover .nav-icon {
          opacity: 1;
          color: #38bdf8;
        }

        .nav-label {
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          opacity: ${collapsed ? 0 : 1};
          max-width: ${collapsed ? '0' : '160px'};
          transform: translateX(${collapsed ? '-8px' : '0'});
          transition:
            opacity 0.24s ease,
            max-width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nav-tooltip {
          display: none;
          position: absolute;
          left: 54px;
          top: 50%;
          transform: translateY(-50%);
          min-height: 30px;
          align-items: center;
          padding: 0 12px;
          border-radius: 9px;
          border: 1px solid rgba(126, 184, 255, 0.16);
          background: rgba(10, 22, 45, 0.96);
          color: rgba(235, 245, 255, 0.92);
          font-size: 11.5px;
          font-weight: 750;
          white-space: nowrap;
          pointer-events: none;
          z-index: 500;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.34);
        }

        .nav-tooltip::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 50%;
          width: 10px;
          height: 10px;
          transform: translateY(-50%) rotate(45deg);
          background: rgba(10, 22, 45, 0.96);
          border-left: 1px solid rgba(126, 184, 255, 0.16);
          border-bottom: 1px solid rgba(126, 184, 255, 0.16);
        }

        .nav-item:hover .nav-tooltip {
          display: ${collapsed ? 'flex' : 'none'};
        }

        .sidebar-user {
          min-height: 68px;
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          gap: ${collapsed ? '0' : '10px'};
          padding: ${collapsed ? '12px 8px' : '12px'};
          box-sizing: border-box;
          transition:
            padding 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            gap 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            justify-content 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #38bdf8);
          color: white;
          font-size: 12px;
          font-weight: 850;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.28);
        }

        .user-info {
          flex: 1;
          min-width: 0;
          opacity: ${collapsed ? 0 : 1};
          max-width: ${collapsed ? '0' : '150px'};
          overflow: hidden;
          transform: translateX(${collapsed ? '-8px' : '0'});
          transition:
            opacity 0.24s ease,
            max-width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .user-name,
        .user-email,
        .user-role {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-name {
          color: rgba(245, 250, 255, 0.9);
          font-size: 11.5px;
          font-weight: 750;
        }

        .user-email {
          margin-top: 2px;
          color: rgba(180, 210, 255, 0.45);
          font-size: 10.5px;
        }

        .user-role {
          margin-top: 2px;
          color: rgba(180, 210, 255, 0.26);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .logout-btn {
          width: ${collapsed ? '0' : '30px'};
          height: 30px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(180, 210, 255, 0.3);
          cursor: pointer;
          opacity: ${collapsed ? 0 : 1};
          pointer-events: ${collapsed ? 'none' : 'auto'};
          overflow: hidden;
          transition:
            width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.24s ease,
            border-color 0.22s ease,
            background 0.22s ease,
            color 0.22s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.18);
          color: rgba(252, 165, 165, 0.95);
        }

        .logout-btn:disabled {
          cursor: wait;
          opacity: 0.5;
        }

        .logout-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(1, 6, 18, 0.72);
          backdrop-filter: blur(7px);
        }

        .logout-confirm-dialog {
          width: min(360px, 100%);
          border-radius: 16px;
          border: 1px solid rgba(100, 160, 255, 0.16);
          background: rgba(8, 18, 40, 0.94);
          box-shadow: 0 22px 48px rgba(0, 0, 0, 0.42);
          padding: 18px;
        }

        .logout-confirm-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.18);
          color: rgba(248, 113, 113, 0.95);
          margin-bottom: 14px;
        }

        .logout-confirm-title {
          margin: 0;
          color: rgba(245, 250, 255, 0.96);
          font-size: 16px;
          font-weight: 800;
        }

        .logout-confirm-text {
          margin: 8px 0 0;
          color: rgba(180, 210, 255, 0.52);
          font-size: 12.5px;
          line-height: 1.5;
        }

        .logout-confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
        }

        .logout-confirm-btn {
          min-height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(100, 160, 255, 0.12);
          padding: 0 13px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-confirm-btn.cancel {
          background: rgba(100, 160, 255, 0.06);
          color: rgba(190, 215, 255, 0.82);
        }

        .logout-confirm-btn.confirm {
          background: rgba(239, 68, 68, 0.13);
          border-color: rgba(239, 68, 68, 0.22);
          color: rgba(252, 165, 165, 0.95);
        }

        .logout-confirm-btn:hover {
          transform: translateY(-1px);
        }

        .logout-confirm-btn:disabled {
          cursor: wait;
          opacity: 0.55;
          transform: none;
        }
      `}</style>

      <aside className="sidebar">
        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <div className="sidebar-header">
          <div className="brand-block">
            <div className="logo-wrapper">
              <img src={neuLogo} alt="NEU" className="neu-logo" />
            </div>
            <div className="logo-text">
              <p className="logo-title">HOPE CMS</p>
              <p className="logo-subtitle">Customer Management</p>
            </div>
          </div>
        </div>

        <div className="header-accent" />

        <nav className="sidebar-body" aria-label="Primary navigation">
          {sections.map((section) => (
            <div className="sidebar-section" key={section.label}>
              <div className="section-label">{section.label}</div>
              <div className="section-items">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-tooltip">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="user-accent" />

        <div className="sidebar-user">
          <div className="user-avatar">{user.initials}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="logout-btn" type="button" title="Sign out" onClick={() => setShowLogoutConfirm(true)} disabled={isSigningOut}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
          <div className="logout-confirm-dialog">
            <div className="logout-confirm-icon">
              <LogOut size={18} />
            </div>
            <h2 className="logout-confirm-title" id="logout-confirm-title">Sign out?</h2>
            <p className="logout-confirm-text">Are you sure you want to log out of Hope CMS?</p>
            <div className="logout-confirm-actions">
              <button className="logout-confirm-btn cancel" type="button" onClick={() => setShowLogoutConfirm(false)} disabled={isSigningOut}>
                Cancel
              </button>
              <button className="logout-confirm-btn confirm" type="button" onClick={handleSignOut} disabled={isSigningOut}>
                {isSigningOut ? 'Signing out...' : 'Yes, log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
