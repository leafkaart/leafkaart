import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import logo from '../../assets/logo.png';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const validateEmail = () => {
    if (!email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email format";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateEmail();
    if (error) {
      setErrors({ email: error });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/forgot-password`,
        { email }
      );

      addToast(res.data.message || "OTP sent to your email", "success");

      // Move to reset-password screen, carrying the email along
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1000);

    } catch (error) {
      console.error("Forgot password error:", error);
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Failed to send reset OTP. Please try again.";
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>


      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <img src={logo} alt="Logo" className="mx-auto mb-6 h-40" />

            <h2 className="text-xl font-semibold text-gray-800 text-center mb-1">
              Forgot Password
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Enter your email and we'll send you an OTP to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="you@email.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-800 hover:bg-amber-900 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <a
                href="/login"
                className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;