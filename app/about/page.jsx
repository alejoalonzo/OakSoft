export default function About() {
  return (
    <div
      className="w-full bg-transparent flex items-center justify-center"
      style={{
        minHeight: "calc(100vh - 64px - 93px)",
        height: "calc(100vh - 64px - 93px)",
      }}
    >
      <div className="w-full max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
        <h1
          className="w-full text-center lg:text-right text-[30px] md:text-[50px] mb-[21px] md:mb-[80px]"
          style={{
            color: "#FFF",
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontStyle: "normal",
            lineHeight: "normal",
          }}
        >
          About Us
        </h1>

        <div className="w-full flex justify-center lg:justify-end">
          <p
            className="text-white w-full max-w-[625px] text-center lg:text-right"
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              fontWeight: 400,
              marginBottom: "0",
            }}
          >
            Content for the About page will go here. This page follows the same structure and styling as the Home page.
          </p>
        </div>
      </div>
    </div>
  );
}