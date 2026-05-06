import { useState } from 'react'
import { Users, ShoppingCart, Package, ShieldCheck, LayoutDashboard, Search, LogOut, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import neuLogo from '../../assets/neu-logo.png'

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user: authUser } = useAuth()

  // para kay M4: palitan/ikabit sa final AuthContext or UserRightsContext user_type value kapag finalized na
  const userType = authUser?.user_type ?? 'ADMIN'
  const canViewDeletedCustomers = userType === 'ADMIN' || userType === 'SUPERADMIN'

  const sections = [
    {
      label: 'Overview',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      ]
    },
    {
      label: 'Management',
      items: [
        { icon: Users, label: 'Customers', path: '/lookups/customers' },
        { icon: ShoppingCart, label: 'Sales', path: '/sales' },
        { icon: Package, label: 'Products', path: '/lookups/products' },
      ]
    },
    {
      label: 'System',
      items: [
        { icon: ShieldCheck, label: 'Admin', path: '/admin' },
        // para kay M4: hidden dapat ito kapag USER; ADMIN/SUPERADMIN lang ang may Deleted Customers access
        ...(canViewDeletedCustomers
          ? [{ icon: Trash2, label: 'Deleted Customers', path: '/deleted-customers' }]
          : []),
      ]
    },
  ]

  // para kay M4: palitan display fields kapag final user profile fields are ready
  const user = {
    email: authUser?.email ?? 'admin@hope.com',
    initials: authUser?.email?.charAt(0).toUpperCase() ?? 'A',
    role: userType,
  }

  return (
    <>
      <style>{`
        @keyframes sidebarIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .sidebar {
          width: ${collapsed ? '68px' : '245px'};
          min-height: 100vh;
          background: rgba(4, 9, 22, 0.25); 
          backdrop-filter: blur(18px) saturate(160%) brightness(0.9);
          -webkit-backdrop-filter: blur(18px) saturate(160%) brightness(0.9);
          
          border-right: 1px solid transparent;
          border-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(100, 160, 255, 0.1) 15%,
            rgba(100, 160, 255, 0.3) 50%,
            rgba(100, 160, 255, 0.1) 85%,
            transparent 100%
          ) 1;

          box-shadow: 4px 0 20px rgba(100, 160, 255, 0.05);

          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          /* transition: all para pati colors at shadows sumabay */
          transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: visible;
          position: relative;
        }

        /* Para magmukhang tunay na glass edge na tinatamaan ng nebula light */
        .sidebar::after {
          content: '';
          position: absolute;
          top: 10%;
          right: -1px;
          height: 80%;
          width: 1px;
          background: linear-gradient(to bottom, 
            transparent, 
            rgba(255, 255, 255, 0.15), 
            transparent
          );
          pointer-events: none;
        }

        /* Toggle button — center of right edge */
        .toggle-btn {
          position: absolute;
          right: -14px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(14, 40, 100, 0.95);
          border: 1px solid rgba(100, 160, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(180, 210, 255, 0.75);
          z-index: 50;
          transition: all 0.2s ease;
          box-shadow: 0 0 0 3px rgba(4, 9, 22, 0.97), 0 4px 14px rgba(0,0,0,0.4);
        }

        .toggle-btn:hover {
          background: rgba(46, 134, 245, 0.9);
          border-color: rgba(100, 160, 255, 0.5);
          color: white;
          box-shadow: 0 0 0 3px rgba(4, 9, 22, 0.97), 0 0 16px rgba(46,134,245,0.4);
        }

        .sidebar-header {
          /* Siguraduhin na 64px ang height para pantay sa 40px logo */
          min-height: 64px; 
          display: flex;
          align-items: center;
          /* Kapag collapsed, dapat center. Kapag hindi, flex-start */
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          /* Dagdagan natin ang horizontal padding para hindi dikit sa edge */
          padding: 0 ${collapsed ? '0' : '20px'};
          gap: 1px;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .logo-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 40px; 
          height: 40px;
          flex-shrink: 0; /* Para hindi siya mapipit */
          
          /* Kung collapsed, siguraduhin nasa gitna talaga */
          margin-left: 6px;
          margin: ${collapsed ? '0 auto' : '0 0 0 6px'};
          
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(180, 210, 255, 0.2);
        
        }

        .neu-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* ── Logo Text Adjustment ── */
        .logo-text {
          display: block; /* Huwag i-none para ma-animate ang opacity */
          opacity: ${collapsed ? 0 : 1};
          max-width: ${collapsed ? '0' : '150px'};
          transform: translateX(${collapsed ? '-10px' : '0'});
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          pointer-events: ${collapsed ? 'none' : 'auto'};
          padding-left: ${collapsed ? '0' : '12px'};
        }

        .logo-wrapper {
          /* ... existing ... */
          margin: ${collapsed ? '0 auto' : '0'};
          transition: margin 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logo-title {
          font-size: 15px;
          font-weight: 800;
          color: white;
          letter-spacing: 0.05em;
          line-height: 1;
          margin: 0;
        }

        .logo-subtitle {
          font-size: 9px;
          color: rgba(100, 160, 255, 0.5);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 3px;
          font-weight: 500;
        }

        /* Search */
        .sidebar-search { padding: 10px 10px; }

        .search-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${collapsed ? '0' : '7px'};
          background: rgba(100, 160, 255, 0.04);
          border: 1px solid rgba(100, 160, 255, 0.08);
          border-radius: 10px;
          padding: 7px ${collapsed ? '0' : '12px'};
          transition: all 0.32s ease;
          overflow: hidden;
        }

        .search-bar:focus-within {
          border-color: rgba(100, 160, 255, 0.2);
          background: rgba(100, 160, 255, 0.07);
        }

        .search-icon { color: rgba(180, 210, 255, 0.28); flex-shrink: 0; }

        .search-input {
          background: none;
          border: none;
          outline: none;
          font-size: 12px;
          color: rgba(180, 210, 255, 0.7);
          width: ${collapsed ? '0' : '100%'};
          opacity: ${collapsed ? '0' : '1'};
          transition: all 0.25s ease;
        }

        .search-input::placeholder { color: rgba(180, 210, 255, 0.2); }

        /* Nav body */
        .sidebar-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0px 0;
        }

        .sidebar-body::-webkit-scrollbar { width: 0; }
        .sidebar-section { margin-bottom: 2px; }

        .section-label {
          font-size: 9px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.18);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: ${collapsed ? '0' : '10px 20px 4px'};
          white-space: nowrap;
          overflow: hidden;
          opacity: ${collapsed ? '0' : '1'};
          max-height: ${collapsed ? '0' : '30px'};
          transition: opacity 0.2s ease, max-height 0.3s ease, padding 0.3s ease;
        }

        .section-divider {
          height: 1px;
          background: rgba(100, 160, 255, 0.06);
          margin: ${collapsed ? '6px 14px' : '0'};
          opacity: ${collapsed ? '1' : '0'};
          transition: opacity 0.25s ease;
        }

        .section-items {
          padding: 0 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          gap: ${collapsed ? '0' : '9px'};
          padding: 9px ${collapsed ? '0' : '12px'};
          border-radius: 10px;
          text-decoration: none;
          color: rgba(180, 210, 255, 0.4);
          font-size: 12.5px;
          font-weight: 500;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .nav-item:hover {
          background: rgba(100, 160, 255, 0.07);
          color: rgba(180, 210, 255, 0.8);
        }

        .nav-item.active {
          background: rgba(46, 134, 245, 0.12);
          border-color: rgba(100, 160, 255, 0.14);
          color: #7eb8ff;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 18px;
          background: linear-gradient(180deg, #1a4fd6, #2e86f5);
          border-radius: 0 3px 3px 0;
        }

        .nav-icon {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .nav-item:hover .nav-icon,
        .nav-item.active .nav-icon { opacity: 1; }

        .nav-label {
          white-space: nowrap;
          overflow: hidden;
          opacity: ${collapsed ? '0' : '1'};
          max-width: ${collapsed ? '0' : '200px'};
          transition: opacity 0.2s ease, max-width 0.32s ease;
        }

        .nav-tooltip {
          display: none;
          position: absolute;
          left: 58px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(6, 14, 34, 0.97);
          border: 1px solid rgba(100, 160, 255, 0.15);
          color: rgba(180, 210, 255, 0.85);
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 7px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 200;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }

        .nav-item:hover .nav-tooltip {
          display: ${collapsed ? 'block' : 'none'};
        }

        /* ── User section ── */
        .sidebar-user {
          padding: 12px ${collapsed ? '0' : '12px'};
          border-top: 1px solid rgba(100, 160, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          gap: ${collapsed ? '0' : '10px'};
          transition: all 0.32s ease;
          overflow: hidden;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a4fd6, #2e86f5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          /* Same size as nav icons area — keeps visual alignment */
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(30,80,220,0.3);
        }

        .user-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          opacity: ${collapsed ? '0' : '1'};
          max-width: ${collapsed ? '0' : '200px'};
          transition: opacity 0.2s ease, max-width 0.32s ease;
        }

        .user-email {
          font-size: 11.5px;
          color: rgba(180, 210, 255, 0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }

        .user-role {
          font-size: 9px;
          color: rgba(180, 210, 255, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 2px;
          display: block;
        }

        .logout-btn {
          /* Dito yung magic: Ginagawa nating 0 ang width kapag collapsed */
          width: ${collapsed ? '0' : '28px'};
          height: 28px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(180, 210, 255, 0.22);
          flex-shrink: 0;
          overflow: hidden; /* Tinatago yung icon mismo kapag lumiit na sa 0 */
          opacity: ${collapsed ? '0' : '1'};
          pointer-events: ${collapsed ? 'none' : 'auto'};
          /* Pinalitan ng 0.32s para sabay sa animation ng sidebar */
          transition: all 0.32s ease; 
        }

        .logout-btn:hover {
          background: rgba(255,70,70,0.08);
          border-color: rgba(255,70,70,0.15);
          color: rgba(255,100,100,0.75);
        }
        /* ── Logo Shimmer Animation Fix (Circle Version) ── */
        
        /* ── Updated Logo Wrapper (40px) ── */
        .logo-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px; /* Sakto sa 40px */
          height: 40px;
          flex-shrink: 0;
          overflow: hidden; 
          border-radius: 50%; 
          background: transparent; 
          border: none;
          /* Manatili ang subtle glow */
          box-shadow: 0 0 10px rgba(180, 210, 255, 0.2);
          transition: all 0.3s ease;
        }

        .neu-logo {
          /* Gawin nating 100% para sagad ang shimmer sa 40px */
          width: 100%; 
          height: 100%;
          object-fit: contain;
          z-index: 2;
        }

        /* ── Sidebar Header Adjustment ── */
        .sidebar-header {
          padding: 14px ${collapsed ? '8px' : '16px'};
          min-height: 64px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          gap: 1px;
          transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-sizing: border-box;
        }

        .logo-wrapper {
          margin: 0 !important;
          flex-shrink: 0;
        }

        /* Panatilihin ang slow-mo shimmer (4s cycle) */
        .logo-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 3;
          background: linear-gradient(
            250deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0) 30%, 
            rgba(255, 255, 255, 0.4) 50%, 
            rgba(255, 255, 255, 0) 70%, 
            transparent 100%
          );
          background-size: 250% 100%;
          background-repeat: no-repeat;
          background-position: 150% 0;
          animation: logoShimmer 4s linear infinite; 
        }

        @keyframes logoShimmer {
          0% { background-position: 150% 0; }
          50% { background-position: -150% 0; }
          100% { background-position: -150% 0; }
        }
      `}</style>

      <aside className="sidebar">

        {/* Toggle — center right edge */}
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-wrapper">
            <img src={neuLogo} alt="NEU" className="neu-logo" />
          </div>

          <div className="logo-text">
            <p className="logo-title">HOPE CMS</p>
            <p className="logo-subtitle">Customer Management</p>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <div className="search-bar">
            <Search size={13} className="search-icon" />
            <input className="search-input" placeholder="Search..." />
          </div>
        </div>

        {/* Nav */}
        <div className="sidebar-body">
          {sections.map((section, i) => (
            <div className="sidebar-section" key={section.label}>
              {i > 0 && <div className="section-divider" />}
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
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="user-avatar">{user.initials}</div>
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="logout-btn" title="Sign out">
            <LogOut size={13} />
          </button>
        </div>

      </aside>
    </>
  )
}

export default Sidebar
