import Sidebar from './Sidebar'
import ParticlesBg from './ParticlesBg'

function AppShell({ children }) {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .app-shell {
          display: flex;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: #020818;
        }

        .app-shell-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(180deg, #010610 0%, #020c22 50%, #030d1e 100%);
          overflow: hidden;
        }

        @keyframes cloudDrift {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.45; }
          50% { transform: translateX(40px) translateY(-20px); opacity: 0.65; }
        }
        @keyframes cloudDrift2 {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.35; }
          50% { transform: translateX(-30px) translateY(15px); opacity: 0.55; }
        }

        .cloud { position: absolute; border-radius: 50%; }
        .cl1 { width: 1000px; height: 600px; background: radial-gradient(ellipse, rgba(30,60,140,0.85), transparent 70%); filter: blur(80px); top: -20%; left: -25%; animation: cloudDrift 16s ease-in-out infinite; }
        .cl2 { width: 900px; height: 500px; background: radial-gradient(ellipse, rgba(20,40,120,0.75), transparent 70%); filter: blur(90px); top: 25%; right: -25%; animation: cloudDrift2 20s ease-in-out infinite; }
        .cl3 { width: 800px; height: 450px; background: radial-gradient(ellipse, rgba(15,30,100,0.7), transparent 70%); filter: blur(85px); bottom: -10%; left: 5%; animation: cloudDrift 18s ease-in-out infinite reverse; }
        .cl4 { width: 600px; height: 350px; background: radial-gradient(ellipse, rgba(60,20,120,0.5), transparent 70%); filter: blur(90px); top: 20%; left: 20%; animation: cloudDrift2 22s ease-in-out infinite; }

        .fog-mist {
          position: absolute;
          left: 0; right: 0;
          height: 250px;
          filter: blur(50px);
        }
        .mist1 {
          top: 25%;
          background: linear-gradient(90deg, transparent, rgba(40,80,180,0.25) 40%, rgba(50,100,200,0.35) 60%, transparent);
          animation: cloudDrift 28s ease-in-out infinite;
        }
        .mist2 {
          top: 60%;
          background: linear-gradient(90deg, transparent, rgba(30,60,150,0.2) 35%, rgba(40,80,170,0.3) 65%, transparent);
          animation: cloudDrift2 32s ease-in-out infinite;
        }

        .fog-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1.5px 1.5px at 8% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 22% 7%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 38% 18%, rgba(255,255,255,0.55) 0%, transparent 100%),
            radial-gradient(2px 2px at 55% 5%, rgba(255,255,255,0.65) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 72% 14%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(2px 2px at 85% 9%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 30%, rgba(180,210,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 25%, rgba(180,210,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 78% 28%, rgba(180,210,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 92% 32%, rgba(180,210,255,0.3) 0%, transparent 100%);
        }

        .app-shell-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background: rgba(1, 6, 18, 0.52);
        }

        .app-shell-inner {
          position: relative;
          z-index: 2;
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        .app-shell-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .app-shell-content {
          flex: 1;
          padding: 28px;
          overflow-y: auto;
          color: white;
        }

        .app-shell-content::-webkit-scrollbar { width: 4px; }
        .app-shell-content::-webkit-scrollbar-track { background: transparent; }
        .app-shell-content::-webkit-scrollbar-thumb {
          background: rgba(100,160,255,0.1);
          border-radius: 10px;
        }
        .app-shell-content::-webkit-scrollbar-thumb:hover {
          background: rgba(100,160,255,0.2);
        }
      `}</style>

      <div className="app-shell">

        <div className="app-shell-bg">
          <div className="fog-stars" />
          <ParticlesBg />
          <div className="cloud cl1" />
          <div className="cloud cl2" />
          <div className="cloud cl3" />
          <div className="cloud cl4" />
          <div className="fog-mist mist1" />
          <div className="fog-mist mist2" />
        </div>

        <div className="app-shell-overlay" />

        <div className="app-shell-inner">
          <Sidebar />
          <div className="app-shell-main">
            <main className="app-shell-content">
              {children}
            </main>
          </div>
        </div>

      </div>
    </>
  )
}

export default AppShell