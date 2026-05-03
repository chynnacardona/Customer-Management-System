import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      // Tally with Screenshot 4.2 naming
      const { data: userRow, error } = await supabase
        .from('user')
        .select('record_status, user_type, email, full_name')
        .eq('userId', sessionUser.id) 
        .single();

      if (error || !userRow) {
        console.warn("User record not found. Allowing entry for setup.");
        setUser(sessionUser);
        return;
      }

      // Login Guard Check (Screenshot 4.2)
      if (userRow.record_status !== 'ACTIVE') {
        await supabase.auth.signOut();
        setUser(null);
        alert("Your account is pending activation by a Sales Manager.");
        return;
      }

      setUser({ ...sessionUser, ...userRow });
    } catch (err) {
      setUser(sessionUser);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) checkAndSetUser(session.user).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session?.user) await checkAndSetUser(session.user);
      else setUser(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, handleLogin, signOut: () => supabase.auth.signOut() }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);