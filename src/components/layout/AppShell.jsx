import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ParticlesBg from './ParticlesBg';
import ActivityAuditTracker from '../shared/ActivityAuditTracker';

const AppShell = () => {
  return (
    <div style={shellStyles.container}>
      <ActivityAuditTracker />
      <ParticlesBg />
      <Sidebar />
      <main className="dashboard-scroll-pane" style={shellStyles.mainContent}>
        <Outlet /> 
      </main>
    </div>
  );
};

const shellStyles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(160deg, #020818 0%, #051030 50%, #060d28 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 1,
    padding: '24px',
    overflowX: 'hidden',
    overflowY: 'auto',
  }
};

export default AppShell;
