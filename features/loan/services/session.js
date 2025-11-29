import { auth } from "@/lib/firebaseClient";
import { signInAnonymously } from "firebase/auth";

export async function getIdToken() {
  try {
    if (!auth.currentUser) await signInAnonymously(auth);
    return await auth.currentUser.getIdToken(true);
  } catch (e) {
    // Firebase Auth errors have code and message properties
    console.error("Firebase Auth error:", e.code, e.message);
    throw new Error(`${e.code || "auth/error"}: ${e.message}`);
  }
}
