// src/features/auth/googleSignIn.js
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  // optional: prompt user to select account
  provider.setCustomParameters({ prompt: "select_account" });

  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}
