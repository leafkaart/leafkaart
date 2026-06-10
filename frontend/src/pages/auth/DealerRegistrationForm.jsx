import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Store,
  FileText,
  CreditCard,
  MapPin,
  CheckCircle,
  AlertCircle,
  Image,
  X,
} from "lucide-react";
import logo from "../../assets/logo.png";

const DealerRegistrationForm = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dealerPhotos, setDealerPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
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

  const steps = [
    { id: 1, title: "Personal", subtitle: "Account details", icon: User },
    { id: 2, title: "Business", subtitle: "Store details", icon: Store },
    { id: 3, title: "Photos", subtitle: "Upload & review", icon: Image },
  ];

  const stepFields = {
    1: ["name", "mobile", "email", "password", "confirmPassword"],
    2: ["storeName", "storeGstin", "panCard", "storeAddress", "pinCode"],
    3: ["dealerPhotos"],
  };

  const fieldToStep = {
    name: 1,
    mobile: 1,
    email: 1,
    password: 1,
    confirmPassword: 1,
    storeName: 2,
    storeGstin: 2,
    panCard: 2,
    storeAddress: 2,
    pinCode: 2,
    dealerPhotos: 3,
  };

  const validateAllFields = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    else if (formData.name.length < 3)
      newErrors.name = "Name must be at least 3 characters";

    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile))
      newErrors.mobile = "Mobile must be 10 digits";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.storeName) newErrors.storeName = "Store name is required";
    else if (formData.storeName.length < 3)
      newErrors.storeName = "Store name must be at least 3 characters";

    if (!formData.storeGstin) newErrors.storeGstin = "GSTIN is required";
    else if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        formData.storeGstin
      )
    ) {
      newErrors.storeGstin = "Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)";
    }

    if (!formData.panCard) newErrors.panCard = "PAN card is required";
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panCard))
      newErrors.panCard = "Invalid PAN format (e.g., ABCDE1234F)";

    if (!formData.storeAddress)
      newErrors.storeAddress = "Store address is required";
    else if (formData.storeAddress.length < 10)
      newErrors.storeAddress = "Please provide a complete address";

    if (!formData.pinCode) newErrors.pinCode = "Pin code is required";
    else if (!/^\d{6}$/.test(formData.pinCode))
      newErrors.pinCode = "Pin code must be 6 digits";

    if (dealerPhotos.length < 3)
      newErrors.dealerPhotos = "Please upload at least 3 dealer photos";
    else if (dealerPhotos.length > 5)
      newErrors.dealerPhotos = "You can upload up to 5 dealer photos";

    return newErrors;
  };

  const validateCurrentStep = () => {
    const allErrors = validateAllFields();
    const stepErrors = {};

    stepFields[currentStep].forEach((field) => {
      if (allErrors[field]) {
        stepErrors[field] = allErrors[field];
      }
    });

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const validateEntireForm = () => {
    const allErrors = validateAllFields();
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      const firstErrorField = Object.keys(allErrors)[0];
      setCurrentStep(fieldToStep[firstErrorField] || 1);
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue =
      name === "storeGstin" || name === "panCard" ? value.toUpperCase() : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const invalidFiles = selectedFiles.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length) {
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
      setErrors((prev) => ({ ...prev, dealerPhotos: "" }));
    }

    e.target.value = "";
  };

  const removePhoto = (index) => {
    const nextFiles = dealerPhotos.filter((_, i) => i !== index);
    const nextPreviews = photoPreviews.filter((_, i) => i !== index);

    URL.revokeObjectURL(photoPreviews[index]);
    setDealerPhotos(nextFiles);
    setPhotoPreviews(nextPreviews);
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      setToastType("error");
      setToastMessage("Please complete the required fields before continuing");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateEntireForm()) {
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
        setToastMessage(
          data.message || "Registration failed. Please try again."
        );
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
      setCurrentStep(1);
      photoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setDealerPhotos([]);
      setPhotoPreviews([]);

      setToastType("success");
      setToastMessage(
        "Registration successful! Your account is pending approval from admin."
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
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
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div
            className={`${
              toastType === "success" ? "bg-green-600" : "bg-red-600"
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

      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/3 bg-amber-800 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-40 h-40 border-4 border-white rounded-full" />
            <div className="absolute bottom-40 right-10 w-60 h-60 border-4 border-white rounded-full" />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 border-4 border-white rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-20 h-20 backdrop-blur rounded-xl flex items-center justify-center">
                <img src={logo} alt="LEAFKAART" />
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

        <div className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-5xl">
            <div className="min-h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/70 overflow-hidden flex flex-col">
              <div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-gradient-to-r from-white to-amber-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.18em]">
                      Dealer Registration
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-gray-900">
                      Step {currentStep} of 3
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Complete the form step by step. Your account will be
                      reviewed after submission.
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
                    <img
                      src={logo}
                      alt="Leafkaart"
                      className="h-10 w-auto object-contain"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        LEAFKAART
                      </p>
                      <p className="text-xs text-gray-500">Dealer onboarding</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isDone = currentStep > step.id;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setCurrentStep(step.id)}
                        className={`text-left rounded-2xl border p-3 sm:p-4 transition ${
                          isActive
                            ? "border-amber-500 bg-amber-50 shadow-sm"
                            : isDone
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isActive
                                ? "bg-amber-700 text-white"
                                : isDone
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {step.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {step.subtitle}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-700 via-orange-500 to-yellow-500 transition-all duration-300"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 px-6 py-6 sm:px-8 sm:py-7 bg-gradient-to-b from-white to-gray-50 overflow-y-auto">
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <TextField
                      label="Full Name"
                      required
                      icon={<User className="w-5 h-5 text-gray-400" />}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      error={errors.name}
                    />
                    <TextField
                      label="Mobile Number"
                      required
                      icon={<Phone className="w-5 h-5 text-gray-400" />}
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      maxLength={10}
                      error={errors.mobile}
                    />
                    <TextField
                      label="Email Address"
                      required
                      icon={<Mail className="w-5 h-5 text-gray-400" />}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      error={errors.email}
                    />
                    <TextField
                      label="Password"
                      required
                      icon={<Lock className="w-5 h-5 text-gray-400" />}
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      error={errors.password}
                    />
                    <div className="md:col-span-2">
                      <TextField
                        label="Confirm Password"
                        required
                        icon={<Lock className="w-5 h-5 text-gray-400" />}
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        error={errors.confirmPassword}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <TextField
                      label="Store Name"
                      required
                      icon={<Store className="w-5 h-5 text-gray-400" />}
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="Enter your store name"
                      error={errors.storeName}
                    />
                    <TextField
                      label="Store GSTIN"
                      required
                      icon={<FileText className="w-5 h-5 text-gray-400" />}
                      name="storeGstin"
                      value={formData.storeGstin}
                      onChange={handleChange}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      error={errors.storeGstin}
                    />
                    <TextField
                      label="PAN Card Number"
                      required
                      icon={<CreditCard className="w-5 h-5 text-gray-400" />}
                      name="panCard"
                      value={formData.panCard}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      error={errors.panCard}
                    />
                    <TextField
                      label="Pin Code"
                      required
                      icon={<MapPin className="w-5 h-5 text-gray-400" />}
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      placeholder="6-digit pin code"
                      maxLength={6}
                      error={errors.pinCode}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Address *
                      </label>
                      <textarea
                        name="storeAddress"
                        value={formData.storeAddress}
                        onChange={handleChange}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition ${
                          errors.storeAddress
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                        placeholder="Enter complete store address with landmarks"
                      />
                      {errors.storeAddress && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.storeAddress}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dealer Photos *{" "}
                        <span className="text-gray-400">(3 to 5 images)</span>
                      </label>
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-300 bg-amber-50 rounded-2xl px-4 py-8 cursor-pointer hover:bg-amber-100 transition">
                        <Image className="w-7 h-7 text-amber-700" />
                        <span className="text-sm font-semibold text-gray-800">
                          Upload dealer photos
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          Add at least 3 photos and no more than 5. Admin will
                          review them before approval.
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>{dealerPhotos.length}/5 selected</span>
                        <span>
                          {dealerPhotos.length >= 3
                            ? "Ready for review"
                            : "Minimum 3 required"}
                        </span>
                      </div>

                      {errors.dealerPhotos && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dealerPhotos}
                        </p>
                      )}

                      {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                          {photoPreviews.map((preview, index) => (
                            <div
                              key={`${preview}-${index}`}
                              className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"
                            >
                              <img
                                src={preview}
                                alt={`Dealer preview ${index + 1}`}
                                className="h-24 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                                aria-label={`Remove photo ${index + 1}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Review Before Submit
                      </h3>
                      <div className="space-y-3 text-sm">
                        <ReviewRow
                          label="Name"
                          value={formData.name || "N/A"}
                        />
                        <ReviewRow
                          label="Mobile"
                          value={formData.mobile || "N/A"}
                        />
                        <ReviewRow
                          label="Email"
                          value={formData.email || "N/A"}
                        />
                        <ReviewRow
                          label="Store"
                          value={formData.storeName || "N/A"}
                        />
                        <ReviewRow
                          label="GSTIN"
                          value={formData.storeGstin || "N/A"}
                          mono
                        />
                        <ReviewRow
                          label="PAN"
                          value={formData.panCard || "N/A"}
                          mono
                        />
                        <ReviewRow
                          label="Pin Code"
                          value={formData.pinCode || "N/A"}
                        />
                      </div>

                      <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 p-4">
                        <p className="text-sm font-medium text-amber-900">
                          Final check
                        </p>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Make sure the photos clearly show your business before
                          you submit. Admin can view them directly during
                          approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-white/95 flex items-center justify-between gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold transition ${
                    currentStep === 1 || isSubmitting
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Back
                </button>

                <div className="hidden sm:block text-sm text-gray-500">
                  {currentStep === 1 && "Start with your account details"}
                  {currentStep === 2 && "Add your business information"}
                  {currentStep === 3 && "Upload photos and submit"}
                </div>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-amber-800 hover:bg-amber-900 transition shadow-sm"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold text-white transition shadow-sm ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-amber-800 hover:bg-amber-900"
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      "Submit Registration"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`\n        @keyframes slide-in {\n          from {\n            transform: translateX(100%);\n            opacity: 0;\n          }\n          to {\n            transform: translateX(0);\n            opacity: 1;\n          }\n        }\n        .animate-slide-in {\n          animation: slide-in 0.3s ease-out;\n        }\n      `}</style>
    </div>
  );
};

const TextField = ({
  label,
  required,
  icon,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  maxLength,
  error,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required ? "*" : ""}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
          error ? "border-red-500" : "border-gray-200"
        }`}
        placeholder={placeholder}
      />
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const ReviewRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
    <span className="text-gray-500">{label}</span>
    <span
      className={`text-gray-900 font-medium text-right ${
        mono ? "font-mono" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

export default DealerRegistrationForm;
