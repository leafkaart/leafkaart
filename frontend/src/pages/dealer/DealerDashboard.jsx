import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  ShoppingCart,
  Package,
  Plus,
  MapPin,
  Image,
  AlertCircle,
  CheckCircle,
  Clock3,
  BadgeCheck,
  DollarSign,
} from "lucide-react";
import { useGetDealerDashboardQuery } from "../../store/api/dealerDashboardApi";

const DealerDashboard = () => {
  const navigate = useNavigate();
  const {
    data: response,
    isLoading,
    error,
  } = useGetDealerDashboardQuery();

  const dashboard = response?.data || {};
  const profile = dashboard.profile || {};
  const stats = dashboard.stats || {};
  const products = dashboard.recentProducts || [];
  const orders = dashboard.recentOrders || [];
  const lowStockProducts = dashboard.lowStockProducts || [];

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Dealer dashboard</h1>
          <p className="text-sm text-gray-600 mt-2">
            {error?.data?.message || error?.error || "Unable to load dealer data."}
          </p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br  from-gray-50 to-gray-100 py-4">
      <div className="max-w-7xl mx-auto  py-2 lg:py-2 space-y-4">
    <div className="">
      <h1 className="text-2xl font-bold text-gray-900">Dealer Dashboard</h1>
    </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="My Products"
            value={stats.products?.total || 0}
            hint={`${stats.products?.approved || 0} approved`}
            icon={<Package className="w-5 h-5 text-amber-700" />}
            loading={isLoading}
          />
          <StatCard
            title="Active Products"
            value={stats.products?.active || 0}
            hint={`${stats.products?.lowStock || 0} low stock`}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            loading={isLoading}
          />
          <StatCard
            title="Assigned Orders"
            value={stats.orders?.total || 0}
            hint={`${stats.orders?.processing || 0} processing`}
            icon={<ShoppingCart className="w-5 h-5 text-orange-600" />}
            loading={isLoading}
          />
          <StatCard
            title="Delivered Orders"
            value={stats.orders?.delivered || 0}
            hint={`${stats.orders?.pending || 0} still open`}
            icon={<Clock3 className="w-5 h-5 text-blue-600" />}
            loading={isLoading}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.revenue?.total || 0)}
            hint="Delivered orders only"
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Panel title="Recent Products" subtitle="Newest products created by this dealer">
              {products.length > 0 ? (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{product.title || "Untitled Product"}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          SKU: {product.sku || "N/A"} | Created: {formatDate(product.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-medium ${
                            product.isApproved
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {product.isApproved ? "Approved" : "Pending"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full font-medium ${
                            product.isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No dealer products found yet." />
              )}
            </Panel>

            <Panel title="Recent Orders" subtitle="Latest orders assigned to this dealer">
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order #{order.orderNumber || order._id}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.user?.name || "Customer"} | {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full font-medium bg-amber-100 text-amber-800 text-sm">
                        {String(order.status || "pending").toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No assigned orders yet." />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <button
              type="button"
              onClick={() => navigate("/dealer/products")}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-amber-800 px-5 py-4 text-white font-semibold hover:bg-amber-900 transition shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add New Product
            </button>

            <Panel
              title="Low Stock Alerts"
              subtitle="Your products with stock below 20 units"
            >
              {lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product._id}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {product.title || "Untitled Product"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            SKU: {product.sku || "N/A"}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                          {product.stock} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No low stock alerts for your products." />
              )}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
};

const Panel = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-6">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const StatCard = ({ title, value, hint, icon, loading }) => (
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {loading ? (
          <div className="mt-3 h-8 w-20 rounded-md bg-gray-100 animate-pulse" />
        ) : (
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">{hint}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const DetailRow = ({ label, value, mono = false }) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
    <span className="text-gray-500">{label}</span>
    <span className={`font-medium text-gray-900 text-right ${mono ? "font-mono" : ""}`}>
      {value || "N/A"}
    </span>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
    <p className="text-sm text-gray-500">{text}</p>
  </div>
);

const InfoPill = ({ icon, label }) => (
  <div className="flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-sm px-3 py-2 text-white">
    <span className="shrink-0">{icon}</span>
    <span className="truncate">{label || "N/A"}</span>
  </div>
);

export default DealerDashboard;
