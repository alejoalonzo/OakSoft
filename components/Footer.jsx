import React from "react";

export default function Footer() {
  return (
    <footer
      className="w-full flex flex-col justify-center items-center px-[34px] py-[9px] gap-[18px] min-h-[93px]"
      style={{ flexShrink: 0, background: '#151A23' }}
    >
      {/* Row de links */}
      <div
        className="flex flex-col justify-center items-center gap-2 w-full lg:flex-row lg:gap-8"
      >
        <a
          href="/privacy-policy"
          className="hover:underline text-center uppercase"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'rgba(255,255,255,0.40)',
            fontFamily: 'var(--font-abhaya-libre), serif',
            fontWeight: 800,
            fontSize: '12px',
            lineHeight: '15px',
            letterSpacing: '1.8px',
            fontStyle: 'normal',
            textTransform: 'uppercase',
          }}
        >
          Privacy Policy
        </a>
        <a
          href="/terms-of-use"
          className="hover:underline text-center uppercase"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'rgba(255,255,255,0.40)',
            fontFamily: 'var(--font-abhaya-libre), serif',
            fontWeight: 800,
            fontSize: '12px',
            lineHeight: '15px',
            letterSpacing: '1.8px',
            fontStyle: 'normal',
            textTransform: 'uppercase',
          }}
        >
          Terms of Use
        </a>
      </div>
      {/* Row de copyright */}
      <div className="w-full flex justify-center items-center">
        <span
          className="text-center"
          style={{
            color: 'rgba(255,255,255,0.80)',
            fontFamily: 'var(--font-abhaya-libre), serif',
            fontWeight: 800,
            fontSize: '9px',
            lineHeight: '24px',
            letterSpacing: '1.125px',
            fontStyle: 'normal',
          }}
        >
          Copyright © 2025 Oaksoft Digital Fund. All rights reserved
        </span>
      </div>

      {/* Estilos responsivos solo con Tailwind */}
    </footer>
  );
}
