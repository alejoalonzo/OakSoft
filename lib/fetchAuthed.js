import { auth } from "@/lib/firebaseClient";

export async function fetchAuthed(url, options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No logged in user");
  }

  const token = await user.getIdToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
}
