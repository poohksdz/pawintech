import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const PCBAdminRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo && userInfo.isPCBAdmin ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};
export default PCBAdminRoute;
