"use client";

import LoanWidget from "../../components/LoanWidget";
import ConnectWalletButton from "../../components/ConnectWalletButton";

export default function LoansPage() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Title (se queda igual) */}
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
          LOANS
        </h1>
      </div>

      {/* Main content */}
      <section
        className="w-full"
        style={{
          background: "linear-gradient(0deg, #151A23 0%, #151A23 100%), #FFF",
        }}
      >
        <div className="mx-auto w-full max-w-[1300px] px-4 py-10 lg:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-[2fr_1fr] lg:gap-10 items-stretch">
            {/* LEFT - TOP (2/3) */}
            <div className="lg:col-start-1 lg:row-start-1 h-full">
              <div className="h-full rounded-2xl border border-red-500/40 bg-red-500/20 p-6">
                <p className="text-white/90 font-semibold">LEFT / ROW 1 (TOP) — 2/3</p>
              </div>
            </div>

            {/* RIGHT - Widget (spans both rows) */}
            <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 h-full">
              <LoanWidget />
            </div>

            {/* LEFT - BOTTOM (1/3) */}
            <div className="lg:col-start-1 lg:row-start-2 h-full">
              <div className="h-full rounded-2xl border border-green-500/40 bg-green-500/20 p-6">
                <p className="text-white/90 font-semibold">LEFT / ROW 2 (BOTTOM) — 1/3</p>

                <div className="mt-6">
                  <ConnectWalletButton />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ New Cards Section (same 1300px width) */}
        <section className="w-full">
          <div className="mx-auto w-full max-w-[1300px] px-4 pb-12 lg:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1 */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[160px]">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 mb-4" />
                <h3 className="text-white font-semibold">Card 1</h3>
                <p className="text-white/70 text-sm mt-2">
                  Placeholder text.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[160px]">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 mb-4" />
                <h3 className="text-white font-semibold">Card 2</h3>
                <p className="text-white/70 text-sm mt-2">
                  Placeholder text.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[160px]">
                <div className="h-10 w-10 rounded-xl bg-green-500/20 border border-green-500/30 mb-4" />
                <h3 className="text-white font-semibold">Card 3</h3>
                <p className="text-white/70 text-sm mt-2">
                  Placeholder text.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[160px]">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 mb-4" />
                <h3 className="text-white font-semibold">Card 4</h3>
                <p className="text-white/70 text-sm mt-2">
                  Placeholder text.
                </p>
              </div>
            </div>
          </div>
        </section>

      </section>
    </div>
  );
}
