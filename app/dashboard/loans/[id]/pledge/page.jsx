import PledgeFlowMiniPage from "@/features/loan/ui/PledgeLoan";

export default async function Page({ params }) {
  // Next 16: params can be a Promise
  const { id } = await params;
  return <PledgeFlowMiniPage loanId={id} />;
}
