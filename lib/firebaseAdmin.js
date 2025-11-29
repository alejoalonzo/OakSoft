// lib/firebaseAdmin.js
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
const privateKey = process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n");

// validate env vars
if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase admin env vars: FB_PROJECT_ID, FB_CLIENT_EMAIL o FB_PRIVATE_KEY"
  );
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
export const adminAuth = getAuth(app);
export const adminDB = getFirestore(app);
