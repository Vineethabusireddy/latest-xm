import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import enterimg from "./assets/otp.jpeg";
import logo from "./assets/logo.jpeg";
import shop from "./assets/login_home.jpeg";

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<"email" | "mobile">("email");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>(""); // For mobile registration
  const [userPhone, setUserPhone] = useState<string>(""); // For email registration
  const [pincode, setPincode] = useState<string>("");
  const [showOtpScreen, setShowOtpScreen] = useState<boolean>(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isOtpInvalid, setIsOtpInvalid] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);
  const [showResendButton, setShowResendButton] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;
  // alert(apiUrl);
  const navigate = useNavigate();

  useEffect(() => {
    if (showOtpScreen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [showOtpScreen]);

  useEffect(() => {
    let countdown: number;
    if (showOtpScreen) {
      setTimer(60);
      setShowResendButton(false);
      countdown = window.setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(countdown);
            setShowResendButton(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [showOtpScreen]);

  const requestOtp = async (): Promise<void> => {
    const payload = loginMethod === "email" ? { email } : { phone };

    if (loginMethod === "email" && (!email.includes("@") || !email.includes("."))) {
      alert("Please enter a valid email!");
      return;
    }

    if (loginMethod === "mobile" && !/^\d{10,15}$/.test(phone)) {
      alert("Please enter a valid 10-15 digit mobile number!");
      return;
    }

    setIsLoading(true);
    setShowOtpScreen(true);

    try {
      await axios.post(`${apiUrl}/api/auth/send-otp`, payload);
    } catch (error: any) {
      console.error("Send OTP Error:", error);
      alert(error.response?.data?.message || "Error sending OTP. Please try again.");
      setShowOtpScreen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setIsOtpInvalid(false);
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") verifyOtp();
  };

  const setInputRef = (el: HTMLInputElement | null, index: number): void => {
    inputRefs.current[index] = el;
  };

  const verifyOtp = async (): Promise<void> => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setIsOtpInvalid(true);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    setIsLoading(true);
    const payload = loginMethod === "email"
      ? { email, otp: enteredOtp }
      : { phone, otp: enteredOtp };

    try {
      const response = await axios.post(`${apiUrl}/api/auth/verify-otp`, payload);
      if (response.data.message) {
        const { isNewUser, user, token } = response.data;
        
        // Store temp user data in localStorage
        localStorage.setItem("tempUser", JSON.stringify(user));
        localStorage.setItem("tempToken", token);

        if (isNewUser) {
          setShowRegistrationForm(true);
          // Clear form fields
          setName("");
          setUserEmail("");
          setUserPhone("");
          setPincode("");
        } else {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);
          navigate("/home");
        }
      }
    } catch (error: any) {
      console.error("Verify OTP Error:", error);
      setIsOtpInvalid(true);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      alert(error.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = (): void => {
    requestOtp();
    setTimer(60);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(countdown);
          setShowResendButton(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setShowResendButton(false);
  };

  const handleRegistrationSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Validate email if mobile login
    if (loginMethod === "mobile" && (!userEmail || !userEmail.includes("@"))) {
      alert("Please enter a valid email address");
      return;
    }

    // Validate phone if email login
    if (loginMethod === "email" && (!userPhone || !/^\d{10,15}$/.test(userPhone))) {
      alert("Please enter a valid 10-15 digit phone number");
      return;
    }

    setIsLoading(true);
    
    try {
      const tempUser = JSON.parse(localStorage.getItem("tempUser") || "{}");
      if (!tempUser?.id) {
        throw new Error("Session expired. Please login again.");
      }

      const payload = {
        name: name.trim(),
        userId: tempUser.id,
        ...(loginMethod === "mobile" && { email: userEmail }), // Email for mobile login
        ...(loginMethod === "email" && { phone: userPhone }),  // Phone for email login
        ...(pincode && { pincode })
      };

      const response = await axios.post("http://localhost:4000/api/auth/save-registration", payload);

      if (response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", localStorage.getItem("tempToken") || "");
        localStorage.removeItem("tempUser");
        localStorage.removeItem("tempToken");
        navigate("/home");
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error.response?.data?.details) {
        const errors = Object.values(error.response.data.details).filter(Boolean);
        alert(errors.join('\n'));
      } else {
        alert(error.response?.data?.message || error.message || "Error saving registration details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 relative">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm text-center">
        {!showOtpScreen ? (
          <>
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
            </div>
            <div className="flex justify-center mb-4">
              <img src={shop} alt="Login Illustration" className="h-32 w-auto object-cover rounded-lg" />
            </div>
            <h2 className="text-lg font-semibold">Welcome</h2>
            <p className="text-gray-500 mb-4">Login with Email or Mobile</p>
            <div className="flex justify-center space-x-2 mb-4">
              <button
                onClick={() => setLoginMethod("email")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${loginMethod === "email" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              >
                Email
              </button>
              <button
                onClick={() => setLoginMethod("mobile")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${loginMethod === "mobile" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              >
                Mobile
              </button>
            </div>
            {loginMethod === "email" ? (
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                className="w-full border border-gray-300 rounded-lg p-2 text-md outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                type="tel"
                placeholder="Enter your mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                className="w-full border border-gray-300 rounded-lg p-2 text-md outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <button
              onClick={requestOtp}
              disabled={isLoading}
              className={`w-full bg-black text-white font-semibold py-2 rounded-lg mt-4 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Sending..." : "Request OTP →"}
            </button>
          </>
        ) : (
          <div>
            <button 
              onClick={() => setShowOtpScreen(false)} 
              className="text-2xl mb-2 hover:text-blue-500 transition-colors"
              disabled={isLoading}
            >
              ←
            </button>
            <h2 className="text-lg font-semibold">OTP Verification</h2>
            <p className="text-gray-500">
              OTP sent to {loginMethod === "email" ? email : `+91${phone}`}
            </p>
            <div className="flex justify-center my-4">
              <img src={enterimg} alt="OTP Illustration" className="h-32 w-auto object-cover rounded-lg" />
            </div>
            <div className="flex justify-center space-x-2 mb-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => setInputRef(el, index)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={isLoading}
                  className={`w-12 h-12 border rounded-lg text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                    isOtpInvalid ? "border-red-500" : "border-gray-300"
                  } ${isLoading ? "bg-gray-100" : ""}`}
                />
              ))}
            </div>
            {isOtpInvalid && (
              <p className="text-red-500 text-sm">Invalid OTP. Please try again.</p>
            )}
            <p className="text-gray-600 text-sm mt-2">
              OTP expires in: {timer}s
            </p>
            {showResendButton ? (
              <button
                onClick={handleResendOtp}
                disabled={isLoading}
                className={`w-full bg-blue-500 text-white font-semibold py-2 rounded-lg mt-2 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                Resend OTP 🔄
              </button>
            ) : (
              <button
                onClick={verifyOtp}
                disabled={isLoading}
                className={`w-full bg-green-500 text-white font-semibold py-2 rounded-lg mt-2 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Verifying..." : "Verify OTP ✔"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Registration Popup */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
            <h2 className="text-lg font-bold mb-2">Complete Registration</h2>
            <p className="text-gray-500 mb-4">
              Hi {loginMethod === "email" ? email : phone}, please complete your registration.
            </p>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-md mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            
            {/* Show email field for mobile logins */}
            {loginMethod === "mobile" && (
              <input
                type="email"
                placeholder="Enter your email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-md mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            )}
            
            {/* Show phone field for email logins */}
            {loginMethod === "email" && (
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-md mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            )}
            
            <input
              type="text"
              placeholder="Enter your pincode (optional)"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-md mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              maxLength={6}
            />
            
            <button
              onClick={handleRegistrationSubmit}
              disabled={isLoading}
              className={`w-full bg-black text-white font-semibold py-2 rounded-lg ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
