// /app/api/_utils/coinrabbitCreate.js
import { adminDB } from "@/lib/firebaseAdmin";

export async function saveCoinrabbitLoan({ uid, data, payload }) {
  console.log(">>> saveCoinrabbitLoan START");
  console.log("UID:", uid);
  console.log("DATA keys:", Object.keys(data || {}));

  const loanId =
    data?.response?.id ??
    data?.response?.loan_id ??
    data?.response?.loan?.id ??
    data?.id ??
    null;

  console.log("Extracted loanId:", loanId);

  if (!loanId) {
    console.error("!!! NO LOAN ID FOUND in response data");
    return null;
  }

  const ref = adminDB.collection("loans").doc(String(loanId));

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
