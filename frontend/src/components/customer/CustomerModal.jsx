import React from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  IndianRupee,
  CheckCircle,
  XCircle,
  Shield,
  Package,
} from "lucide-react";

const CustomerModal = ({ customer, onClose }) => {
  if (!customer) return null;

  const addr = customer.defaultAddress;
  const orders = customer.orders || [];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const statusColor = (status) => {
    const map = {
      order_placed: "bg-blue-100 text-blue-700",
      processing: "bg-amber-100 text-amber-700",
      packed: "bg-amber-100 text-amber-700",
      ready_for_dispatch: "bg-amber-100 text-amber-700",
      shipped: "bg-indigo-100 text-indigo-700",
      out_for_delivery: "bg-indigo-100 text-indigo-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      returned: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {customer.name}
              </h2>
              <p className="text-xs text-gray-500">CUSTOMER</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                customer.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {customer.isActive ? (
                <>
                  <CheckCircle className="w-3 h-3" /> Active
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" /> Inactive
                </>
              )}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                customer.isVerified
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Shield className="w-3 h-3" />
              {customer.isVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          {/* Personal Info */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Personal Information
            </h3>
            <InfoRow
              icon={<Mail className="w-4 h-4 text-gray-400" />}
              label="Email"
              value={customer.email}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4 text-gray-400" />}
              label="Mobile"
              value={customer.mobile}
            />
          </div>

          {/* Address */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" /> Address
            </h3>
            {addr ? (
              <div className="text-sm text-gray-700">
                <p className="font-medium">{addr.name || customer.name}</p>
                <p className="text-gray-600 mt-0.5">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-gray-600">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-gray-600">{addr.country || "India"}</p>
                {addr.phone && (
                  <p className="text-gray-500 mt-1 text-xs">
                    Phone: {addr.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No address on file</p>
            )}
          </div>

          {/* Order Summary */}
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" /> Order Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                <p className="text-xl font-bold text-gray-800 flex items-center gap-1">
                  <Package className="w-4 h-4 text-gray-400" />
                  {customer.orderCount ?? orders.length}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                <p className="text-xl font-bold text-gray-800 flex items-center gap-1">
                  <IndianRupee className="w-4 h-4 text-gray-400" />
                  {formatCurrency(customer.totalSpent).replace("₹", "")}
                </p>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" /> Order History
            </h3>

            {orders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}{" "}
                        · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(
                          order.status
                        )}`}
                      >
                        {order.status?.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-semibold text-gray-800 min-w-[70px] text-right">
                        {formatCurrency(order.grandTotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <p className="text-xs text-gray-400 text-right">
            Registered: {formatDate(customer.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, mono }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`text-sm text-gray-700 font-medium ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "N/A"}
      </p>
    </div>
  </div>
);

export default CustomerModal;
