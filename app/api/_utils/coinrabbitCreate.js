// /app/api/_utils/coinrabbitLoans.js
import { adminDB } from "@/lib/firebaseAdmin";

export async function saveCoinrabbitLoan({ uid, data, payload }) {
  const loanId =
    data?.response?.id ??
    data?.response?.loan_id ??
    data?.response?.loan?.id ??
    data?.id ??
    null;

  if (!loanId) return null;

  const ref = adminDB
    .collection("coinrabbit_users")
    .doc(uid)
    .collection("loans")
    .doc(String(loanId));

  await ref.set(
    {
      uid,
      loanId: String(loanId),
      status: data?.response?.status || "created",
      deposit: data?.response?.deposit || null,
      borrow: data?.response?.loan || null,
      requestPayload: payload ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  return loanId;
}
