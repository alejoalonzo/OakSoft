"use client";

import { useState, useEffect } from "react";

export default function LoanWidget() {
  const [selectedLTV, setSelectedLTV] = useState("65");
  const [selectedDuration, setSelectedDuration] = useState("long");

  const [depositList, setDepositList] = useState([]);
  const [selectedCollateral, setSelectedCollateral] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [currencies, setCurrencies] = useState([]);
  const [loadingCur, setLoadingCur] = useState(false);
  const [curErr, setCurErr] = useState(null);


  const optValue = (c) => `${c.code}|${c.network}`;  // id único
  const optLabel = (c) => `${c.code} (${c.network}) — ${c.name || c.code}`;
  const findByValue = (v) => {
    const [code, network] = String(v).split("|");
    return depositList.find(c => c.code === code && c.network === network) || null;
  };

  // Function to get the token logo using the API URL
  const getTokenLogo = (code, network) => {
    // Find the token in the list to get its logo_url
    const token = depositList.find(c => c.code === code && c.network === network);
    return token?.logo_url || `https://via.placeholder.com/32/6B7280/FFFFFF?text=${code.charAt(0)}`;
  };

  // Filter tokens based on search term
  const filteredTokens = depositList.filter(token => 
    token.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (token.name && token.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle token selection
  const handleTokenSelect = (token) => {
    setSelectedCollateral(token);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };


  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingCur(true);
      try {
        const r = await fetch("/api/coinrabbit/currencies?is_enabled=null", { cache: "no-store" });
        const j = await r.json();
        if (cancel) return;

        // CoinRabbit responde { result: true, response: [...] }
        const arr = Array.isArray(j?.response) ? j.response : [];
        // Only valid currencies for DEPOSIT (collateral)
        const byDeposit = arr
          .filter(c => c?.is_loan_deposit_enabled)
          .sort((a, b) =>
            (a.loan_deposit_priority ?? 999) - (b.loan_deposit_priority ?? 999) ||
            String(a.code).localeCompare(String(b.code))
          );

        setCurrencies(arr);       
        setDepositList(byDeposit);

        // set default seleccionado
        if (!selectedCollateral && byDeposit.length) {
          setSelectedCollateral(byDeposit[0]);
        }
      } catch (e) {
        if (!cancel) setCurErr(e.message || "Error");
      } finally {
        if (!cancel) setLoadingCur(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.token-dropdown')) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl border border-white/20 p-10 shadow-2xl backdrop-blur-sm">
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-white tracking-tight">Loan Calculator</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">
                Collateral
              </label>
              <div className="flex bg-gray-700/50 border border-gray-600/60 rounded-xl overflow-hidden focus-within:border-[#95E100]  transition-all duration-300 hover:border-gray-500">
                <input
                  type="number"
                  placeholder={selectedCollateral?.loan_deposit_default_amount || "0.00"}
                  className="flex-1 px-5 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg font-medium [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <div className="border-l border-gray-600/60"></div>

                <div className="relative token-dropdown">
                  <div 
                    className="flex items-center px-4 py-3 cursor-pointer min-w-[220px] hover:bg-gray-600/20 transition-colors"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {selectedCollateral ? (
                      <>
                        <img 
                          src={getTokenLogo(selectedCollateral.code, selectedCollateral.network)}
                          alt={selectedCollateral.code}
                          className="w-6 h-6 rounded-full mr-3"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/24/6B7280/FFFFFF?text=${selectedCollateral.code.charAt(0)}`;
                          }}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-white font-medium">{selectedCollateral.code}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-gray-600">
                            {selectedCollateral.network}
                          </span>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    ) : (
                      <span className="text-gray-400">Seleccionar token...</span>
                    )}
                  </div>

                  {/* Custom Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden">
                      {/* Search Bar */}
                      <div className="p-4 border-b border-gray-600">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Search tokens..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#95E100] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Token List */}
                      <div className="max-h-60 overflow-y-auto">
                        {loadingCur ? (
                          <div className="p-4 text-center text-gray-400">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#95E100] mx-auto"></div>
                            <span className="mt-2 block">Cargando tokens...</span>
                          </div>
                        ) : curErr ? (
                          <div className="p-4 text-center text-red-400">
                            Error al cargar tokens
                          </div>
                        ) : filteredTokens.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">
                            No se encontraron tokens
                          </div>
                        ) : (
                          filteredTokens.map((token) => (
                            <div
                              key={optValue(token)}
                              onClick={() => handleTokenSelect(token)}
                              className="flex items-center px-4 py-3 hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-700/30 last:border-b-0"
                            >
                              <img 
                                src={getTokenLogo(token.code, token.network)}
                                alt={token.code}
                                className="w-8 h-8 rounded-full mr-3"
                                onError={(e) => {
                                  e.target.src = `https://via.placeholder.com/32/6B7280/FFFFFF?text=${token.code.charAt(0)}`;
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{token.code}</span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-gray-600">
                                    {token.network}
                                  </span>
                                </div>
                                {token.name && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {token.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">
                Loan
              </label>
              <div className="flex bg-gray-700/50 border border-gray-600/60 rounded-xl overflow-hidden">
                <div className="flex-1 px-5 py-4 bg-transparent text-white font-bold text-xl flex items-center">
                  $2,450.00
                </div>
                <div className="border-l border-gray-600/60"></div>
                <select className="px-5 py-4 bg-transparent text-white focus:outline-none cursor-pointer min-w-[130px] font-medium">
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-1">
                Amount calculated based on LTV ratio and current market prices
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">
                LTV Ratio (Loan-to-Value)
              </label>
              <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/40">
                <div className="grid grid-cols-4 gap-3">
                  {["50", "65", "80", "90"].map((ltv) => (
                    <button
                      key={ltv}
                      onClick={() => setSelectedLTV(ltv)}
                      className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                        selectedLTV === ltv
                          ? "bg-[#95E100] text-gray-900"
                          : "bg-gray-600/60 text-gray-300 hover:bg-[#95E100]/80 hover:text-gray-900"
                      }`}
                    >
                      {ltv}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">
                Choose APR
              </label>
              <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/40">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedDuration("long")}
                    className={`p-5 rounded-xl font-medium text-sm transition-all duration-300 text-left transform hover:scale-105 ${
                      selectedDuration === "long"
                        ? "border-2 border-[#95E100] bg-gray-600/40 text-white"
                        : "border-2 border-gray-500/60 bg-gray-600/30 text-gray-300 hover:border-[#95E100]/60 hover:text-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold mb-1">Long Term</div>
                        <div className="text-xs opacity-80">Unlimited time</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold mb-1">APR</div>
                        <div className="text-xs">(...)</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedDuration("short")}
                    className={`p-5 rounded-xl font-medium text-sm transition-all duration-300 text-left transform hover:scale-105 ${
                      selectedDuration === "short"
                        ? "border-2 border-[#95E100] bg-gray-600/40 text-white"
                        : "border-2 border-gray-500/60 bg-gray-600/30 text-gray-300 hover:border-[#95E100]/60 hover:text-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold mb-1">Short Term</div>
                        <div className="text-xs opacity-80">30 days</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold mb-1">APR</div>
                        <div className="text-xs">(...)</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            

          </div>
          
        <button className="w-full bg-gradient-to-r from-[#95E100] to-[#95E100]/90 hover:from-[#95E100]/90 hover:to-[#95E100] text-gray-900 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
          Get Loan
        </button>
      </div>
    </div>
  );
}