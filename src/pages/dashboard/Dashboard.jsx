function Dashboard() {
  return (
    <div className="dashboard-empty">
      <style>{`
        .dashboard-empty {
          min-height: 100%;
          display: grid;
          place-items: center;
          color: rgba(180, 210, 255, 0.48);
          font-size: 13px;
          text-align: center;
        }
      `}</style>
      <span>Dashboard is temporarily cleared.</span>
    </div>
  )
}

export default Dashboard
