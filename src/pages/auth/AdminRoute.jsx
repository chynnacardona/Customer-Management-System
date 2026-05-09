import { Navigate } from 'react-router-dom';
import { useRights } from '../../context/UserRightsContext';

const AdminRoute = ({ children }) => {
  const { userType, rightsLoading } = useRights();

  if (rightsLoading) {
    return <div className="loading-screen">Verifying access...</div>;
  }

  // Block the USER role from accessing this route
  if (userType === 'USER') {
    return <Navigate to="/customers" replace />;
  }

  return children;
};

export default AdminRoute;