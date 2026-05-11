import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from "../../supabase/supabaseClient";

const isTwoFactorEnabled = (email) => {
  if (!email) return false
  return window.localStorage.getItem(`hope-cms-2fa-${email.trim().toLowerCase()}`) === 'enabled'
}

function Login() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [isError, setIsError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.3 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.004 + 0.002,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        s.alpha += s.speed
        if (s.alpha > 1 || s.alpha < 0) s.speed *= -1
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 210, 255, ${s.alpha * 0.75})`
        ctx.fill()
      })
      animationId = requestAnimationFrame(draw)
    }

    draw()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (!isTwoFactorEnabled(session.user?.email)) navigate('/dashboard');
      }
    });

  return () => {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', handleResize)
    subscription.unsubscribe()
  };
}, [navigate]);

  

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setIsError(false)
    setErrorMsg('')

    try {
      // 1. Check muna natin sa public 'user' table kung nandun yung email
      const { data: dbUser, error: dbError } = await supabase
        .from('user')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        setIsError(true)
        
        if (authError.message.includes("Invalid login credentials") && !dbError) {
          if (dbUser) {
            setErrorMsg("Invalid credentials. If you used Google before, please use the Google button.")
          } else {
            setErrorMsg("Account not found. Please register first.")
          }
        } else {
          setErrorMsg(authError.message)
        }
      } else if (data?.user) {
        if (isTwoFactorEnabled(data.user.email)) {
          await supabase.auth.signOut()
          const normalizedEmail = data.user.email.trim().toLowerCase()
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: { shouldCreateUser: false },
          })

          if (otpError) {
            setIsError(true)
            setErrorMsg(otpError.message)
            return
          }

          setPendingTwoFactorEmail(normalizedEmail)
          setPassword('')
          setErrorMsg('A verification code was sent to your email.')
          return
        }
        navigate('/dashboard')
      }
    } catch {
      setIsError(true)
      setErrorMsg("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyTwoFactor = async (event) => {
    event.preventDefault()
    setLoading(true)
    setIsError(false)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingTwoFactorEmail,
        token: twoFactorCode.trim(),
        type: 'email',
      })

      if (error) {
        setIsError(true)
        setErrorMsg(error.message)
        return
      }

      navigate('/dashboard')
    } catch {
      setIsError(true)
      setErrorMsg('Unable to verify the code.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' }
    })
  }

  return (
    <>
      <style>{`
        @keyframes scaleSlideUp {
          0% { opacity: 0; transform: translateY(60px) scale(0.88); }
          60% { opacity: 1; transform: translateY(-8px) scale(1.02); }
          80% { transform: translateY(4px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% {
            box-shadow:
              0 0 0 0.5px rgba(100, 160, 255, 0.1),
              0 0 20px rgba(50, 100, 220, 0.2),
              0 0 50px rgba(50, 100, 220, 0.08),
              0 20px 60px rgba(0, 0, 0, 0.7),
              inset 0 1px 0 rgba(255,255,255,0.07);
          }
          50% {
            box-shadow:
              0 0 0 0.5px rgba(100, 160, 255, 0.18),
              0 0 32px rgba(50, 120, 255, 0.35),
              0 0 70px rgba(50, 100, 220, 0.14),
              0 20px 60px rgba(0, 0, 0, 0.7),
              inset 0 1px 0 rgba(255,255,255,0.1);
          }
        }
        @keyframes inputFadeIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes btnFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .apple-card {
          background: rgba(8, 18, 40, 0.85);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(100, 160, 255, 0.12);
          border-radius: 22px;
          animation: scaleSlideUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     glowPulse 3.5s ease-in-out 0.85s infinite;
        }

        .input-wrap { animation: inputFadeIn 0.5s ease both; }
        .input-wrap:nth-child(1) { animation-delay: 0.5s; }
        .input-wrap:nth-child(2) { animation-delay: 0.65s; }

        .glow-input {
          background: rgba(100, 160, 255, 0.04);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 12px;
          color: white;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          padding: 10px 16px;
          font-size: 14px;
        }
        .glow-input::placeholder { color: rgba(180, 210, 255, 0.2); }
        .glow-input:focus {
          outline: none;
          border-color: rgba(80, 140, 255, 0.55);
          background: rgba(80, 140, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(60, 120, 255, 0.1), 0 0 12px rgba(60, 120, 255, 0.12);
          transform: translateY(-1px);
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-container .glow-input {
          padding-right: 44px;
        }
        .toggle-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(180, 210, 255, 0.35);
          transition: color 0.2s;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .toggle-btn:hover { color: rgba(180, 210, 255, 0.7); }

        .sign-in-btn {
          background: linear-gradient(135deg, #1a4fd6, #2e86f5);
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          padding: 11px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.04em;
          position: relative;
          overflow: hidden;
          animation: btnFadeIn 0.5s 0.8s ease both;
        }
        .sign-in-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.5s ease;
        }
        .sign-in-btn:hover::before { left: 100%; }
        .sign-in-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(30, 80, 220, 0.45), 0 0 0 1px rgba(100,160,255,0.2);
        }
        .sign-in-btn:active { transform: translateY(0px); }

        .google-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 12px;
          color: rgba(180, 210, 255, 0.7);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          padding: 11px;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          animation: btnFadeIn 0.5s 0.9s ease both;
        }
        .google-btn:hover {
          background: rgba(100, 160, 255, 0.07);
          border-color: rgba(100, 160, 255, 0.22);
          color: rgba(220, 235, 255, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(30, 80, 220, 0.2);
        }
        .google-btn:active { 
          transform: translateY(0px); 
        }
        /* Red error state for inputs */
        .glow-input.error-glow {
          border-color: rgba(255, 70, 70, 0.5) !important;
          background: rgba(255, 70, 70, 0.05) !important;
          box-shadow: 0 0 0 3px rgba(255, 70, 70, 0.1), 0 0 12px rgba(255, 70, 70, 0.15) !important;
        }

        /* Optional: Shake animation para mas ramdam yung error */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake-error {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>

      <div style={{ background: 'linear-gradient(160deg, #020818 0%, #051030 50%, #060d28 100%)', minHeight: '100vh', position: 'relative' }}
        className="flex items-center justify-center overflow-hidden">
        
        <canvas ref={canvasRef} className="absolute inset-0 z-0" />
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(20, 60, 180, 0.12) 0%, transparent 70%)' }} />

        <form
          onSubmit={pendingTwoFactorEmail ? handleVerifyTwoFactor : handleLogin}
          className={`apple-card relative z-10 w-full mx-4 p-8 ${isError ? 'shake-error' : ''}`} 
          style={{ maxWidth: '380px' }}
        >
          
          <div className="text-center mb-7">
            <h1 className="text-2xl font-semibold text-white tracking-wide mb-1">Customer Management</h1>
            <p className="text-xs" style={{ color: 'rgba(180, 210, 255, 0.35)' }}>
              Sign in to your account
            </p>
          </div>

          {pendingTwoFactorEmail ? (
            <div className="input-wrap mb-3">
              <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
                style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Email Code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter verification code"
                className={`glow-input ${isError ? 'error-glow' : ''}`}
                value={twoFactorCode}
                onChange={(e) => {
                  setTwoFactorCode(e.target.value)
                  setIsError(false)
                }}
                required
              />
            </div>
          ) : (
            <>
              <div className="input-wrap mb-3">
                <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
                  style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`glow-input ${isError ? 'error-glow' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsError(false);
                  }}
                  required
                />
              </div>

              <div className="input-wrap mb-1">
                <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
                  style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Password</label>
                <div className="input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`glow-input mb-1.5 ${isError ? 'error-glow' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setIsError(false);
                    }}
                    required
                  />
                  <button type="button" className="toggle-btn mb-1.5" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {isError && (
            <div className="mb-5 text-center">
              <p className="text-[11px] font-medium px-4" style={{ color: '#ff9494', lineHeight: '1.4' }}>
                {errorMsg}
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="sign-in-btn mb-3">
            {loading ? 'Authenticating...' : pendingTwoFactorEmail ? 'Verify Code' : 'Sign In'}
          </button>

          {pendingTwoFactorEmail && (
            <button type="button" onClick={() => {
              setPendingTwoFactorEmail('')
              setTwoFactorCode('')
              setErrorMsg('')
            }} className="google-btn mb-3">
              Back to password
            </button>
          )}

          {!pendingTwoFactorEmail && <button type="button" onClick={handleGoogleLogin} className="google-btn mb-4">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
            Sign in with Google
          </button>}

          <div className="text-center pt-4 mt-2 border-t border-white/5">
            <p className="text-xs" style={{ color: 'rgba(180, 210, 255, 0.45)' }}>
              No account yet?{' '}
              <Link to="/register" className="font-medium hover:underline" style={{ color: '#7eb8ff' }}>
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  )
}

export default Login
