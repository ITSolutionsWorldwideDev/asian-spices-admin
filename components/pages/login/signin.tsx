// apps\admin\components\pages\login\signin.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORM_SUBDOMAIN = "admin";

export default function SigninComponent() {
  const { status } = useSession();
  const router = useRouter();

  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      const hostname = window.location.hostname;
      const subdomain = hostname.split(".")[0];

      if (subdomain === PLATFORM_SUBDOMAIN) {
        router.replace("/platform/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("username") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
      return;
    }

    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];

    if (subdomain === PLATFORM_SUBDOMAIN) {
      router.replace("/platform/dashboard");
    } else {
      router.replace("/dashboard");
    }
  };

  if (status === "authenticated") return null;

  return (
    <>
      <div className="main-wrapper">
        <div className="account-content">
          <div className="login-wrapper">
            <div className="grid grid-cols-1 lg:grid-cols-2 m-0">
              <div className="p-0">
                <div className="login-content bg-black">
                  <form onSubmit={handleLogin}>
                    <div className="login-userset">
                      <a href="index.html" className="login-logo logo-white">
                        <img src="assets/img/logo.svg" alt="Img" />
                      </a>
                      <div className="login-userheading">
                        <h3>Sign In</h3>

                        {errorMsg && (
                          <p className="text-red-500 mb-3">{errorMsg}</p>
                        )}

                        <h4 className="text-[16px]">
                          Access the Asian Spices panel using your email and
                          passcode.
                        </h4>
                      </div>
                      <div className="mb-4">
                        {" "}
                        <label className="form-label block mb-2">
                          Email <span className="text-red-600"> *</span>
                        </label>
                        <div className="input-group w-auto input-group-flat bg-white rounded-b-md">
                          <input
                            type="text"
                            className="form-control"
                            name="username"
                          />
                          <span className="input-group-text text-black">
                            <i className="fa fa-envelope"></i>
                          </span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="form-label block mb-2">
                          Password<span className="text-red-600"> *</span>
                        </label>
                        <div className="relative pass-group">
                          <input
                            type={isPasswordVisible ? "text" : "password"}
                            className="form-control w-full pass-input"
                            defaultValue="12345678"
                            name="password"
                          />
                          <span
                            className={`input-group-text cursor-pointer fa toggle-password bg-none  pt-2 ${
                              isPasswordVisible ? "fa-eye-slash" : "fa-eye"
                            }`}
                            onClick={() =>
                              setPasswordVisible(!isPasswordVisible)
                            }
                          ></span>
                        </div>
                      </div>
                      <div className="form-login">
                        <button className="btn btn-login" disabled={loading}>
                          {loading ? "Signing in..." : "Sign In"}
                        </button>
                        {errorMsg && <p className="text-red-500">{errorMsg}</p>}
                      </div>

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
    </>
  );
}
