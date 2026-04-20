import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from "../../supabase/supabaseClient";

function Register() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  // --- States for Form Data ---
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    
    if (password !== confirmPassword) {
      return alert("Passwords do not match!")
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      })

      if (error) throw error

      if (data) {
        alert("Registration successful! Please check your email for verification if enabled, or sign in now.")
        navigate('/login')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Eye icon
  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  // Eye-off icon
  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

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
        .create-btn:active { transform: translateY(0px); }
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

          {/* Email */}
          <div className="input-wrap mb-3">
            <label className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
              style={{ color: 'rgba(180, 210, 255, 0.38)' }}>Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="glow-input" 
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
                className="glow-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
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
                className="glow-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" className="toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="create-btn">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(180,210,255,0.25)' }}>
            Already have an account?{" "}
            <a href="/login" className="font-medium transition-all hover:opacity-80"
              style={{ color: '#7eb8ff' }}>Sign In</a>
          </p>

        </form>
      </div>
    </>
  )
}

export default Register