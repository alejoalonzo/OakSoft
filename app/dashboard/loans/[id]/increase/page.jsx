import IncreaseLoan from "@/features/loan/ui/IncreaseLoan";

export default async function Page({ params }) {
  // Next 16: params can be a Promise
  const { id } = await params;
  return <IncreaseLoan loanId={id} />;
}
