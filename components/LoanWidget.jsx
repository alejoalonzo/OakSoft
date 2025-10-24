"use client";

import { useState } from "react";

export default function LoanWidget() {
  const [selectedLTV, setSelectedLTV] = useState("65");
  const [selectedDuration, setSelectedDuration] = useState("long");
  
  return (
    <div className="bg-gray-800 rounded-xl border border-white/10 p-8">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Loan Calculator</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collateral
              </label>
              <div className="flex bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                <input
                  type="number"
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                />
                <div className="border-l border-gray-600"></div>
                <select className="px-4 py-3 bg-transparent text-white focus:outline-none cursor-pointer min-w-[120px]">
                  <option value="BTC" className="bg-gray-700">BTC</option>
                  <option value="ETH" className="bg-gray-700">ETH</option>
                  <option value="USDT" className="bg-gray-700">USDT</option>
                  <option value="USDC" className="bg-gray-700">USDC</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Loan
              </label>
              <div className="flex bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                <div className="flex-1 px-4 py-3 bg-transparent text-white font-semibold text-lg flex items-center">
                  $2,450.00
                </div>
                <div className="border-l border-gray-600"></div>
                <select className="px-4 py-3 bg-transparent text-white focus:outline-none cursor-pointer min-w-[120px]">
                  <option value="USDT" className="bg-gray-700">USDT</option>
                  <option value="USDC" className="bg-gray-700">USDC</option>
                  <option value="DAI" className="bg-gray-700">DAI</option>
                  <option value="BUSD" className="bg-gray-700">BUSD</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Amount calculated based on LTV ratio and current market prices
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LTV Ratio (Loan-to-Value)
              </label>
              <div className="bg-gray-700 rounded-lg p-2 border border-gray-600">
                <div className="grid grid-cols-4 gap-2">
                  {["50", "65", "80", "90"].map((ltv) => (
                    <button
                      key={ltv}
                      onClick={() => setSelectedLTV(ltv)}
                      className={`py-2 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                        selectedLTV === ltv
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white"
                      }`}
                    >
                      {ltv}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose APR
              </label>
              <div className="bg-gray-700 rounded-lg p-2 border border-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedDuration("long")}
                    className={`p-4 rounded-md font-medium text-sm transition-all duration-200 text-left ${
                      selectedDuration === "long"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">Long Term</div>
                        <div className="text-xs opacity-80">Unlimited time</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">APR</div>
                        <div className="text-xs">(...)</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedDuration("short")}
                    className={`p-4 rounded-md font-medium text-sm transition-all duration-200 text-left ${
                      selectedDuration === "short"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">Short Term</div>
                        <div className="text-xs opacity-80">30 days</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">APR</div>
                        <div className="text-xs">(...)</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            

          </div>
          
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          Get Loan
        </button>
      </div>
    </div>
  );
}