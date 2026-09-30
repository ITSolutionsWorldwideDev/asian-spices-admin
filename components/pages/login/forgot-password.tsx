"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordComponent() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send OTP");
        return;
      }
      setSuccessMsg(data.message);
      setStep("reset");
    } catch {
      setErrorMsg("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to reset password");
        return;
      }
      setSuccessMsg(data.message);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setErrorMsg("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper">
          <div className="grid grid-cols-1 lg:grid-cols-2 m-0">
            <div className="p-0">
              <div className="login-content bg-black">
                <form onSubmit={step === "email" ? sendOtp : resetPassword}>
                  <div className="login-userset">
                    <a
                      href="/login"
                      className="login-logo logo-white"
                      style={{ marginInline: 0 }}
                    >
                      <img src="assets/img/logo.svg" alt="Img" />
                    </a>
                    <div className="login-userheading">
                      <h3>Forgot Password</h3>
                      {errorMsg && (
                        <p className="text-red-500 mb-3">{errorMsg}</p>
                      )}
                      {successMsg && (
                        <p className="text-green-400 mb-3">{successMsg}</p>
                      )}
                      <h4 className="text-[16px]">
                        {step === "email"
                          ? "Enter your email and we’ll send a one-time code."
                          : "Enter the OTP from your email and choose a new password."}
                      </h4>
                    </div>

                    <div className="mb-4">
                      <label className="form-label block mb-2">
                        Email <span className="text-red-600"> *</span>
                      </label>
                      <div className="input-group w-auto input-group-flat bg-white rounded-b-md">
                        <input
                          type="email"
                          className="form-control"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={step === "reset"}
                          required
                        />
                        <span className="input-group-text text-black">
                          <i className="fa fa-envelope"></i>
                        </span>
                      </div>
                    </div>

                    {step === "reset" && (
                      <>
                        <div className="mb-4">
                          <label className="form-label block mb-2">
                            OTP <span className="text-red-600"> *</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            inputMode="numeric"
                            maxLength={6}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label className="form-label block mb-2">
                            New Password <span className="text-red-600"> *</span>
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label className="form-label block mb-2">
                            Confirm Password{" "}
                            <span className="text-red-600"> *</span>
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="form-login">
                      <button className="btn btn-login" disabled={loading}>
                        {loading
                          ? "Please wait..."
                          : step === "email"
                            ? "Send OTP"
                            : "Reset Password"}
                      </button>
                    </div>

                    <p className="mt-4 text-center text-white text-sm space-x-3">
                      {step === "reset" && (
                        <button
                          type="button"
                          className="underline hover:text-orange-400 mr-3"
                          onClick={() => {
                            setStep("email");
                            setOtp("");
                            setPassword("");
                            setConfirmPassword("");
                            setErrorMsg("");
                            setSuccessMsg("");
                          }}
                        >
                          Resend OTP
                        </button>
                      )}
                      <Link
                        href="/login"
                        className="underline hover:text-orange-400"
                      >
                        Back to Sign In
                      </Link>
                    </p>

                    <div className="my-6 flex justify-center items-center copyright-text">
                      <p>Copyright &copy; 2026 Asian Spices</p>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="p-0">
              <div className="login-img w-full h-screen justify-items-center content-center">
                <img
                  src="assets/img/Login Art.png"
                  alt="img"
                  width={400}
                  height={400}
                  className="align-middle justify-items-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
