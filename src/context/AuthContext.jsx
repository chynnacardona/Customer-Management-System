import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../supabase/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAndSetUser = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }

    const { data, error } = await supabase
      .from("user")
      .select("user_id, email, full_name, role, status")
      .eq("email", sessionUser.email)
      .single();

    if (error || !data) {
      await supabase.auth.signOut();
      setUser(null);
      return;
    }

    if (data.status === "INACTIVE") {
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
      value={{ user, loading, signOut: () => supabase.auth.signOut() }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
