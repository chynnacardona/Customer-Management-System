import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ParticlesBg from './ParticlesBg';

const AppShell = () => {
  return (
    <div style={shellStyles.container}>
      <ParticlesBg />
      <Sidebar />
      <main style={shellStyles.mainContent}>
        {/* This is where your nested pages will appear */}
        <Outlet /> 
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