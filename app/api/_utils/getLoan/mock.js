export async function getLoanByIdMock({ loanId }) {
  const data = {
    result: true,
    response: {
      loan_id: String(loanId),
      status: "confirmed",
      loan: {
        amount: null,
        expected_amount: "29.727618557",
        currency_code: "USDT",
        currency_network: "ETH",
        receive_address: "0x0000000000000000000000000000000000000000",
        receive_extra_id: null,
        payout_tx: { amount: null, hash: null, timestamp: null },
      },
      deposit: {
        amount: null,
        expected_amount: "0.1044",
        currency_code: "ETH",
        currency_network: "ETH",
        transaction_status: "waiting",
        send_address: "0xMOCK_DEPOSIT_ADDRESS",
        send_extra_id: null,
        transaction_hash: null,
        active: false,
        payin_tx: { amount: null, hash: null, timestamp: null },
      },
      repayment: {
        amount: "0",
        currency_code: "USDT",
        currency_network: "ETH",
        active: false,
        payin_txs: [],
      },
      increase: {
        currency_code: "ETH",
        currency_network: "ETH",
        active: false,
        payin_txs: [],
      },
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      interest_percent: null,
      interest_amounts: { day: null, month: null, year: null },
      close_price: null,
      liquidation_price: null,
      rate_side: "SELL",
    },
  };

  return { ok: true, status: 200, data };
}
