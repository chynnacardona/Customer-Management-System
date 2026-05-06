import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const missingProfileWarnedRef = useRef(false);

  const handleLogin = async (emailInput) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput,
      options: { emailRedirectTo: 'http://localhost:5173/auth/callback' },
    });
    if (error) alert("Login Error: " + error.message);
    else alert("Check your email for the magic link!");
  };

  const checkAndSetUser = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }

    try {
      // para kay M4: dito papasok yung final login guard/profile query behavior
      const profileQuery = supabase
        .from('user')
        .select('record_status, user_type, email, full_name')
        .eq('userId', sessionUser.id)
        .maybeSingle();

      const timeout = new Promise((resolve) => {
        setTimeout(() => resolve({ data: null, error: new Error('Profile lookup timeout') }), 5000);
      });

      const { data: userRow, error } = await Promise.race([profileQuery, timeout]);

      if (error) {
        console.warn("Unable to load user profile. Allowing entry for setup.", error);
        setUser(sessionUser);
        return;
      }

      if (!userRow) {
        if (!missingProfileWarnedRef.current) {
          console.warn("User profile row not found yet. Allowing entry for UI testing.");
          missingProfileWarnedRef.current = true;
        }
        setUser(sessionUser);
        return;
      }

      if (userRow.record_status !== 'ACTIVE') {
        setUser(null);
        setTimeout(() => {
          supabase.auth.signOut();
          alert("Your account is pending activation by a Sales Manager.");
        }, 0);
        return;
      }

      setUser({ ...sessionUser, ...userRow });
    } catch (err) {
      console.warn("Unable to load user profile. Allowing entry for setup.", err);
      setUser(sessionUser);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) await checkAndSetUser(session.user);
        else setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase recommends not awaiting extra Supabase calls directly inside this callback.
      setTimeout(() => {
        if (session?.user) checkAndSetUser(session.user);
        else setUser(null);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, handleLogin, signOut: () => supabase.auth.signOut() }}>
      {loading ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #020818 0%, #051030 50%, #060d28 100%)',
          color: 'rgba(180,210,255,0.75)',
          fontSize: '13px',
        }}>
          Restoring session...
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);