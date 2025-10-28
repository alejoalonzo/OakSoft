const NET_ORDER = [
  "ETH",
  "ARBITRUM",
  "BASE",
  "BSC",
  "AVAXC",
  "MATIC",
  "TRX",
  "SOL",
];

export function receiveNetworksOf(code, all) {
  return [
    ...new Set(
      (all || [])
        .filter(c => c.code === code && c.is_loan_receive_enabled === true)
        .map(c => c.network)
    ),
  ];
}

export function prioritize(nets, prefer) {
  const scored = nets.map(n => ({ n, s: NET_ORDER.indexOf(n) }));
  scored.sort((a, b) =>
    a.n === prefer
      ? -1
      : b.n === prefer
        ? 1
        : (a.s < 0) - (b.s < 0) || a.s - b.s
  );
  return scored.map(x => x.n);
}
