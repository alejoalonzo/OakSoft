"use client";

import { useState } from "react";
import Navigation from "../../components/Navigation";

export default function LoansPage() {
  const [selectedTab, setSelectedTab] = useState("borrow");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            DeFi Loans
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Secure crypto-backed loans powered by CoinRabbit
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-xl p-2 border border-white/10">
            <button
              onClick={() => setSelectedTab("borrow")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedTab === "borrow"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Borrow
            </button>
            <button
              onClick={() => setSelectedTab("lend")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ml-2 ${
                selectedTab === "lend"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Lend
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto">
          {selectedTab === "borrow" ? (
            <BorrowSection />
          ) : (
            <LendSection />
          )}
        </div>
      </div>
    </div>
  );
}

function BorrowSection() {
  return (
    <div className="bg-gray-800 rounded-xl border border-white/10 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Borrow Against Your Crypto</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Loan Calculator */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Loan Calculator</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collateral Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collateral Token
              </label>
              <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDT">Tether (USDT)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Loan Duration
              </label>
              <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>
          
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Calculate Loan
          </button>
        </div>
        
        {/* Loan Details */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Loan Details</h3>
          
          <div className="bg-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Max Loan Amount:</span>
              <span className="text-white font-semibold">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Interest Rate:</span>
              <span className="text-white font-semibold">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">LTV Ratio:</span>
              <span className="text-white font-semibold">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Total to Repay:</span>
              <span className="text-white font-semibold">$0.00</span>
            </div>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-semibold mb-2">How it works:</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Deposit your crypto as collateral</li>
              <li>• Receive instant loan in stablecoins</li>
              <li>• Repay to unlock your collateral</li>
              <li>• No credit checks required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function LendSection() {
  return (
    <div className="bg-gray-800 rounded-xl border border-white/10 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Earn Interest by Lending</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Lending Options */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Available Lending Pools</h3>
          
          <div className="space-y-4">
            {[
              { token: "USDT", apy: "12.5%", available: "$1,234,567" },
              { token: "USDC", apy: "11.8%", available: "$987,432" },
              { token: "DAI", apy: "10.9%", available: "$654,321" },
            ].map((pool, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-white font-semibold">{pool.token}</h4>
                  <p className="text-sm text-gray-300">Available: {pool.available}</p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold text-lg">{pool.apy}</div>
                  <div className="text-sm text-gray-300">APY</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Lend Form */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Start Lending</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Token
              </label>
              <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option value="USDT">Tether (USDT)</option>
                <option value="USDC">USD Coin (USDC)</option>
                <option value="DAI">DAI</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount to Lend
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lending Period
              </label>
              <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option value="flexible">Flexible (withdraw anytime)</option>
                <option value="30">30 days (higher APY)</option>
                <option value="60">60 days (highest APY)</option>
              </select>
            </div>
          </div>
          
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Lending
          </button>
          
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-300 font-semibold mb-2">Benefits:</h4>
            <ul className="text-sm text-green-200 space-y-1">
              <li>• Earn competitive interest rates</li>
              <li>• Automated compounding</li>
              <li>• Withdraw anytime (flexible terms)</li>
              <li>• Secured by crypto collateral</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}