export default function Home() {
  return (
    <div
      className="w-full bg-transparent flex items-center justify-center"
      style={{
        minHeight: "calc(100vh - 64px - 93px)",
        height: "calc(100vh - 64px - 93px)",
      }}
    >
      <div className="w-full max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
        {/* Title: centered on mobile/tablet, left on desktop */}
        <h1
          className="w-full text-center lg:text-left text-[30px] md:text-[50px] mb-[21px] md:mb-[80px]"
          style={{
            color: "#FFF",
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontStyle: "normal",
            lineHeight: "normal",
          }}
        >
          Oaksoft Digital Fund
        </h1>

        {/* Paragraph block: centered on mobile/tablet, left on desktop */}
        <div className="w-full flex justify-center lg:justify-end">
          <p
            className="text-white w-full max-w-[625px] text-right"
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              fontWeight: 400,
              marginBottom: "0",
            }}
          >
            We are an institutional investment firm specializing in portfolio
            management and venture investing, with an exclusive focus on
            blockchain technology. The fund emphasizes the highest standards of
            security for investor assets, providing our clients with a
            streamlined solution to access blockchain opportunities, without the
            complexities of trading or safeguarding coins. We craft winning
            portfolios using Quantitative investing strategies & cutting edge
            research models. Moreover, we target venture-stage investments
            between $25k – $100K (equity + tokens) and bring differentiated
            value to cap tables – experience, relationships and resources to
            help them find product-market fit
          </p>
        </div>
      </div>
    </div>
  );
}
