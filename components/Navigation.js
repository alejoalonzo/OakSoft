"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    <nav className="bg-white dark:bg-gray-900 shadow-sm relative">
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

          {/* Hamburger Menu Button - Desktop & Mobile */}
          <div className="flex items-center" ref={menuRef}>
            {/* Desktop Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className="hidden md:inline-flex flex-col justify-center items-end focus:outline-none p-2 cursor-pointer"
              style={{
                marginTop: "34px",
                marginRight: "43px",
              }}
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
                  /* hamburger when closed */
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
              className="md:hidden inline-flex flex-col justify-center items-end focus:outline-none p-2 cursor-pointer"
              style={{
                marginTop: "22px",
                marginRight: "24px",
              }}
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
                  /* hamburger when closed */
                  <>
                    {/* Top line - 100% width */}
                    <div
                      className="w-5 h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100" }}
                    ></div>
                    {/* Middle line - 50% width, aligned to the right */}
                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300 mb-1"
                      style={{ backgroundColor: "#95E100", width: "10px" }}
                    ></div>
                    {/* Bottom line - 75% width, aligned to the right */}
                    <div
                      className="h-0.5 bg-primary-500 transition-all duration-300"
                      style={{ backgroundColor: "#95E100", width: "15px" }}
                    ></div>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-0 bg-white dark:bg-gray-900 shadow-lg z-50">
          <div className="py-4">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block transition-colors uppercase mb-4 mr-10 md:mr-36 cursor-pointer ${
                isActive("/")
                  ? "text-primary-500 dark:text-accent"
                  : "text-white hover:text-primary-500 dark:hover:text-accent"
              }`}
              style={{
                fontFamily: "var(--font-abhaya-libre), serif",
                fontWeight: 800,
                fontSize: "18px",
                lineHeight: "18px",
                letterSpacing: "2.7px",
                textAlign: "right",
                minWidth: "73.61px",
                height: "26.5px",
                padding: "4px 8px",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
            <Link
              href="/trade"
              onClick={() => setIsMenuOpen(false)}
              className={`block transition-colors uppercase mr-10 md:mr-36 cursor-pointer ${
                isActive("/trade")
                  ? "text-primary-500 dark:text-accent"
                  : "text-white hover:text-primary-500 dark:hover:text-accent"
              }`}
              style={{
                fontFamily: "var(--font-abhaya-libre), serif",
                fontWeight: 800,
                fontSize: "18px",
                lineHeight: "18px",
                letterSpacing: "2.7px",
                textAlign: "right",
                minWidth: "73.61px",
                height: "26.5px",
                padding: "4px 8px",
                textDecoration: "none",
              }}
            >
              Trade
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
