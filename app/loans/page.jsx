"use client";

import LoanWidget from "../../components/LoanWidget";

export default function LoansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
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
            LOANS
          </h1>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">
          {/* Mobile: How it works above widget */}
          <div className="lg:hidden mb-8">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
              <h4 className="text-blue-300 font-semibold mb-4 text-lg">How it works:</h4>
              <ul className="text-blue-200 space-y-2">
                <li>• Deposit your crypto as collateral</li>
                <li>• Receive instant loan</li>
                <li>• Repay to unlock your collateral</li>
                <li>• No credit checks required</li>
              </ul>
            </div>
          </div>

          {/* Desktop: Widget and How it works side by side */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Widget takes 2/3 of the width on desktop */}
            <div className="lg:col-span-2">
              <LoanWidget />
            </div>
            
            {/* How it works takes 1/3 of the width on desktop, hidden on mobile */}
            <div className="hidden lg:block">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 h-fit">
                <h4 className="text-blue-300 font-semibold mb-4 text-lg">How it works:</h4>
                <ul className="text-blue-200 space-y-3">
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-2">1.</span>
                    <span>Deposit your crypto as collateral</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-2">2.</span>
                    <span>Receive instant loan in stablecoins</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-2">3.</span>
                    <span>Repay to unlock your collateral</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-2">4.</span>
                    <span>No credit checks required</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

