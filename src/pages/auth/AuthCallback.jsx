import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Ang callback page ay ginagamit para i-process ang auth token.
    // Pansamantala, naka-simulate ito na mag-lo-load ng 2 seconds tapos pupunta sa login or dashboard.
    const timeout = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <h2 style={styles.title}>Verifying account...</h2>
      <p style={styles.subtitle}>Please wait while we set things up for you.</p>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent', 
    fontFamily: 'sans-serif',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(100, 160, 255, 0.1)',
    borderTop: '3px solid #64a0ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
    boxShadow: '0 0 15px rgba(100, 160, 255, 0.3)',
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  subtitle: {
    color: 'rgba(180, 210, 255, 0.5)',
    fontSize: '14px',
  },
};

export default AuthCallback;