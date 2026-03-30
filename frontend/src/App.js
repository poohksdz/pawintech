import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { logout } from "./slices/authSlice";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const expirationTime = localStorage.getItem("expirationTime");

    if (expirationTime) {
      const currentTime = new Date().getTime();

      if (currentTime > Number(expirationTime)) {
        dispatch(logout());
      }
    }
  }, [dispatch]);

  return (
    <>
      {/* Toast */}
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />

      {/* Global Header */}
      <Header />

      {/* Main Layout */}
      <main className="min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500">
        <div key={location.pathname} className="animate-pageFade w-full">
          <Outlet />
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </>
  );
};

export default App;
