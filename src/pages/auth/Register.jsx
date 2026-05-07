import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock3, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from "../../supabase/supabaseClient";

function Register() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  // --- States for Form Data ---
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Idagdag itong dalawa para sa visibility ng password
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorField, setErrorField] = useState('') // Importante ito para sa red border

  const [isSuccess, setIsSuccess] = useState(false); // Para sa visibility ng success card

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
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // --- Registration Logic ---
  const handleRegister = async (e) => {
  e.preventDefault()
  setLoading(true)
  setErrorMsg('')
  setErrorField('')

  // Check kung magkapareho ang password
  if (password !== confirmPassword) {
    setErrorMsg("Passwords do not match!")
    setErrorField('confirmPassword') // I-rered ang confirm password
    setLoading(false)
    return
  }

  try {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          username,
        }
      }
    })

    if (signUpError) throw signUpError

    if (data.user?.identities?.length === 0) {
      setErrorField('email')
      setErrorMsg("This email is already registered. Try signing in instead.")
      return
    }

    if (data.user) {
      setIsSuccess(true);
      setLoading(false);

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  } catch (error) {
    const message = error.message || 'Registration failed. Please try again.'
    if (message.toLowerCase().includes('database error')) {
      setErrorMsg('Your auth account was removed, but the old profile row may still exist in the database. Ask the DB owner to rerun the provision user trigger migration, then try again.')
    } else {
      setErrorMsg(message)
    }
    if (message.toLowerCase().includes("email")) setErrorField('email')
    if (message.toLowerCase().includes("password")) setErrorField('password')
  } finally {
    setLoading(false)
  }
}

  const handleGoogleRegister = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
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
        .input-wrap:nth-child(2) { animation-delay: 0.62s; }
        .input-wrap:nth-child(3) { animation-delay: 0.74s; }
        .input-wrap:nth-child(4) { animation-delay: 0.86s; }
        .input-wrap:nth-child(5) { animation-delay: 0.98s; }

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
          bottom: 4px;
        }
        .toggle-btn:hover { color: rgba(180, 210, 255, 0.7); }

        .create-btn {
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
          animation: btnFadeIn 0.5s 1.1s ease both;
        }
        .create-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.5s ease;
        }
        .create-btn:hover::before { left: 100%; }
        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(30, 80, 220, 0.45), 0 0 0 1px rgba(100,160,255,0.2);
        }
        .create-btn:active { 
        transform: translateY(0px); 
        }
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px;
          border-radius: 12px;
          border: 1px solid rgba(100, 160, 255, 0.1);
          background: rgba(255,255,255,0.03);
          color: rgba(180, 210, 255, 0.7);
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .google-btn:hover {
          background: rgba(100, 160, 255, 0.07);
          border-color: rgba(100, 160, 255, 0.22);
          color: rgba(220, 235, 255, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(30, 80, 220, 0.2);
        }
        .error-glow {
          border-color: rgba(255, 100, 100, 0.5) !important;
          background: rgba(255, 50, 50, 0.05) !important;
          box-shadow: 0 0 10px rgba(255, 50, 50, 0.15) !important;
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .shake-error {
          animation: shakeError 0.4s ease-in-out;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes successCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .success-notification {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(1, 6, 18, 0.68);
          backdrop-filter: blur(8px);
        }
        .success-card {
          width: min(420px, 100%);
          padding: 24px;
          border-radius: 22px;
          border: 1px solid rgba(126, 184, 255, 0.16);
          background: rgba(8, 18, 40, 0.96);
          box-shadow: 0 24px 60px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.06);
          text-align: center;
          animation: successCardIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .success-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(134, 239, 172, 0.24);
          color: #86efac;
          box-shadow: 0 10px 28px rgba(34, 197, 94, 0.12);
        }
        .success-title {
          margin: 0;
          color: rgba(245, 250, 255, 0.96);
          font-size: 18px;
          font-weight: 800;
        }
        .success-copy {
          margin: 9px 0 0;
          color: rgba(190, 215, 255, 0.62);
          font-size: 13px;
          line-height: 1.55;
        }
        .pending-pill {
          margin: 18px auto 0;
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background: rgba(59, 130, 246, 0.1);
          color: rgba(191, 219, 254, 0.9);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
      `}</style>

      <div style={{ background: 'linear-gradient(160deg, #020818 0%, #051030 50%, #060d28 100%)', minHeight: '100vh', position: 'relative' }}
        className="flex items-center justify-center overflow-hidden">

        <canvas ref={canvasRef} className="absolute inset-0 z-0" />
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(20, 60, 180, 0.12) 0%, transparent 70%)' }} />

        {/* Card - Wrapped in FORM */}
        <form onSubmit={handleRegister} className="apple-card relative z-10 w-full mx-4 p-8" style={{ maxWidth: '380px' }}>

          <div className="text-center mb-7">
            <h1 className="text-2xl font-semibold text-white tracking-wide mb-1">Customer Management</h1>
            <p className="text-xs" style={{ color: 'rgba(180, 210, 255, 0.35)' }}>
              Create your account
            </p>
          </div>

          {/* First Name & Last Name */}
          <div className="input-wrap flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
                style={{ color: 'rgba(180, 210, 255, 0.38)' }}>First Name</label>
              <input 
                type="text" 
                placeholder="First name" 
                className="glow-input" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
                style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Last Name</label>
              <input 
                type="text" 
                placeholder="Last name" 
                className="glow-input" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-wrap mb-3">
            <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
              style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              className={`glow-input ${errorField === 'username' ? 'error-glow' : ''}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="input-wrap mb-3">
            <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
              style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              // Dito papasok yung red border logic
              className={`glow-input ${errorField === 'email' ? 'error-glow' : ''}`} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="input-wrap mb-3">
            <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
              style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Password</label>
            <div className="input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className={`glow-input ${errorField === 'password' ? 'error-glow' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-btn mb-1.5" // Sinunod natin yung class mo sa login
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-wrap mb-5">
            <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
              style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Confirm Password</label>
            <div className="input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                className={`glow-input ${errorField === 'confirmPassword' ? 'error-glow' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-btn mb-1.5" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Lalabas lang ito kapag may errorMsg na state */}
          {errorMsg && (
            <div className="mb-4 text-center">
              <p className="text-[11px] font-medium" style={{ color: '#ff9494' }}>
                {errorMsg}
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="create-btn">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <button type="button" onClick={handleGoogleRegister} className="google-btn mt-3">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
            Register with Google
          </button>

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(180,210,255,0.25)' }}>
            Already have an account?{" "}
            <Link to="/login" className="font-medium transition-all hover:opacity-80"
              style={{ color: '#7eb8ff' }}>Sign In</Link>
          </p>

        </form>

        {/* Success Notification */}
        {isSuccess && (
          <div className="success-notification">
            <div className="success-card">
              <div className="success-icon">
                <CheckCircle2 size={30} />
              </div>
              <h4 className="success-title">Registration successful</h4>
              <p className="success-copy">
                Your account was created and is now waiting for Sales Manager activation. You will be redirected to sign in shortly.
              </p>
              <div className="pending-pill">
                <Clock3 size={14} />
                Pending activation
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Register
