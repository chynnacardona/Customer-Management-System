import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import ParticlesBg from '../../components/layout/ParticlesBg'; 

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Kapag may session na (Success Google Login), diretso Dashboard
        navigate('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        // Kung walang session o nag-error, balik sa Login
        navigate('/login');
      }
    });

    // 2. Backup check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // Timeout as LAST RESORT (pag lumampas ng 5 secs at wala pa ring nangyayari)
    const fallbackTimer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [navigate]);

  return (
    <div style={styles.container}>
      <ParticlesBg />
      <div style={styles.loaderBox}>
        <div style={styles.spinner}></div>
        <p style={styles.text}>Verifying account...</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(160deg, #020818 0%, #051030 50%, #060d28 100%)',
  },
  loaderBox: {
    zIndex: 10, 
    padding: '40px',
    background: 'rgba(8, 18, 40, 0.85)',
    backdropFilter: 'blur(30px)',
    borderRadius: '22px',
    border: '1px solid rgba(100, 160, 255, 0.12)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(100, 160, 255, 0.1)',
    borderTop: '3px solid #7eb8ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  text: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    letterSpacing: '0.1em',
  }
};

export default AuthCallback;