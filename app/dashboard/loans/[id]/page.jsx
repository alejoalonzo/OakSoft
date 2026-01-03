import Link from "next/link";

export default function Page({ params }) {
  const loanId = params.loanId;

  return (
    <div style={{ padding: 20, display: "grid", gap: 16, maxWidth: 340 }}>
      <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>Loan {loanId}</h2>

      <Link
        href={`/dashboard/loans/${loanId}/increase`}
        style={{
          display: 'inline-block',
          padding: '10px 18px',
          background: 'var(--color-primary-500)',
          color: '#222',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          textDecoration: 'none',
          marginBottom: 6,
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
          transition: 'background 0.2s, opacity 0.2s',
        }}
      >
        Increase
      </Link>
      <Link
        href={`/dashboard/loans/${loanId}/pledge`}
        style={{
          display: 'inline-block',
          padding: '10px 18px',
          background: '#eee',
          color: '#444',
          border: 'none',
          borderRadius: 8,
          fontWeight: 500,
          fontSize: 16,
          textDecoration: 'none',
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
          transition: 'background 0.2s, opacity 0.2s',
        }}
      >
        Pledge
      </Link>
    </div>
  );
}
