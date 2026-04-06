import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticlesBg from '../../components/layout/ParticlesBg';
import { supabase } from '../../lib/supabase'; // Make sure tama ang path mo papunta sa supabase config mo

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          
          // Login guard - iche-check kung active o inactive yung user
          const { data, error } = await supabase
            .from('user')
            .select('record_status')
            .eq('email', session.user.email)
            .single();

          if (error || !data) {
            await supabase.auth.signOut();
            navigate('/login?error=account_not_found');
            return;
          }

          if (data.record_status === 'INACTIVE') {
            await supabase.auth.signOut();
            navigate('/login?error=inactive');
            return;
          }

          // Kung walang problema, papasok na sa main page (e.g., /customers)
          navigate('/customers');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={styles.container}>
      {/* 1. Eto yung Stars at Fog animation */}
      <ParticlesBg />
      
      {/* 2. Eto yung Glassmorphism box sa ibabaw */}
      <div style={styles.loaderBox}>
        <div style={styles.spinner}></div>
        {/* Ipapakita yung error text kung meron, kung wala "Verifying account..." */}
        {error ? (
           <p style={{ ...styles.text, color: 'red' }}>{error}</p>
        ) : (
           <p style={styles.text}>Verifying account...</p>
        )}
      </div>
    </div>
  );
};

// Hayaan mo lang yung "const styles = { ... }" mo diyan sa baba
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // ... keep mo lang yung existing styles mo
  }
};

export default AuthCallback;