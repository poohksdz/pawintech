import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const StaffRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo && userInfo.isStore ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default StaffRoute;
