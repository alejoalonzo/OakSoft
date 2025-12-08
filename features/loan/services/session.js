import { auth } from "@/lib/firebaseClient";

export async function getIdToken() {
  try {
    // Do not signInAnonymously - require that the user is logged in
    if (!auth.currentUser) {
      throw new Error("No logged in user - please sign in");
    }

    return await auth.currentUser.getIdToken(true);
  } catch (e) {
    // Firebase Auth errors have code and message properties
    console.error("Firebase Auth error:", e.code, e.message);
    throw new Error(`${e.code || "auth/error"}: ${e.message}`);
  }
}
