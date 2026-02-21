import React from "react";
import { X, User, Mail, Phone, CreditCard, FileText, Shield, CheckCircle, XCircle } from "lucide-react";

const EmployeeModal = ({ employee, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{employee.name}</h2>
              <p className="text-xs text-gray-500">{(employee.role || "employee").toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              employee.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {employee.isActive
                ? <><CheckCircle className="w-3 h-3" /> Active</>
                : <><XCircle className="w-3 h-3" /> Inactive</>
              }
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              employee.isVerified ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            }`}>
              <Shield className="w-3 h-3" />
              {employee.isVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          {/* Personal Info */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Personal Information
            </h3>
            <InfoRow icon={<Mail className="w-4 h-4 text-gray-400" />} label="Email" value={employee.email} />
            <InfoRow icon={<Phone className="w-4 h-4 text-gray-400" />} label="Mobile" value={employee.mobile} />
          </div>

          {/* Documents */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Documents
            </h3>
            <InfoRow icon={<CreditCard className="w-4 h-4 text-gray-400" />} label="PAN Card" value={employee.panCard} mono />
            <InfoRow icon={<FileText className="w-4 h-4 text-gray-400" />} label="Aadhar Card" value={employee.aadharCard} mono />
          </div>

          {/* Meta */}
          <p className="text-xs text-gray-400 text-right">
            Registered: {new Date(employee.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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

export default EmployeeModal;