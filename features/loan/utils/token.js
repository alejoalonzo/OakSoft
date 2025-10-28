export const optValue = c => `${c.code}|${c.network}`;
export const optLabel = c => `${c.code} (${c.network}) — ${c.name || c.code}`;

export function isSameAsCollateral(c, collat) {
  return !!collat && c.code === collat.code && c.network === collat.network;
}

export function findByValue(v, list) {
  const [code, network] = String(v).split("|");
  return (
    (list || []).find(c => c.code === code && c.network === network) || null
  );
}

export function getTokenLogo(list, code, network) {
  const token = (list || []).find(
    c => c.code === code && c.network === network
  );
  return (
    token?.logo_url ||
    `https://via.placeholder.com/32/6B7280/FFFFFF?text=${(code || "?").charAt(0)}`
  );
}
