// pures helpers w/o React dependencies

export function fmt(n, p = 2) {
  if (n == null || n === "") return "";
  const num = Number(n);
  return Number.isFinite(num) ? num.toFixed(p) : String(n);
}

export function sortBy(list, prioKey) {
  return (list || [])
    .filter(c => c?.code && c?.network)
    .sort(
      (a, b) =>
        (a?.[prioKey] ?? 999) - (b?.[prioKey] ?? 999) ||
        String(a.code).localeCompare(String(b.code))
    );
}
