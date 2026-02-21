import React from "react";
import { X, User, Mail, Phone, Store, MapPin, FileText, CreditCard, Shield, CheckCircle, XCircle, Clock } from "lucide-react";

const DealerModal = ({ dealer, onClose }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <User className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{dealer.name}</h2>
              <p className="text-xs text-gray-500">{dealer.role.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(dealer.status)}`}>
              <Clock className="w-3 h-3 inline mr-1" />
              {dealer.status?.toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${dealer.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {dealer.isActive ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
              {dealer.isActive ? "Active" : "Inactive"}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${dealer.isVerified ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              {dealer.isVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          {/* Personal Info */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" /> Personal Information
            </h3>
            <InfoRow icon={<Mail className="w-4 h-4 text-gray-400" />} label="Email" value={dealer.email} />
            <InfoRow icon={<Phone className="w-4 h-4 text-gray-400" />} label="Mobile" value={dealer.mobile} />
          </div>

          {/* Store Info */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" /> Store Information
            </h3>
            <InfoRow icon={<Store className="w-4 h-4 text-gray-400" />} label="Store Name" value={dealer.storeName} />
            <InfoRow icon={<FileText className="w-4 h-4 text-gray-400" />} label="GSTIN" value={dealer.storeGstin} mono />
            <InfoRow icon={<CreditCard className="w-4 h-4 text-gray-400" />} label="PAN Card" value={dealer.panCard} mono />
            <InfoRow icon={<MapPin className="w-4 h-4 text-gray-400" />} label="Pin Code" value={dealer.pinCode} />
          </div>

          {/* Address */}
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" /> Store Address
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">{dealer.storeAddress}</p>
          </div>

          {/* Meta */}
          <p className="text-xs text-gray-400 text-right">
            Registered: {new Date(dealer.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
      <p className={`text-sm text-gray-700 font-medium ${mono ? "font-mono" : ""}`}>{value || "N/A"}</p>
    </div>
  </div>
);

export default DealerModal;