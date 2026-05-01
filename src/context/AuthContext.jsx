import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogin = async (emailInput) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: emailInput, // Use the variable from your form
      options: {
        // Must match the "Site URL" in your Dashboard
        emailRedirectTo: 'http://localhost:5173', 
      },
    });

    if (error) {
      console.error("Login failed:", error.message);
      alert("Login Error: " + error.message);
    } else {
      alert("Check your email for the magic login link!");
    }
  };

  const checkAndSetUser = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }

    const { data, error } = await supabase
      .from('user')
      .select('user_id, email, full_name, role, status')
      .eq('email', sessionUser.email)
      .single();

    if (error || !data) {
      await supabase.auth.signOut();
      setUser(null);
      return;
    }

    if (data.status === 'INACTIVE') {
      await supabase.auth.signOut();
      setUser(null);
      alert("Your account is disabled. Please contact your administrator.");
      return;
    }

    setUser({ ...sessionUser, ...data });
  };

  useEffect(() => {
    // Check session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAndSetUser(session?.user ?? null).finally(() => setLoading(false));
    });

    // Listen for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (event === "SIGNED_IN" && session) {
        await checkAndSetUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, handleLogin, signOut: () => supabase.auth.signOut() }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);