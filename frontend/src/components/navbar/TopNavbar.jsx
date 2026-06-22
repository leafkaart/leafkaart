import React from "react";
import { Calendar } from "lucide-react";
import { useLocation } from "react-router-dom";
import NotificationBell from "../NotificationBell";

const getTitleFromPath = (pathname) => {
  const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const titles = {
    dashboard: "Dashboard",
    products: "Products",
    dealers: "Dealers",
    customers: "Customers",
    employees: "Employees",
    orders: "Orders",
    categories: "Categories",
    banners: "Banners",
    profile: "Profile",
    "user-register": "User Register",
  };

  return titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
};

const TopNavbar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-52 z-40 bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            {role} Panel
          </p>
          <h1 className="text-xl font-bold text-gray-900">
            {getTitleFromPath(location.pathname)}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
