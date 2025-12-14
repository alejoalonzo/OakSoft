"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { user, loading, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  async function handleSignUp() {
    setError("");
    
    // Validations
    if (!email || !pass) {
      setError("Email and password are required");
      return;
    }
    
    if (pass.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      // Complete error log for debugging
      console.error("Firebase signup error:", e.code, e.message, e);
      
      // Specific Firebase error handling
      if (e.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (e.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else if (e.code === "auth/weak-password") {
        setError("Password must be at least 6 characters");
      } else if (e.code === "auth/operation-not-allowed") {
        setError("Email/password sign-in is not enabled. Please contact support.");
      } else {
        setError(e?.message || "Sign up failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    setError("");
    
    // Validations
    if (!email || !pass) {
      setError("Email and password are required");
      return;
    }
    
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      // Specific Firebase error handling
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password") {
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

  async function handleLogout() {
    // await signOut(auth);
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
                  <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-2">Logged in as</p>
                  <p className="text-white text-xl font-semibold">{user.email || user.uid}</p>
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

                {/* Info Box */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-6">
                  <p className="text-blue-200 text-sm text-center">
                    Password must be at least 6 characters
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
