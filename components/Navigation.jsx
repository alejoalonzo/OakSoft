"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import ConnectWalletButton from "./ConnectWalletButton";
// import UserDisplay from "./UserDisplay";
// import { AppKitButton } from "@reown/appkit/react";
// import { useAppKitAccount } from "@reown/appkit/react";
// import WalletBadge from "./WalletBadge";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // State to control visibility of Dashboard link
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

  const isActive = (path) => pathname === path;

  const toggleMenu = () => setIsMenuOpen((v) => !v);

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // -------------------------
  //  Menu link styling (ONE place)
  // -------------------------
  const MENU_RIGHT_PADDING = "pr-[39px] md:pr-[79px] lg:pr-[144px]";

  const linkBase = "block transition-colors uppercase cursor-pointer text-right";

  const linkActive = "text-primary-500";
  const linkInactive = "text-white hover:text-primary-500";

  const linkStyle = {
    fontFamily: "var(--font-abhaya-libre), serif",
    fontWeight: 800,
    fontSize: "18px",
    lineHeight: "18px",
    letterSpacing: "2.7px",
    textAlign: "right",
  };

  const MenuLink = ({ href, children, onClick, isLast = false }) => {
    const active = isActive(href);

    return (
      <Link
        href={href}
        onClick={(e) => {
          setIsMenuOpen(false);
          onClick?.(e);
        }}
        className={`${linkBase} ${active ? linkActive : linkInactive} ${
          isLast ? "" : "mb-4"
        }`}
        style={linkStyle}
      >
        {children}
      </Link>
    );
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-transparent shadow-sm relative">
      <div className="w-full">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            {pathname !== "/" && (
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
            )}
          </div>

          {/* Buttons + Dropdown wrapped in the same ref */}
          <div
            className="flex items-center gap-3 mr-[43px] mt-[34px] md:mr-[43px] md:mt-[34px]"
            ref={menuRef}
          >
            {/* User Display */}
            {/* <UserDisplay /> */}
            {/* <WalletBadge /> */}
            {/* <AppKitButton /> */}

            {/* Desktop Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className="hidden md:inline-flex flex-col justify-center items-end focus:outline-none cursor-pointer p-3 hover:bg-gray-800/20 rounded-lg transition-colors relative z-50"
              aria-controls="desktop-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-6 h-4 flex flex-col justify-center items-end">
                {isMenuOpen ? (
                  <>
                    <div
                      className="absolute w-6 h-0.5 bg-primary-500 transition-all duration-300 transform rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    />
                    <div
                      className="absolute w-6 h-0.5 bg-primary-500 transition-all duration-300 transform -rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div
                      className="w-6 h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100" }}
                    />
                    <div
                      className="w-3 h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100" }}
                    />
                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300"
                      style={{ backgroundColor: "#95E100", width: "18px" }}
                    />
                  </>
                )}
              </div>
            </button>

            {/* Mobile Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className="md:hidden inline-flex flex-col justify-center items-end focus:outline-none cursor-pointer h-11 px-0 pr-[1px] bg-transparent rounded-lg relative z-50 focus-visible:ring-2 focus-visible:ring-[#95E100]/60"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-5 h-4 flex flex-col justify-center items-end">
                {isMenuOpen ? (
                  <>
                    <div
                      className="absolute w-5 h-0.5 bg-primary-500 transition-all duration-300 transform rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    />
                    <div
                      className="absolute w-5 h-0.5 bg-primary-500 transition-all duration-300 transform -rotate-45"
                      style={{
                        backgroundColor: "#95E100",
                        top: "50%",
                        marginTop: "-1px",
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div
                      className="w-5 h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100" }}
                    />
                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100", width: "10px" }}
                    />
                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300"
                      style={{ backgroundColor: "#95E100", width: "15px" }}
                    />
                  </>
                )}
              </div>
            </button>

            {isMenuOpen && (
              <>
                {/* Full page blur overlay */}
                <div
                  className="fixed inset-0 z-40"
                  style={{
                    background: "rgba(0, 0, 0, 0.50)",
                    backdropFilter: "blur(14.899999618530273px)",
                  }}
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Menu dropdown */}
                <div className="absolute top-16 right-0 bg-transparent rounded-lg z-50">
                  <div className={`py-4 ${MENU_RIGHT_PADDING}`}>
                    <MenuLink href="/">Home</MenuLink>
                    <MenuLink href="/about">About</MenuLink>
                    <MenuLink href="/strategies">Strategies</MenuLink>
                    <MenuLink href="/trade">Trade</MenuLink>
                    <MenuLink href="/loans">Loans</MenuLink>

                    {showDashboard && (
                      <MenuLink href="/dashboard/loans">Dashboard</MenuLink>
                    )}

                    {userId ? (
                      <MenuLink
                        href="/login"
                        onClick={async (e) => {
                          e.preventDefault();
                          await handleLogout();
                        }}
                        isLast
                      >
                        Logout
                      </MenuLink>
                    ) : (
                      <MenuLink href="/login" isLast>
                        Login
                      </MenuLink>
                    )}

                    <div className="mt-6 flex justify-end">
                      <ConnectWalletButton />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
