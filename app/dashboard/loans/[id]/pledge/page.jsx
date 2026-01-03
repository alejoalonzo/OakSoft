export default function Page({ params }) {
  const loanId = params.loanId;

  return (
    <div style={{ padding: 20, display: "grid", gap: 12, maxWidth: 480 }}>
      <h2 style={{ fontWeight: 600, fontSize: 22 }}>Pledge (coming soon)</h2>
      <div style={{ fontSize: 14, color: "#666" }}>Loan: {loanId}</div>
    </div>
  );
}
