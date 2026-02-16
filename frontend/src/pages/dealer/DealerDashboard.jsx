// ==========================================
// FILE 1: src/components/DealerDashboard.jsx
// ==========================================

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  Plus,
  ArrowRightCircle,
  IdCard,
} from "lucide-react";

const DealerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentDealer = JSON.parse(localStorage.getItem("user"));

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "employee":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const handleBackToList = () => {
    localStorage.removeItem("currentDealer");
    navigate("/admin/dealers");
  };

  if (!currentDealer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No dealer selected</p>
          <button
            onClick={() => navigate("/admin/dealers")}
            className="text-green-600 hover:underline"
          >
            Go back to dealers list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                {/* <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                
                  {currentDealer.name}
                </h1> */}
                <p className="text-sm text-gray-500">
                  Welcome, {currentDealer.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">{currentDealer.email}</p>
                <p className="text-sm text-gray-500">
                  {currentDealer.location}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                  currentDealer.role
                )}`}
              >
                {currentDealer.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">124</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Revenue</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Products</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">89</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Customers</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Recent Orders
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                className="w-full flex items-center gap-3 p-4 bg-gradient bg-amber-700 hover:bg-amber-800 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                onClick={() => navigate("/dealer/products")}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add New Product</span>
              </button>

              {/* <button className="w-full flex items-center gap-3 p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-all">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Sales Report</span>
              </button> */}
            </div>

            {/* Dealer Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">
                Account Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {currentDealer.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {currentDealer.mobile}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <IdCard className="w-4 h-4" />
                  {currentDealer.panCard}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  {currentDealer.storeAddress}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <IdCard className="w-4 h-4" />
                  {currentDealer.storeGstin}
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <p
                    className={`text-sm text-white px-4 py-2 rounded-md ${
                      currentDealer.isActive ? "bg-green-600 " : "bg-red-600"
                    }`}
                  >
                    {currentDealer.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;
