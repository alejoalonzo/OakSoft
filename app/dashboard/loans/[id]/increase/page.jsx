import IncreaseLoan from "@/features/loan/ui/IncreaseLoan";

export default function Page({ params }) {
  return <IncreaseLoan loanId={params.loanId} />;
}
