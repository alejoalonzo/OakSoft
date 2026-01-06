"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useAuth } from "@/providers/AuthProvider";
import { signInWithGoogle } from "@/features/auth/googleSignIn";

export default function LoginPage() {
  const { user, loading, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState(""); // confirm password
  const [signupMode, setSignupMode] = useState(false); // show confirm only for create account

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  async function handleSignUp() {
    setError("");
    setSignupMode(true); // show confirm field when creating account

    // Validations
    if (!email || !pass) {
      setError("Email and password are required");
      return;
    }

    if (pass.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!pass2) {
      setError("Please confirm your password");
      return;
    }

    if (pass !== pass2) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      console.error("Firebase signup error:", e.code, e.message, e);

      if (e.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (e.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else if (e.code === "auth/weak-password") {
        setError("Password must be at least 6 characters");
      } else if (e.code === "auth/operation-not-allowed") {
        setError(
          "Email/password sign-in is not enabled. Please contact support."
        );
      } else {
        setError(e?.message || "Sign up failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    setError("");
    setSignupMode(false);
    setPass2("");

    // Validations
    if (!email || !pass) {
      setError("Email and password are required");
      return;
    }

    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      if (
        e.code === "auth/user-not-found" ||
        e.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password");
      } else if (e.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else if (e.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later");
      } else {
        setError(e?.message || "Login failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    if (busy) return; // avoid multiple clicks
    setError("");
    setBusy(true);

    try {
      await signInWithGoogle();
    } catch (e) {
      const code = e?.code;

      // This is NOT a real error: the user cancelled
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // Do not show anything, do not log as error
        return;
      }

      // These are real errors
      console.error("Google login error:", e);

      if (code === "auth/unauthorized-domain") {
        setError("Firebase: need to add this domain in Authorized domains.");
      } else {
        setError(e?.message || "Google sign-in failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Title */}
      <div
        className="flex justify-center pt-[60px] mb-[60px]"
        style={{
          width: "292.07px",
          height: "76.8px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h1
          className="text-white text-center align-middle uppercase"
          style={{
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontSize: "48px",
            lineHeight: "76.8px",
            letterSpacing: "11px",
          }}
        >
          LOGIN
        </h1>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {user ? (
            // Logged in state
            <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl border border-white/20 p-8 shadow-2xl backdrop-blur-sm">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30">
                  <svg
                    className="w-8 h-8 text-primary-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Logged in as</p>
                  <p className="text-white text-xl font-semibold">
                    {user.email || user.uid}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-900/90 hover:bg-black text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/10"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            // Login form
            <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl border border-white/20 p-8 shadow-2xl backdrop-blur-sm">
              <div className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@email.com"
                    className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  />
                </div>

                {/* Confirm Password (only for Create Account) */}
                {signupMode && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Confirm password
                    </label>
                    <input
                      value={pass2}
                      onChange={(e) => setPass2(e.target.value)}
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                    />
                  </div>
                )}

                {/* Password hint (moved here, plain text) */}
                <p className="text-xs text-gray-400">
                  Password must be at least 6 characters
                </p>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    disabled={busy}
                    onClick={handleLogin}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {busy ? "Loading..." : "Sign in"}
                  </button>
                  <button
                    disabled={busy}
                    onClick={handleSignUp}
                    className="flex-1 bg-gray-700/80 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {busy ? "Loading..." : "Create account"}
                  </button>
                </div>

                {/* Google section at the bottom */}
                <div className="flex items-center gap-3 pt-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  disabled={busy}
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {busy ? "Loading..." : "Continue with Google"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
