export default function Home() {
  return (
    <div className="min-h-screen w-full bg-transparent">
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
          HOME
        </h1>
      </div>

      <div className="container mx-auto px-4 py-8"></div>
    </div>
  );
}
