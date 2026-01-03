"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [loanId, setLoanId] = useState("");
  const router = useRouter();

  return (
    <div style={{ padding: 20, display: "grid", gap: 16, maxWidth: 340 }}>
      <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>My loans</h2>

      <input
        value={loanId}
        onChange={(e) => setLoanId(e.target.value)}
        placeholder="Paste loan ID"
        style={{
          padding: '10px 12px',
          border: '1.5px solid #a0ff2f',
          borderRadius: 8,
          fontSize: 16,
          outline: 'none',
          marginBottom: 4,
          background: 'var(--background)',
          color: 'var(--foreground)',
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
        }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => router.push(`/dashboard/loans/${loanId.trim()}`)}
          disabled={!loanId.trim()}
          style={{
            padding: '10px 18px',
            background: 'var(--color-primary-500)',
            color: '#222',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor: !loanId.trim() ? 'not-allowed' : 'pointer',
            opacity: !loanId.trim() ? 0.6 : 1,
            transition: 'background 0.2s, opacity 0.2s',
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
          }}
        >
          Open loan
        </button>
        <button
          onClick={() => setLoanId("")}
          disabled={!loanId}
          style={{
            padding: '10px 18px',
            background: '#eee',
            color: '#444',
            border: 'none',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 16,
            cursor: !loanId ? 'not-allowed' : 'pointer',
            opacity: !loanId ? 0.6 : 1,
            transition: 'background 0.2s, opacity 0.2s',
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
