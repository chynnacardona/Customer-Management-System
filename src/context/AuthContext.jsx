import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { AuthContext } from "./useAuth";
import { logAuditActivity } from "../services/auditLogService";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  const showAuthNotice = useCallback((notice) => {
    setAuthNotice(notice);
    window.setTimeout(() => setAuthNotice(null), 5200);
  }, []);

  const signOutWithNotice = useCallback((notice) => {
    setUser(null);
    setTimeout(() => {
      supabase.auth.signOut();
      showAuthNotice(notice);
    }, 0);
  }, [showAuthNotice]);

  const handleLogin = async (emailInput) => {
  const { error } = await supabase.auth.signInWithOtp({
    email: emailInput,
    options: { 
      // DYNAMIC REDIRECT: This uses the actual URL of the site you are on
      emailRedirectTo: `${window.location.origin}/auth/callback` 
    },
  });
    if (error) {
      showAuthNotice({
        tone: 'error',
        title: 'Login failed',
        message: error.message,
      });
    } else {
      showAuthNotice({
        tone: 'success',
        title: 'Magic link sent',
        message: 'Check your email to continue signing in.',
      });
    }
  };

  const checkAndSetUser = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }

    try {
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
        signOutWithNotice({
          tone: 'error',
          title: 'Profile check failed',
          message: 'We could not verify your account status. Please try again.',
        });
        return;
      }

      if (!userRow) {
        signOutWithNotice({
          tone: 'error',
          title: 'Account profile missing',
          message: 'Your account profile is not ready yet. Please contact a Sales Manager.',
        });
        return;
      }

      if (userRow.record_status !== 'ACTIVE') {
        signOutWithNotice({
          tone: 'pending',
          title: 'Account pending activation',
          message: 'Registration successful. A Sales Manager needs to activate your account before you can sign in.',
        });
        return;
      }

      setUser({ ...sessionUser, ...userRow });
      await logAuditActivity({
        action: 'Signed in',
        entityType: 'auth',
        entityId: sessionUser.id,
        metadata: { method: 'session', role: userRow.user_type },
      });
    } catch {
      signOutWithNotice({
        tone: 'error',
        title: 'Profile check failed',
        message: 'We could not verify your account status. Please try again.',
      });
    }
  }, [signOutWithNotice]);

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
  }, [checkAndSetUser]);

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
      ) : (
        <>
          {children}
          {authNotice && (
            <div style={noticeStyles.shell} role="status" aria-live="polite">
              <div style={{ ...noticeStyles.icon, ...noticeToneStyles[authNotice.tone]?.icon }}>
                {authNotice.tone === 'success' ? 'OK' : authNotice.tone === 'error' ? '!' : 'i'}
              </div>
              <div style={noticeStyles.copy}>
                <strong style={noticeStyles.title}>{authNotice.title}</strong>
                <span style={noticeStyles.message}>{authNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthNotice(null)}
                style={noticeStyles.close}
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};

const noticeStyles = {
  shell: {
    position: 'fixed',
    top: 22,
    right: 22,
    zIndex: 2000,
    width: 'min(420px, calc(100vw - 32px))',
    display: 'grid',
    gridTemplateColumns: '38px 1fr 28px',
    gap: 12,
    alignItems: 'center',
    padding: '14px 14px',
    borderRadius: 16,
    border: '1px solid rgba(126, 184, 255, 0.18)',
    background: 'rgba(8, 18, 40, 0.94)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255,255,255,0.05)',
    backdropFilter: 'blur(18px) saturate(145%)',
    color: 'white',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 900,
    background: 'rgba(59, 130, 246, 0.14)',
    color: '#93c5fd',
    border: '1px solid rgba(147, 197, 253, 0.24)',
  },
  copy: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  title: {
    fontSize: 13,
    lineHeight: 1.2,
    color: 'rgba(245, 250, 255, 0.96)',
  },
  message: {
    fontSize: 12,
    lineHeight: 1.45,
    color: 'rgba(190, 215, 255, 0.62)',
  },
  close: {
    width: 28,
    height: 28,
    borderRadius: 9,
    border: '1px solid transparent',
    background: 'transparent',
    color: 'rgba(190, 215, 255, 0.45)',
    cursor: 'pointer',
    fontWeight: 800,
  },
};

const noticeToneStyles = {
  success: {
    icon: {
      background: 'rgba(34, 197, 94, 0.14)',
      color: '#86efac',
      border: '1px solid rgba(134, 239, 172, 0.24)',
    },
  },
  error: {
    icon: {
      background: 'rgba(239, 68, 68, 0.14)',
      color: '#fca5a5',
      border: '1px solid rgba(252, 165, 165, 0.24)',
    },
  },
  pending: {
    icon: {
      background: 'rgba(59, 130, 246, 0.14)',
      color: '#93c5fd',
      border: '1px solid rgba(147, 197, 253, 0.24)',
    },
  },
};

