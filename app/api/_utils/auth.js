import { adminAuth } from "@/lib/firebaseAdmin";
export async function requireUser(req) {
  const a = req.headers.get("authorization");
  if (!a?.startsWith("Bearer "))
    throw new Response("No token", { status: 401 });
  try {
    return (await adminAuth.verifyIdToken(a.slice(7))).uid;
  } catch {
    throw new Response("Invalid token", { status: 401 });
  }
}
