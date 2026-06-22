import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  User,
  Mail,
  Phone,
  Building2,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Image,
} from "lucide-react";

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
    });
  }, [user]);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const userRole = user?.role?.toLowerCase() || "admin";
  const supportedRoles = ["admin", "employee", "dealer"];
  const isSupportedRole = supportedRoles.includes(userRole);
  const displayRole = isSupportedRole ? userRole : "admin";
  const profilePhoto = user?.profilePic || "";
  const dealerPhotos = Array.isArray(user?.dealerPhotos) ? user.dealerPhotos : [];

  const getRoleDisplayText = (role) => {
    const roleMap = {
      admin: "Administrator",
      employee: "Employee",
      dealer: "Dealer",
    };
    return roleMap[role] || role;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayValue = (value) => {
    if (value === undefined || value === null || value === "") return "N/A";
    if (typeof value === "object") {
      return value.name || value.email || value._id || "N/A";
    }
    return value;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!profileData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(profileData.mobile.replace(/\D/g, ""))) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {
      // TODO: Replace with actual API call
      // await dispatch(updateProfile(profileData)).unwrap();
      
      // console.log("Saving profile:", profileData);
      
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrors({ submit: error.message || "Failed to update profile" });
    }
  };

  const handleCancelProfile = () => {
    setIsEditing(false);
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
    });
    setErrors({});
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      // TODO: Replace with actual API call
      // await dispatch(changePassword(passwordData)).unwrap();
      
      // console.log("Changing password");
      
      setSuccessMessage("Password changed successfully!");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrors({ submit: error.message || "Failed to change password" });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account information and preferences
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{errors.submit}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={`${user?.name || "User"} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 md:w-16 md:h-16 text-amber-600" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* User Info */}
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {user?.name || "User Name"}
                </h2>
                <p className="text-amber-100 mt-1">{user?.email || "leafkaart.in@gmail.com"}</p>
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <Building2 className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm">
                    {getRoleDisplayText(userRole)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-50 rounded-2xl border border-gray-200 p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Basic Information
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Only fields stored in the user record are shown here.
                    </p>
                  </div>

                  {!isEditing && !isChangingPassword && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white text-amber-700 border border-amber-200 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <ProfileField
                    label="Full Name"
                    icon={<User className="w-5 h-5 text-gray-400" />}
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    error={errors.name}
                    placeholder="Enter your full name"
                  />
                  <ProfileField
                    label="Email Address"
                    icon={<Mail className="w-5 h-5 text-gray-400" />}
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled
                    readOnly
                    error={errors.email}
                    placeholder="Enter your email"
                  />
                  <ProfileField
                    label="Mobile Number"
                    icon={<Phone className="w-5 h-5 text-gray-400" />}
                    name="mobile"
                    value={profileData.mobile}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    error={errors.mobile}
                    placeholder="Enter your mobile number"
                  />
                  <ProfileField
                    label="Role"
                    icon={<Building2 className="w-5 h-5 text-gray-400" />}
                    value={getRoleDisplayText(displayRole)}
                    readOnly
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-5 pt-5 border-t border-gray-200">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 md:flex-none px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelProfile}
                      className="flex-1 md:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 md:p-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Account Status
                </h3>
                <div className="mt-5 space-y-3">
                  <StatusRow label="Status" value={displayValue(user?.status)} />
                  <StatusRow
                    label="Verified"
                    value={user?.isVerified ? "Yes" : "No"}
                    tone={user?.isVerified ? "success" : "muted"}
                  />
                  <StatusRow
                    label="Active"
                    value={user?.isActive ? "Yes" : "No"}
                    tone={user?.isActive ? "success" : "muted"}
                  />
                  {/* <StatusRow
                    label="Created"
                    value={formatDate(user?.createdAt)}
                  />
                  <StatusRow
                    label="Profile Photo"
                    value={profilePhoto ? "Uploaded" : "Not uploaded"}
                    tone={profilePhoto ? "success" : "muted"}
                  />
                  <StatusRow
                    label="Updated"
                    value={formatDate(user?.updatedAt)}
                  />
                  <StatusRow
                    label="Last Login"
                    value={formatDate(user?.meta?.lastLoginAt)}
                  />
                  <StatusRow
                    label="Approved At"
                    value={formatDate(user?.approvedAt)}
                  />
                  <StatusRow
                    label="Approved By"
                    value={displayValue(user?.approvedBy)}
                  /> */}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Role Details
                  </h3>
                  <p className="text-sm text-gray-500">
                    Additional fields stored for your account type.
                  </p>
                </div>
              </div>

              {displayRole === "dealer" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadOnlyField label="Store Name" value={user?.storeName} />
                    <ReadOnlyField
                      label="Store GSTIN"
                      value={user?.storeGstin}
                      mono
                    />
                    <ReadOnlyField
                      label="PAN Card"
                      value={user?.panCard}
                      mono
                    />
                    <ReadOnlyField
                      label="Pin Code"
                      value={user?.pinCode}
                    />
                    <div className="sm:col-span-2">
                      <ReadOnlyField
                        label="Store Address"
                        value={user?.storeAddress}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="w-5 h-5 text-amber-700" />
                      <h4 className="font-semibold text-gray-900">
                        Dealer Photos
                      </h4>
                      <span className="text-xs text-gray-500">
                        {dealerPhotos.length} image{dealerPhotos.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {dealerPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {dealerPhotos.map((photo, index) => (
                          <a
                            key={`${photo}-${index}`}
                            href={photo}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                          >
                            <img
                              src={photo}
                              alt={`Dealer photo ${index + 1}`}
                              className="h-28 w-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No dealer photos uploaded.
                      </p>
                    )}
                  </div>
                </div>
              ) : displayRole === "employee" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="PAN Card" value={user?.panCard} mono />
                  <ReadOnlyField
                    label="Aadhar Card"
                    value={user?.aadharCard}
                    mono
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField
                    label="Profile Photo"
                    value={profilePhoto ? "Uploaded" : "Not uploaded"}
                  />
                  <ReadOnlyField
                    label="Role"
                    value={getRoleDisplayText(displayRole)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  Security
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your password and security settings
                </p>
              </div>
              {!isChangingPassword && !isEditing && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 text-amber-700 border border-amber-300 rounded-lg font-medium hover:bg-amber-50 transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                        errors.currentPassword ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                        errors.newPassword ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 md:flex-none px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setErrors({});
                    }}
                    className="flex-1 md:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">••••••••</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({
  label,
  icon,
  name,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  error,
  placeholder,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
          disabled || readOnly
            ? "bg-gray-50 border-gray-200 cursor-not-allowed"
            : "bg-white border-gray-300"
        } ${error ? "border-red-500" : ""}`}
        placeholder={placeholder}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const ReadOnlyField = ({ label, value, mono = false }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
      {label}
    </p>
    <p
      className={`mt-2 text-sm font-semibold text-gray-900 break-words ${
        mono ? "font-mono" : ""
      }`}
    >
      {value ? value : "N/A"}
    </p>
  </div>
);

const StatusRow = ({ label, value, tone = "neutral" }) => {
  const toneClasses = {
    success: "bg-green-100 text-green-700",
    muted: "bg-gray-100 text-gray-600",
    accent: "bg-amber-100 text-amber-800",
    neutral: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full ${
          toneClasses[tone] || toneClasses.neutral
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default ProfilePage;
