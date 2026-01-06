"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import UserDisplay from "./UserDisplay";
import { AppKitButton } from "@reown/appkit/react";
import { useAppKitAccount } from "@reown/appkit/react";
// import WalletBadge from "./WalletBadge";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });

  // Estate to control visibility of Dashboard link
  const [showDashboard, setShowDashboard] = useState(false);
  const [userId, setUserId] = useState(null);

  // Detect authenticated user (Firebase Auth)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u?.uid || null);
    });
    return () => unsub();
  }, []);

  // Check if the user has active/closed loans
  useEffect(() => {
    if (!userId) {
      setShowDashboard(false);
      return;
    }
    // Search for only 1 loan that is ACTIVE, CLOSED, or LIQUIDATED
    const q = query(
      collection(db, "loans"),
      where("uid", "==", userId),
      where("phase", "in", ["ACTIVE", "CLOSED", "LIQUIDATED"]),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      setShowDashboard(snap.size > 0);
    });
    return () => unsub();
  }, [userId]);

  const isActive = path => {
    return pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="bg-gray-900 shadow-sm relative">
      <div className="w-full">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span
                className="hidden md:block font-extrabold leading-[100%] tracking-normal text-right align-middle text-white"
                style={{
                  fontFamily: "var(--font-abhaya-libre), serif",
                  fontSize: "30px",
                  width: "262px",
                  height: "35px",
                  marginTop: "34px",
                  marginLeft: "43px",
                  fontWeight: 800,
                }}
              >
                Oaksoft Digital Fund
              </span>
              {/* Mobile Logo */}
              <span
                className="md:hidden font-extrabold leading-[100%] tracking-normal text-right align-middle text-white"
                style={{
                  fontFamily: "var(--font-abhaya-libre), serif",
                  fontSize: "20px",
                  width: "175px",
                  height: "24px",
                  marginTop: "22px",
                  marginLeft: "24px",
                  fontWeight: 800,
                }}
              >
                Oaksoft Digital Fund
              </span>
            </Link>
          </div>

          {/* Buttons + Dropdown wrapped in the same ref */}
          <div className="flex items-center gap-3 mr-[43px] mt-[34px] md:mr-[43px] md:mt-[34px]" ref={menuRef}>
            {/* User Display */}
            <UserDisplay />
            {/* <WalletBadge /> */}
            <AppKitButton />
            
            {/* Desktop Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className="hidden md:inline-flex flex-col justify-center items-end focus:outline-none cursor-pointer p-3 hover:bg-gray-800/20 rounded-lg transition-colors"
              aria-controls="desktop-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-6 h-4 flex flex-col justify-center items-end">
                {isMenuOpen ? (
                  /* X when open */
                  <>
                    <div
                      className="absolute w-6 h-0.5 bg-primary-500 transition-all duration-300 transform rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    ></div>
                    <div
                      className="absolute w-6 h-0.5 bg-primary-500 transition-all duration-300 transform -rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    ></div>
                  </>
                ) : (
                  /* Closed hamburger */
                  <>
                    <div
                      className="w-6 h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100" }}
                    ></div>

                    <div
                      className="w-3 h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100" }}
                    ></div>

                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300"
                      style={{ backgroundColor: "#95E100", width: "18px" }}
                    ></div>
                  </>
                )}
              </div>
            </button>

            {/* Mobile Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className="md:hidden inline-flex flex-col justify-center items-end focus:outline-none cursor-pointer p-3 hover:bg-gray-800/20 rounded-lg transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-5 h-4 flex flex-col justify-center items-end">
                {isMenuOpen ? (
                  /* X when open */
                  <>
                    <div
                      className="absolute w-5 h-0.5 bg-primary-500 transition-all duration-300 transform rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    ></div>
                    <div
                      className="absolute w-5 h-0.5 bg-primary-500 transition-all duration-300 transform -rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    ></div>
                  </>
                ) : (
                  /*  */
                  <>
                    <div
                      className="w-5 h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100" }}
                    ></div>

                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100", width: "10px" }}
                    ></div>

                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300"
                      style={{ backgroundColor: "#95E100", width: "15px" }}
                    ></div>
                  </>
                )}
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute top-16 right-0 bg-gray-900 shadow-lg rounded-lg z-50">
                <div className="py-4">
                  <Link
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block transition-colors uppercase mb-4 mr-10 md:mr-36 cursor-pointer ${
                      isActive("/")
                        ? "text-primary-500"
                        : "text-white hover:text-primary-500"
                    }`}
                    style={{
                      fontFamily: "var(--font-abhaya-libre), serif",
                      fontWeight: 800,
                      fontSize: "18px",
                      lineHeight: "18px",
                      letterSpacing: "2.7px",
                      textAlign: "right",
                    }}
                  >
                    Home
                  </Link>
                  <Link
                    href="/trade"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block transition-colors uppercase mb-4 mr-10 md:mr-36 cursor-pointer ${
                      isActive("/trade")
                        ? "text-primary-500"
                        : "text-white hover:text-primary-500"
                    }`}
                    style={{
                      fontFamily: "var(--font-abhaya-libre), serif",
                      fontWeight: 800,
                      fontSize: "18px",
                      lineHeight: "18px",
                      letterSpacing: "2.7px",
                      textAlign: "right",
                    }}
                  >
                    Trade
                  </Link>
                  <Link
                    href="/loans"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block transition-colors uppercase mb-4 mr-10 md:mr-36 cursor-pointer ${
                      isActive("/loans")
                        ? "text-primary-500"
                        : "text-white hover:text-primary-500"
                    }`}
                    style={{
                      fontFamily: "var(--font-abhaya-libre), serif",
                      fontWeight: 800,
                      fontSize: "18px",
                      lineHeight: "18px",
                      letterSpacing: "2.7px",
                      textAlign: "right",
                    }}
                  >
                    Loans
                  </Link>
                   {showDashboard && (
                     <Link
                       href="/dashboard/loans"
                       onClick={() => setIsMenuOpen(false)}
                       className={`block transition-colors uppercase mb-4 mr-10 md:mr-36 cursor-pointer ${
                         isActive("/dashboard/loans")
                           ? "text-primary-500"
                           : "text-white hover:text-primary-500"
                       }`}
                       style={{
                         fontFamily: "var(--font-abhaya-libre), serif",
                         fontWeight: 800,
                         fontSize: "18px",
                         lineHeight: "18px",
                         letterSpacing: "2.7px",
                         textAlign: "right",
                       }}
                     >
                       Dashboard
                     </Link>
                   )}
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block transition-colors uppercase mr-10 md:mr-36 cursor-pointer ${
                      isActive("/login")
                        ? "text-primary-500"
                        : "text-white hover:text-primary-500"
                    }`}
                    style={{
                      fontFamily: "var(--font-abhaya-libre), serif",
                      fontWeight: 800,
                      fontSize: "18px",
                      lineHeight: "18px",
                      letterSpacing: "2.7px",
                      textAlign: "right",
                    }}
                  >
                    Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
