"use client";

const DUNE_EMBEDS = {
  // ⬇️ Reemplaza estas URLs por tus “Embed link” reales desde Dune (Share → Embed)
  USDC: "https://dune.com/embeds/000000/000000/iframe", 
  DAI:  "https://dune.com/embeds/000000/000000/iframe",
  LINK: "https://dune.com/embeds/000000/000000/iframe",
};

export default function TokenChart({ token }) {
  const src = DUNE_EMBEDS[token]; 
  if (!src) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No chart configured for {token}. Add its Dune embed URL.
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title={`Dune chart for ${token}`}
      className="w-full h-full"
      style={{ border: "0", borderRadius: 12 }}
      loading="lazy"
    />
  );
}
