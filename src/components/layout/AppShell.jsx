import React from 'react';
import Sidebar from './Sidebar';
import ParticlesBg from './ParticlesBg';

const AppShell = ({ children }) => {
  return (
    <div style={shellStyles.container}>
      {/* 1. Background Animation para sa buong Dashboard */}
      <ParticlesBg />

      {/* 2. Sidebar sa gilid */}
      <Sidebar />

      {/* 3. Main Content Area */}
      <main style={shellStyles.mainContent}>
        {children}
        
      </main>
    </div>
    
  );
};

const shellStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    background: 'linear-gradient(160deg, #020818 0%, #051030 50%, #060d28 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    padding: '24px',
    overflowY: 'auto',
  }
};

export default AppShell;