"use client";

import LoanWidget from "../../components/LoanWidget";
import ConnectWalletButton from "../../components/ConnectWalletButton";

export default function LoansPage() {


  const cards = [
    {
      icon: "/assets/coins.svg",
      title: "Buy more crypto",
      description:
        "Tired of waiting endlessly for the all-time-high rate of your favorite coin? Keep holding your crypto and get liquidity to buy even more crypto without any hesitation.",
    },
    {
      icon: "/assets/calculator.svg",
      title: "Optimize taxes",
      description:
        "Maximize your tax efficiency. Getting a crypto loan and its spending - are non-taxable events, because they do not generate direct earnings.",
    },
    {
      icon: "/assets/house.svg",
      title: "Make a huge purchase",
      description:
        "Don't put your dreams on hold. Leverage your crypto and put the cash towards a major expense. Buy a house or a car, travel to a new place or pay for studies.",
    },
    {
      icon: "/assets/arrowup.svg",
      title: "Invest in your business",
      description:
        "Reinvest your crypto holdings and make your company grow. Cover operational expenses, pay employees on time, or even buy another company.",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
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
            <div className="h-full rounded-2xl flex flex-col">
              <div className="flex-1 flex items-start mb-6 md:mb-8 lg:mb-0">
                <h1 className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-medium tracking-[0.988px] text-[42px] leading-[44px] md:text-[76px] md:leading-[70px]">
                  <span className="block">Borrow cash</span>
                  <span className="block">using Bitcoin as</span>
                  <span className="block">collateral</span>
                </h1>
              </div>

              <div className="w-full rounded-[15px] bg-[linear-gradient(129deg,rgba(255,255,255,0.05)_39.82%,rgba(25,120,237,0.05)_133.74%)] px-[35px] pb-[30px] pt-[30px] flex items-center gap-[94px]">
                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10 lg:grid-cols-1">
                    <div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-medium tracking-[1.125px] text-[20px] leading-[24px] md:text-[32px] md:leading-[36px]">
                        Safe
                      </div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-normal tracking-[1.125px] text-[14px] leading-[16px] md:text-[17px] md:leading-[24px]">
                        <span className="block">Top-tier security, Cold</span>
                        <span className="block">wallet storage</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-medium tracking-[1.125px] text-[20px] leading-[24px] md:text-[32px] md:leading-[36px]">
                        Start
                      </div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-normal tracking-[1.125px] text-[14px] leading-[16px] md:text-[17px] md:leading-[24px]">
                        From $100
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10 lg:grid-cols-1">
                    <div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-medium tracking-[1.125px] text-[20px] leading-[24px] md:text-[32px] md:leading-[36px]">
                        Easy
                      </div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-normal tracking-[1.125px] text-[14px] leading-[16px] md:text-[17px] md:leading-[24px]">
                        No Credict check
                      </div>
                    </div>

                    <div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-medium tracking-[1.125px] text-[20px] leading-[24px] md:text-[32px] md:leading-[36px]">
                        351+
                      </div>
                      <div className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-normal tracking-[1.125px] text-[14px] leading-[16px] md:text-[17px] md:leading-[24px]">
                        Curriencies
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* RIGHT - Widget (spans both rows) */}
            <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 h-full">
              <LoanWidget />
            </div>

            {/* LEFT - BOTTOM (1/3) */}
            <div className="h-full rounded-2xl flex flex-col">
              <h2 className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif'] font-medium tracking-[0.988px] text-[28px] leading-[64.142px] md:text-[48px]">
                Why borrow crypto?
              </h2>

              <div className="mt-4 space-y-4">
                <p className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif'] font-normal tracking-[1.125px] text-[14px] leading-[16px] md:text-[17px] md:leading-[24px]">
                  Have you ever needed cash for something urgent, like medical bills or car repairs? In the past, you might have sold Bitcoin to cover it and incurred a taxable gain or loss. Now you don't have to.
                </p>

                <p className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif'] font-normal tracking-[1.125px] text-[14px] leading-[16px] md:text-[17px] md:leading-[24px]">
                  <span className="block">Access extra funds without selling your crypto. Grow your portfolio or invest in your dreams</span>
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* New Cards Section */}
        <section className="w-full">
          <div className="mx-auto w-full max-w-[1300px] px-4 pb-12 lg:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-[#161B26] shadow-[-6px_-4px_10.3px_0_rgba(75,84,98,0.20),_0_4px_20.6px_0_rgba(0,0,0,0.50)] p-[30px_25px] flex flex-col items-start gap-[18.74px] flex-1 rounded-2xl h-auto lg:aspect-square"
                >
                  <div className="flex items-center gap-4">
                    <img src={card.icon} alt={card.title} className="w-[50px] h-[50px]" />
                    <h3 className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif'] font-medium text-[18px] md:text-[24px] leading-[25.8px]">
                      {card.title}
                    </h3>
                  </div>

                  <p className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif']  text-[15px] leading-[24px] tracking-[0.169px]">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </section>
    </div>
  );
}
