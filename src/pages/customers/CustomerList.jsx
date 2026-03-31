import { Link } from 'react-router-dom'

const CustomerList = () => {
  return (
    <div className="page-content">
      <h1>👥 Customer Directory</h1>
      <table style={{ width: '100%', textAlign: 'left', marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John Doe</td>
            <td>✅ Active</td>
            <td><Link to="/customers/1">View Profile</Link></td>
          </tr>
          <tr>
            <td>Jane Smith</td>
            <td>⏳ Pending</td>
            <td><Link to="/customers/2">View Profile</Link></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default CustomerList