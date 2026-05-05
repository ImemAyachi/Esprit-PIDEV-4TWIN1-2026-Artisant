import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleRoute = ({ children, roles }) => {
  const { user } = useSelector((s) => s.auth);
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard/home" replace />;
  }
  return children;
};
export default RoleRoute;
