export async function confirmLoanMock({ loanId, payoutAddress }) {
  if (!loanId) throw new Error("confirmLoanMock missing loanId");
  if (!payoutAddress) throw new Error("confirmLoanMock missing payoutAddress");

  const data = {
    result: true,
    response: {
      address: payoutAddress,
      extraId: null,
    },
  };

  return { ok: true, status: 200, data };
}
