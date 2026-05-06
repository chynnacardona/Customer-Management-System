import { Link, useParams } from 'react-router-dom'

const CustomerDetail = () => {
  const { id } = useParams() // This grabs the ":id" from the URL!

  return (
    <div className="page-content">
      <h1>👤 Customer Profile</h1>
      <p>Viewing details for Customer ID: <strong>{id}</strong></p>
      <Link to="/customers">← Back to List</Link>
    </div>
  )
}

export default CustomerDetail