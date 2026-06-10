import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Leaf,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle,
  Building2,
  CreditCard,
  AlertCircle,
  MapPin,
  Image,
  X,
} from "lucide-react";
import onlylogo from '../../assets/onlylogo.png';
import logo from '../../assets/logo.png';
import { useNavigate } from "react-router-dom";

const Register = () => {
  
  const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState("success");
    const [toastMessage, setToastMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    storeName: "",
    storeGstin: "",
    panCard: "",
    storeAddress: "",
    pinCode: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealerPhotos, setDealerPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const navigate = useNavigate();
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.mobile) newErrors.mobile = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.mobile))
      newErrors.mobile = "Phone must be 10 digits";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.storeName) newErrors.storeName = "Store name is required";
    if (!formData.storeGstin) newErrors.storeGstin = "GSTIN is required";
    if (!formData.panCard) newErrors.panCard = "PAN card is required";
    if (!formData.storeAddress)
      newErrors.storeAddress = "Store address is required";
    if (!formData.pinCode) newErrors.pinCode = "Pin code is required";
    else if (!/^\d{6}$/.test(formData.pinCode))
      newErrors.pinCode = "Pin code must be 6 digits";
    if (dealerPhotos.length < 3)
      newErrors.dealerPhotos = "Please upload at least 3 dealer photos";
    else if (dealerPhotos.length > 5)
      newErrors.dealerPhotos = "You can upload up to 5 dealer photos";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const invalidFiles = selectedFiles.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        dealerPhotos: "Only image files are allowed",
      }));
      return;
    }

    const nextFiles = [...dealerPhotos, ...selectedFiles].slice(0, 5);
    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file));

    photoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setDealerPhotos(nextFiles);
    setPhotoPreviews(nextPreviews);

    if (errors.dealerPhotos) {
      setErrors({ ...errors, dealerPhotos: "" });
    }

    e.target.value = "";
  };

  const removePhoto = (index) => {
    const nextFiles = dealerPhotos.filter((_, fileIndex) => fileIndex !== index);
    const nextPreviews = photoPreviews.filter(
      (_, previewIndex) => previewIndex !== index
    );

    URL.revokeObjectURL(photoPreviews[index]);
    setDealerPhotos(nextFiles);
    setPhotoPreviews(nextPreviews);
  };

  
  const handleSubmit = async () => {
    if (!validateForm()) {
      setToastType("error");
      setToastMessage("Please fix all errors before submitting");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsSubmitting(true);

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("email", formData.email);
    payload.append("password", formData.password);
    payload.append("mobile", formData.mobile);
    payload.append("storeName", formData.storeName);
    payload.append("storeGstin", formData.storeGstin);
    payload.append("panCard", formData.panCard);
    payload.append("storeAddress", formData.storeAddress);
    payload.append("pinCode", formData.pinCode);
    payload.append("role", "dealer");
    dealerPhotos.forEach((photo) => payload.append("dealerPhotos", photo));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/dealer-register`,
        {
          method: "POST",
          body: payload,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setToastType("error");
        setToastMessage(data.message || "Registration failed. Please try again.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobile: "",
        storeName: "",
        storeGstin: "",
        panCard: "",
        storeAddress: "",
        pinCode: "",
      });
      setErrors({});
      photoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setDealerPhotos([]);
      setPhotoPreviews([]);

      setToastType("success");
      setToastMessage(
        "Registration successful! Your account is pending approval from admin."
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setTimeout(() => {
         navigate("/waiting-for-approval");
      }, 3000);
     
    } catch (error) {
      console.error("Error:", error);
      setToastType("error");
      setToastMessage("Server error! Please try again later.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
        {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div
            className={`${
              toastType === "success"
                ? "bg-green-600"
                : "bg-red-600"
            } text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md`}
          >
            <div className="bg-white bg-opacity-20 p-2 rounded-lg flex-shrink-0">
              {toastType === "success" ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">
                {toastType === "success" ? "Success!" : "Error!"}
              </p>
              <p className="text-sm opacity-90">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-amber-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 border-4 border-white rounded-full" />
          <div className="absolute bottom-40 right-10 w-60 h-60 border-4 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border-4 border-white rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-20 h-20  backdrop-blur rounded-xl flex items-center justify-center">
             <img src={onlylogo} alt="" />
            </div>
            <span className="text-2xl font-bold text-white">LEAFKAART</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Join our growing
            <br />
            community today
          </h1>
          <p className="text-amber-100 text-lg max-w-md">
            Create an account to grow your business with LEAFKAART.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            "Wide range of products",
            "Trusted Customer network",
            "Secure transactions",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-white">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center  overflow-hidden p-4">
        <div className="w-full px-4 h-full flex flex-col">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center py-4">
            <div className="inline-flex items-center justify-center w-24 h-20 rounded-xl mb-2">
              <img src={logo} alt="" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Dealer Registration</h1>
          </div>

          {/* Scrollable Form Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-1">
            <div className="space-y-6 pb-6">
              {/* Personal Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-800" />
                  Personal Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.name
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.mobile
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="9876543210"
                      />
                    </div>
                    {errors.mobile && (
                      <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.email
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.password
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="Min. 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.confirmPassword
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-800" />
                  Business Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Store Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.storeName
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="Your Store Name"
                      />
                    </div>
                    {errors.storeName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.storeName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      GSTIN
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="storeGstin"
                        value={formData.storeGstin}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.storeGstin
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    {errors.storeGstin && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.storeGstin}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      PAN Card
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="panCard"
                        value={formData.panCard}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.panCard
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    {errors.panCard && (
                      <p className="text-red-500 text-xs mt-1">{errors.panCard}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Store Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        name="storeAddress"
                        value={formData.storeAddress}
                        onChange={handleChange}
                        rows="2"
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition resize-none ${
                          errors.storeAddress
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="Enter your store address"
                      />
                    </div>
                    {errors.storeAddress && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.storeAddress}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pin Code
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition ${
                          errors.pinCode
                            ? "border-red-400 bg-red-50"
                            : "border-gray-100 bg-gray-50 focus:bg-white"
                        }`}
                        placeholder="462001"
                      />
                    </div>
                    {errors.pinCode && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.pinCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Dealer Photos *
                    </label>
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg px-4 py-5 cursor-pointer hover:bg-amber-100 transition">
                      <Image className="w-5 h-5 text-amber-700" />
                      <span className="text-sm font-medium text-gray-700">
                        Upload 3 to 5 dealer photos
                      </span>
                      <span className="text-xs text-gray-500">
                        The admin will review these before approval
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {dealerPhotos.length}/5 selected
                    </p>
                    {errors.dealerPhotos && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.dealerPhotos}
                      </p>
                    )}

                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {photoPreviews.map((preview, index) => (
                          <div
                            key={`${preview}-${index}`}
                            className="relative rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={preview}
                              alt={`Dealer preview ${index + 1}`}
                              className="h-20 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                              aria-label={`Remove photo ${index + 1}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-amber-800 hover:bg-amber-900 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 text-sm"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-amber-700 hover:text-amber-800 font-semibold"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
