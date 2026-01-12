export default function Estrategies() {
  return (
    <div className="w-full bg-transparent">
      <div
        className="w-full flex items-center justify-center"
        style={{
          minHeight: "calc(50vh - 64px - 93px)",
          height: "calc(50vh - 64px - 93px)",
        }}
      >
        <div className="w-full max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
        <h1
          className="w-full mb-[21px] md:mb-[80px] text-[34px] md:text-[48px] leading-[54.4px] md:leading-[76.8px] tracking-[8px] md:tracking-[11px]"
          style={{
            color: "#FFF",
            textAlign: "center",
            fontFamily: "Abhaya Libre ExtraBold",
            fontStyle: "normal",
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          ESTRATEGIES
        </h1>
        </div>
      </div>

      <div className="w-full flex flex-col">
        <div className="w-full py-8" style={{ background: "#151A23", paddingTop: "70px" }}>
          <div className="max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
            <p
              className="text-white text-left"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                fontWeight: 400,
                marginBottom: "0",
              }}
            >
              Oaksoft Core Index: Secure. Stable. Trusted.
              Oaksoft Core is designed for investors seeking reliable, long-term growth with minimal risk. This portfolio prioritizes stability by focusing on blue-chip crypto assets like Bitcoin (BTC), Ethereum (ETH) & Ripple (XRP). Using time-tested strategies and advanced security measures, including cold wallet storage, Oaksoft Core ensures your investments are safeguarded while delivering steady, predictable returns. Ideal for those who value consistency and fundamentals in their portfolio.            </p>
          </div>
        </div>
        <div className="w-full py-8" style={{ background: "#151A23" }}>
          <div className="max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
            <p
              className="text-white text-left"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                fontWeight: 400,
                marginBottom: "0",
              }}
            >
              Oaksoft Alpha Index: Dynamic. Bold. High-upside.
              Oaksoft Alpha is built for investors ready to embrace the future of crypto with a focus on high-reward opportunities. This portfolio focuses on emerging, high-upside assets, including lower-cap cryptocurrencies and innovative projects, combining them with cutting-edge strategies to achieve outsized returns. Leveraging proprietary tools and active portfolio management, Oaksoft Alpha is for those who are ready to take calculated risks in pursuit of transformative growth.            </p>
          </div>
        </div>
        <div className="w-full py-8" style={{ background: "#151A23" }}>
          <div className="max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
            <p
              className="text-white text-left"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                fontWeight: 400,
                marginBottom: "0",
              }}
            >
              Oaksoft VC: Unlocking outsized returns through next-generation venture investing. We combine the expertise of crypto-native and traditional venture capital with strategic research—both qualitative and quantitative—to identify and back early-stage blockchain projects poised for exceptional growth. As investors and active users, we leverage platform to maximize impact and drive value creation in the growing Web3 ecosystem            </p>
          </div>
        </div>
      </div>
    </div>
  );
}